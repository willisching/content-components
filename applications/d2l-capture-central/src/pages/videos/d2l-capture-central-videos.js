import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '@brightspace-ui/core/components/list/list-item-content.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/list/list.js';
import '../../components/content-filter-dropdown.js';
import '../../components/videos/content-list.js';
import '../../components/upload-status-management.js';
import '../../components/unauthorized-message.js';

import { css, html } from 'lit-element/lit-element.js';
import { contentSearchMixin } from '../../mixins/content-search-mixin.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { navigationSharedStyle } from '../../style/d2l-navigation-shared-styles.js';
import { PageViewElement } from '../../components/page-view-element';
import { rootStore } from '../../state/root-store.js';
import { sharedManageStyles } from '../../style/shared-styles.js';
import { getSupportedExtensions } from '../../util/media-type-util.js';
import { maxFileSizeInBytes } from '../../util/constants.js';
import { formatFileSize } from '@brightspace-ui/intl/lib/fileSize';

class D2LCaptureCentralVideos extends contentSearchMixin(DependencyRequester(PageViewElement)) {
	static get properties() {
		return {
			contentItems: { type: Array, attribute: false },
		};
	}

	static get styles() {
		return [heading2Styles, navigationSharedStyle, sharedManageStyles, css`
			.d2l-capture-central-videos-heading {
				display: none;
			}
			.d2l-capture-central-videos-controls {
				display: flex;
				margin: 25px 0;
			}

			.d2l-capture-central-videos-upload-button {
				margin-right: 10px;
			}

			content-filter-dropdown {
				margin-left: auto;
			}

			.d2l-capture-central-videos-input-search {
				margin-left: 10px;
				max-width: 375px;
			}

			.sidebar-container {
				display: flex;
				flex-direction: column;
				padding-top: 1.5rem;
				padding-bottom: 1.5rem;
			}
			.list-container {
				margin-top: 0.75rem;
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

			@media (max-width: 768px) {
				.d2l-capture-central-videos-heading {
					display: flex;
					width: 100%;
				}
				.d2l-capture-central-videos-controls {
					margin-top: 0;
				}
			}
		`];
	}

	constructor() {
		super();
		this._supportedTypes = getSupportedExtensions();
	}

	connectedCallback() {
		super.connectedCallback();
		this.uploader = this.requestDependency('uploader');
	}

	render() {
		if (!rootStore.permissionStore.getCanManageCaptureCentral()) {
			return html`
				<unauthorized-message></unauthorized-message>
			`;
		}
		const heading = rootStore.permissionStore.getCanManageAllVideos() ? this.localize('everyonesVideos') : this.localize('myVideos');
		return html`
			<div class="d2l-capture-central-manage-container">
				<h2 class="d2l-capture-central-videos-heading d2l-heading-2">${heading}</h2>
				<div class="d2l-capture-central-videos-controls">
					<d2l-button
						class="d2l-capture-central-videos-upload-button"
						@click=${this._handleFileUploadClick}
						primary
					>${this.localize('upload')}
					</d2l-button>
					<content-filter-dropdown
						@change-filter-cleared=${this._handleFilterCleared}
						@change-filter=${this._handleFilterChange}
					></content-filter-dropdown>
					<d2l-input-search
						class="d2l-capture-central-videos-input-search"
						label="${this.localize('searchPlaceholder')}"
						placeholder="${this.localize('searchPlaceholder')}"
						maxlength="100"
						value=${this.rootStore.routingStore.getQueryParams().searchQuery || ''}
						@d2l-input-search-searched=${this._handleSearch}
					></d2l-input-search>
				</div>
				<content-list></content-list>
			</div>
			<upload-status-management id="upload-status-management"></upload-status-management>
			<input
				type="file"
				id="fileInput"
				accept=${this._supportedTypes.join(',')}
				@change=${this._handleFileChange}
				style="display:none"
				multiple
			/>
			<d2l-alert-toast
				id="upload-toast"
				type="error"
				announce-text=${this.uploadErrorMessage}>
				${this.uploadErrorMessage}
			</d2l-alert-toast>
		`;
	}

	_handleFileChange(event) {
		const { files } = event.target;
		for (const file of files) {
			if (file.size > maxFileSizeInBytes) {
				const errorToastElement = this.shadowRoot.querySelector('#upload-toast');
				if (errorToastElement) {
					this.uploadErrorMessage = this.localize(
						'fileTooLarge',
						{ localizedMaxFileSize: formatFileSize(maxFileSizeInBytes) }
					);
					this.requestUpdate();
					errorToastElement.setAttribute('open', true);
				}
				event.target.value = '';
				return;
			}
		}
		this.uploader.uploadFiles(files);
		event.target.value = '';
	}

	_handleFileUploadClick() {
		this.shadowRoot.querySelector('#fileInput').click();
	}

	_handleFilterChange({ detail = {} }) {
		this._navigate('/videos', {
			...this.rootStore.routingStore.getQueryParams(),
			...detail
		});
	}

	_handleFilterCleared() {
		const queryParams = this.rootStore.routingStore.getQueryParams();
		delete queryParams.dateCreated;
		delete queryParams.dateModified;
		this._navigate('/videos', queryParams);
	}

	_handleSearch(event) {
		const { value } = event.detail;

		this._navigate('/videos', {
			...this.rootStore.routingStore.getQueryParams(),
			searchQuery: value
		});
	}
}
customElements.define('d2l-capture-central-videos', D2LCaptureCentralVideos);
