import '@brightspace-ui/core/components/button/button.js';
import '../../components/file-upload/content-file-drop.js';
import '../../components/file-upload/upload-confirmation.js';
import '../../components/file-upload/upload-progress-indicator.js';
import { css, html, LitElement } from 'lit-element';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { Uploader } from '../../state/uploader.js';

const TabStatus = Object.freeze({
	PROMPT: 0,
	CONFIRMATION: 1,
	UPLOADING: 2
});

class UploadAudioVideoTab extends MobxReactionUpdate(DependencyRequester((InternalLocalizeMixin(LitElement)))) {
	static get properties() {
		return {
			_tabStatus: { type: Number, attribute: false },
			_contentTitle: { type: String, attribute: false },
			_errorMessage: { type: String, attribute: false },
			_fileName: { type: String, attribute: false },
			_fileSize: { type: Number, attribute: false },
			_fileType: { type: String, attribute: false },
		};
	}

	static get styles() {
		return css`
			#tab-container {
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				height: 100%;
			}
			#tab-content-container {
				width: 100%;
				overflow-y: auto;
			}
			#top-level-buttons {
				display: flex;
				flex-direction: row;
				justify-content: flex-start;
				margin-top: 20px;
			}
			#top-level-buttons > * {
				margin: 5px;
			}
			@media (hover: hover) {
				#prompt-with-file-drop-disabled {
					display: none;
				}
			}
			@media (hover: none) {
				#prompt-with-file-drop-enabled {
					display: none;
				}
			}
		`;
	}

	constructor() {
		super();
		this._tabStatus = TabStatus.PROMPT;
		this._contentTitle = '';
		this._errorMessage = '';
		this._fileName = '';
		this._fileSize = 0;
		this._fileType = '';

		this.reactToUploadError = this.reactToUploadError.bind(this);
		this.reactToUploadSuccess = this.reactToUploadSuccess.bind(this);
	}

	async connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');

		this.uploader = new Uploader({
			apiClient: this.apiClient,
			onSuccess: this.reactToUploadSuccess,
			onError: this.reactToUploadError
		});
	}

	render() {
		let tabContent;
		switch (this._tabStatus) {
			case TabStatus.PROMPT:
				tabContent = html`
					<content-file-drop
						id="prompt-with-file-drop-enabled"
						error-message=${this._errorMessage}
						enable-file-drop
						@stage-file-for-upload=${this.onStageFileForUpload}
						@upload-error=${this.onUploadError}></content-file-drop>
					<content-file-drop
						id="prompt-with-file-drop-disabled"
						error-message=${this._errorMessage}
						@stage-file-for-upload=${this.onStageFileForUpload}
						@upload-error=${this.onUploadError}></content-file-drop>
					`;
				break;
			case TabStatus.CONFIRMATION:
				tabContent = html`
					<upload-confirmation
						content-title=${this._contentTitle}
						file-name=${this._fileName}
						file-size=${this._fileSize}
						file-type=${this._fileType}
						@change-content-title=${this.onChangeContentTitle}
						@discard-staged-file=${this.onDiscardStagedFile}></upload-confirmation>
					`;
				break;
			case TabStatus.UPLOADING:
				tabContent = html`
					<upload-progress-indicator
						file-name=${this._fileName}
						upload-progress=${this.uploader.uploadProgress}></upload-progress-indicator>
				`;
		}

		return html`<div id="tab-container">
			<div id="tab-content-container">
				${tabContent}
			</div>
			<div id="top-level-buttons">
				<d2l-button
					primary
					description=${this.localize('addSelectedContentToCourse')}
					?disabled=${(this._tabStatus !== TabStatus.CONFIRMATION) || !this._contentTitle}
					@click=${this.onSaveClick}
					>${this.localize('save')}</d2l-button>
				<d2l-button
					description=${this.localize('closeDialog')}
					@click=${this.onCancelClick}
					>${this.localize('cancel')}</d2l-button>
			</div>
		</div>`;
	}

	onCancelClick() {
		if (this._tabStatus === TabStatus.UPLOADING) {
			this.uploader.cancelUpload()
				.catch(() => {
					this._errorMessage = this.localize('workerErrorCancelUploadFailed');
				})
				.finally(() => {
					this.uploader.reset();
					this.onDiscardStagedFile();
				});
		} else {
			this.dispatchEvent(new CustomEvent('d2l-content-store-cancel-add-content', {
				bubbles: true,
				composed: true
			}));
		}
	}

	onChangeContentTitle(event) {
		this._contentTitle = event.detail.contentTitle;
	}

	onDiscardStagedFile() {
		this.file = undefined;
		this._fileName = '';
		this._fileSize = 0;
		this._fileType = '';
		this._contentTitle = '';
		this._tabStatus = TabStatus.PROMPT;
	}

	onSaveClick() {
		this._tabStatus = TabStatus.UPLOADING;
		this.uploader.uploadFile(this.file, this._contentTitle);
	}

	onStageFileForUpload(event) {
		this.file = event.detail.file;
		this._fileName = event.detail.file.name;
		this._fileSize = event.detail.file.size;
		this._fileType = event.detail.file.type;
		this._contentTitle = this._fileName.substring(0, this._fileName.lastIndexOf('.'));
		this._tabStatus = TabStatus.CONFIRMATION;
		this._errorMessage = '';
	}

	onUploadError(event) {
		this._errorMessage = event.detail.message;
		this.file = undefined;
		this._fileName = '';
		this._fileSize = 0;
		this._fileType = '';
		this._contentTitle = '';
		this._tabStatus = TabStatus.PROMPT;
	}

	reactToUploadError(error) {
		this._errorMessage = this.localize(error);
		this.uploader.reset();
		this.file = undefined;
		this._fileName = '';
		this._fileSize = 0;
		this._fileType = '';
		this._contentTitle = '';
		this._tabStatus = TabStatus.PROMPT;
	}

	reactToUploadSuccess(d2lrn) {
		this.dispatchEvent(new CustomEvent('d2l-content-store-content-added', {
			detail: { d2lrn },
			bubbles: true,
			composed: true
		}));
	}
}

window.customElements.define('d2l-content-store-add-content-upload-audio-video-tab', UploadAudioVideoTab);
