import { html, LitElement } from 'lit-element/lit-element.js';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';

class UploadStatusDialog extends MobxReactionUpdate(DependencyRequester(LitElement)) {
	render() {
		return html`
			<ul>
				${this.uploader.uploads.map(upload => html`<li>${upload.file.name} ${upload.progress}</li>`)}
			</ul>
		`;
	}

	connectedCallback() {
		super.connectedCallback();
		this.uploader = this.requestDependency('uploader');
	}
}

window.customElements.define('upload-status-dialog', UploadStatusDialog);
