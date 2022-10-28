import './components/create-presentation-dialog.js';
import './components/two-column-layout.js';
import './components/upload-status-management.js';
import '../../../core/d2l-media-web-recording/d2l-media-web-recording-dialog.js';
import '@brightspace-ui/core/components/dropdown/dropdown.js';
import '@brightspace-ui/core/components/dropdown/dropdown-button.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/list/list-item-content.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/list/list.js';
import '@brightspace-ui/core/components/menu/menu.js';
import '@brightspace-ui/core/components/menu/menu-item.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import '@brightspace-ui/core/components/dialog/dialog.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { BASE_PATH } from './state/routing-store.js';

import { DependencyRequester } from './mixins/dependency-requester-mixin.js';
import { formatFileSize } from '@brightspace-ui/intl/lib/fileSize';
import { InternalLocalizeMixin } from '../../../mixins/internal-localize-mixin.js';
import { getSupportedExtensions, isSupported } from '../../../util/media-type-util.js';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { NavigationMixin } from './mixins/navigation-mixin.js';
import { navigationSharedStyle } from './style/d2l-navigation-shared-styles.js';
import page from 'page/page.mjs';
import { maxFileSizeInBytes as defaultMaxFileUploadSizeInBytes, pageNames } from './util/constants.js';
import { ResizeObserver } from '@brightspace-ui/resize-aware/resize-observer-module.js';
import { rootStore } from './state/root-store.js';

class D2lContentLibraryApp extends DependencyRequester(NavigationMixin(InternalLocalizeMixin(MobxReactionUpdate(LitElement)))) {
	static get properties() {
		return {
			authServiceEndpoint: { type: String, attribute: 'auth-service-endpoint' },
			canAccessCapture: { type: Boolean, attribute: 'can-access-capture' },
			canManageAllObjects: { type: Boolean, attribute: 'can-manage-all-objects' },
			canTransferOwnership: { type: Boolean, attribute: 'can-transfer-ownership' },
			isMultipart: { type: Boolean, attribute: 'is-multipart' },
			maxFileUploadSizeInBytes: { type: Number, attribute: 'max-file-upload-size-in-bytes' },
			tenantId: { type: String, attribute: 'tenant-id' },
			_errorMessage: { type: String, attribute: false },
			_loading: { type: Boolean, attribute: false },
			_shouldRenderSidebar: { type: Boolean, attribute: false },
		};
	}

	static get styles() {
		return [navigationSharedStyle, css`
			.d2l-content-library {
				display: flex;
				height: 100%;
				margin: 0 auto;
				max-width: 1230px;
			}

			.d2l-content-library-loading-spinner {
				display: block;
				margin-top: 20px;
			}

			.d2l-content-library-primary {
				width: 100%;
			}

			#d2l-content-library-sidebar-header-content {
				align-items: center;
				display: flex;
				flex-direction: column;
				width: 100%;
			}

			#d2l-content-library-add-menu-button {
				width: 90%;
			}

			.d2l-content-library-primary.sidebar {
				width: auto;
			}

			.page {
				display: none;
				min-height: 500px;
			}

			.page[active] {
				display: flex;
				flex-direction:column;
				width: 100%;
			}

			.d2l-content-library-sidebar-icon {
				margin-right: 10px;
			}

			.d2l-content-library-sidebar-active {
				font-weight: bolder;
			}

			#d2l-content-library-preview {
				align-items: center;
				display: flex;
				flex-direction: column;
				height: 100%;
				justify-content: center;
				min-height: 400px;
				width: 100%;
			}

			@media (max-width: 1056px) {
				two-column-layout {
					--sidebar-width: 200px;
				}
			}

			@media (min-width: 769px) {
				#d2l-content-library-add-menu-button {
					display: block;
				}
				#d2l-content-library-add-menu-icon-button {
					display: none;
				}
			}

			@media (max-width: 768px) {
				two-column-layout {
					--sidebar-width: 65px;
				}
				d2l-list-item-content d2l-link {
					display: none;
				}
				.d2l-content-library-primary {
					position: absolute;
				}
				#d2l-content-library-add-menu-button {
					display: none;
				}
				#d2l-content-library-add-menu-icon-button {
					display: block;
				}
			}
		`];
	}

