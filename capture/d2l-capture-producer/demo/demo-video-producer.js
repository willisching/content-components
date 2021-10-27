import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/button/button.js';
import { radioStyles } from '@brightspace-ui/core/components/inputs/input-radio-styles.js';
import { labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import '../d2l-capture-producer-editor.js';
import '../src/d2l-video-producer-language-selector.js';

const VIDEO_SOURCE = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const AUDIO_SOURCE = 'https://archive.org/download/MlkButIfNot/mlkbutifnot.mp3';
const LANGUAGE_TO_CAPTIONS_VTT = {
	'en-us': `WEBVTT

00:01.000 --> 00:03.000
Take me out to the ball game,
Take me out with the crowd.

00:06.000 --> 00:08.000
Buy me some peanuts and cracker jack, I don't care if I never get back.

00:03.000 --> 00:06.000
Let me root, root, root for the home team. If they don't win it's a shame.

00:08.000 --> 00:10.000
For it's one, two, three strikes, you're out.`,
	'fr-fr': `WEBVTT

00:01.000 --> 00:03.000
Emmène-moi au jeu de balle,
Sortez-moi avec la foule.

00:06.000 --> 00:08.000
Achetez-moi des cacahuètes et des crackers, je m'en fiche si je ne reviens jamais.

00:03.000 --> 00:06.000
Permettez-moi de root, root, root pour l'équipe à domicile, s'ils ne gagnent pas, c'est dommage.

00:08.000 --> 00:10.000
Car c'est un, deux, trois coups, tu es dehors`,
};

import { css, html, LitElement } from 'lit-element/lit-element.js';
class DemoVideoProducer extends LitElement {
	static get properties() {
		return {
			captions: { type: Array },
			languages: { type: Array },
			metadata: { type: Object },
			defaultLanguage: { type: Object },
			selectedLanguage: { type: Object },
			_captionsUrl: { type: String },
			_captionsLoading: { type: Boolean },
			_loading: { type: Boolean },
			_metadataLoading: { type: Boolean },
			_saving: { type: Boolean },
			_unsavedChanges: { type: Boolean },
			_finishing: { type: Boolean },
			_videoSelected: { type: Boolean },
		};
	}

	static get styles() {
		return [labelStyles, radioStyles, css`
			.demo-video-producer {
				width: 1170px;
			}

			.demo-video-producer-loading-container {
				display: flex;
				flex-direction: row;
				justify-content: center;
				width: 100%;
			}

			.demo-video-producer-content-type-selection {
				align-items: baseline;
				display: flex;
				flex-direction: row;
				margin-bottom: 10px;
			}

			.demo-video-producer-content-type-selection label {
				margin-right: 10px;
			}

			.demo-video-producer-controls {
				align-items: center;
				display: flex;
				justify-content: flex-end;
				margin-bottom: 15px;
			}

			d2l-video-producer-language-selector {
				margin-right: auto;
			}

			.demo-video-producer-saved-unsaved-indicator-container {
				align-items: center;
				display: flex;
				flex-direction: row;
				margin-right: 15px;
			}

			.demo-video-producer-saved-unsaved-indicator-icon {
				margin-left: 5px;
			}

			.demo-video-producer-controls-publish-button {
				margin-left: 10px;
			}

			.demo-video-producer-controls-publish-button .demo-video-producer-controls-publishing {
				display: flex;
				align-items: center;
			}

			.demo-video-producer-controls-publish-button demo-loading-spinner {
				margin-right: 5px;
			}
		`];
	}

	constructor() {
		super();
		this.languages = [];
		this.captions = [];
		this._captionsLoading = true;
		this._loading = true;
		this.metadata = { cuts: [], chapters: [] };
		this.fetchAndSetData();
		this._saving = false;
		this._finishing = false;
		this.errorOccurred = false;
		this._alertMessage = '';
		this._metadataLoading = true;
		this._unsavedChanges = false;
		this._videoSelected = true;
	}

	render() {
		if (this._loading) {
			return html`<div class="demo-video-producer-loading-container"><d2l-loading-spinner size=150></d2l-loading-spinner></div>`;
		}
		return html`
			<div class="demo-video-producer">
				<p class="d2l-label-text">Content Type</p>
				<div class="demo-video-producer-content-type-selection">
					<label class="d2l-input-radio-label">
						<input
							?checked="${this._videoSelected}"
							@click="${this._handleVideoClicked}"
							type="radio"
						>
							Video
						</input>
					</label>
					<label class="d2l-input-radio-label">
						<input
							?checked="${!this._videoSelected}"
							@click="${this._handleAudioClicked}"
							type="radio"
						>
							Audio
						</input>
					</label>
				</div>
				<div class="demo-video-producer-controls">
					<d2l-video-producer-language-selector
						?disabled="${this._saving || this._finishing}"
						.languages="${this.languages}"
						.selectedLanguage="${this.selectedLanguage}"
						@selected-language-changed="${this._handleSelectedLanguageChanged}"
					></d2l-video-producer-language-selector>
					${this._renderSavedUnsavedIndicator()}
					<d2l-button
						class="demo-video-producer-controls-save-button"
						@click="${this._handleSave}"
						?disabled="${this._saving || this._finishing || this._metadataLoading || this._captionsLoading}"
						text="Save Draft"
					>
						Save Draft
					</d2l-button>
					<d2l-button
						?disabled="${this._saving || this._finishing || this._metadataLoading || this._captionsLoading}"
						@click="${this._handleFinish}"
						class="demo-video-producer-controls-publish-button"
						primary
					><div class="demo-video-producer-controls-publishing" style="${!this._finishing ? 'display: none' : ''}">
							<d2l-loading-spinner size="20"></d2l-loading-spinner>
							Finishing...
						</div>
						<div ?hidden="${this._finishing}">
							Finish
						</div>
					</d2l-button>
				</div>

				<d2l-capture-producer-editor
					.captions="${this.captions}"
					@captions-auto-generation-started="${this._handleCaptionsAutoGenerationStarted}"
					@captions-changed="${this._handleCaptionsChanged}"
					@captions-edited="${this._handleCaptionsEdited}"
					?captions-loading="${this._captionsLoading}"
					.captionsUrl="${this._captionsUrl}"
					@captions-url-changed="${this._handleCaptionsUrlChanged}"
					.defaultLanguage="${this.defaultLanguage}"
					?enableCutsAndChapters="${this._videoSelected}"
					.languages="${this.languages}"
					.metadata="${this.metadata}"
					?metadata-loading="${this._metadataLoading}"
					@metadata-changed="${this._handleMetadataChanged}"
					.selectedLanguage="${this.selectedLanguage}"
					.src="${this._videoSelected ? VIDEO_SOURCE : AUDIO_SOURCE}"
				></d2l-capture-producer-editor>

				<d2l-alert-toast type="default">
					${this._alertMessage}
				</d2l-alert-toast>
			</div>
		`;
	}

	async fetchAndSetData() {
		await new Promise(resolve => setTimeout(resolve, 500));

		this.languages = [{
			name: 'English (United States)',
			code: 'en-us',
			isDefault: true,
		}, {
			name: 'Français (Canada)',
			code: 'fr-fr',
			isDefault: false
		}];

		this.selectedLanguage = this.languages.find(language => language.isDefault);
		this.defaultLanguage = this.selectedLanguage;

		setTimeout(() => {
			this.metadata = {
				chapters: [{
					time: 50,
					title: {
						'en-us': 'Chapter 1',
						'fr-fr': 'Çhàptêr 1',
					}
				}, {
					time: 150,
					title: {
						'en-us': 'Chapter 2',
						'fr-fr': 'Chaptér 2',
					}
				}, {
					time: 500,
					title: {
						'en-us': 'Ch 1',
						'fr-fr': 'Fr Ch 2'
					}
				}],
				cuts: [{ in: 10, out: 60 }, { in: 200, out: 320 }, { in: 400, out: 515 }],
			};
			this._metadataLoading = false;
		}, 500);

		this._captionsUrl = window.URL.createObjectURL(new Blob([LANGUAGE_TO_CAPTIONS_VTT['en-us']], { type: 'text/vtt' }));

		this._loading = false;
	}

	_changeContentType(videoSelected) {
		this._loading = true;
		this._captionsLoading = true;
		this._metadataLoading = true;
		setTimeout(() => {
			this._videoSelected = videoSelected;
			this._loading = false;
			setTimeout(() => {
				this._captionsLoading = false;
				this._metadataLoading = false;
			}, 500);
		}, 500);
	}

	_handleAudioClicked() {
		this._changeContentType(false);
	}

	_handleCaptionsAutoGenerationStarted(event) {
		console.log('Captions auto-generation was triggered for this language:');
		console.log(event.detail.language);
	}

	_handleCaptionsChanged(e) {
		console.log('Captions changed:', e.detail.captions);
		this.captions = e.detail.captions;
		if (!this._captionsLoading) {
			this._unsavedChanges = true;
		}
		this._captionsLoading = false;
	}

	_handleCaptionsEdited() {
		this._unsavedChanges = true;
	}

	_handleCaptionsUrlChanged(event) {
		this._captionsLoading = true;
		// Media Player's onSlotChange might not execute if the <track> slot's attributes change.
		// To force it to execute, we need to temporarily remove the slot and re-add it.
		// In D2LVideoProducerEditor.render(), we hide the <track> slot when captionsUrl is falsy.
		this._captionsUrl = '';
		setTimeout(() => {
			this._captionsUrl = event.detail.captionsUrl;
			this._unsavedChanges = true;
		}, 0);
	}

	async _handleFinish() {
		this._finishing = true;
		console.log('Publishing metadata:', this.metadata);
		console.log('Publishing captions:', this.captions);
		await new Promise(resolve => setTimeout(resolve, 1000));
		this._finishing = false;
		this._unsavedChanges = false;
		this._alertMessage = 'Publish successful.';
		this.shadowRoot.querySelector('d2l-alert-toast').open = true;
	}

	_handleMetadataChanged(e) {
		console.log('Metadata changed:', e.detail);
		this.metadata = e.detail;
		if (!this._metadataLoading) {
			this._unsavedChanges = true;
		}
		this._metadataLoading = false;
	}

	async _handleSave() {
		this._saving = true;
		console.log('Saving draft metadata:', this.metadata);
		console.log('Saving draft captions:', this.captions);
		await new Promise(resolve => setTimeout(resolve, 1000));
		this._saving = false;
		this._unsavedChanges = false;

		this._alertMessage = 'Saved changes.';
		this.shadowRoot.querySelector('d2l-alert-toast').open = true;
	}

	_handleSelectedLanguageChanged(e) {
		this.selectedLanguage = e.detail.selectedLanguage;
		this._captionsUrl = '';
		this._captionsLoading = true;
		setTimeout(() => {
			this._captionsUrl = window.URL.createObjectURL(new Blob([LANGUAGE_TO_CAPTIONS_VTT[e.detail.selectedLanguage.code]], { type: 'text/vtt' }));
		}, 500);
	}

	_handleVideoClicked() {
		this._changeContentType(true);
	}

	get _producer() {
		return this.shadowRoot.querySelector('d2l-capture-producer-editor');
	}

	_renderSavedUnsavedIndicator() {
		let feedbackColor = 'var(--d2l-color-feedback-success)';
		let icon = 'tier1:check-circle';
		let label = 'Saved';
		if (this._unsavedChanges) {
			feedbackColor = 'var(--d2l-color-feedback-warning)';
			icon = 'tier1:alert';
			label = 'Unsaved';
		}
		return html`
		  <div class="demo-video-producer-saved-unsaved-indicator-container">
			<p class="d2l-label-text" style="color: ${feedbackColor};">
				${label}
			</p>
			<d2l-icon class="demo-video-producer-saved-unsaved-indicator-icon" icon="${icon}" style="color: ${feedbackColor};"></d2l-icon>
		  </div>`;
	}
}

customElements.define('d2l-video-producer-demo-producer', DemoVideoProducer);
