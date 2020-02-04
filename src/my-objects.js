import { html } from 'lit-element/lit-element.js';
import { PageViewElement } from './components/page-view-element.js';

class MyObjects extends PageViewElement {
	static get properties() {
		return {
			apiClient: { type: Object, attribute: 'api-client' }
		};
	}

	constructor() {
		super();
		this.apiClient = {};
	}

	render() {
		return html`
			<h2>My Objects</h2>
			<p>...</p>
		`;
	}
}

window.customElements.define('my-objects', MyObjects);
