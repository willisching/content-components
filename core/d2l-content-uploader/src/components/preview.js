import '@brightspace-ui/core/components/button/button-subtle';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui-labs/media-player/media-player.js';
import { css, html, LitElement } from 'lit-element';
import { bodyCompactStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { RequesterMixin } from '@brightspace-ui/core/mixins/provider-mixin.js';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin';
import { getComposedActiveElement } from '@brightspace-ui/core/helpers/focus.js';
import { parse } from '../util/d2lrn';
import '../../../../capture/d2l-capture-producer.js';
import '../../../d2l-content-viewer.js';
import { isAudioType } from '../util/media-type-util';

const REVISION_POLL_WAIT_MILLISECONDS = 10000;
const FORMATS_BEST_FIRST = ['HD', 'SD', 'LD', 'MP3'];
export class Preview extends MobxReactionUpdate(RequesterMixin(InternalLocalizeMixin(LitElement))) {
	static get properties() {
		return {
			allowAsyncProcessing: { type: Boolean, attribute: 'allow-async-processing' },
			canManage: { type: Boolean, attribute: 'can-manage' },
			canUpload: { type: Boolean, attribute: 'can-upload' },
			fileName: { type: String, attribute: 'file-name', reflect: true },
			noMediaFound: { type: Boolean, attribute: false },
			orgUnitId: { type: String, attribute: 'org-unit-id' },
			resource: { type: String, attribute: true },
			topicId: { type: String, attribute: 'topic-id' },
			_bestFormat: { type: String, attribute: false },
			_mediaSources: { type: Array, attribute: false },
		};
	}

	static get styles() {
		return [bodyCompactStyles, css`
			#container {
				display: flex;
				flex-direction: column;
				align-items: center;
			}
			#staged-file {
				display: table;
				margin: 0 auto;
			}
			#staged-file > * {
				margin: 3px 50px 3px 50px;
				display: inline-block;
			}
			#file-details {
				font-weight: 600;
				word-break: break-word;
				overflow-wrap: break-word;
			}
			#change-file-button[hidden],
			#advanced-editing-button[hidden] {
				display: none;
			}
			#processing-message {
				white-space: pre-line;
				margin-top: 0px;
				margin-bottom: 40px;
				text-align: center;
			}
			#status-message-container {
				aspect-ratio: 16/9;
				background-color: black;
				color: white;
				display: flex;
				flex-direction: column;
				justify-content: center;
 				overflow: hidden;
 				position: relative;
				text-align: center;
				white-space: pre-line;
 				width: 100%;
			}
		`];
	}

	constructor() {
		super();
		this.contentTitle = '';
		this.fileName = '';
		this._mediaSources = null;
		this._bestFormat = '';
		this._contentId = null;
		this._attemptedReloadOnError = false;
		this.noMediaFound = false;
	}

	async connectedCallback() {
		super.connectedCallback();
		if (!this.topicId) {
			this._loadNonTopicVideo();
		}
	}

	firstUpdated() {
		super.firstUpdated();
		this._updateNoMediaFound();
	}

	render() {
		const {contentId} = parse(this.resource);
		this._contentId = contentId;
		const hideAdvancedEditing = !this.canManage || (!this.topicId && !this._mediaSources) || this.noMediaFound;
		return html`
			<div id="container">
				${this._renderPreviewPlayer()}
				<div id="staged-file">
					<d2l-button-subtle
						id="change-file-button"
						aria-expanded="false"
						aria-haspopup="false"
						aria-label=${this.localize('changeFile')}
						text=${this.localize('changeFile')}
						@click=${this._onChangeFile}
						?hidden="${!this.canUpload}">
					</d2l-button-subtle>
					<d2l-button-subtle
						id="advanced-editing-button"
						aria-expanded="false"
						aria-haspopup="false"
						aria-label=${this.localize('advancedEditing')}
						text=${this.localize('advancedEditing')}
						@click=${this._onAdvancedEditing}
						?hidden="${hideAdvancedEditing}">
					</d2l-button-subtle>
				</div>
			</div>
		`;
	}

	_getApiEndpoint() {
		const client = this.requestInstance('content-service-client');
		return client.endpoint;
	}

	async _getSource(resourceUrn, format) {
		const client = this.requestInstance('content-service-client');

		let url;
		try {
			url = await client.getSecureUrlByName(resourceUrn, format);
		} catch (error) {
			if (error.cause === 404) {
				return null;
			}
			throw error;
		}

		return {
			src: url.value,
			format,
			expires: url.expireTime * 1000
		};
	}

	_isAudio() {
		return isAudioType(this.fileName);
	}

	async _loadMediaPlayerSources() {
		const client = this.requestInstance('content-service-client');
		if (!this.resource) {
			return null;
		}

		const revision = await client.getRevisionByName(this.resource);
		const formats = revision.formats || [];

		this._mediaSources = (formats.length > 0
			? (await Promise.all(formats.map(format => this._getSource(this.resource, format))))
			: [await this._getSource(this.resource)])
			.filter(mediaSource => mediaSource !== null);

		this._bestFormat = FORMATS_BEST_FIRST.find(format =>
			this._mediaSources.some(mediaSource => mediaSource.format && mediaSource.format.toUpperCase() === format)
		);
	}

	async _loadNonTopicVideo() {
		const { contentId, revisionId } = parse(this.resource);
		const client = this.requestInstance('content-service-client');
		const revisionProgressInfo = await client.getWorkflowProgress({ contentId, revisionId });
		if (!revisionProgressInfo.ready) {
			setTimeout(() => {
				this._loadNonTopicVideo();
			}, REVISION_POLL_WAIT_MILLISECONDS);
		} else {
			this._loadMediaPlayerSources();
		}
	}

	async _onAdvancedEditing() {
		const location = `/d2l/le/contentservice/producer/${this._contentId}/view`;

		const dialogResult = await D2L.LP.Web.UI.Desktop.MasterPages.Dialog.Open(
			getComposedActiveElement(),
			new D2L.LP.Web.Http.UrlLocation(location),
		);

		await new Promise(resolve => {
			dialogResult.AddReleaseListener(() => {
				resolve();
			});
		});

		if (this.topicId) {
			const contentViewer = this.shadowRoot.getElementById('content-viewer');
			await contentViewer.reloadResources();
		} else {
			await this._loadMediaPlayerSources();
		}
	}

	_onChangeFile() {
		this.dispatchEvent(new CustomEvent('cancel', {
			bubbles: true,
			composed: true
		}));
	}

	_onMediaPlayerError() {
		if (this._mediaSources && this._mediaSources.length > 0 && !this._attemptedReloadOnError) {
			this._attemptedReloadOnError = true;
			this._loadMediaPlayerSources();
		}
	}

	_onMediaPlayerLoadedData() {
		this._attemptedReloadOnError = false;
	}

	_renderContentViewer() {
		return html`
			<d2l-content-viewer
				id="content-viewer"
				org-unit-id=${this.orgUnitId}
				topic-id=${this.topicId}>
			</d2l-content-viewer>`;
	}

	_renderMediaFileFailedProcessing() {
		return html`
			<div
				id="status-message-container"
			>
				${this.localize('mediaFileFailedProcessing')}
			</div>
		`;
	}

	_renderMediaSources() {
		if (!this._mediaSources) {
			return html``;
		}

		if (this._mediaSources.length === 0) {
			return this._renderMediaFileFailedProcessing();
		}

		return html`
			<d2l-labs-media-player
				@error=${this._onMediaPlayerError}
				@loadeddata=${this._onMediaPlayerLoadedData}
				media-type="${this._isAudio() ? 'audio' : 'video'}"
				style="width:100%"
			>
				${this._mediaSources.map(mediaSource => this._renderSource(mediaSource))}
			</d2l-labs-media-player>`;
	}

	_renderPreviewPlayer() {
		if (this.topicId) {
			return this._renderContentViewer();
		} else {
			if (!this._mediaSources && this.allowAsyncProcessing) {
				return this._renderProcessingMessage();
			} else {
				return this._renderMediaSources();
			}
		}
	}

	_renderProcessingMessage() {
		return html`
			<div
				id="status-message-container"
			>
				${this.localize('mediaFileIsProcessing')}
			</div>
		`;
	}

	_renderSource(source) {
		return html`<source src=${source.src} label=${this.localize(`format${source.format?.toUpperCase() ?? 'Source'}`)} ?default=${source.format && this._bestFormat === source.format}>`;
	}

	async _updateNoMediaFound() {
		const contentViewer = this.shadowRoot.getElementById('content-viewer');
		await contentViewer.firstUpdated();
		this.noMediaFound = contentViewer.noMediaFound;
	}
}

customElements.define('d2l-content-uploader-preview', Preview);
