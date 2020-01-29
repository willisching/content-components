import { html } from 'lit-element/lit-element.js';
import { PageViewElement } from './components/page-view-element.js';

class D2lContentStore404 extends PageViewElement {
	render() {
		return html`
			<p>Page not found</p>
			<button @click=${this.navigateToSomeOtherPage}>click this to navigate</button>
		`;
	}

	navigateToSomeOtherPage() {
		this._navigate('some-other-page', {});
	}
}

window.customElements.define('d2l-content-store-404', D2lContentStore404);
