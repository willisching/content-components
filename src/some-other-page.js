import { html } from 'lit-element/lit-element.js';
import { PageViewElement } from './components/page-view-element.js';

class SomeOtherPage extends PageViewElement {
	render() {
		return html`
			<h2>Hello ${this.prop1}!</h2>
			<div>Localization Example: ${this.localize('myLangTerm')}</div>
			<p>
				hmmmmmm a b c d e f g h
				<br />
				${this.someStringAttribute} <br/>
				${this.someBooleanAttribute}
			</p>
			<button @click=${this.handleClick}>Click this to go to 404</button>
		`;
	}

	handleClick() {
		this._navigate('404', {});
	}
}

window.customElements.define('some-other-page', SomeOtherPage);
