import { css, html, LitElement } from 'lit-element';
import '@brightspace-ui/core/components/colors/colors.js';

class GhostBox extends LitElement {
	static get styles() {
		return [css`
			:host {
				display: block;
			}

			.ghost {
				border-radius: 4px;
				width: 100%;
				height: 100%;
				-webkit-animation: skeletonPulse 1.8s ease-in-out infinite alternate;
				animation: skeletonPulse 1.8s ease-in-out infinite alternate;
			}
			@-webkit-keyframes skeletonPulse {
				0%{background: var(--d2l-color-sylvite)}
				50%{background: var(--d2l-color-regolith)}
				100%{background: var(--d2l-color-sylvite)}
			}
			@keyframes skeletonPulse {
				0%{background: var(--d2l-color-sylvite)}
				50%{background: var(--d2l-color-regolith)}
				100%{background: var(--d2l-color-sylvite)}
			}
		`];
	}

	render() {
		return html`<div class="ghost"></div>`;
	}
}

window.customElements.define('ghost-box', GhostBox);
