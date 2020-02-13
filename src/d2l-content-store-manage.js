import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles, bodyStandardStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { observe } from 'mobx';
import { PageViewElement } from './components/page-view-element.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/list/list.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/list/list-item-content.js';
import 'd2l-dropdown/d2l-dropdown.js';
import 'd2l-dropdown/d2l-dropdown-content.js';
import './components/two-column-layout.js';

class D2lContentStoreManage extends PageViewElement {
	static get properties() {
		return {
		};
	}

	static get styles() {
		return [heading2Styles, bodyStandardStyles, css`
			:host {
				display: block;
			}
			:host([hidden]) {
				display: none;
			}
			d2l-menu-item {
				background-color: transparent;
			}
			two-column-layout {
				--sidebar-background-color: var(--d2l-color-regolith);
			}
			.h2-custom {
				margin-top: 0 !important;
			}
			.sidebar-container {
				display: flex;
				flex-direction: column;
			}
			.list-container {
				margin-top: 1.1rem;
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
		<div class="sidebar-container">
			<d2l-dropdown>
				<d2l-dropdown-button text="${this.localize('new')}" primary>
					<d2l-dropdown-menu>
						<d2l-menu>
							<d2l-menu-item text="${this.localize('createANewItem')}" @click=${this.handleFileUploadClick} ></d2l-menu-item>
						</d2l-menu>
					</d2l-dropdown-menu>
				</d2l-dropdown-button>
				<input type="file" id="fileInput" @change=${this.handleFileChange} style="display:none" multiple />
				<file-uploader id="uploader" files=${this.files} @upload-completed=${this.handleUploadCompleted}></file-uploader>
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
		`;
	}

	renderPrimary() {
		return html`
			<h2 class="d2l-heading-2 h2-custom">${this.localize('myContent')}</h2>
			<p>Your current view placeholder is: ${this.rootStore.routingStore.getSubView()}</p>
			${this.rootStore.routingStore.queryParams.page && html`<p>You're on page ${this.rootStore.routingStore.queryParams.page}</p>`}
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

	handleFileUploadClick() {
		this.shadowRoot.querySelector('#fileInput').click();
	}

	handleFileChange(event) {
		const files = [];
		for (let i = 0; i < event.target.files.length; i++) {
			files[i] = event.target.files[i];
		}

		const uploader = this.shadowRoot.querySelector('#uploader');
		uploader.enqueueFiles(files);
	}

	handleUploadCompleted(event) {
		console.log(event);
	}

	goToFilesView() {
		this._navigate('/manage/files', { sortBy: 'date', page: Math.floor(Math.random() * 10) });
	}

	goToRecycleBin() {
		this._navigate('/manage/trash');
	}
}

window.customElements.define('d2l-content-store-manage', D2lContentStoreManage);
