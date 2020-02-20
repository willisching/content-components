import { LitElement, html } from 'lit-element';
import { formatDateTime } from '@brightspace-ui/intl/lib/dateTime.js';
import { formatRelativeDate } from '../util/date-time.js';

class RelativeDate extends LitElement {
	static get properties() {
		return {
			value: { type: String },
			relative: { type: String, attribute: false }
		};
	}

	firstUpdated() {
		super.firstUpdated();
		const date = new Date(Date.parse(this.value));
		this.absolute = formatDateTime(date, { format: 'full' });

		formatRelativeDate(date, {
			onUpdate: text => {
				this.relative = text;
			}
		});
	}

	render() {
		return html`
		<div title="${this.absolute}">
			${this.relative}
		</div>`;
	}
}

window.customElements.define('relative-date', RelativeDate);
