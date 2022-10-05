import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui-labs/media-player/media-player.js';
import '@brightspace-ui/core/components/alert/alert-toast.js';
import { css, html } from 'lit-element/lit-element.js';
import { styleMap } from 'lit-html/directives/style-map.js';

import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { navigationSharedStyle } from '../../style/d2l-navigation-shared-styles.js';
import ContentType from '../../../../../util/content-type.js';
import { PageViewElement } from '../../components/page-view-element';
import '../../../../../core/d2l-content-renderer.js';

class D2LContentLibraryPreview extends DependencyRequester(PageViewElement) {
	static get properties() {
		return {
			contentId: { type: String, attribute: true },
			contentType: { type: String, attribute: true },
			loading: {type: Boolean, attribute: false},
		};
	}

	static get styles() {
		return [navigationSharedStyle, css`
			d2l-loading-spinner {
				display: flex;
				margin-top: 20%;
			}
		`];
	}

	constructor() {
		super();
		this.loading = true;
	}

	async firstUpdated() {
		super.firstUpdated();

		this.loading = true;

		if (!this.contentId) {
			console.warn('Missing contentId', this);
			return;
		}

		this.contentServiceEndpoint = this.requestDependency('content-service-endpoint');
		this.tenantId = this.requestDependency('tenant-id');

		this.loading = false;
	}

	render() {
		if (this.loading) {
			return html`<d2l-loading-spinner size=150></d2l-loading-spinner>`;
		}

		// d2l-content-renderer uses display inline-block, which defines it dimensions as being
		// dependent on the dimensions of its child. In this case, the child is the Media Player.
		let contentRendererStyleMap;
		if (this.contentType === ContentType.AUDIO) {
			// For Audio items, the Media Player doesn't set an intrinsic width (since there is no
			// video to take the dimensions from). Because of that, d2l-content-renderer must set
			// a concrete width or else it and the Media Player will be rendered with 0 width.
			contentRendererStyleMap = { width: '100%' };
		} else {
			// For Video items, the Media Player calculates width and height in such a way as to
			// maintain the video's aspect ratio.
			//
			// To prevent a horizontal scrollbar from appearing, it should not exceed the dialog width.
			//
			// At the same time, we can't force the width to always be 100%, or else the height of the
			// video could become taller than the dialog (e.g. for vertical videos) and cause a
			// vertical scrollbar to appear. We need to allow it to be smaller than 100% depending
			// on the aspect ratio.
			//
			// max-width allows us to satisfy both of these conditions.
			contentRendererStyleMap = { 'max-width': '100%' };
			// Workaround for Safari iOS. It seems that a minimum width is needed
			// in order for the Media Player to calculate its dimensions.
			// Without this, the Media Player does not appear.
			if (this._is_iOS()) {
				contentRendererStyleMap['min-width'] = '90%';
			}
		}

		return html`
		<d2l-content-renderer
			content-service-endpoint=${this.contentServiceEndpoint}
			tenant-id=${this.tenantId}
			content-id=${this.contentId}
			style="${styleMap(contentRendererStyleMap)}"
		></d2l-content-renderer>`;
	}

	_is_iOS() {
		return /iPad|iPhone|iPod/.test(navigator.platform);
	}
}
customElements.define('d2l-content-library-preview', D2LContentLibraryPreview);
