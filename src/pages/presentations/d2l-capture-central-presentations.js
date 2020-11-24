import '../../components/add-videos-dialog.js';
import '@brightspace-ui-labs/pagination/pagination.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/dialog/dialog-confirm.js';
import '@brightspace-ui/core/components/dropdown/dropdown-button.js';
import '@brightspace-ui/core/components/dropdown/dropdown-context-menu.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/inputs/input-checkbox.js';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '@brightspace-ui/core/components/menu/menu-item.js';
import '@brightspace-ui/core/components/menu/menu.js';
import 'd2l-table/d2l-table-wrapper.js';

import { css, html } from 'lit-element/lit-element.js';
import { sharedManageStyles, sharedTableStyles } from '../../style/shared-styles.js';
import { autorun } from 'mobx';
import { contentSearchMixin } from '../../mixins/content-search-mixin.js';
import { d2lTableStyles } from '../../style/d2l-table-styles.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { navigationSharedStyle } from '../../style/d2l-navigation-shared-styles.js';
import { PageViewElement } from '../../components/page-view-element.js';

class D2lCapturePresentations extends contentSearchMixin(DependencyRequester(PageViewElement)) {
	static get properties() {
		return {
			_numSelectedPresentations: { type: Number },
			_moreResultsAvailable: { type: Boolean },
			_query: { type: String },
			_start: { type: Number },
		};
	}
	static get styles() {
		return [ d2lTableStyles, heading2Styles, sharedManageStyles, sharedTableStyles, navigationSharedStyle, css`
		`];
	}

	constructor() {
		super();
		this.apiClient = this.requestDependency('content-service-client');
		this._numSelectedPresentations = 0;
	}

	async connectedCallback() {
		super.connectedCallback();
		autorun(async() => {
			if (this.rootStore.routingStore.page === 'presentations'
				&& !this.rootStore.routingStore.subView
			) {
				this._handleVideoSearch();
			}
		});
	}

	firstUpdated() {
		super.firstUpdated();
		this._table = this.shadowRoot.querySelector('d2l-table-wrapper');
	}

