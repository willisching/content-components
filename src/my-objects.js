import { html } from 'lit-element/lit-element.js';
import { PageViewElement } from './components/page-view-element.js';
import { DependencyRequester } from './mixins/dependency-requester-mixin.js';

class MyObjects extends DependencyRequester(PageViewElement) {
	connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
		this.testFetch();
	}

	async testFetch() {
		const r = await this.apiClient.listContent();
		console.log('response', r);
	}

	render() {
		return html`
			<h2>My Objects</h2>
			${this.apiClient.dump}
		`;
	}
}

window.customElements.define('my-objects', MyObjects);
