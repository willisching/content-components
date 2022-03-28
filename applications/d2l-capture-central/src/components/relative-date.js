import { css, html, LitElement } from 'lit-element';
import { formatDateTime } from '@brightspace-ui/intl/lib/dateTime.js';
import { formatRelativeDate } from '../util/date-time.js';

class RelativeDate extends LitElement {
	static get properties() {
		return {
			value: { type: String },
			relative: { type: String, attribute: false }
		};
	}

	static get styles() {
		return css`
			.relative-date {
				word-wrap: break-word;
			}
		`;
	}

	firstUpdated() {
		super.firstUpdated();
		this.setupFormatRelativeDate();
	}

	render() {
		return html`
		<div class="relative-date" title="${this.absolute}">
			${this.relative}
		</div>`;
	}

	updated(changedProperties) {
		if (this.value !== changedProperties.value) {
			this.setupFormatRelativeDate();
		}
	}

	setupFormatRelativeDate() {
		if (!this.value) {
			this.stopWatchingRelativeDate();
			return;
		}

		const date = new Date(Date.parse(this.value));
		this.absolute = formatDateTime(date, { format: 'full' });
		this.stopWatchingRelativeDate();

		this.res = formatRelativeDate(date, {
			onUpdate: text => {
				this.relative = text;
			}
		});
	}

	stopWatchingRelativeDate() {
		if (this.res && this.res.stop) {
			this.res.stop();
		}
	}
}

window.customElements.define('relative-date', RelativeDate);
