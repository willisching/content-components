import { css, html, LitElement } from 'lit-element/lit-element.js';
import { LocalizeMixin } from '@brightspace-ui/core/mixins/localize-mixin.js';

class D2lContentStoreAddContent extends LocalizeMixin(LitElement) {

	static get properties() {
		return {
			prop1: { type: String },
		};
	}

	static get styles() {
		return css`
			:host {
				display: inline-block;
			}
			:host([hidden]) {
				display: none;
			}
		`;
	}

	static async getLocalizeResources(langs) {
		const langResources = {
			'en': { 'myLangTerm': 'I am a localized string!' }
		};

		for (let i = 0; i < langs.length; i++) {
			if (langResources[langs[i]]) {
				return {
					language: langs[i],
					resources: langResources[langs[i]]
				};
			}
		}

		return null;
	}

	constructor() {
		super();

		this.prop1 = 'd2l-content-store-add-content';
	}

	render() {
		return html`
			<h2>Hello ${this.prop1}!</h2>
			<div>Localization Example: ${this.localize('myLangTerm')}</div>
		`;
	}
}
customElements.define('d2l-content-store-add-content', D2lContentStoreAddContent);
