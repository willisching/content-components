import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui-labs/video-producer/src/video-producer.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';

import { css, html } from 'lit-element/lit-element.js';
import { autorun } from 'mobx';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { PageViewElement } from '../../components/page-view-element';

class D2LCaptureCentralProducer extends DependencyRequester(PageViewElement) {
	static get properties() {
		return {
			_content: { type: String, attribute: false },
			_defaultLanguage: { type: String, attribute: false },
			_loading: { type: Boolean, attribute: false },
			_sourceUrl: { type: String, attribute: false },
		};
	}

	static get styles() {
		return css`
			d2l-loading-spinner {
				display: flex;
				margin: auto;
				margin-top: 200px;
			}
			d2l-breadcrumbs {
				margin: 25px 0;
			}
		`;
	}

	constructor() {
		super();
		this.apiClient = this.requestDependency('content-service-client');
		this.userBrightspaceClient = this.requestDependency('user-brightspace-client');
	}

	async connectedCallback() {
		super.connectedCallback();
		autorun(async() => {
			if (this.rootStore.routingStore.page === 'producer'
				&& this.rootStore.routingStore.params.id
			) {
				this._loading = true;
				this._content = await this.apiClient.getContent(this.rootStore.routingStore.params.id);
				this._sourceUrl = (await this.apiClient.getSignedUrl(this.rootStore.routingStore.params.id)).value;
				this._loading = false;
				this._setupLanguages();
			}
		});
	}

	get producer() {
		return this.shadowRoot.querySelector('d2l-labs-video-producer');
	}

	async _setupLanguages() {
		this.requestUpdate();
		const { Items } = await this.userBrightspaceClient.getLocales();
		const languages = Items.map(({ LocaleName, CultureCode, IsDefault }) => {
			const code = CultureCode.toLowerCase();
			return { name: LocaleName, code, isDefault: IsDefault  };
		});
		this.producer.setLanguages(languages);
	}

	async _getMetadata() {
		const metadata = await this.apiClient.getMetadata({
			contentId: this._content.id,
			revisionId: 'latest',
			draft: true
		});

		this.producer.setMetadata(metadata);
	}

	async _publishMetadata(e) {
		this.producer.setState({ state: 'publishing', inProgress: true });

		await this.apiClient.updateMetadata({
			contentId: this._content.id,
			metadata: e.detail,
			revisionId: 'latest',
		});
		// eslint-disable-next-line no-unused-vars
		const { id, ...revision } = this._content.revisions[this._content.revisions.length - 1];
		let newRevision;
		try {
			newRevision = await this.apiClient.createRevision({
				contentId: this._content.id,
				body: {
					title: this._content.name,
					extension: revision.extension,
					sourceFormat: 'hd',
					formats: ['ld'],
				},
				sourceRevisionId: id
			});
			await this.apiClient.processRevision({
				contentId: this._content.id,
				revisionId: newRevision.id,
				body: { sourceRevisionId: id }
			});
		} catch (error) {
			if (newRevision) {
				await this.apiClient.deleteRevision({
					contentId: this._content.id, revisionId: newRevision.id
				});
			}
			this.producer.setState({ state: 'publishing', inProgress: false, error: true });
			return;
		}

		this.producer.setState({ state: 'publishing', inProgress: false });
	}

	async _saveDraftMetadata(e) {
		this.producer.setState({ state: 'saving', inProgress: true });
		try {
			await this.apiClient.updateMetadata({
				contentId: this._content.id,
				draft: true,
				metadata: e.detail,
				revisionId: 'latest',
			});
		} catch (error) {
			this.producer.setState({ state: 'saving', inProgress: false, error: true });
			return;
		}
		this.producer.setState({ state: 'saving', inProgress: false });
	}

	_renderBreadcrumbs() {
		const { params, previousSubView } = this.rootStore.routingStore;
		const previousLocation = previousSubView ? `/presentations/edit/${params.id}` : '/presentations';
		const previousLocationLangterm = previousSubView ? 'editPresentation' : 'presentations';

		return html`
			<d2l-breadcrumbs>
				<d2l-breadcrumb
					@click=${this._goTo('/admin')}
					href=""
					text="${this.localize('captureCentral')}"
				></d2l-breadcrumb>
				<d2l-breadcrumb
					@click=${this._goTo(previousLocation)}
					href=""
					text="${this.localize(previousLocationLangterm)}"
				></d2l-breadcrumb>
				<d2l-breadcrumb-current-page
					text="${this._content.title}"
				></d2l-breadcrumb-current-page>
			</d2l-breadcrumbs>
		`;
	}

	render() {
		if (this._loading) {
			return html`<d2l-loading-spinner size=150></d2l-loading-spinner>`;
		}

		return html`
			${this._renderBreadcrumbs()}
			<d2l-labs-video-producer
				@get-metadata=${this._getMetadata}
				@publish-metadata=${this._publishMetadata}
				@save-metadata=${this._saveDraftMetadata}
				src="${this._sourceUrl}"
			></d2l-labs-video-producer>
		`;
	}

}
customElements.define('d2l-capture-central-producer', D2LCaptureCentralProducer);
