import '@brightspace-ui/core/components/button/button-subtle.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui-labs/media-player/media-player.js';
import { css, html, LitElement } from 'lit-element';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { bodyCompactStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { RequesterMixin } from '@brightspace-ui/core/mixins/provider-mixin.js';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { getComposedActiveElement } from '@brightspace-ui/core/helpers/focus.js';
import { InternalLocalizeMixin } from './src/mixins/internal-localize-mixin.js';
import '../../capture/d2l-capture-producer.js';
import '../d2l-content-renderer.js';
import { parse as d2lrnParse } from '../../util/d2lrn.js';

export class Preview extends MobxReactionUpdate(RequesterMixin(InternalLocalizeMixin(LitElement))) {
	static get properties() {
		return {
			_advancedEditingAvailable: { type: Boolean, attribute: false },
			canManage: { type: Boolean, attribute: 'can-manage' },
			canUpload: { type: Boolean, attribute: 'can-upload' },
			resource: { type: String, attribute: true },
			topicId: { type: String, attribute: 'topic-id' }
		};
	}

	static get styles() {
		return [bodyCompactStyles, css`
			#container {
				display: flex;
				flex-direction: column;
				align-items: center;
			}
			#staged-file {
				display: table;
				margin: 0 auto;
			}
			#staged-file > * {
				margin: 3px 50px 3px 50px;
				display: inline-block;
			}
			#change-file-button[hidden],
			#advanced-editing-button[hidden] {
				display: none;
			}
			#content-renderer {
				width: 100%;
			}
		`];
	}

	constructor() {
		super();
		this._advancedEditingAvailable = false;
	}

	render() {
		const showAdvancedEditing = this.canManage && this._advancedEditingAvailable;
		return html`
			<div id="container">
				<d2l-content-renderer
					id="content-renderer"
					content-service-endpoint=${this._getApiEndpoint()}
					d2lrn=${this.resource}
					context-type=${ifDefined(this.topicId ? 'topic' : undefined)}
					context-id=${ifDefined(this.topicId)}
					@cs-content-loaded=${this._onContentLoaded}
					inserting
				></d2l-content-renderer>
				<div id="staged-file">
					<d2l-button-subtle
						id="change-file-button"
						aria-expanded="false"
						aria-haspopup="false"
						aria-label=${this.localize('changeFile')}
						text=${this.localize('changeFile')}
						@click=${this._onChangeFile}
						?hidden="${!this.canUpload}">
					</d2l-button-subtle>
					<d2l-button-subtle
						id="advanced-editing-button"
						aria-expanded="false"
						aria-haspopup="false"
						aria-label=${this.localize('advancedEditing')}
						text=${this.localize('advancedEditing')}
						@click=${this._onAdvancedEditing}
						?hidden="${!showAdvancedEditing}">
					</d2l-button-subtle>
				</div>
			</div>
		`;
	}

	get contentRenderer() {
		return this.renderRoot.querySelector('#content-renderer');
	}

	_getApiEndpoint() {
		const client = this.requestInstance('content-service-client');
		return client.endpoint;
	}

	async _onAdvancedEditing() {
		const parsedD2lrn = d2lrnParse(this.resource);
		const location = `/d2l/le/contentservice/producer/${parsedD2lrn.contentId}/view`;

		const dialogResult = await D2L.LP.Web.UI.Desktop.MasterPages.Dialog.Open(
			getComposedActiveElement(),
			new D2L.LP.Web.Http.UrlLocation(location),
		);

		await new Promise(resolve => {
			dialogResult.AddReleaseListener(() => {
				resolve();
			});
		});

		if (this.topicId) {
			await this.contentRenderer.reloadResources();
		}
	}

	_onChangeFile() {
		this.dispatchEvent(new CustomEvent('cancel', {
			bubbles: true,
			composed: true,
		}));
	}

	_onContentLoaded(event) {
		this._advancedEditingAvailable = event.detail.revision && event.detail.supportsAdvancedEditing;
	}
}

customElements.define('d2l-topic-preview', Preview);
