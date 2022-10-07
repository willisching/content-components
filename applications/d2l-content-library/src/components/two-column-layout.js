import '@brightspace-ui/core/components/colors/colors.js';
import { css, html, LitElement } from 'lit-element';
import { ResizeObserver } from '@brightspace-ui/resize-aware/resize-observer-module.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';

class TwoColumnLayout extends RtlMixin(LitElement) {
	static get styles() {
		return css`
			:host {
				display: block;
				width: 100%;
			}
			:host([hidden]) {
				display: none;
			}
			.container {
				box-sizing: border-box;
				display: flex;
				height: 100%;
				margin: 0px;
				overflow: hidden;
			}
			.content {
				flex-grow: 1;
				height: 100%;
				overflow-y: auto;
			}
			.column {
				height: 100%;
			}
			.sidebar-header {
				align-items: center;
				display: flex;
				flex-direction: column;
				flex-shrink: 0;
				height: var(--primary-header-height, auto);
				margin-top: 25px;
				margin-bottom: 25px;
			}
			.sidebar {
				background-color: var(--sidebar-background-color, transparent);
				border-right: 1px solid var(--d2l-color-gypsum);
				box-sizing: border-box;
				flex-shrink: 0;
				flex-grow: 0;
				position: fixed;
				width: var(--sidebar-width, 300px);
				/* Sidebar needs to be stacked on top of the Primary column in order to prevent the "Add" dropdown menu from being covered by other page elements on mobile. */
				z-index: 1;
			}
			:host([dir="rtl"]) .sidebar {
				border-left: 1px solid var(--d2l-color-gypsum);
				border-right: none;
			}
			.primary-header {
				flex-shrink: 0;
				height: var(--primary-header-height, auto);
			}
			.primary-header-slot {
				border-bottom: 1px solid var(--d2l-color-gypsum);
			}
			.primary {
				margin-left: var(--sidebar-width, 300px);
				max-width: 930px;
				width: 100%;
			}
			:host([dir="rtl"]) .primary {
				margin-left: 0px;
				margin-right: var(--sidebar-width, 300px);
			}
			.primary-content {
				min-width: 500px;
			}

			@media (max-width: 1056px) {
				.primary {
					max-width: 1030px;
				}
			}

			@media (max-width: 660px) {
				.primary-content {
					min-width: 400px;
				}
			}
		`;
	}

	constructor() {
		super();
		const documentObserver = new ResizeObserver(this._resized.bind(this));
		documentObserver.observe(document.body, { attributes: true });

		window.addEventListener('scroll', () => {
			this._adjustSidebar();
		});
	}

	firstUpdated() {
		super.firstUpdated();
		this._resized();
	}

	render() {
		return html`
			<div id="container" class="container">
				<div id="sidebar" class="sidebar column">
					<div class="sidebar-header">
						<slot name="sidebar-header"></slot>
					</div>
					<div class="content" id="sidebar-content">
						<slot name="sidebar"></slot>
					</div>
				</div>
				<div id="primary" class="primary column">
					<div class="primary-header" id="primary-header">
						<slot class="primary-header-slot" name="primary-header"></slot>
					</div>
					<div class="content primary-content" id="primary-content">
						<slot name="primary"></slot>
					</div>
				</div>
			</div>
		`;
	}

	_adjustPrimary() {
		const sidebarElement = this.shadowRoot.querySelector('#sidebar');
		const primaryElement = this.shadowRoot.querySelector('#primary');
		const primaryContentElement = this.shadowRoot.querySelector('#primary-content');
		if (primaryElement && sidebarElement && primaryContentElement) {
			primaryElement.style.minHeight = sidebarElement.style.height;
			primaryContentElement.style.minHeight = sidebarElement.style.height;
		}
	}

	_adjustSidebar() {
		const containerElement = this.shadowRoot.querySelector('#container');
		const sidebarElement = this.shadowRoot.querySelector('#sidebar');
		if (containerElement && sidebarElement) {
			const containerElementToTopOfDocument = containerElement.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop);
			const difference = containerElementToTopOfDocument - window.pageYOffset;
			sidebarElement.style.top = difference < 0 ? '0px' : `${difference}px`;
			sidebarElement.style.height = `calc( 100vh - ${sidebarElement.offsetTop}px - 8px )`;
		}
	}

	_resized() {
		this._adjustSidebar();
		this._adjustPrimary();
	}
}

window.customElements.define('two-column-layout', TwoColumnLayout);
