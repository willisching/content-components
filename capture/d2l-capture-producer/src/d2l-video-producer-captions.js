import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui-labs/file-uploader/d2l-file-uploader.js';
import { formatFileSize } from '@brightspace-ui/intl/lib/fileSize.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { inputStyles } from '@brightspace-ui/core/components/inputs/input-styles.js';
import { InternalLocalizeMixin } from './internal-localize-mixin.js';
import { labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { formatTimestampText, parseSrtFile, parseWebVttFile }  from './captions-utils.js';
import constants from './constants.js';

class CaptionsCueListItem extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			captionsCue: { type: Object, attribute: 'captions-cue' },
			expanded: { type: Boolean }
		};
	}

	static get styles() {
		return [ inputStyles, labelStyles, css`
			.d2l-video-producer-captions-cues-list-item {
				background-color: var(--d2l-color-gypsum);
				border-radius: var(--d2l-input-border-radius, 0.3rem);
				display: flex;
				flex-direction: column;
				margin-bottom: 15px;
				padding: 12px;
			}

			.d2l-video-producer-captions-cue-main-controls {
				align-items: center;
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				width: 100%;
			}

			.d2l-video-producer-captions-cue-text-input {
				margin-bottom: 10px;
				margin-top: 12px;
				width: 100%;
				/* Disable word wrap and preserve line breaks from uploaded files */
				overflow: auto;
				resize: none;
				white-space: pre;
				/* This is needed to make "white-space: pre;" work on Safari */
				word-wrap: normal;
			}

			.d2l-video-producer-captions-cue-main-controls-buttons {
				align-items: center;
				display: flex;
				flex-direction: column;
			}

			.d2l-video-producer-captions-cue-expanded-controls {
				align-items: flex-end;
				display: flex;
				flex-direction: row;
			}

			.d2l-video-producer-captions-cue-start-end-container {
				align-items: center;
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				width: 100%;
			}

			.d2l-video-producer-captions-cue-timestamp-container {
				align-items: center;
				display: flex;
				flex-direction: column;
			}

			.d2l-video-producer-sync-cue-button-anchor {
				height: 0;
				position: relative;
				width: 0;
			}

			.d2l-video-producer-sync-cue-button {
				left: 35px;
				position: absolute;
				top: -10px;
			}

			.d2l-video-producer-captions-cue-timestamp-container > d2l-input-text {
				width: 135px;
			}
		` ];
	}

	constructor() {
		super();
		this.captionsCue = null;
	}

	render() {
		return html`
			<div class="d2l-video-producer-captions-cues-list-item">
				${this._renderMainControls()}
				${this.expanded ? this._renderExpandedControls() : ''}
			</div>
		`;
	}

	_hideExpandedControls() {
		this.expanded = false;
	}

	_renderExpandedControls() {
		return html`
			<div class="d2l-video-producer-captions-cue-expanded-controls">
				<div class="d2l-video-producer-captions-cue-start-end-container">
					<div class="d2l-video-producer-captions-cue-timestamp-container">
						<div class="d2l-video-producer-sync-cue-button-anchor">
							<d2l-button-icon
								class="d2l-video-producer-sync-cue-button"
								text=${this.localize('syncStartTimeToTimeline')}
								icon="tier1:time"
							></d2l-button-icon>
						</div>
						<d2l-input-text
							class="d2l-video-producer-captions-cue-start-timestamp"
							label=${this.localize('captionsCueStartTimestamp')}
							description=${this.localize('captionsCueStartTimestampDescription')}
							value=${formatTimestampText(this.captionsCue.startTime)}
						></d2l-input-text>
					</div>
					<div class="d2l-video-producer-captions-cue-timestamp-container">
						<div class="d2l-video-producer-sync-cue-button-anchor">
							<d2l-button-icon
								class="d2l-video-producer-sync-cue-button"
								text=${this.localize('syncEndTimeToTimeline')}
								icon="tier1:time"
							></d2l-button-icon>
						</div>
						<d2l-input-text
							class="d2l-video-producer-captions-cue-end-timestamp"
							label=${this.localize('captionsCueEndTimestamp')}
							description=${this.localize('captionsCueEndTimestampDescription')}
							value=${formatTimestampText(this.captionsCue.endTime)}
						></d2l-input-text>
					</div>
				</div>
			</div>
		`;
	}

	_renderMainControls() {
		return html`
			<div class="d2l-video-producer-captions-cue-main-controls">
				<textarea
					class="d2l-input d2l-video-producer-captions-cue-text-input"
					aria-label=${this.localize('captionsCueText')}
					rows="2"
				>${this.captionsCue.text}</textarea>
				<div class="d2l-video-producer-captions-cue-main-controls-buttons">
					<d2l-button-icon
						text=${this.localize('deleteCaptionsCue')}
						icon="tier1:delete"
					></d2l-button-icon>
					${ this.expanded ? (html`
						<d2l-button-icon
							text=${this.localize('hideExpandedCaptionsCueControls')}
							icon="tier1:arrow-collapse"
							@click=${this._hideExpandedControls}
						></d2l-button-icon>
					`) : (html`
						<d2l-button-icon
							text=${this.localize('openExpandedCaptionsCueControls')}
							icon="tier1:arrow-expand"
							@click=${this._showExpandedControls}
						></d2l-button-icon>
					`)}
				</div>
			</div>
		`;
	}

	_showExpandedControls() {
		this.expanded = true;
	}
}

