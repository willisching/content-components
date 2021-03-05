import { LitElement, css, html } from 'lit-element';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/colors/colors.js';
import Type from '../util/content-type.js';

class ContentIcon extends LitElement {
	static get properties() {
		return {
			type: { type: String, attribute: 'type' },
			icon: { type: String, attribute: false },
			colorStyle: { type: String, attribute: false }
		};
	}

	static get styles() {
		return [css`
			.icon {
				border-radius: 5px;
				padding: var(--content-icon-padding, 12px);
			}
			.spacer {
				height: 0;
				padding: 0 12px;
			}
		`];
	}

	connectedCallback() {
		super.connectedCallback();
		const [bg, fg] = Type.toColors(this.type);
		this.colorStyle = [
			`background-color: var(--d2l-color-${bg})`,
			`color: var(--d2l-color-${fg})`
		].join('; ');
	}

	render() {
		return html`
			<d2l-icon
				class="${this.type ? 'icon' : 'spacer'}"
				icon=${`tier1:${Type.toIcon(this.type)}`}
				style=${this.colorStyle}
			></d2l-icon>`;
	}
}

window.customElements.define('content-icon', ContentIcon);
