import { css, html, LitElement } from 'lit-element';
import { ResizeObserver } from 'd2l-resize-aware/resize-observer-module.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import '@brightspace-ui/core/components/colors/colors.js';

class TwoColumnLayout extends RtlMixin(LitElement) {
	static get properties() {
		return {
		};
	}

	static get styles() {
		return css`
			:host {
				display: block;
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
				flex-shrink: 0;
				height: var(--primary-header-height, auto);
			}
			.sidebar {
				background-color: var(--sidebar-background-color, transparent);
				border-right: 1px solid var(--d2l-color-gypsum);
				box-sizing: border-box;
				flex-shrink: 0;
				flex-grow: 0;
				position: fixed;
				width: var(--sidebar-width, 350px);
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
				margin-left: var(--sidebar-width, 350px);
				overflow-x: auto;
				width: 100%;
			}
			:host([dir="rtl"]) .primary {
				margin-left: 0px;
				margin-right: var(--sidebar-width, 350px);
			}
			.primary-content {
				min-width: 500px;
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

	_resized() {
		this._adjustSidebar();
		this._adjustPrimary();
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
}

window.customElements.define('two-column-layout', TwoColumnLayout);