customElements.define('d2l-video-producer-captions-cues-list-item', CaptionsCueListItem);

class VideoProducerCaptions extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			captionCues: { type: Object },
			visibleCuesInList: { type: Object },
		};
	}

	static get styles() {
		return [ labelStyles, css`
			.d2l-video-producer-captions {
				border: 1px solid var(--d2l-color-mica);
				box-sizing: border-box;
				height: 532px;
				position: relative;
				width: 360px;
			}

			.d2l-video-producer-empty-captions-menu {
				align-items: center;
				display: flex;
				flex-direction: column;
				height: 100%;
				justify-content: center;
			}

			.d2l-video-producer-captions-cues-list {
				display: flex;
				flex-direction: column;
				height: 481px;
				overflow-x: hidden;
				overflow-y: scroll;
				padding: 39px 10px 10px 10px;
				position: relative;
			}

			.d2l-video-producer-captions-cues-list-bottom {
				align-items: center;
				display: flex;
				justify-content: center;
				padding: 20px;
				width: 100%;
			}
		`];
	}

	constructor() {
		super();
		this.captionCues = [];
		this.visibleCuesInList = [];
		this.intersectionObserver = null;

		this._updateVisibleCuesInList = this._updateVisibleCuesInList.bind(this);
	}

	async firstUpdated() {
		const fileUploader = this.shadowRoot.querySelector('#file-uploader');
		fileUploader.addEventListener('d2l-file-uploader-files-added', this._onFilesAdded.bind(this));
	}

	render() {
		return html`
			<div class="d2l-video-producer-captions">
				${this.captionCues.length > 0 ? this._renderCuesList() : this._renderEmptyCaptionsMenu()}
				<d2l-alert-toast
					id="d2l-video-producer-captions-alert-toast"
				></d2l-alert-toast>
			</div>
			${this._appendVttScript()}
		`;
	}

	updated(changedProperties) {
		changedProperties.forEach((oldValue, propName) => {
			if (propName === 'captionCues') {
				if (oldValue && oldValue.length === 0 && this.captionCues.length > 0) {
					const options = {
						root: this.shadowRoot.querySelector('.d2l-video-producer-captions-cues-list'),
						rootMargin: '0px',
						threshold: 0.1,
					};
					const listBottom = this.shadowRoot.querySelector('.d2l-video-producer-captions-cues-list-bottom');
					this.intersectionObserver = new IntersectionObserver(this._updateVisibleCuesInList, options);
					this.intersectionObserver.observe(listBottom);
				} else if (this.intersectionObserver && oldValue.length > 0 && this.captionCues.length === 0) {
					this.intersectionObserver.disconnect();
				}
			}
		});
	}

	// <script> tags must be added via Javascript in LitElement.
	// https://stackoverflow.com/a/55693185
	_appendVttScript() {
		// Using a relative path (e.g. './scripts/vtt.min.js') in the <script> tag
		// won't work because the script is on a separate domain from the LMS page.
		// So we need to construct the absolute URL to the vtt script.
		const urlOfThisFile = new URL(import.meta.url);
		const vttScriptUrlPrefix = urlOfThisFile.href.slice(0, urlOfThisFile.href.indexOf('src'));

		const script = document.createElement('script');
		script.src = `${vttScriptUrlPrefix}scripts/vtt.min.js`;
		return script;
	}

	_onFilesAdded(event) {
		if (!(event?.detail?.files?.length === 1)) {
			return;
		}

		const file = event.detail.files[0];
		const extension = file.name.split('.').pop();
		if (!['srt', 'vtt'].includes(extension.toLowerCase())) {
			this._openAlertToast({type: 'critical', text: this.localize('captionsInvalidFileType') });
		} else if (file.size > constants.MAX_CAPTIONS_UPLOAD_SIZE_IN_BYTES) {
			this._openAlertToast({type: 'critical', text: this.localize('captionsFileTooLarge', { localizedMaxFileSize: formatFileSize(constants.MAX_CAPTIONS_UPLOAD_SIZE_IN_BYTES) }) });
		} else {
			const fileReader = new FileReader();
			fileReader.addEventListener('load', event => {
				try {
					if (extension === 'srt') {
						this.captionCues = parseSrtFile(event.target.result);
					} else {
						const vttLibrary = window.WebVTT;
						const vttParser = new vttLibrary.Parser(window, vttLibrary.StringDecoder());
						this.captionCues = parseWebVttFile(vttParser, event.target.result);
					}
				} catch (error) {
					this._openAlertToast({type: 'critical', text: this.localize(error.message) });
					return;
				}
				this.visibleCuesInList = this.captionCues.slice(0, constants.NUM_OF_VISIBLE_CAPTIONS_CUES);
			});
			fileReader.addEventListener('error', () => {
				this._openAlertToast({type: 'critical', text: this.localize('captionsReadError') });
			});
			fileReader.readAsText(file, 'UTF-8');
		}
	}

	_openAlertToast({type, text}) {
		const alertToast = this.shadowRoot.querySelector('#d2l-video-producer-captions-alert-toast');
		alertToast.setAttribute('open', 'open');
		alertToast.setAttribute('type', type);
		alertToast.innerText = text;
	}

	_renderCuesList() {
		return html`
			<div class="d2l-video-producer-captions-cues-list">
				${this.visibleCuesInList.map(captionCue => html`
					<d2l-video-producer-captions-cues-list-item
						captions-cue=${JSON.stringify(captionCue)}
					></d2l-video-producer-captions-cues-list-item>
				`)}
				<div class="d2l-video-producer-captions-cues-list-bottom"></div>
			</div>
		`;
	}

	_renderEmptyCaptionsMenu() {
		return html`
			<div class="d2l-video-producer-empty-captions-menu">
				<p class="d2l-label-text">${this.localize('uploadSrtWebVttFile')}</p>
				<d2l-labs-file-uploader
					id="file-uploader"
					label=${this.localize('browseForCaptionsFile')}>
				</d2l-labs-file-uploader>
			</div>
		`;
	}

	_updateVisibleCuesInList(entries) {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const lastVisibleCueIndex = this.visibleCuesInList.length - 1;
				if (lastVisibleCueIndex < this.captionCues.length - 1) {
					this.visibleCuesInList = [...this.visibleCuesInList, ...this.captionCues.slice(lastVisibleCueIndex, lastVisibleCueIndex + constants.NUM_OF_VISIBLE_CAPTIONS_CUES)];
				}
			}
		});
	}
}

customElements.define('d2l-video-producer-captions', VideoProducerCaptions);
