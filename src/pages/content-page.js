import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { PageViewElement } from '../components/page-view-element.js';
import { navigationSharedStyle } from '../styles/d2l-navigation-shared-styles.js';

import '@brightspace-ui/core/components/inputs/input-search.js';
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
			.content-page-header {
				align-items: center;
				display: flex;
				justify-content: space-between;
			}
			.content-page-search-input {
				max-width: 12.5rem;
			}

			@media (max-width: 900px) {
				.content-page-header {
					align-items: flex-start;
					flex-direction: column;
				}
			}
		`];
	}

	render() {
		return html`
			<div class="content-page-header">
				<h2 class="d2l-heading-2 d2l-navigation-gutters">
					${this.localize('myContent')}
				</h2>
				<d2l-input-search
					class="content-page-search-input d2l-navigation-gutters"
					label="${this.localize('searchPlaceholder')}"
					placeholder="${this.localize('searchPlaceholder')}"
					maxlength="100"
					value=${this.rootStore.routingStore.getQueryParams().q || ''}
					@d2l-input-search-searched=${this._handleSearch}
				></d2l-input-search>
			</div>
			<content-list></content-list>
		`;
	}

	_handleSearch({ detail = {} }) {
		const { value } = detail;

		this._navigate('/manage/content', {
			...this.rootStore.routingStore.getQueryParams(),
			q: encodeURIComponent(value)
		});
	}
}

window.customElements.define('content-page', ContentPage);
