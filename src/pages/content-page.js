import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';

// Polyfills
import '../components/content-list/content-list.js';

import { PageViewElement } from '../components/page-view-element.js';

class ContentPage extends PageViewElement {
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
			<h2 class="d2l-heading-2">${this.localize('myContent')}</h2>
			<content-list></content-list>
		`;
	}
}

window.customElements.define('content-page', ContentPage);
