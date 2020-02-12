import { LitElement, html } from 'lit-element';
import { formatDate, formatDateTime } from '@brightspace-ui/intl/lib/dateTime.js';

class RelativeDate extends LitElement {
	static get properties() {
		return {
			value: { type: String }
		};
	}

	firstUpdated() {
		super.firstUpdated();
		const date = new Date(Date.parse(this.value));
		this.absolute = formatDateTime(date, { format: 'full' });
		this.relative = formatDate(date, { format: 'short' });
		this.requestUpdate();
	}

	render() {
		return html`
		<div title="${this.absolute}">
			${this.relative}
		</div>`;
	}
}

window.customElements.define('relative-date', RelativeDate);
