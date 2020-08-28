import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui/core/components/inputs/input-checkbox.js';
import '@brightspace-ui-labs/accordion/accordion-collapse.js';

import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles, labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { inputStyles } from '@brightspace-ui/core/components/inputs/input-styles.js';
import { PageViewElement } from '../../components/page-view-element.js';
import { sharedEditStyles } from '../../components/shared-styles.js';

class D2LCapturePresentationsEdit extends DependencyRequester(PageViewElement) {

	static get properties() {
		return {
			_presentation: { type: Object }
		};
	}
	static get styles() {
		return [inputStyles, heading2Styles, labelStyles, sharedEditStyles, css`
			.d2l-capture-central-edit-presentation-options d2l-icon {
				color: var(--d2l-color-celestine);
				margin-bottom: 5px;
				margin-right: 5px;
			}
		`];
	}

	constructor() {
		super();
		this._presentation = {
			title: 'Recording 1',
			presenter: 'DC',
			description: 'An amazing recorded video.'
		};
	}

	render() {
		const { title, presenter, description } = this._presentation;
		return html`
			<div class="d2l-capture-central-edit-container">
				<d2l-breadcrumbs>
					<d2l-breadcrumb @click=${this._goTo('/admin')} href="#" text="${this.localize('captureCentral')}"></d2l-breadcrumb>
					<d2l-breadcrumb @click=${this._goTo('/presentations')} href="#" text="${this.localize('presentations')}"></d2l-breadcrumb>
					<d2l-breadcrumb-current-page text="${this.localize('editPresentation')}"></d2l-breadcrumb-current-page>
				</d2l-breadcrumbs>
				<div class="d2l-heading-2">${this.localize('editRecordedPresentation')}</div>
				<div class="d2l-capture-central-edit-presentation-options">
					<d2l-link><d2l-icon icon="tier1:file-video"></d2l-icon>${this.localize('editInPostProductionTool')}</d2l-link>
					<d2l-link><d2l-icon icon="tier1:play"></d2l-icon>${this.localize('watchPresentation')}</d2l-link>
				</div>
				<d2l-input-text
					label="${this.localize('title')}"
					placeholder="${this.localize('title')}"
					value="${title}"
				></d2l-input-text>
				<d2l-input-text
					label="${this.localize('presenter')}"
					placeholder="${this.localize('presenter')}"
					value="${presenter}"
				></d2l-input-text>
				<div class="d2l-capture-central-edit-textarea-container">
					<div class="d2l-label-text">${this.localize('description')}</div>
					<textarea class="d2l-input">${description}</textarea>
				</div>
				<d2l-labs-accordion-collapse flex no-icons>
					<div slot="header">${this.localize('accessControl')}</div>
					<div>${this.localize('basicAccess')}</div>
					<d2l-input-checkbox>${this.localize('passwordRequired')}</d2l-input-checkbox>
					<div>${this.localize('permissions')}</div>
					<d2l-input-text
						label="${this.localize('searchUserGroupOrRole')}"
						placeholder="Replace with an autocomplete"
					></d2l-input-text>
				</d2l-labs-accordion-collapse>
				<d2l-labs-accordion-collapse flex no-icons>
					<div slot="header">${this.localize('transcodingStatus')}</div>
					<div>Placeholder text...</div>
				</d2l-labs-accordion-collapse>
				<d2l-labs-accordion-collapse flex no-icons>
					<div slot="header">${this.localize('sharing')}</div>
					<div>Placeholder text...</div>
				</d2l-labs-accordion-collapse>
				<d2l-labs-accordion-collapse flex no-icons>
					<div slot="header">${this.localize('prepostRollSection')}</div>
					<div>Placeholder text...</div>
				</d2l-labs-accordion-collapse>
				<d2l-labs-accordion-collapse flex no-icons>
					<div slot="header">${this.localize('thumbnailImage')}</div>
					<div>Placeholder text...</div>
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

window.customElements.define('d2l-capture-central-presentations-edit', D2LCapturePresentationsEdit);
