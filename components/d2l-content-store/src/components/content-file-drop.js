import { css, html, LitElement } from 'lit-element/lit-element.js';
import '@brightspace-ui/core/components/colors/colors.js';
import 'file-drop-element';

import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';

class ContentFileDrop extends DependencyRequester(LitElement) {
	static get properties() {
		return {
			_supportedMimeTypes: { type: Array }
		};
	}

	static get styles() {
		return [css`
			file-drop {
				display: block;
				border: 1px solid transparent;
			}
			file-drop.drop-valid {
				background-color: var(--d2l-color-celestine-plus-2);
				border: 1px solid var(--d2l-color-primary-accent-action);
			}
			file-drop.drop-invalid {
				background-color: var(--d2l-color-cinnabar-plus-2);
				border: 1px solid var(--d2l-color-feedback-error);
			}
		`];
	}

	constructor() {
		super();
		this._supportedMimeTypes = [];
	}

	onFileDrop(event) {
		this.uploader.uploadFiles(event._files);
	}

	async connectedCallback() {
		super.connectedCallback();
		this.uploader = this.requestDependency('uploader');
		this.client = this.requestDependency('content-service-client');
		this._supportedMimeTypes = await this.client.getSupportedMimeTypes();
	}

	render() {
		return html`
			<file-drop multiple @filedrop=${this.onFileDrop} accept=${this._supportedMimeTypes.join(',')}>
				<slot></slot>
			</file-drop>
		`;
	}
}

window.customElements.define('content-file-drop', ContentFileDrop);
