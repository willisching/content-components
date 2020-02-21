import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { PageViewElement } from '../components/page-view-element.js';
import { navigationSharedStyle } from '../styles/d2l-navigation-shared-styles.js';

import '../components/content-list/content-list.js';

class ContentPage extends PageViewElement {
	static get styles() {
		return [heading2Styles, navigationSharedStyle, css`
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
			<h2 class="d2l-heading-2 d2l-navigation-gutters">${this.localize('myContent')}</h2>
			<content-list></content-list>
		`;
	}
}

window.customElements.define('content-page', ContentPage);
