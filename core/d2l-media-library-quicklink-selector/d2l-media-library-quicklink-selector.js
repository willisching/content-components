import '../d2l-content-selector-list.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import { heading4Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin';

import ContentType from '../../util/content-type.js';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { BrightspaceApiClient } from '@d2l/content-service-shared-utils';

const TYPE_KEY = 'mediaLibrary';
const VIEW = Object.freeze({
	LIST: 'list',
	PROPERTIES: 'properties',
});

class MediaLibraryQuicklinkSelector extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			canManageAllObjects: { type: Boolean, attribute: 'can-manage-all-objects' },
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			orgUnitId: { type: Number, attribute: 'org-unit-id' },
			moduleId: { type: Number, attribute: 'module-id' },
			tenantId: { type: String, attribute: 'tenant-id' },
			userId: { type: String, attribute: 'user-id' },
			_primaryButtonDisabled: { type: Boolean },
			_currentView: { type: String },
		};
	}

	static get styles() {
		return [heading4Styles, css`
			.quicklink-selector-container {
				height: 100%;
			}

			.quicklink-selector-header {
				padding-top: 10px;
			}

			.quicklink-selector-header > d2l-breadcrumbs {
				font-weight: 700;
			}

			.button-group {
				padding-top: 5px;
			}

			.button-group > d2l-button {
				margin-right: 18px;
			}

			.title-input {
				padding-top: 20px;
			}
		`];
	}

	constructor() {
		super();
		this._primaryButtonDisabled = true;
		this._supportedTypes = [ContentType.AUDIO, ContentType.VIDEO];
		this._clientApps = ['LmsContent', 'LmsCapture', 'VideoNote', 'Capture', 'LmsCourseImport', 'none'];
		this._currentView = VIEW.LIST;
	}

	connectedCallback() {
		super.connectedCallback();

		this.brightspaceClient = new BrightspaceApiClient({
			httpClient: new ContentServiceBrowserHttpClient()
		});
	}

	render() {
		let breadcrumbs;
		let innerView;
		let buttons;

		switch (this._currentView) {
			case VIEW.LIST:
				breadcrumbs = html`
					<d2l-breadcrumb-current-page text=${this.localize('mediaLibrary')}></d2l-breadcrumb-current-page>
				`;
				innerView = html`
					<d2l-content-selector-list
						allowFilter
						allowSelection
						allowSort
						showDescription
						showThumbnail
						?canManageAllObjects=${this.canManageAllObjects}
						.contentTypes=${this._supportedTypes}
						.clientApps=${this._clientApps}
						serviceUrl=${this.contentServiceEndpoint}
						tenantId=${this.tenantId}
						userId=${this.userId}
						@object-selected=${this._enableAddButton}
					>
					</d2l-content-selector-list>
				`;
				buttons = html`
					<d2l-button
						primary
						?disabled=${this._primaryButtonDisabled}
						description="${this.localize('next')}"
						@click=${this._handleNextButton}
					>${this.localize('next')}</d2l-button>
				`;
				break;
			case VIEW.PROPERTIES:
				breadcrumbs = html`
				<d2l-breadcrumb
					text="${this.localize('mediaLibrary')}"
					@click=${this._handleBackButton}
					href="javascript:void(0)"
				></d2l-breadcrumb>
				<d2l-breadcrumb-current-page text="${this.localize('properties')}"></d2l-breadcrumb-current-page>
			`;
				innerView = html`
					<d2l-input-text
					  id="title-input"
						class="title-input"
						label="${this.localize('title')}"
						placeholder="${this.localize('titlePlaceholder')}"
						value="${this._itemTitle}"
						@input=${this._titleInputChangedHandler}
					>
					</d2l-input-text>
				`;
				buttons = html`
					<d2l-button
						primary
						?disabled=${this._primaryButtonDisabled}
						description="${this.localize('insert')}"
						@click=${this._addQuicklink}
					>${this.localize('insert')}</d2l-button>
				`;
				break;
			default:
				break;
		}
		return html`
			<div class="quicklink-selector-container">
				<div id="selector-header" class="quicklink-selector-header">
					<d2l-breadcrumbs>
						${breadcrumbs}
					</d2l-breadcrumbs>
				</div>
				<div id="inner-view">
					${innerView}
				</div>
				<div class="button-group">
					${buttons}
					<d2l-button
						description=${this.localize('cancel')}
						@click=${this._cancel}
					>${this.localize('cancel')}</d2l-button>
				</div>
			</div>
		`;
	}

	resize(height) {
		// Need to wait until the breadcrumb and footer buttons render so we can use their height
		// to calculate the height of the selector list.
		if (this.shadowRoot?.querySelector('d2l-breadcrumb-current-page')?.offsetHeight) {
			const header = this.shadowRoot.getElementById('selector-header');
			const footer = this.shadowRoot.querySelector('.button-group');
			this.shadowRoot.getElementById('inner-view').style.height = `${height - header.offsetHeight - footer.offsetHeight}px`;
		} else {
			setTimeout(() => this.resize(height), 500);
		}
	}

	_addQuicklink() {
		const titleInputElement = this.shadowRoot.getElementById('title-input');
		if (titleInputElement) {
			this.dispatchEvent(new CustomEvent('create-quicklink', {
				bubbles: true,
				composed: true,
				detail: {
					typeKey: TYPE_KEY,
					itemId: this._itemId,
					itemTitle: titleInputElement.value,
					itemProperties: [
						// This property ensures the quicklink opens in a new tab when accessed from an html file.
						{ name: 'target', value: 'NewWindow' }
					]
				}
			}));
		}
	}

	_cancel() {
		this.dispatchEvent(new CustomEvent('cancel'));
	}

	_enableAddButton() {
		this._primaryButtonDisabled = false;
	}

	_handleBackButton() {
		this._currentView = VIEW.LIST;
		this._primaryButtonDisabled = true;
	}

	_handleNextButton() {
		const selectedObject = this.shadowRoot.querySelector('d2l-content-selector-list').selectedContent;
		this._itemId = `${TYPE_KEY}-${selectedObject.id}`;
		this._itemTitle = selectedObject.lastRevTitle;
		this._currentView = VIEW.PROPERTIES;
	}

	_titleInputChangedHandler(event) {
		const titleInputValue = event.target.value;
		this._primaryButtonDisabled = !titleInputValue || titleInputValue.trim().length === 0;
	}
}

customElements.define('d2l-media-library-quicklink-selector', MediaLibraryQuicklinkSelector);
