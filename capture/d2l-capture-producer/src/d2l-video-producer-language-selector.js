import '@brightspace-ui/core/components/dropdown/dropdown-button-subtle.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import { html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from './internal-localize-mixin.js';

class VideoProducerLanguageSelector extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			disabled: { type: Boolean },
			languages: { type: Array },
			selectedLanguage: { type: Object },
		};
	}

	constructor() {
		super();
		this.disabled = false;
		this.languages = null;
		this.selectedLanguage = null;
	}

	render() {
		if (!(this.languages && this.selectedLanguage)) {
			return;
		}

		const selectLanguage = language => () => {
			this.selectedLanguage = language;
			this.dispatchEvent(new CustomEvent(
				'selected-language-changed',
				{
					composed: false,
					detail: { selectedLanguage: language }
				}
			));
		};

		return html`
			<d2l-dropdown-button-subtle ?disabled="${this.disabled}" text="${this.selectedLanguage.name}">
				<d2l-dropdown-menu id="dropdown">
					<d2l-menu label="${this.localize('languages')}">
						${this.languages.map(language => html`
							<d2l-menu-item @click="${selectLanguage(language)}" text=${language.name}></d2l-menu-item>
						`)}
					</d2l-menu>
				</d2l-dropdown-menu>
			</d2l-dropdown-button-subtle>
		`;
	}
}
customElements.define('d2l-video-producer-language-selector', VideoProducerLanguageSelector);
