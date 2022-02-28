import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui-labs/media-player/media-player.js';
import '@brightspace-ui/core/components/alert/alert-toast.js';

import { getDocumentLocaleSettings } from '@brightspace-ui/intl/lib/common.js';
import { css, html } from 'lit-element/lit-element.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { navigationSharedStyle } from '../../style/d2l-navigation-shared-styles.js';
import { PageViewElement } from '../../components/page-view-element';
import { ifDefined } from 'lit-html/directives/if-defined.js';

class D2LCaptureCentralPreview extends DependencyRequester(PageViewElement) {
	static get properties() {
		return {
			id: { type: String, attribute: true },
			loading: {type: Boolean, attribute: false},
		};
	}

	static get styles() {
		return [navigationSharedStyle, css`
			.d2l-capture-central-preview {
				width: 1170px;
				overflow: hidden;
			}

			d2l-loading-spinner {
				display: flex;
				margin: auto;
				margin-top: 200px;
			}

			#status-container {
				aspect-ratio: 16/9;
				background-color: black;
				color: white;
				display: flex;
				flex-direction: column;
				justify-content: center;
 				overflow: hidden;
 				position: relative;
				text-align: center;
 				width: 100%;
			}
		`];
	}

	constructor() {
		super();
		this.loading = true;
		this.revision = null;
		this.languages = null;
		this.captionsUrls = [];
		this.metadata = null;
		this.urls = [];
	}

	async firstUpdated() {
		super.firstUpdated();

		this.loading = true;
		this.apiClient = this.requestDependency('content-service-client');
		this.id = this.rootStore.routingStore.params.id;
		this.revision = await this.apiClient.getLatestRevision(this.id);

		this.urls = await this.apiClient.getSignedUrls({ contentId: this.id, revisionId: this.revision.id });

		const metadata = await this.apiClient.getMetadata({ contentId: this.id, revisionId: this.revision.id });
		this.metadata = metadata ? JSON.stringify(metadata) : undefined;

		await this.loadAllCaptions();

		this.loading = false;
	}

	render() {
		if (this.loading) {
			return html`<d2l-loading-spinner size=150></d2l-loading-spinner>`;
		}

		if (!this.revision.ready) {
			return html`
				<div id="status-container">
					${this.localize('mediaFileIsProcessing')}
				</div>
			`;
		}

		return html`
		<d2l-labs-media-player
			id="d2l-capture-central-mp"
			crossorigin="anonymous"
			media-type="video"
			metadata=${ifDefined(this.metadata ? this.metadata : undefined)}
			style="width:100%"
			>
			${this.urls.map(source => this.renderSources(source))}
			${this.captionsUrls.map(captionSignedUrl => this.renderCaptionsTrack(captionSignedUrl))}
		</d2l-labs-media-player>`;
	}

	updated() {
		this.loadLocale();
	}

	async loadAllCaptions() {
		this.captionsUrls = [];
		if (!this.revision?.captions) {
			return;
		}
		for (const track of this.revision?.captions) {
			await this.loadCaptions(track.locale);
		}
	}

	async loadCaptions(locale) {
		const res = await this.apiClient.getCaptionsUrl({
			contentId: this.id,
			revisionId: this.revision.id,
			locale: locale
		});
		res.locale = locale;
		this.captionsUrls.push(res);
	}

	loadLocale() {
		const defaultLocale = getDocumentLocaleSettings()._language || getDocumentLocaleSettings()._fallbackLanguage;
		if (!defaultLocale) return;
		const mediaPlayer = this.shadowRoot?.querySelector('d2l-labs-media-player');
		if (mediaPlayer) mediaPlayer.locale = defaultLocale.toLowerCase();
	}

	renderCaptionsTrack(captionsUrl) {
		return html`<track src="${captionsUrl.value}" kind="captions" label=${captionsUrl.locale} srclang=${captionsUrl.locale}>`;
	}

	renderSources(source) {
		return html`<source src=${source.value} label=${source.format.toUpperCase()}>`;
	}

}
customElements.define('d2l-capture-central-preview', D2LCaptureCentralPreview);
