import { css, html, LitElement } from 'lit-element/lit-element.js';

class RendererStatusMessage extends LitElement {
	static get styles() {
		return css`
			:host([hidden]) {
				display: none;
			}
			#status-container {
				aspect-ratio: 16/9;
				background-color: black;
				color: white;
				display: flex;
				flex-direction: column;
				justify-content: center;
 				overflow: hidden;
 				position: relative;
				text-align: center;
 				width: 100%;
			}
		`;
	}

	render() {
		return html`
            <div id="status-container">
                <slot></slot>
            </div>
        `;
	}
}

customElements.define('d2l-renderer-status-message', RendererStatusMessage);
