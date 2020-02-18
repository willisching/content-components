import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles, bodyStandardStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { observe } from 'mobx';
import { PageViewElement } from './components/page-view-element.js';
import { navigationSharedStyle } from './styles/d2l-navigation-shared-styles.js';
import { DependencyRequester } from './mixins/dependency-requester-mixin.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/list/list.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/list/list-item-content.js';
import 'd2l-dropdown/d2l-dropdown.js';
import 'd2l-dropdown/d2l-dropdown-content.js';
import './components/two-column-layout.js';

class D2lContentStoreManage extends DependencyRequester(PageViewElement) {
	static get properties() {
		return {
		};
	}

	static get styles() {
		return [heading2Styles, bodyStandardStyles, navigationSharedStyle, css`
			:host {
				display: block;
			}
			:host([hidden]) {
				display: none;
			}
			d2l-menu-item {
				background-color: transparent;
			}
			.h2-custom {
				margin-top: 0 !important;
			}
			.sidebar-container {
				display: flex;
				flex-direction: column;
				padding-top: 1.5rem;
				padding-bottom: 1.5rem;
			}
			.primary-container {
				padding: 1.5rem;
			}
			.list-container {
				margin-top: 0.75rem;
				padding: 0 0.5rem;
			}
			.list-item-container {
				align-items: center;
				display: flex;
				flex-wrap: nowrap;
			}
			.list-item-label {
				color: var(--d2l-color-ferrite) !important;
				padding-left: 0.75rem;
			}
			:host([dir="rtl"]) .list-item-label {
				padding-left: 0;
				padding-right: 0.75rem;
			}
			.dropdown-menu {
				left: 0.75rem !important;
			}
			:host([dir="rtl"]) .dropdown-menu {
				right: 0.75rem !important;
				left: 0 !important;
			}
		`];
	}

	constructor() {
		super();
		observe(
			this.rootStore.routingStore,
			'subView',
			change => {
				if (this.rootStore.routingStore.page === 'manage') {
					console.log(`Your sub view changed from ${change.oldValue} to ${change.newValue}`);
				}
			}
		);

		observe(
			this.rootStore.routingStore,
			'page',
			change => {
				if (this.rootStore.routingStore.page === 'manage') {
					console.log(`Your page changed from ${change.oldValue} to ${change.newValue}`);
				}
			}
		);
	}

	renderSidebar() {
		return html`
		<div class="sidebar-container d2l-navigation-gutters">
			<d2l-dropdown>
				<d2l-dropdown-button text="${this.localize('new')}" primary>
					<d2l-dropdown-menu class="dropdown-menu">
						<d2l-menu>
							<d2l-menu-item text="${this.localize('createANewItem')}" @click=${this.handleFileUploadClick} ></d2l-menu-item>
						</d2l-menu>
					</d2l-dropdown-menu>
				</d2l-dropdown-button>
			</d2l-dropdown>
			<div class="list-container">
				<d2l-list separators="between">
					<d2l-list-item href="javascript:void(0)" @click=${this.goToFilesView}>
						<d2l-list-item-content class="list-item-container">
							<d2l-icon icon="tier2:content"></d2l-icon><span class="list-item-label">${this.localize('myContent')}</span>
						</d2l-list-item-content>
					</d2l-list-item>
					<d2l-list-item href="javascript:void(0)" @click=${this.goToRecycleBin}>
						<d2l-list-item-content class="list-item-container">
							<d2l-icon icon="tier2:delete"></d2l-icon><span class="list-item-label">${this.localize('trash')}</span>
						</d2l-list-item-content>
					</d2l-list-item>
				</d2l-list>
			</div>
		</div>
		<input type="file" id="fileInput" @change=${this.handleFileChange} style="display:none" multiple />
		`;
	}

	renderPrimary() {
		return html`
			<div class="primary-container">
				<h2 class="d2l-heading-2 h2-custom">${this.localize('myContent')}</h2>
				<p>Your current view placeholder is: ${this.rootStore.routingStore.getSubView()}</p>
				${this.rootStore.routingStore.queryParams.page && html`<p>You're on page ${this.rootStore.routingStore.queryParams.page}</p>`}
			</div>
		`;
	}

	render() {
		return html`
			<div>
				<two-column-layout>
					<div slot="sidebar">
						${this.renderSidebar()}
					</div>
					<div slot="primary">
						${this.renderPrimary()}
					</div>
				</two-column-layout>
			</div>
		`;
	}

	connectedCallback() {
		super.connectedCallback();
		this.uploader = this.requestDependency('uploader');
	}

	handleFileUploadClick() {
		this.shadowRoot.querySelector('#fileInput').click();
	}

	handleFileChange(event) {
		for (let i = 0; i < event.target.files.length; i++) {
			this.uploader.uploadFile(event.target.files[i]);
		}

		event.target.value = '';
	}

	goToFilesView() {
		this._navigate('/manage/files', { sortBy: 'date', page: Math.floor(Math.random() * 10) });
	}

	goToRecycleBin() {
		this._navigate('/manage/trash');
	}
}

window.customElements.define('d2l-content-store-manage', D2lContentStoreManage);
