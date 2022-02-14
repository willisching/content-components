import '@brightspace-ui/core/components/inputs/input-search.js';
import '@brightspace-ui/core/components/inputs/input-checkbox.js';
import '@brightspace-ui/core/components/dialog/dialog.js';
import '@brightspace-ui/core/components/dialog/dialog-confirm.js';
import '@brightspace-ui-labs/pagination/pagination.js';
import '@brightspace-ui/core/components/table/table-col-sort-button.js';
import { tableStyles } from '@brightspace-ui/core/components/table/table-wrapper.js';
import { radioStyles } from '@brightspace-ui/core/components/inputs/input-radio-styles.js';

import { css, html, LitElement } from 'lit-element/lit-element.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin';

const dialogConfirmAction = 'confirm';
const sortFields = {
	lastName: 'LastName',
	firstName: 'FirstName',
	userId: 'UserId'
};

class D2LTransferOwnerShipDialog extends DependencyRequester(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			contentId: { type: String, attribute: 'content-id' },
			ownerId: { type: String, attribute: 'owner-id' },
			title: { type: String },
			_users: { type: Array, attribute: false },
			_selectedUser: { type: Number, attribute: false },
			_confirmDisabled: { type: Boolean, attribute: false },
			_currentSort: { type: String, attribute: false },
			_sortIsDesc: { type: Boolean, attribute: false },
			_pageNumber: { type: Number, attribute: false },
		};
	}

	static get styles() {
		return [tableStyles, radioStyles, css`
			.d2l-transfer-ownership-results-container {
				margin-top: 15px;
				height: 400px;
			}
		`];
	}

	constructor() {
		super();
		this.reset();
	}

	render() {
		return html`
			<d2l-dialog id="transfer-ownership" title-text="${this.localize('transferOwnership')}">
				<d2l-input-search
					id="transfer-ownership-input"
					label="${this.localize('search')}"
					@d2l-input-search-searched=${this.handleUserSearch}
				></d2l-input-search>
				<div class="d2l-transfer-ownership-results-container">
					${this.renderSearch()}
				</div>
				<d2l-button
					slot="footer"
					?disabled=${this._confirmDisabled}
					id="transfer-ownership-dialog-confirm"
					primary
					@click=${this.openConfirmDialog()}
				>${this.localize('save')}</d2l-button>
				<d2l-button slot="footer" id="transfer-ownership-cancel" dialog-action>${this.localize('cancel')}</d2l-button>
			</d2l-dialog>

			<d2l-dialog-confirm
				id="transfer-ownership-confirm"
				title-text="${this.localize('transferOwnership')}"
				text=${this.localize('transferOwnershipWarning', { fileName: this.title, user: this._selectedUserDisplayname })}
			>
				<d2l-button slot="footer" primary dialog-action="${dialogConfirmAction}">${this.localize('yes')}</d2l-button>
				<d2l-button slot="footer" dialog-action>${this.localize('no')}</d2l-button>
			</d2l-dialog-confirm>
		`;
	}

	dispatchTransferOwnershipEvent() {
		this.dispatchEvent(new CustomEvent('transfer-ownership-dialog-transfer', {
			bubbles: true,
			composed: true,
			detail: {
				id: this.contentId,
				userId: this._selectedUser,
				displayName: this._selectedUserDisplayname
			}
		}));
	}

	handleItemsPerPageChange(e) {
		this._pageSize = e.detail.itemCount;
	}

	handlePageChange(e) {
		this._pageNumber = e.detail.page;
		this.performSearch();
	}

	handleSort(e) {
		const { target } = e;
		const sortName = target.getAttribute('value');

		if (this._currentSort !== sortName) {
			this._sortIsDesc = false;
		} else {
			this._sortIsDesc = !target.hasAttribute('desc');
		}

		this._currentSort = sortName;
		this.performSearch();
	}

	handleUserSearch(event) {
		const { value } = event.detail;
		this._searchTerm = value;
		this._pageNumber = 1;
		this.performSearch();
	}

	open() {
		if (this._users !== null) {
			this.reset();
			this.shadowRoot.querySelector('#transfer-ownership-input').value = '';
		}
		this.shadowRoot.querySelector('#transfer-ownership').open();
	}

	openConfirmDialog() {
		return async() => {
			const action = await this.shadowRoot.querySelector('#transfer-ownership-confirm').open();
			if (action === dialogConfirmAction) {
				this.shadowRoot.querySelector('#transfer-ownership').removeAttribute('opened');
				this.dispatchTransferOwnershipEvent();
			}
		};
	}

	performSearch() {
		const searchResult = D2L.LP.Web.UI.Rpc.ConnectObject(
			D2L.LP.Web.UI.Rpc.Verbs.GET,
			new D2L.LP.Web.Http.UrlLocation('/d2l/wcs/transfer-ownership/search'),
			{
				searchTerm: this._searchTerm,
				pageNumber: this._pageNumber,
				pageSize: this._pageSize,
				sortField: this._currentSort,
				isAscending: !this._sortIsDesc
			},
		);
		searchResult.AddListener(result => {
			const resultJson = JSON.parse(result);
			this._users = resultJson.Objects;
			this._totalCount = resultJson.TotalCount;
			this.removeSelection();
		});
	}

	removeSelection() {
		if (this._selectedUser) {
			this.shadowRoot.querySelector(`input[user-id="${this._selectedUser}"`).checked = false;
			this._selectedUser = null;
			this._selectedUserDisplayname = '';
			this._confirmDisabled = true;
		}
	}

	renderSearch() {
		return this._users !== null ?
			html`
			<d2l-table-wrapper>
					<table class="d2l-table">
						<thead>
							<tr>
								<th></th>
								<th>
									<d2l-table-col-sort-button
										@click=${this.handleSort}
										?nosort=${this._currentSort !== sortFields.firstName}
										?desc=${this._sortIsDesc}
										value=${sortFields.firstName}
									>
										${this.localize('firstName')}
									</d2l-table-col-sort-button>
									<d2l-table-col-sort-button
										@click=${this.handleSort}
										?nosort=${this._currentSort !== sortFields.lastName}
										?desc=${this._sortIsDesc}
										value=${sortFields.lastName}
									>
										${this.localize('lastName')}
									</d2l-table-col-sort-button>
								</th>
								<th>
									<d2l-table-col-sort-button
										@click=${this.handleSort}
										?nosort=${this._currentSort !== sortFields.userId}
										?desc=${this._sortIsDesc}
										value=${sortFields.userId}
									>
										${this.localize('userId')}
									</d2l-table-col-sort-button>
								</th>
							</tr>
						</thead>
						<tbody>
							${this.renderUsers()}
						</tbody>
					</table>
				</d2l-table-wrapper>
				<d2l-labs-pagination
					page-number="${this._pageNumber}"
					max-page-number="${1 + Math.floor(this._totalCount / this._pageSize)}"
					show-item-count-select
					selected-count-option="${this._pageSize}"
					@pagination-page-change=${this.handlePageChange}
					@pagination-item-counter-change=${this.handleItemsPerPageChange}
				></d2l-labs-pagination>
			` :
			html`
			<p>${this.localize('performSearch')}</p>
			`;
	}

	renderUsers() {
		return this._users.map(row => {
			const displayName = `${row.FirstName} ${row.LastName}`;
			return html`
				<tr>
					<td>
						<input
							aria-label=${this.localize('selectOption', { option: displayName })}
							type="radio"
							name="userGroup"
							user-id="${row.UserId}"
							.value=${displayName}
							class="d2l-input-radio"
							@change=${this.selectUser}
						>
					</td>
					<td>${displayName}</td>
					<td>${row.UserId}</td>
				</tr>
			`;
		});
	}

	reset() {
		this._users = null;
		this._selectedUser = null;
		this._confirmDisabled = true;
		this._currentSort = sortFields.lastName;
		this._sortIsDesc = false;
		this._pageNumber = 1;
		this._pageSize = 10;
		this._selectedUserDisplayname = '';
		this._searchTerm = '';
		this._totalCount = 0;
	}

	selectUser(e) {
		const { target } = e;
		if (target) {
			this._selectedUser = target.getAttribute('user-id');
			this._selectedUserDisplayname = target.getAttribute('value');
			this._confirmDisabled = false;
		}
	}

}

window.customElements.define('d2l-transfer-ownership-dialog', D2LTransferOwnerShipDialog);
