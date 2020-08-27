import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui/core/components/inputs/input-checkbox.js';
import '@brightspace-ui/core/components/inputs/input-date-time-range.js';
import '@brightspace-ui-labs/accordion/accordion-collapse.js';

import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles, labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { inputStyles } from '@brightspace-ui/core/components/inputs/input-styles.js';
import { PageViewElement } from '../../components/page-view-element.js';
import { sharedEditStyles } from '../../components/shared-styles.js';

class D2LCaptureLiveEventsEdit extends DependencyRequester(PageViewElement) {

	static get properties() {
		return {
			_liveEvent: { type: Object }
		};
	}
	static get styles() {
		return [inputStyles, heading2Styles, labelStyles, sharedEditStyles, css`
			.d2l-capture-central-edit-live-events-start-end-times {
				margin-bottom: 25px;
				width: 750px;
			}
		`];
	}

	constructor() {
		super();
		this._liveEvent = {
			title: 'Live Event 1',
			presenter: 'DC',
			description: 'An upcoming live event.'
		};
	}

	render() {
		const { title, presenter, description } = this._liveEvent;
		return html`
			<div class="d2l-capture-central-edit">
				<d2l-breadcrumbs>
					<d2l-breadcrumb @click=${this._goTo('/admin')} href="#" text="${this.localize('captureCentral')}"></d2l-breadcrumb>
					<d2l-breadcrumb @click=${this._goTo('/live-events')} href="#" text="${this.localize('liveEvents')}"></d2l-breadcrumb>
					<d2l-breadcrumb-current-page text="${this.localize('editEvent')}"></d2l-breadcrumb-current-page>
				</d2l-breadcrumbs>
				<div class="d2l-heading-2">${this.localize('editRecordedPresentation')}</div>
				<d2l-input-text
					label="${this.localize('title')}"
					placeholder="${this.localize('title')}"
					value="${title}">
				</d2l-input-text>
				<d2l-input-text
					label="${this.localize('presenter')}"
					placeholder="${this.localize('presenter')}"
					value="${presenter}">
				</d2l-input-text>
				<div class="d2l-capture-central-edit-textarea-container">
					<div class="d2l-label-text">${this.localize('description')}</div>
					<textarea class="d2l-input">${description}</textarea>
				</div>
				<div class="d2l-capture-central-edit-live-events-start-end-times">
					<d2l-input-date-time-range
						label-hidden
						label="${this.localize('startEndDates')}"
					></d2l-input-date-time-range>
				</div>
				<d2l-labs-accordion-collapse flex no-icons>
					<div slot="header">${this.localize('layoutSettings')}</div>
					<d2l-button-icon text="My Button" icon="tier1:file-video"></d2l-button-icon>
					<d2l-button-icon text="My Button" icon="tier1:file-document"></d2l-button-icon>
				</d2l-labs-accordion-collapse>
				<d2l-labs-accordion-collapse flex no-icons>
					<div slot="header">${this.localize('accessControl')}</div>
					<div>Some placeholder text...</div>
				</d2l-labs-accordion-collapse>
				<d2l-labs-accordion-collapse flex no-icons>
					<div slot="header">${this.localize('sharing')}</div>
					<div>Some placeholder text...</div>
				</d2l-labs-accordion-collapse>
				<d2l-labs-accordion-collapse flex no-icons>
					<div slot="header">${this.localize('prepostRollSection')}</div>
					<div>Some placeholder text...</div>
				</d2l-labs-accordion-collapse>
				<d2l-button
					class="d2l-capture-central-edit-save-changes-button"
					primary
				>${this.localize('saveChanges')}
				</d2l-button>
			</div>
		`;
	}
}

window.customElements.define('d2l-capture-central-live-events-edit', D2LCaptureLiveEventsEdit);
