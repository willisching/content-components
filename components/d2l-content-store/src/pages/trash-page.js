import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { PageViewElement } from '../components/page-view-element.js';

class TrashPage extends PageViewElement {
	static get styles() {
		return [heading2Styles, css`
			:host {
				display: block;
			}
			:host([hidden]) {
				display: none;
			}
		`];
	}

	render() {
		return html`
			<h2 class="d2l-heading-2">${this.localize('trash')}</h2>
			<p>All your trash is ours now. Bwa-ha-ha</p>
		`;
	}
}

window.customElements.define('trash-page', TrashPage);