	constructor() {
		super();
		const documentObserver = new ResizeObserver(this._resized.bind(this));
		documentObserver.observe(document.body, { attributes: true });

		this._errorMessage = '';
		this._loading = true;
		this._shouldRenderSidebar = null;
		this._setupPageNavigation();
	}

	async connectedCallback() {
		await super.connectedCallback();
		this.uploader = this.requestDependency('uploader');

		this.contentServiceEndpoint = this.requestDependency('content-service-endpoint');
		this._canRecord = this.requestDependency('can-record');
		if (this._canRecord) {
			this._audioRecordingDurationLimit = this.requestDependency('audio-recording-duration-limit');
			this._videoRecordingDurationLimit = this.requestDependency('video-recording-duration-limit');
			this._autoCaptionsEnabled = this.requestDependency('auto-captions-enabled');
		}
		this._supportedTypes = this.requestDependency('supported-types');
		this._supportedExtensions = getSupportedExtensions(this._supportedTypes);

		const permissions = {
			canAccessCapture: this.canAccessCapture ? 'true' : 'false',
			canManageAllObjects: this.canManageAllObjects ? 'true' : 'false',
			canTransferOwnership: this.canTransferOwnership ? 'true' : 'false'
		};

		rootStore.permissionStore.setPermissions(permissions);
		this._loading = false;
	}

	firstUpdated() {
		super.firstUpdated();
		this.addEventListener('preview', this.onPreviewClick);
	}

	render() {
		if (this._loading) {
			return html`
				<d2l-loading-spinner
					class="d2l-content-library-loading-spinner"
					size="150"
				></d2l-loading-spinner>
			`;
		}
		const renderContent = () => {
			if (this._shouldRenderSidebar === null) {
				return;
			} else if (this._shouldRenderSidebar) {
				return html`
					<two-column-layout>
						<div slot="sidebar-header" id="d2l-content-library-sidebar-header-content">
							${this._renderAddContextMenu()}
						</div>
						<div slot="sidebar">
							${this._renderSidebar()}
						</div>
						<div slot="primary">
							${this._renderPrimary()}
						</div>
					</two-column-layout>
					<upload-status-management id="upload-status-management"></upload-status-management>
					<d2l-dialog id="preview-dialog" title-text="${this.localize('preview')}">
						<d2l-content-library-preview id="d2l-content-library-preview" active></d2l-content-library-preview>
					</d2l-dialog>
				`;
			} else {
				return html`${this._renderPrimary()}`;
			}
		};
		return html`
			<div class="d2l-content-library">
				${renderContent()}
			</div>
			<d2l-alert-toast
				id="error-toast"
				type="error"
			>
				${this._errorMessage}
			</d2l-alert-toast>
		`;
	}

	onPreviewClick(event) {
		const previewDialog = this.shadowRoot.querySelector('#preview-dialog');
		previewDialog.opened = true;
		const preview = this.shadowRoot.getElementById('d2l-content-library-preview');
		preview.contentId = event.detail.id;
		preview.contentType = event.detail.type;
		previewDialog.addEventListener('d2l-dialog-close', () => {
			preview.loading = true;
		});
		preview.firstUpdated?.();
	}

	setupPage(ctx) {
		rootStore.routingStore.setRouteCtx(ctx);
		const { page: currentPage, subView } = rootStore.routingStore;
		this._shouldRenderSidebar = true;

		switch (currentPage) {
			case '':
				import('./pages/d2l-content-library-landing.js');
				return;
			case pageNames.files:
				import('./pages/files/d2l-content-library-files.js');
				import('./pages/preview/d2l-content-library-preview.js');
				if (rootStore.routingStore.previousPage === '') {
					// Ensures the DOM updates when redirecting from the initial landing page. Otherwise, the app shows a blank page.
					this.requestUpdate();
				}
				return;
			case pageNames.recycleBin:
				import('./pages/recycle-bin/d2l-content-library-recycle-bin.js');
				return;
			case pageNames.editor:
				this._shouldRenderSidebar = false;
				if (subView) {
					import('./pages/editor/d2l-content-library-editor.js');
					return;
				}
				this._navigate('/404');
				return;
			case pageNames.preview:
				import('./pages/preview/d2l-content-library-preview.js');
				return;
			case '404':
				rootStore.routingStore.setPage('404');
				import('./pages/404/d2l-content-library-404.js');
				return;
			default:
				this._navigate('/404');
				return;
		}
	}