	_openAddVideosDialog() {
		this.shadowRoot.querySelector('d2l-capture-central-add-videos-dialog').open();
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

	_handleDeletePresentation(contentId) {
		return async() => {
			const shouldDelete = await this.shadowRoot.querySelector('d2l-dialog-confirm').open();
			if (shouldDelete) {
				this.apiClient.deleteContent({ contentId });
				this._handleVideoSearch();
			}
		};
	}

	_handlePaginationPageChange({ detail: { page } = {}}) {
		this._handlePaginationSearch(page);
	}

	_renderDialogs() {
		return html`
			<d2l-capture-central-add-videos-dialog></d2l-capture-central-add-videos-dialog>
			<d2l-dialog-confirm text=${this.localize('confirmDeletion')}>
				<d2l-button slot="footer" primary data-dialog-action="yes">${this.localize('yes')}</d2l-button>
				<d2l-button slot="footer" data-dialog-action>${this.localize('no')}</d2l-button>
			</d2l-dialog-confirm>
		`;
	}

	_renderPresentations() {
		if (!this._videos.length) {
			return html`
				<tr>
					<td class="d2l-capture-central-table-no-results" colspan=5>
						${this.localize('noResults')}
					</td>
				</tr>
			`;
		}

		return this._videos.map(({ id: contentId, title, presenter = '-', views = 0}) => html`
			<tr>
				<td>
					<d2l-input-checkbox
						aria-label=${this.localize('selectOption', { option: title })}
						@change=${this._addToSelection}
					></d2l-input-checkbox>
				</td>
				<td>
					<d2l-link @click=${this._goTo(`/presentations/edit/${contentId}`)}>${title}</d2l-link>
				</td>
				<td>${presenter}</td>
				<td>${views}</td>
				<td>
					<d2l-dropdown-context-menu>
						<d2l-dropdown-menu>
							<d2l-menu label="${this.localize('moreOptions')}">
								<d2l-menu-item
									@click=${this._goTo(`/producer/${contentId}`)}
									text="${this.localize('openInProducer')}"
								></d2l-menu-item>
								<d2l-menu-item
									@click=${this._goTo(`/course-videos/${contentId}`)}
									text="${this.localize('openInPlayer')}"
								></d2l-menu-item>
								<d2l-menu-item
									@click=${this._handleDeletePresentation(contentId)}
									text="${this.localize('delete')}"
								></d2l-menu-item>
							</d2l-menu>
						</d2l-dropdown-menu>
					</d2l-dropdown-context-menu>
				</td>
			</tr>
		`);
	}

	render() {
		return html`
			<div class="d2l-capture-central-manage-container d2l-navigation-gutters">
				<d2l-breadcrumbs>
					<d2l-breadcrumb @click=${this._goTo('/admin')} href="#" text="${this.localize('captureCentral')}"></d2l-breadcrumb>
					<d2l-breadcrumb-current-page text="${this.localize('presentations')}"></d2l-breadcrumb-current-page>
				</d2l-breadcrumbs>
				<div class="d2l-capture-central-manage-header">
					<h2 class="d2l-heading-2">${this.localize('managePresentations')}</h2>
					<d2l-dropdown-button primary text=${this.localize('addToCourseVideos')}>
						<d2l-dropdown-menu>
							<d2l-menu label="${this.localize('addToCourseVideos')}">
								<d2l-menu-item @click=${this._goTo('/upload-video')} text=${this.localize('uploadVideoDropdownOption')}></d2l-menu-item>
								<d2l-menu-item @click=${this._openAddVideosDialog} text=${this.localize('addFromContentStore')}></d2l-menu-item>
							</d2l-menu>
						</d2l-dropdown-menu>
					</d2l-dropdown-button>
				</div>
				<div class="d2l-capture-central-manage-num-selected">
					${this.localize('numPresentationsSelected', { count: this._numSelectedPresentations })}
				</div>
				<div class="d2l-capture-central-manage-options">
					<d2l-button ?disabled=${this._numSelectedPresentations === 0}>${this.localize('delete')}</d2l-button>
					<d2l-button ?disabled=${this._numSelectedPresentations === 0}>${this.localize('settings')}</d2l-button>
					<d2l-input-search
						@d2l-input-search-searched=${this._handleInputVideoSearch}
						class="search-presentations"
						label="${this.localize('searchPresentations')}"
						placeholder="${this.localize('searchPresentations')}"
					></d2l-input-search>
				</div>
				<d2l-table-wrapper>
					<p class="d2l-capture-central-table-caption" id="d2l-capture-central-table-caption">
						${this.localize('presentations')}
					</p>
					<table class="d2l-table" aria-describedby="d2l-capture-central-table-caption">
						<thead>
							<tr>
								<th class="d2l-capture-central-th-checkbox-container">
									<d2l-input-checkbox aria-label=${this.localize('selectAllPresentations')} @change=${this._addAllToSelection}></d2l-input-checkbox>
								</th>
								<th><div class="d2l-capture-central-th-container">
									${this.localize('name')}
								</div></th>
								<th><div class="d2l-capture-central-th-container">
									${this.localize('presenter')}
								</div></th>
								<th><div class="d2l-capture-central-th-container">
									${this.localize('views')}
								</div></th>
								<th class="d2l-capture-central-th-more-options-container"></th>
							</tr>
						</thead>
						<tbody>
							${this._renderPresentations()}
						</tbody>
					</table>
				</d2l-table-wrapper>
				<d2l-labs-pagination
					@pagination-page-change=${this._handlePaginationPageChange}
					?hidden="${this._totalResults < 20}"
					page-number="${this._start / 20 + 1}"
					max-page-number="${Math.ceil(this._totalResults / 20)}"
				></d2l-labs-pagination>
				${this._renderDialogs()}
			</div>
		`;
	}
}

window.customElements.define('d2l-capture-central-presentations', D2lCapturePresentations);
