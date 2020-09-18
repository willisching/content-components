import '@brightspace-ui-labs/accordion/accordion-collapse.js';
import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/inputs/input-checkbox.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import 'd2l-table/d2l-table-wrapper.js';

import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles, labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { sharedEditStyles, sharedTableStyles } from '../../components/shared-styles.js';
import { autorun } from 'mobx';
import { d2lTableStyles } from '../../components/d2l-table-styles.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { inputStyles } from '@brightspace-ui/core/components/inputs/input-styles.js';
import { PageViewElement } from '../../components/page-view-element.js';

class D2LCapturePresentationsEdit extends DependencyRequester(PageViewElement) {
	static get properties() {
		return {
			_content: { type: Object },
			_downloadUrl: { type: String },
			_loading: { type: Boolean },
			_shareUrl: { type: String },
		};
	}
	static get styles() {
		return [ d2lTableStyles, inputStyles, heading2Styles, labelStyles, sharedEditStyles, sharedTableStyles, css`
			.d2l-capture-central-edit-presentation-options {
				margin-bottom: 20px;
			}
			.d2l-capture-central-edit-presentation-options d2l-icon {
				color: var(--d2l-color-celestine);
				margin-bottom: 5px;
				margin-right: 5px;
			}
			.d2l-capture-central-edit-transcode-status {
				margin-top: 15px;
			}

			.d2l-capture-central-edit-transcode-status-format {
				display: inline-block;
				width: 10%;
			}

			.d2l-capture-central-edit-url-sharing-container {
				display: flex;
				margin-top: 20px;
			}
			.d2l-capture-central-edit-url-sharing-container d2l-input-text {
				margin-right: 10px;
			}

			d2l-loading-spinner {
				display: flex;
				margin-top: 100px;
			}
		`];
	}

	constructor() {
		super();
		this.apiClient = this.requestDependency('content-service-client');
	}

	async connectedCallback() {
		super.connectedCallback();
		autorun(async() => {
			if (this.rootStore.routingStore.page === 'presentations'
				&& this.rootStore.routingStore.subView === 'edit'
			) {
				this._loading = true;
				const contentId = this.rootStore.routingStore.getQueryParams().id;
				const { orgUnitId } = this.rootStore.routingStore;
				this._content = await this.apiClient.getContent(contentId);
				this._downloadUrl = (await this.apiClient.getSignedUrl(contentId)).value;
				this._shareUrl = `${window.location.hostname}/d2l/wcs/capture-central/${orgUnitId}/course-videos/${contentId}`;
				this._loading = false;
			}
		});
	}

	_handleCopyUrl() {
		const textarea = document.createElement('textarea');
		textarea.textContent = this._shareUrl;
		textarea.style.position = 'fixed';  // Prevent scrolling to bottom of page in Microsoft Edge.
		document.body.appendChild(textarea);
		textarea.select();
		try {
			document.execCommand('copy');  // Security exception may be thrown by some browsers.
			this.shadowRoot.querySelector('#d2l-capture-central-edit-copy-url-toast').setAttribute('open', 'open');
		}
		catch (e) {
			console.warn('Copy to clipboard failed.', e);
		}
		finally {
			document.body.removeChild(textarea);
		}
	}

	async _handleSaveChanges() {
		const title = this.shadowRoot.querySelector('#d2l-capture-central-edit-presentation-title').value;
		const updatedBody = Object.assign({}, this._content, {
			title,
		});
		this.apiClient.updateContent({
			id: this._content.id,
			body: updatedBody
		});
		this._goTo('/presentations')();
	}

	render() {
		if (this._loading) {
			return html`<d2l-loading-spinner size=150></d2l-loading-spinner>`;
		}
		const { title, presenter, description, id } = this._content;
		return html`
			<div class="d2l-capture-central-edit-container">
				<d2l-breadcrumbs>
					<d2l-breadcrumb @click=${this._goTo('/admin')} href="#" text="${this.localize('captureCentral')}"></d2l-breadcrumb>
					<d2l-breadcrumb @click=${this._goTo('/presentations')} href="#" text="${this.localize('presentations')}"></d2l-breadcrumb>
					<d2l-breadcrumb-current-page text="${this.localize('editPresentation')}"></d2l-breadcrumb-current-page>
				</d2l-breadcrumbs>
				<div class="d2l-heading-2">${this.localize('editRecordedPresentation')}</div>
				<div class="d2l-capture-central-edit-presentation-options">
					<!-- <d2l-link><d2l-icon icon="tier1:file-video"></d2l-icon>${this.localize('editInPostProductionTool')}</d2l-link> -->
					<d2l-link @click=${this._goTo(`/course-videos/${id}`)}><d2l-icon icon="tier1:play"></d2l-icon>${this.localize('watchPresentation')}</d2l-link>
				</div>
				<d2l-input-text
					id="d2l-capture-central-edit-presentation-title"
					label="${this.localize('title')}"
					placeholder="${this.localize('title')}"
					value="${title}"
				></d2l-input-text>
				<!-- <d2l-input-text
					label="${this.localize('presenter')}"
					placeholder="${this.localize('presenter')}"
					value="${presenter}"
				></d2l-input-text> -->
				<!-- <div class="d2l-capture-central-edit-textarea-container">
					<div class="d2l-label-text">${this.localize('description')}</div>
					<textarea class="d2l-input">${description}</textarea>
				</div> -->
				<d2l-labs-accordion-collapse flex>
					<div slot="header">${this.localize('transcodingStatus')}</div>
					<div class="d2l-capture-central-edit-transcode-status">
						<div class="d2l-capture-central-edit-transcode-status-format">${this.localize('hd')}:</div>
						<d2l-link href=${this._downloadUrl}>${this.localize('download')}</d2l-link>
					</div>
					<!-- <div class="d2l-capture-central-edit-transcode-status">
						<div class="d2l-capture-central-edit-transcode-status-format">${this.localize('sd')}:</div>
						<d2l-link>${this.localize('download')}</d2l-link>
					</div> -->
				</d2l-labs-accordion-collapse>
				<d2l-labs-accordion-collapse flex>
					<div slot="header">${this.localize('sharing')}</div>
					<div class="d2l-capture-central-edit-url-sharing-container">
						<d2l-input-text
							disabled
							id="d2l-capture-central-edit-copy-url-input-text"
							value=${this._shareUrl}
						></d2l-input-text>
						<d2l-button-icon
							@click=${this._handleCopyUrl}
							text=${this.localize('copyUrl')}
							icon="tier1:copy"
						></d2l-button-icon>
					</div>
					<d2l-alert-toast id="d2l-capture-central-edit-copy-url-toast" type="default">
						${this.localize('copiedToClipboard')}
					</d2l-alert-toast>
				</d2l-labs-accordion-collapse>
				<!-- <d2l-labs-accordion-collapse flex>
					<div slot="header">${this.localize('prepostRollSection')}</div>
					<div>Placeholder text...</div>
				</d2l-labs-accordion-collapse> -->
				<d2l-button
					primary
					@click=${this._handleSaveChanges}
					class="d2l-capture-central-edit-save-changes-button"
				>${this.localize('saveChanges')}
				</d2l-button>
			</div>
		`;
	}
}

window.customElements.define('d2l-capture-central-presentations-edit', D2LCapturePresentationsEdit);