	_handleFileChange(event) {
		const { files } = event.target;
		this._uploadFiles(files);
		event.target.value = '';
	}

	_handleFileDrop(event) {
		const { files } = event.detail;
		this._uploadFiles(files);
		event.target.value = '';
	}

	_handleRecordingProcessingStarted(event) {
		const extension = event.detail.contentType === 'audio' ? '.mp3' : '.mp4';
		this.uploader.monitorExistingUpload({
			contentId: event.detail.contentId,
			revisionId: event.detail.revisionId,
			extension
		});

		const { page: currentPage } = rootStore.routingStore;
		if (currentPage !== pageNames.files) {
			this._navigate(`/${pageNames.files}`);
		}
	}

	_handleUploadFileClick() {
		this.shadowRoot.querySelector('#fileInput').click();
	}

	_openCreatePresentationDialog() {
		this.shadowRoot.getElementById('create-presentation-dialog').open();
	}

	_openMediaWebRecordingDialog() {
		this.shadowRoot.getElementById('media-web-recording-dialog').open();
	}

	_renderAddContextMenu() {
		const menu = html`
			<d2l-dropdown-menu>
				<d2l-menu label="${this.localize('add')}">
					<d2l-menu-item text="${this.localize('uploadFile')}" @d2l-menu-item-select=${this._handleUploadFileClick}></d2l-menu-item>
					${this._canRecord ? html`<d2l-menu-item text="${this.localize('recordWebcam')}" @d2l-menu-item-select=${this._openMediaWebRecordingDialog}></d2l-menu-item>` : ''}
					${rootStore.permissionStore.getCanAccessCapture() ? html`<d2l-menu-item text="${this.localize('captureEncoder')}" @d2l-menu-item-select=${this._openCreatePresentationDialog}></d2l-menu-item>` : ''}
				</d2l-menu>
			</d2l-dropdown-menu>
		`;

		return html`
			<d2l-dropdown-button primary id="d2l-content-library-add-menu-button" text="${this.localize('add')}">
				${menu}
			</d2l-dropdown-button>
			<d2l-dropdown id="d2l-content-library-add-menu-icon-button">
				<d2l-button-icon class="d2l-dropdown-opener" icon="tier2:add" text="${this.localize('add')}"></d2l-button-icon>
				${menu}
			</d2l-dropdown>
			${this._canRecord ? html`
				<d2l-media-web-recording-dialog
					id="media-web-recording-dialog"
					tenant-id="${this.tenantId}"
					content-service-endpoint="${this.contentServiceEndpoint}"
					client-app="VideoNote"
					audio-recording-duration-limit="${this._audioRecordingDurationLimit}"
					video-recording-duration-limit="${this._videoRecordingDurationLimit}"
					can-capture-video
					can-capture-audio
					?is-multipart=${this.isMultipart}
					?auto-captions-enabled=${this._autoCaptionsEnabled}
					@processing-started="${this._handleRecordingProcessingStarted}"
				></d2l-media-web-recording-dialog>` : ''}
			<d2l-content-library-create-presentation-dialog
				id="create-presentation-dialog"
				auth-service-endpoint="${this.authServiceEndpoint}"
				tenant-id="${this.tenantId}"
			>
			</d2l-content-library-create-presentation-dialog>
		`;
	}

