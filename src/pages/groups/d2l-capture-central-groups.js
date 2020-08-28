import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/inputs/input-checkbox.js';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '@brightspace-ui-labs/pagination/pagination.js';
import 'd2l-table/d2l-table-wrapper.js';

import { css, html } from 'lit-element/lit-element.js';
import { sharedManageStyles, sharedTableStyles } from '../../components/shared-styles.js';
import { d2lTableStyles } from '../../components/d2l-table-styles.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { PageViewElement } from '../../components/page-view-element.js';

class D2lCaptureGroups extends DependencyRequester(PageViewElement) {

	static get properties() {
		return {
			_numSelectedGroups: { type: Number },
			_groups: { type: Array }
		};
	}
	static get styles() {
		return [ d2lTableStyles, heading2Styles, sharedManageStyles, sharedTableStyles, css`
		`];
	}

	constructor() {
		super();
		this._numSelectedGroups = 0;
		this._groups = [{
			id: 1,
			name: 'Group 1',
			externalName: 'External Group 1',
			role: 'Publisher',
		}, {
			id: 2,
			name: 'Group 2',
			externalName: 'External Group 2',
			role: 'Publisher',
		}, {
			id: 3,
			name: 'Group 3',
			externalName: 'External Group 3',
			role: 'Publisher',
		}, {
			id: 4,
			name: 'Group 4',
			externalName: 'External Group 4',
			role: 'Publisher',
		}, {
			id: 5,
			name: 'Group 5',
			externalName: 'External Group 5',
			role: 'Publisher',
		}, {
			id: 6,
			name: 'Group 6',
			externalName: 'External Group 6',
			role: 'Publisher',
		}];
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
		this._numSelectedGroups += numAddedToSelection * (e.target.checked ? 1 : -1);
	}

	_addToSelection(e) {
		this._numSelectedGroups += e.target.checked ? 1 : -1;
	}

	_renderGroups() {
		return this._groups.map(row => html`
			<tr>
				<td><d2l-input-checkbox aria-label=${this.localize('selectOption', { option: row.name })} @change=${this._addToSelection}></d2l-input-checkbox></td>
				<td><d2l-link @click=${this._goTo('/groups/edit', { id: row.id })}>${row.name}</d2l-link></td>
				<td>${row.externalName}</td>
				<td>${row.role}</td>
			</tr>
		`);
	}

	render() {
		return html`
			<div class="d2l-capture-central-manage-container">
				<d2l-breadcrumbs>
					<d2l-breadcrumb @click=${this._goTo('/admin')} href="#" text="${this.localize('captureCentral')}"></d2l-breadcrumb>
					<d2l-breadcrumb-current-page text="${this.localize('groups')}"></d2l-breadcrumb-current-page>
				</d2l-breadcrumbs>
				<div class="d2l-capture-central-manage-header">
					<h2 class="d2l-heading-2">${this.localize('manageGroups')}</h2>
					<d2l-button primary>
						${this.localize('createGroup')}
					</d2l-button>
				</div>
				<div class="d2l-capture-central-manage-num-selected">
					${this.localize('numGroupsSelected', { count: this._numSelectedGroups })}
				</div>
				<div class="d2l-capture-central-manage-options">
					<d2l-button>${this.localize('delete')}</d2l-button>
					<d2l-button>${this.localize('settings')}</d2l-button>
					<d2l-input-search
						label="${this.localize('searchGroups')}"
						placeholder="${this.localize('searchGroups')}"
					></d2l-input-search>
				</div>
				<d2l-table-wrapper sticky-headers>
					<p class="d2l-capture-central-table-caption" id="d2l-capture-central-table-caption">
						${this.localize('manageGroups')}
					</p>
					<table class="d2l-table" aria-describedby="d2l-capture-central-table-caption">
						<thead>
							<tr>
								<th class="d2l-capture-central-th-checkbox-container">
									<d2l-input-checkbox
										aria-label=${this.localize('selectAllGroups')}
										@change=${this._addAllToSelection}
									></d2l-input-checkbox>
								</th>
								<th><div class="d2l-capture-central-th-container">
									${this.localize('name')}
								</div></th>
								<th><div class="d2l-capture-central-th-container">
									${this.localize('externalName')}
								</div></th>
								<th><div class="d2l-capture-central-th-container">
									${this.localize('role')}
								</div></th>
							</tr>
						</thead>
						<tbody>
							${this._renderGroups()}
						</tbody>
					</table>
				</d2l-table-wrapper>
				<d2l-labs-pagination page-number="1" max-page-number="5"></d2l-labs-pagination>
			</div>
		`;
	}
}

window.customElements.define('d2l-capture-central-groups', D2lCaptureGroups);
