import { LitElement, css, html } from 'lit-element';
import { formatDate } from '@brightspace-ui/intl/lib/dateTime.js';

class RelativeDate extends LitElement {
	static get properties() {
		return {
			value: { type: String },
			formatted: { type: String, attribute: false }
		};
	}

	static get styles() {
		return [css`
		`];
	}

	firstUpdated() {
		super.firstUpdated();
		const date = new Date(Date.parse(this.value));
		this.formatted = formatDate(date, { format: 'short' });
	}

	render() {
		return html`<div>${this.formatted}</div>`;
	}
}

window.customElements.define('relative-date', RelativeDate);
