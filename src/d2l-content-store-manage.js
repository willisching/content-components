import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { PageViewElement } from './components/page-view-element.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/icons/icon.js';
import 'd2l-dropdown/d2l-dropdown.js';
import 'd2l-dropdown/d2l-dropdown-content.js';
import './components/two-column-layout.js';

class D2lContentStoreManage extends PageViewElement {
	static get properties() {
		return {
			subView: { type: String }
		};
	}

	static get styles() {
		return [heading2Styles, css`
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
			.menu-container {
				display: flex;
				flex-direction: column;
			}
			.new-button-container {
				align-items: center;
				display: flex;
				flex-wrap: nowrap;
				justify-content: flex-start;
			}
			.new-button-icon {
				color: white;
				padding-left: 0.5rem;
			}
			:host([dir="rtl"]) .new-button-icon {
				padding-left: 0;
				padding-right: 0.5rem;
			}
			.menu-container-item {
				margin-top: 0.5rem;
			}
		`];
	}

	renderSidebar() {
		return html`
		<div class="menu-container">
			<d2l-dropdown>
				<d2l-button class="d2l-dropdown-opener dropdown-opener-button" primary>
					<div class="new-button-container">
						<div>${this.localize('new')}</div>
						<div><d2l-icon class="new-button-icon" icon="tier1:chevron-down"></d2l-icon></div>
					</div>
				</d2l-button>
				<d2l-dropdown-content>
					<p>${this.localize('createANewItem')}</p>
				</d2l-dropdown-content>
			</d2l-dropdown>
			<div class="menu-container-item">
				<d2l-menu label="${this.localize('menu')}">
					<d2l-menu-item text="${this.localize('myContent')}" @click=${this.goToFilesView}></d2l-menu-item>
					<d2l-menu-item text="${this.localize('trash')}" @click=${this.goToRecycleBin}></d2l-menu-item>
				</d2l-menu>
			</div>
		</div>
		`;
	}

	renderPrimary() {
		return html`
			<h2 class="d2l-heading-2 h2-custom">${this.localize('myContent')}</h2>
			<p>Your current view placeholder is: ${this.subView}</p>
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

	goToFilesView() {
		this._navigate('/manage/files');
	}

	goToRecycleBin() {
		this._navigate('/manage/trash');
	}
}

window.customElements.define('d2l-content-store-manage', D2lContentStoreManage);
