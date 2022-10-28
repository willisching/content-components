import '@brightspace-ui/core/components/colors/colors.js';
import 'file-drop-element';
import { css, html, LitElement } from 'lit-element/lit-element.js';

import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from '../../../../mixins/internal-localize-mixin.js';

class ContentFileDrop extends InternalLocalizeMixin(DependencyRequester(LitElement)) {
	static get styles() {
		return [css`
			file-drop {
				display: block;
				border: 1px solid transparent;
				padding: 2px;
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

	async connectedCallback() {
		super.connectedCallback();
		this._uploader = this.requestDependency('uploader');
		this._supportedTypes = this.requestDependency('supported-types');
	}

	render() {
		return html`
			<file-drop multiple @filedrop=${this.onFileDrop}>
				<slot></slot>
			</file-drop>
		`;
	}

	onFileDrop(event) {
		const { files } = event;
		this.dispatchEvent(new CustomEvent('file-drop', {
			detail: { files },
			bubbles: true,
			composed: true
		}));
	}

	_dispatchFileDropErrorEvent(message) {
		this.dispatchEvent(new CustomEvent('file-drop-error', {
			detail: { message },
			bubbles: true,
			composed: true
		}));
	}
}

window.customElements.define('content-file-drop', ContentFileDrop);
