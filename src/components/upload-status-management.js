import { css, html, LitElement } from 'lit-element/lit-element.js';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import { ResizeObserver } from 'd2l-resize-aware/resize-observer-module.js';
import { heading4Styles, bodySmallStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin.js';
import { rootStore } from '../state/root-store.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/list/list.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/list/list-item-content.js';
import '@brightspace-ui/core/components/meter/meter-circle.js';
import './content-icon.js';

const rightOffset = '1.2rem';

class UploadStatusManagement extends InternalLocalizeMixin(RtlMixin(MobxReactionUpdate(DependencyRequester(LitElement)))) {
	static get properties() {
		return {
			toggleShowHideText: { type: String },
			toggleShowHideIcon: { type: String }
		};
	}

	static get styles() {
		return [heading4Styles, bodySmallStyles, css`
			:host {
				display: none;
			}
			:host([hidden]) {
				display: none;
			}
			.container {
				background-color: #ffffff;
				border-radius: 0.3rem;
				border: 1px solid var(--d2l-color-mica);
				bottom: 1.2rem;
				box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
				box-sizing: border-box;
				max-height: 300px;
				overflow: hidden;
				position: fixed;
				width: 360px;
				z-index: 100;
			}
			.header {
				align-items: center;
				background-color: var(--d2l-color-gypsum);
				display: flex;
				height: 2.6rem;
				padding: 0 0.2rem;
			}
			.header-title {
				cursor: default;
				display: inline-block;
				flex: 0 1 auto;
				overflow: hidden;
				padding: 0 24px;
				text-overflow: ellipsis;
				white-space: nowrap;
				width: 362px;
			}
			.header-icons-container {
				flex: 0 0 auto;
			}
			.content {
				max-height: calc(300px - 2.6rem);
				overflow-x: hidden;
				overflow-y: auto;
			}
			content-icon {
				--content-icon-padding: 3px;
			}
			.upload-item-container {
				align-items: center;
				display: flex;
				flex-direction: row;
				height: 1.6rem;
			}
			.upload-file-name-container {
				align-items: center;
				display: flex;
				flex: 1 1 auto;
				width: 100px;
			}
			.upload-file-name {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			.upload-file-progress {
				flex: 0 0 1.6rem;
				height: 1.6rem;
				padding: 0 0.5rem;
			}
			.upload-file-complete {
				color: var(--d2l-color-feedback-success);
				flex: 0 0 1.6rem;
				padding: 0 0.5rem;
			}
			.upload-file-error {
				color: var(--d2l-color-feedback-error);
				flex: 0 0 1.6rem;
				padding: 0 0.5rem;
			}
			.error {
				color: var(--d2l-color-feedback-error);
				min-width: 0;
			}
			.content-icon-container {
				flex: 0 0 auto;
				padding: 0 0.5rem;
			}
			.upload-failed-message {
				margin-bottom: 0.40rem;
				margin-left: 2.2rem;
				margin-top: -0.15rem;
			}
			:host([dir="rtl"]) .upload-failed-message {
				margin-left: 0;
				margin-right: 2.2rem;
			}
		`];
	}

	constructor() {
		super();
		const documentObserver = new ResizeObserver(this._resized.bind(this));
		documentObserver.observe(document.body, { attributes: true });

		this.toggleShowHideText = '';
		this.toggleShowHideIcon = '';
	}

	firstUpdated() {
		super.firstUpdated();
		this._resized();

		this.toggleShowHideText = this.localize('hide');
		this.toggleShowHideIcon = 'd2l-tier1:chevron-down';
	}

	renderHeaderTitle() {
		let message = '';
		if (this.uploader.uploadsInProgress === 1) {
			message = this.localize('uploadInProgress');
		} else if (this.uploader.uploadsInProgress > 1) {
			message = this.localize('uploadsInProgress', 'uploadsInProgress', this.uploader.uploadsInProgress);
		} else if (this.uploader.uploads.length === 1) {
			message = this.localize('uploadCompleted');
		} else if (this.uploader.uploads.length > 1) {
			message = this.localize('uploadsCompleted', 'uploadsCompleted', this.uploader.uploads.filter(upload => upload.progress === 100).length);
		} else {
			message = '';
		}

		return html`<span role="status" aria-live="polite" class="header-title d2l-heading-4">${message}</span>`;
	}

	renderUploadProgress({ progress, file }) {
		let progressIndicator = html``;
		if (progress === 100) {
			progressIndicator = html`
				<d2l-icon class="upload-file-complete" icon="tier2:check"></d2l-icon>
			`;
		} else {
			progressIndicator = html`
				<d2l-meter-circle class="upload-file-progress" value=${progress} max="100" percent></d2l-meter-circle>
			`;
		}

		return html`
			<div class="upload-file-name-container">
				<span class="upload-file-name">${file.name}</span>
			</div>
			${progressIndicator}
		`;
	}

	renderUploadError(upload) {
		return html`
			<div class="upload-file-name-container">
				<div class="upload-file-name error">${upload.file.name}</div>
			</div>
			<d2l-icon class="upload-file-error" icon="tier2:alert"></d2l-icon>

		`;
	}

	renderContent() {
		return html`
			<d2l-list>
				${this.uploader.uploads.slice(0).reverse().map(upload => html`
					<d2l-list-item>
						<d2l-list-item-content>
							<div class="upload-item-container">
								<div class="content-icon-container">
									<content-icon type="${upload.extension}"></content-icon>
								</div>
								${upload.error ? this.renderUploadError(upload) : this.renderUploadProgress(upload)}
							</div>
							${upload.error && html`<div class="upload-failed-message" slot="secondary">${this.localize('uploadFailed')}</div>`}
						</d2l-list-item-content>

					</d2l-list-item>
				`)}
			</d2l-list>
		`;
	}

	render() {
		return html`
			<div class="container" id="container">
				<div class="header">
					${this.renderHeaderTitle()}
					<div class="header-icons-container">
						<d2l-button-icon
							icon="${this.toggleShowHideIcon}"
							text="${this.toggleShowHideText}"
							@click="${this._toggleShowHideDialog}">
						</d2l-button-icon>
						<d2l-button-icon icon="d2l-tier1:close-small" text="${this.localize('close')}" @click="${this._closeDialog}"></d2l-button-icon>
					</div>
				</div>
				<div class="content" id="content" tabindex="0">
					${this.renderContent()}
				</div>
			</div>
		`;
	}

	connectedCallback() {
		super.connectedCallback();
		this.uploader = this.requestDependency('uploader') || rootStore.uploader;
	}

	_resized() {
		const { parentElement } = this;
		const containerElement = this.shadowRoot.querySelector('#container');
		if (parentElement && containerElement) {
			if (this._dir === 'rtl') {
				const leftOfParentElement = parentElement.getBoundingClientRect().left;
				containerElement.style.left = `calc( ${leftOfParentElement}px + ${rightOffset})`;
				containerElement.style.right = 'auto';
			} else {
				const rightOfParentElement = window.innerWidth - parentElement.getBoundingClientRect().right;
				containerElement.style.right = `calc( ${rightOfParentElement}px + ${rightOffset}`;
				containerElement.style.left = 'auto';
			}
		}
	}

	_toggleShowHideDialog() {
		const contentElement = this.shadowRoot.querySelector('#content');
		if (contentElement && contentElement.style.display === 'none') {
			contentElement.style.display = 'block';
			this.toggleShowHideText = this.localize('hide');
			this.toggleShowHideIcon = 'd2l-tier1:chevron-down';
		} else if (contentElement) {
			contentElement.style.display = 'none';
			this.toggleShowHideText = this.localize('show');
			this.toggleShowHideIcon = 'd2l-tier1:chevron-up';
		}
	}

	_closeDialog() {
		this.style.display = 'none';
		this.uploader.clearCompletedUploads();
	}

	show() {
		const contentElement = this.shadowRoot.querySelector('#content');
		if (contentElement && contentElement.style.display === 'none') {
			this._toggleShowHideDialog();
		}

		this.style.display = 'block';
	}
}

window.customElements.define('upload-status-management', UploadStatusManagement);