	_renderPrimary() {
		const { page: currentPage, subView } = rootStore.routingStore;
		return html`
			<div class="d2l-content-library-primary d2l-navigation-gutters ${this._shouldRenderSidebar ? 'sidebar' : ''}">
				<d2l-content-library-landing class="page" ?active=${currentPage === pageNames.landing}></d2l-content-library-landing>
				<d2l-content-library-files class="page" ?active=${currentPage === pageNames.files} @file-drop=${this._handleFileDrop}></d2l-content-library-files>
				<d2l-content-library-recycle-bin class="page" ?active=${currentPage === pageNames.recycleBin}></d2l-content-library-recycle-bin>
				<d2l-content-library-editor class="page" ?active=${currentPage === pageNames.editor && !!subView}></d2l-content-library-editor>
				<d2l-content-library-404 class="page" ?active=${currentPage === pageNames.page404}></d2l-content-library-404>
			</div>
		`;
	}

	_renderSidebar() {
		const sidebarItems = [ {
			langterm: rootStore.permissionStore.getCanManageAllObjects() ? 'everyonesMedia' : 'myMedia',
			location: `/${pageNames.files}`,
			icon: rootStore.permissionStore.getCanManageAllObjects() ? 'tier2:browser' : 'tier2:folder',
		},
		{
			langterm: 'recycleBin',
			location: `/${pageNames.recycleBin}`,
			icon: 'tier2:delete',
		}];

		const { page: currentPage } = rootStore.routingStore;
		const sidebarListItems = sidebarItems.map(item => {
			const activeItem = currentPage === item.location.split('/')[1];
			return html`
				<d2l-list-item href="javascript:void(0)" @click=${this._goTo(item.location)}>
					<d2l-list-item-content>
						<d2l-icon
							style="${activeItem ? 'color: var(--d2l-color-celestine)' : ''}"
							class="d2l-content-library-sidebar-icon"
							icon="${item.icon}"
						></d2l-icon><d2l-link
							class="${activeItem ? 'd2l-content-library-sidebar-active' : ''}"
						>${this.localize(item.langterm)}</d2l-link>
					</d2l-list-item-content>
				</d2l-list-item>
			`;
		});

		return html`
			<div class="d2l-content-library-sidebar-container d2l-navigation-gutters">
				<d2l-list separators="between">
					${sidebarListItems}
				</d2l-list>
				<input
					type="file"
					id="fileInput"
					accept=${this._supportedExtensions.join(',')}
					@change=${this._handleFileChange}
					style="display:none"
					multiple
				/>
			</div>
		`;
	}

	_resized() {
		rootStore.appTop = this.offsetTop;
	}

	_setupPageNavigation() {
		page.base(BASE_PATH);

		const routes = [
			`/${pageNames.page404}`,
			`/${pageNames.files}`,
			`/${pageNames.recycleBin}`,
			`/${pageNames.editor}/:id`,
			`/${pageNames.preview}/:id`,
			'/*',
		];
		routes.forEach(route => page(route, this.setupPage.bind(this)));
		page();
	}

	_showErrorToast(errorMessage) {
		const errorToastElement = this.shadowRoot.querySelector('#error-toast');
		if (errorToastElement) {
			this._errorMessage = errorMessage;
			this.requestUpdate();
			errorToastElement.setAttribute('open', true);
		}
	}

	_uploadFiles(files) {
		const fileSizeLimit = this.maxFileUploadSizeInBytes ?? defaultMaxFileUploadSizeInBytes;
		for (const file of files) {
			if (file.size > fileSizeLimit) {
				this._showErrorToast(this.localize(
					'fileTooLarge',
					{ localizedMaxFileSize: formatFileSize(fileSizeLimit) }
				));
				event.target.value = '';
				return;
			}
			if (!isSupported(file.name, this._supportedTypes)) {
				this._showErrorToast(this.localize('invalidFileTypeSelected'));
				event.target.value = '';
				return;
			}
		}
		this.uploader.uploadFiles(files);

		const { page: currentPage } = rootStore.routingStore;
		if (currentPage !== pageNames.files) {
			this._navigate(`/${pageNames.files}`);
		}
	}
}

customElements.define('d2l-content-library-app', D2lContentLibraryApp);
