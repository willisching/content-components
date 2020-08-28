import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/inputs/input-checkbox.js';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '@brightspace-ui-labs/pagination/pagination.js';
import 'd2l-table/d2l-table-wrapper.js';

import { bodyStandardStyles, heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { css, html } from 'lit-element/lit-element.js';
import { sharedManageStyles, sharedTableStyles } from '../../components/shared-styles.js';
import { d2lTableStyles } from '../../components/d2l-table-styles.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { PageViewElement } from '../../components/page-view-element.js';

class D2lCaptureUsers extends DependencyRequester(PageViewElement) {

	static get properties() {
		return {
			_numSelectedUsers: { type: Number },
			_users: { type: Array }
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
		this._numSelectedUsers = 0;
		this._users = [{
			id: 1,
			username: 'Username 1',
			email: 'email1@email.com',
			role: 'Admin',
		}, {
			id: 2,
			username: 'Username 1',
			email: 'email2@email.com',
			role: 'Admin',
		}, {
			id: 3,
			username: 'Username 1',
			email: 'email3@email.com',
			role: 'Admin',
		}, {
			id: 4,
			username: 'Username 1',
			email: 'email4@email.com',
			role: 'Admin',
		}, {
			id: 5,
			username: 'Username 1',
			email: 'email5@email.com',
			role: 'Admin',
		}, {
			id: 6,
			username: 'Username 1',
			email: 'email6@email.com',
			role: 'Admin',
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
		this._numSelectedUsers += numAddedToSelection * (e.target.checked ? 1 : -1);
	}

	_addToSelection(e) {
		this._numSelectedUsers += e.target.checked ? 1 : -1;
	}

	_renderUsers() {
		return this._users.map(row => html`
			<tr>
				<td><d2l-input-checkbox aria-label=${this.localize('selectOption', { option: row.username })} @change=${this._addToSelection}></d2l-input-checkbox></td>
				<td><d2l-link @click=${this._goTo('/users/edit', { id: row.id })}>${row.username}</d2l-link></td>
				<td>${row.email}</td>
				<td>${row.role}</td>
			</tr>
		`);
	}

	render() {
		return html`
			<div class="d2l-capture-central-manage-container">
				<d2l-breadcrumbs>
					<d2l-breadcrumb @click=${this._goTo('/admin')} href="#" text="${this.localize('captureCentral')}"></d2l-breadcrumb>
					<d2l-breadcrumb-current-page text="${this.localize('users')}"></d2l-breadcrumb-current-page>
				</d2l-breadcrumbs>
				<div class="d2l-capture-central-manage-header">
					<h2 class="d2l-heading-2">${this.localize('manageUsers')}</h2>
					<div class="d2l-capture-central-manage-header-button-group">
						<d2l-button primary>
							${this.localize('createUser')}
						</d2l-button>
						<d2l-dropdown-button class="d2l-capture-central-users-logs-export" text="${this.localize('export')}">
							<d2l-dropdown-menu>
								<d2l-menu label="${this.localize('export')}">
									<d2l-menu-item text="${this.localize('csv')}"></d2l-menu-item>
								</d2l-menu>
							</d2l-dropdown-menu>
						</d2l-dropdown-button>
					</div>
				</div>
				<div class="d2l-body-standard d2l-capture-central-manage-num-selected">
					${this.localize('numUsersSelected', { count: this._numSelectedUsers })}
				</div>
				<div class="d2l-capture-central-manage-options">
					<d2l-button>${this.localize('delete')}</d2l-button>
					<d2l-button>${this.localize('settings')}</d2l-button>
					<d2l-input-search
						label="${this.localize('searchUsers')}"
						placeholder="${this.localize('searchUsers')}"
					></d2l-input-search>
				</div>
				<d2l-table-wrapper sticky-headers>
					<p class="d2l-capture-central-table-caption" id="d2l-capture-central-table-caption">
						${this.localize('manageUsers')}
					</p>
					<table class="d2l-table" aria-describedby="d2l-capture-central-table-caption">
						<thead>
							<tr>
								<th class="d2l-capture-central-th-checkbox-container">
									<d2l-input-checkbox
										aria-label=${this.localize('selectAllUsers')}
										@change=${this._addAllToSelection}
									></d2l-input-checkbox>
								</th>
								<th><div class="d2l-capture-central-th-container">
									${this.localize('username')}
								</div></th>
								<th><div class="d2l-capture-central-th-container">
									${this.localize('email')}
								</div></th>
								<th><div class="d2l-capture-central-th-container">
									${this.localize('role')}
								</div></th>
							</tr>
						</thead>
						<tbody>
							${this._renderUsers()}
						</tbody>
					</table>
				</d2l-table-wrapper>
				<d2l-labs-pagination page-number="1" max-page-number="5"></d2l-labs-pagination>
			</div>
		`;
	}
}

window.customElements.define('d2l-capture-central-users', D2lCaptureUsers);
