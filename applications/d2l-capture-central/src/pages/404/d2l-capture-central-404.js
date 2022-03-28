import { html } from 'lit-element/lit-element.js';
import { navigationSharedStyle } from '../../style/d2l-navigation-shared-styles.js';
import { PageViewElement } from '../../components/page-view-element.js';

class D2lCaptureCentral404 extends PageViewElement {
	static get styles() {
		return [navigationSharedStyle];
	}

	render() {
		return html`
			<div class="d2l-navigation-gutters">
				<p>${this.localize('pageNotFound')}</p>
				<a href="" @click=${this.navigateToHome}>${this.localize('goBackToHomePage')}</a>
			</div>
		`;
	}

	navigateToHome() {
		this._navigate('/');
	}
}

window.customElements.define('d2l-capture-central-404', D2lCaptureCentral404);
