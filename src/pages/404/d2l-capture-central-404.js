import { html } from 'lit-element/lit-element.js';
import { PageViewElement } from '../../components/page-view-element.js';

class D2lCaptureCentral404 extends PageViewElement {
	render() {
		return html`
			<p>Page not found</p>
			<a href="" @click=${this.navigateToHome}>Go back to the home page.</a>
		`;
	}

	navigateToHome() {
		this._navigate('/manage');
	}
}

window.customElements.define('d2l-capture-central-404', D2lCaptureCentral404);
