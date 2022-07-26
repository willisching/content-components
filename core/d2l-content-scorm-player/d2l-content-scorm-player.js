import { css, html, LitElement } from 'lit-element/lit-element.js';
import { getDocumentLocaleSettings } from '@brightspace-ui/intl/lib/common.js';
import { ContentServiceApiClient } from '@d2l/content-service-api-client';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { parse } from '../../util/d2lrn.js';
import { createToolItemId, ToolItemType } from '../../util/tool-item-id.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';

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
				min-height: 540px;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.review-retake-container {
				-webkit-box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
				-moz-box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
				box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
				border-radius: 9px;
				border: solid 1px #d3d9e3;
				max-width: 600px;
				padding: 45px;
				font-size: 20px;
			}

			.review-retake-title {
				text-align: left;
				font-weight: bold;
			}

			.review-retake-description {
				text-align: left;
				margin: 33px 0 33px 0;
			}

			.review-retake-options {
				text-align: center;
			}

			.review-retake-container d2l-button {
				margin-right: 24px;
				margin-top: 16px;
			}

			iframe {
				width: 100%;
				height: 580px;
				border: 0;
			}
		`;
	}

	constructor() {
		super();

		this._loading = true;
		this._showReviewRetakeOptions = false;
		this._takeUrl = null;
		this._reviewUrl = null;
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

	_handleRetakeClick() {
		this._showReviewRetakeOptions = false;
		this._loading = false;

		this._loadScorm(this._takeUrl);
	}

	_handleReviewClick() {
		this._showReviewRetakeOptions = false;
		this._loading = false;

		this._loadScorm(this._reviewUrl);
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
		const splitContextId = this.contextId.split(':');
		return {
			topicId: splitContextId[0],
			orgUnitId: splitContextId[1]
		};
	}

	_renderContent() {
		if (this._loading) {
			return this._renderLoadingSpinner();
		}

		if (this._showReviewRetakeOptions) {
			return this._renderReviewRetakeOptions();
		}

		return html`
			<iframe
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

	_renderReviewRetakeOptions() {
		return html`
			<div class="review-retake-container">
				<div class="review-retake-title">${this.localize('reviewRetakeViewTitle')}</div>
				<div class="review-retake-description">${this.localize('reviewRetakeViewDescription')}</div>
				<div class="review-retake-options">
					<d2l-button @click=${this._handleReviewClick}>${this.localize('reviewRetakeButtonReview')}</d2l-button>
					<d2l-button @click=${this._handleRetakeClick}>${this.localize('reviewRetakeButtonRetake')}</d2l-button>
				</div>
			</div>
		`;
	}

	async _setup() {
		const { tenantId, contentId, revisionId = 'latest' } = parse(this.d2lrn);

		const httpClient = new ContentServiceBrowserHttpClient({
			serviceUrl: this.contentServiceEndpoint,
			framed: this.framed
		});
		this.client = new ContentServiceApiClient({
			httpClient,
			tenantId
		});

		if (this.preview) {
			const result = await this.client.content.getPreviewUrl({id: contentId, revisionTag: revisionId});
			this._loadScorm(result.previewUrl);
			return;
		}

		if (this.contextType === 'topic') {
			const locale = getDocumentLocaleSettings()._language || getDocumentLocaleSettings()._fallbackLanguage;
			const { topicId, orgUnitId } = this._parseContextId();
			const result = await this.client.topic.launch({
				id: createToolItemId({ toolItemType: ToolItemType.Topic, id: topicId}),
				locale,
				contentId,
				revisionTag: revisionId,
				orgUnitId
			});
			this._reviewUrl = result.reviewUrl;
			this._takeUrl = result.url;
		} else {
			throw new Error('Invalid inputs');
		}

		if (this._reviewUrl) {
			this._showReviewRetakeOptions = true;
			this._loading = false;
		} else {
			this._loadScorm(this._takeUrl);
		}
	}

}

customElements.define('d2l-content-scorm-player', ContentScormPlayer);
