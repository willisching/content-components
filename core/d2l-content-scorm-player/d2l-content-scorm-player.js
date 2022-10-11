import { css, html, LitElement } from 'lit-element/lit-element.js';
import { getDocumentLocaleSettings } from '@brightspace-ui/intl/lib/common.js';
import { ContentServiceApiClient, enums } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { parse } from '../../util/d2lrn.js';
import { createToolItemId, ToolItemType } from '../../util/tool-item-id.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';

const { LaunchType } = enums;

class ContentScormPlayer extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			contextType: { type: String, attribute: 'context-type' },
			contextId: { type: String, attribute: 'context-id' },
			d2lrn: { type: String },
			framed: { type: Boolean, value: false },
			fullPageView: { type: Boolean, attribute: 'full-page-view' },
			preview: { type: Boolean },

			_loading: { type: Boolean, attribute: false },
			_showReviewRetakeOptions: { type: Boolean, attribute: false },
			_url: { type: String, attribute: false },
		};
	}

	static get styles() {
		return css`
			.container {
				width: 100%;
				height: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.message-container {
				-webkit-box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
				-moz-box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
				box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
				border-radius: 9px;
				border: solid 1px #d3d9e3;
				max-width: 600px;
				padding: 45px;
				font-size: 20px;
			}

			.message-title {
				text-align: left;
				font-weight: bold;
			}

			.message-description {
				text-align: left;
				margin: 33px 0 33px 0;
			}

			.message-options {
				text-align: center;
			}

			.message-container d2l-button {
				margin-right: 24px;
				margin-top: 16px;
			}

			iframe {
				width: 100%;
				height: 100%;
				border: 0;
			}
		`;
	}

	constructor() {
		super();

		this._loading = true;
		this._showReviewRetakeOptions = false;
		this._showMaintenanceMode = false;
		this._takeUrl = null;
		this._reviewUrl = null;
		this._topicId = null;
		this._orgUnitId = null;
		this._contentId = null;
		this._revisionTag = null;
		this._locale = null;
	}

	render() {
		return html`
			<div class="container">
				${this._renderContent()}
			</div>
		`;
	}

	updated(changedProperties) {
		if (changedProperties.has('d2lrn') || changedProperties.has('contentServiceEndpoint')) {
			this._setup();
		}
	}

	_handleReviewRetakeClick({ isReview }) {
		return () => {
			this._showReviewRetakeOptions = false;
			this._loading = true;

			this._launch(isReview ? LaunchType.Review : LaunchType.Retake);
		};
	}

	async _launch(launchType = LaunchType.Standard) {
		if (this._topicId === null) {
			throw new Error('Invalid SCORM launch without a topic as context');
		}

		const result = await this.client.topic.launch({
			id: this._topicId,
			locale: this._locale,
			contentId: this._contentId,
			revisionTag: this._revisionTag,
			orgUnitId: this._orgUnitId,
			launchType
		});

		if (result.maintenanceMode) {
			this._loading = false;
			this._showMaintenanceMode = true;
		} else if (result.showReviewOption) {
			this._loading = false;
			this._showReviewRetakeOptions = true;
		} else {
			this._loadScorm(result.url);
		}
	}

	_loadScorm(url) {
		this._loading = false;

		if (this.fullPageView) {
			window.location.replace(url);
		} else {
			this._url = url;
		}
	}

	_parseContextId() {
		if (this.contextType === 'sharingOrgUnit') {
			return { orgUnitId: this.contextId };
		} else if (this.contextId) {
			const splitContextId = this.contextId.split(':');
			return {
				topicId: splitContextId[0],
				orgUnitId: splitContextId[1]
			};
		}
		return {};
	}

	_renderContent() {
		if (this._loading) {
			return this._renderLoadingSpinner();
		}

		if (this._showReviewRetakeOptions) {
			return this._renderReviewRetakeOptions();
		}

		if (this._showMaintenanceMode) {
			return this._renderMaintenanceMode();
		}

		return html`
			<iframe
				allowfullscreen
				mozallowfullscreen
				webkitallowfullscreen
				src=${this._url}
				title=${this.localize('scormPlayer')}
			></iframe>
		`;
	}

	_renderLoadingSpinner() {
		return html`
			<d2l-loading-spinner
				size="120"
			></d2l-loading-spinner>
		`;
	}

	_renderMaintenanceMode() {
		return html`
			<div class="message-container">
				<div class="message-description">${this.localize('performingMaintenance')}</div>
			</div>
		`;
	}

	_renderReviewRetakeOptions() {
		return html`
			<div class="message-container">
				<div class="message-title">${this.localize('reviewRetakeViewTitle')}</div>
				<div class="message-description">${this.localize('reviewRetakeViewDescription')}</div>
				<div class="message-options">
					<d2l-button @click=${this._handleReviewRetakeClick({ isReview: true })}>${this.localize('reviewRetakeButtonReview')}</d2l-button>
					<d2l-button @click=${this._handleReviewRetakeClick({ isReview: false })}>${this.localize('reviewRetakeButtonRetake')}</d2l-button>
				</div>
			</div>
		`;
	}

	async _setup() {
		const { tenantId, contentId, revisionId = 'latest' } = parse(this.d2lrn);
		this._contentId = contentId;
		this._revisionTag = revisionId;

		const { topicId, orgUnitId } = this._parseContextId();

		const httpClient = new ContentServiceBrowserHttpClient({
			serviceUrl: this.contentServiceEndpoint,
			framed: this.framed
		});
		this.client = new ContentServiceApiClient({
			httpClient,
			tenantId,
			contextType: 'sharingOrgUnit',
			contextId: orgUnitId,
		});

		if (this.preview) {
			const result = await this.client.content.getPreviewUrl({id: contentId, revisionTag: revisionId});
			if (result.scormStatus === 'maintenance') {
				this._loading = false;
				this._showMaintenanceMode = true;
				return;
			}

			this._loadScorm(result.previewUrl);
			return;
		}

		if (this.contextType !== 'topic') {
			throw new Error('Invalid inputs');
		}

		this._topicId = createToolItemId({ toolItemType: ToolItemType.Topic, id: topicId });
		this._orgUnitId = orgUnitId;
		this._locale = getDocumentLocaleSettings()._language || getDocumentLocaleSettings()._fallbackLanguage;
		this._launch();
	}

}

customElements.define('d2l-content-scorm-player', ContentScormPlayer);
