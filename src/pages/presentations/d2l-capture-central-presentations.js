import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/dropdown/dropdown-context-menu.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/inputs/input-checkbox.js';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '@brightspace-ui/core/components/menu/menu.js';
import '@brightspace-ui/core/components/menu/menu-item.js';
import '@brightspace-ui-labs/pagination/pagination.js';
import 'd2l-table/d2l-table-wrapper.js';

import { bodyStandardStyles, heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { css, html } from 'lit-element/lit-element.js';
import { sharedManageStyles, sharedTableStyles } from '../../components/shared-styles.js';
import { d2lTableStyles } from '../../components/d2l-table-styles.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { PageViewElement } from '../../components/page-view-element.js';

class D2lCapturePresentations extends DependencyRequester(PageViewElement) {

	static get properties() {
		return {
			_numSelectedPresentations: { type: Number }
		};
	}
	static get styles() {
		return [
			bodyStandardStyles,
			d2lTableStyles,
			heading2Styles,
			sharedManageStyles,
			sharedTableStyles,
			css``
		];
	}

	constructor() {
		super();
		this._numSelectedPresentations = 0;
	}

	_addAllToSelection(e) {
		const checkboxes = this.shadowRoot.querySelectorAll('tbody d2l-input-checkbox');
		let numAddedToSelection = 0;
		checkboxes.forEach(checkbox => {
			if (checkbox.checked !== e.target.checked) {
				numAddedToSelection += 1;
			}
			checkbox.checked = e.target.checked;
		});
		this._numSelectedPresentations += numAddedToSelection * (e.target.checked ? 1 : -1);
	}

	_addToSelection(e) {
		this._numSelectedPresentations += e.target.checked ? 1 : -1;
	}

	_renderLivePresentations() {
		const launches = [{
			id: 1,
			name: 'Recording 1',
			presenter: 'DC',
			views: 12,
		}, {
			id: 2,
			name: 'Recording 2',
			presenter: '-',
			views: 30,
		}, {
			id: 3,
			name: 'Recording 3',
			presenter: '-',
			views: 30,
		}, {
			id: 4,
			name: 'Recording 4',
			presenter: '-',
			views: 30,
		}, {
			id: 5,
			name: 'Recording 5',
			presenter: '-',
			views: 30,
		}, {
			id: 6,
			name: 'Recording 6',
			presenter: '-',
			views: 30,
		}];

		return launches.map(row => html`
			<tr>
				<td><d2l-input-checkbox aria-label=${this.localize('selectOption', { option: row.name })} @change=${this._addToSelection}></d2l-input-checkbox></td>
				<td><d2l-link @click=${this._goTo('/presentations/edit', { id: row.id })}>${row.name}</d2l-link></td>
				<td>${row.presenter}</td>
				<td>${row.views}</td>
				<td>
					<d2l-dropdown-context-menu>
						<d2l-dropdown-menu>
							<d2l-menu label="${this.localize('moreOptions')}">
								<d2l-menu-item text="${this.localize('openInProducer')}"></d2l-menu-item>
								<d2l-menu-item text="${this.localize('openInPlayer')}"></d2l-menu-item>
								<d2l-menu-item text="${this.localize('duplicate')}"></d2l-menu-item>
								<d2l-menu-item text="${this.localize('delete')}"></d2l-menu-item>
							</d2l-menu>
						</d2l-dropdown-menu>
					</d2l-dropdown-context-menu>
				</td>
			</tr>
		`);
	}

	render() {
		return html`
			<div class="d2l-capture-central-manage-container">
				<d2l-breadcrumbs>
					<d2l-breadcrumb @click=${this._goTo('/admin')} href="#" text="${this.localize('captureCentral')}"></d2l-breadcrumb>
					<d2l-breadcrumb-current-page text="${this.localize('presentations')}"></d2l-breadcrumb-current-page>
				</d2l-breadcrumbs>
				<div class="d2l-capture-central-manage-header">
					<h2 class="d2l-heading-2">${this.localize('managePresentations')}</h2>
					<d2l-button primary>
						${this.localize('uploadVideo')}
					</d2l-button>
				</div>
				<div class="d2l-body-standard d2l-capture-central-manage-num-selected">
					${this.localize('numPresentationsSelected', { count: this._numSelectedPresentations })}
				</div>
				<div class="d2l-capture-central-manage-options">
					<d2l-button class="delete-button">${this.localize('delete')}</d2l-button>
					<d2l-button class="settings-button">${this.localize('settings')}</d2l-button>
					<d2l-input-search
						class="search-presentations"
						label="${this.localize('searchPresentations')}"
						placeholder="${this.localize('searchPresentations')}"
					></d2l-input-search>
				</div>
				<d2l-table-wrapper sticky-headers>
					<p class="d2l-capture-central-table-caption" id="d2l-capture-central-table-caption">
						${this.localize('livePresentations')}
					</p>
					<table class="d2l-table" aria-describedby="d2l-capture-central-table-caption">
						<thead>
							<tr>
								<th class="d2l-capture-central-th-checkbox-container">
									<d2l-input-checkbox aria-label=${this.localize('selectAllPresentations')} @change=${this._addAllToSelection}></d2l-input-checkbox>
								</th>
								<th>
									<div class="d2l-capture-central-th-container">
										${this.localize('name')}
									</div>
								</th>
								<th>
									<div class="d2l-capture-central-th-container">
										${this.localize('presenter')}
									</div>
								</th>
								<th>
									<div class="d2l-capture-central-th-container">
										${this.localize('views')}
									</div>
								</th>
								<th class="d2l-capture-central-th-more-options-container">
								</th>
							</tr>
						</thead>
						<tbody>
							${this._renderLivePresentations()}
						</tbody>
					</table>
				</d2l-table-wrapper>
				<d2l-labs-pagination page-number="1" max-page-number="5"></d2l-labs-pagination>
			</div>
		`;
	}
}

window.customElements.define('d2l-capture-central-presentations', D2lCapturePresentations);
