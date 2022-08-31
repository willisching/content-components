import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';

import '../d2l-drop-uploader.js';
import '../d2l-topic-preview.js';
import '../d2l-upload-progress.js';
import { parse as d2lrnParse, toString as d2lrnToString } from '../../util/d2lrn.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import ContentType from '../../util/content-type.js';

const VIEW = Object.freeze({
	UPLOAD: 'UPLOAD',
	PREVIEW: 'PREVIEW',
	PROGRESS: 'PROGRESS',
	LOADING: 'LOADING',
});

const SUPPORTED_TYPES = [ContentType.AUDIO, ContentType.VIDEO];

export class Main extends InternalLocalizeMixin(MobxReactionUpdate(LitElement)) {
	static get properties() {
		return {
			allowAsyncProcessing: { type: Boolean, attribute: 'allow-async-processing' },
			apiEndpoint: { type: String, attribute: 'api-endpoint' },
			canManage: { type: Boolean, attribute: 'can-manage' },
			canUpload: { type: Boolean, attribute: 'can-upload' },
			orgUnitId: { type: String, attribute: 'org-unit-id' },
			tenantId: { type: String, attribute: 'tenant-id' },
			topicId: { type: String, attribute: 'topic-id' },
			maxFileUploadSize: { type: String, attribute: 'max-file-upload-size' },
			enablePreview: { type: Boolean, attribute: 'enable-preview' },
			shareUploadsWith: { type: Array, attribute: 'share-uploads-with' },
			filename: { type: String, reflect: true },
			value: { type: String, reflect: true },
			isMultipart: { type: Boolean, attribute: 'is-multipart'},

			_currentView: { type: Number, attribute: false },
			_errorMessage: { type: String, attribute: false },
			_fileName: { type: String, attribute: false },
			_fileType: { type: String, attribute: false },
			_contentId: { type: String, attribute: false },
		};
	}

	static get styles() {
		return css`
		`;
	}

	constructor() {
		super();
		this._currentView = VIEW.LOADING;
		this._errorMessage = '';
		this._fileName = '';
		this._fileType = '';
		this._uploadProgress = 0;
	}

	async connectedCallback() {
		super.connectedCallback();
		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.apiEndpoint });
		const apiClient = new ContentServiceApiClient({
			httpClient,
			tenantId: this.tenantId,
		});

		if (this.value) {
			if (!this.topicId) {
				const revision = await apiClient.getRevisionByName(this.value);
				this._fileType = revision.type.toLowerCase();
				this._fileName = revision.title;
			}
			this._currentView = VIEW.PREVIEW;
		} else {
			this._currentView = VIEW.UPLOAD;
		}
	}

	render() {
		let view;
		switch (this._currentView) {
			case VIEW.LOADING:
				return html`<d2l-loading-spinner></d2l-loading-spinner>`;

			case VIEW.UPLOAD:
				// should happen if the user has canManage permission otherwise we should
				view = this.canUpload ? html`
					<d2l-drop-uploader
						id="prompt-with-file-drop-enabled"
						tenant-id=${this.tenantId}
						api-endpoint=${this.apiEndpoint}
						?allowAsyncProcessing=${this.allowAsyncProcessing}
						error-message=${this._errorMessage}
						max-file-size=${this.maxFileUploadSize}
						sharing-org-unit-id=${this.orgUnitId}
						.share-uploads-with=${this.shareUploadsWith}
						.supportedTypes=${SUPPORTED_TYPES}
						@change-view=${this.changeView}
						@on-uploader-error=${this.changeView}
						@on-uploader-success=${this.reactToUploaderSuccess}
						@on-progress=${this.onProgress}
						?is-multipart=${this.isMultipart}
						videoAudioDisplay>
					</d2l-drop-uploader>
				` : html`<d2l-loading-spinner></d2l-loading-spinner>`;
				break;
			case VIEW.PREVIEW:
				view = html`
					<d2l-topic-preview
						?can-manage=${this.canManage}
						?can-upload=${this.canUpload}
						file-name=${this._fileName}
						api-endpoint=${this.apiEndpoint}
						resource=${this.value}
						@cancel=${this.onDiscardStagedFile}
						org-unit-id=${this.orgUnitId}
						topic-id=${ifDefined(this.topicId)}>
					</d2l-topic-preview>
				`;
				break;
			case VIEW.PROGRESS:
				view = html`
					<d2l-upload-progress
						file-name=${this._fileName}
						total-files=1
						upload-progress=${this._uploadProgress}>
					</d2l-upload-progress>
				`;
		}
		return view;
	}

	changeView(event) {
		this._fileName = event.detail.fileName;
		this._currentView = event.detail.view ? VIEW[event.detail.view] : VIEW.UPLOAD;
		this._errorMessage = event.detail.errorMessage;
	}

	onDiscardStagedFile() {
		if (this.canUpload) {
			this._errorMessage = '';
			this._fileName = '';
			this.updateValue('');
			this.topicId = '';
			this.contentId = '';
			this.canManage = this.canUpload;
			this._currentView = VIEW.UPLOAD;
		}
	}

	onProgress(event) {
		this._uploadProgress = event.detail.progress;
		this.requestUpdate();
	}

	reactToUploaderSuccess(event) {
		const value = event.detail.d2lrn;
		this.canManage = this.canUpload;
		this.updateValue(value);
		this._currentView = VIEW.PREVIEW;
	}

	updateValue(value) {
		if (value) {
			const d2lrn = d2lrnParse(value);
			d2lrn.resource = `${d2lrn.contentId}/latest`;
			delete d2lrn.contentId;
			delete d2lrn.revisionId;
			this.value = d2lrnToString(d2lrn);
		} else {
			this.value = value;
		}
		this.filename = this._fileName;
		this.dispatchEvent(new Event('change', {
			bubbles: true,
			composed: true,
		}));
	}
}

customElements.define('d2l-content-uploader', Main);
