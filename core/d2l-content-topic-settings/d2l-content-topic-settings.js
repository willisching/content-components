import { css, html, LitElement } from 'lit-element/lit-element.js';
import {radioStyles} from '@brightspace-ui/core/components/inputs/input-radio-styles.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import '@brightspace-ui/core/components/dropdown/dropdown.js';
import '@brightspace-ui/core/components/dropdown/dropdown-button.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/menu/menu.js';
import '@brightspace-ui/core/components/menu/menu-item.js';
import { parse } from '../../util/d2lrn';

import { ContentServiceApiClient } from 'd2l-content-service-api-client';
import ContentServiceBrowserHttpClient from 'd2l-content-service-browser-http-client';

class ContentTopicSettings extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			d2lrn: { type: String },
			serviceUrl: { type: String },
			context: { type: String },
			contentId: { type: String },
			tenantId: { type: String },
			revisionTag: { type: String },

			_resourceType: { type: String, attribute: false },
			_isLoading: { type: Boolean, attribute: false},

			_displayLatestVersion: { type: Boolean, attribute: false },
			_gradeObjectAssociation: { type: Boolean, attribute: false },
			_selectedGradingIndex: { type: Number, attribute: false },
			_selectedPlayerIndex: { type: Number, attribute: false },
		};
	}

	static get styles() {
		return [radioStyles, css`
		h4.section-heading {
			font-size: 16px;
			margin-bottom: 10px;
			margin-top: 20px;
			-webkit-text-size-adjust: 100%;
		}

		.package-title {
			font-size: 18px;
			margin-top: 0;
			word-wrap: break-word;
			overflow-wrap: break-word;
		}

		h4.section-heading {
			font-size: 16px;
			margin-bottom: 10px;
			margin-top: 15px;
			-webkit-text-size-adjust: 100%;
		}

		.setting-section .setting-option {
			display: flex;
			font-size: 16px;
			margin-bottom: 5px;
		}

		.setting-section .setting-option input[type="radio"] {
			margin-top: 2px;
			height: 23px;
			min-width: 23px;
			margin-right: 15px;
		}

		.select-container {
			display: block;
			width: 60%;
		}

		.select-container select {
			background-color: #ffffff;
			border-color: #6e7477;
			border-width: 1px;
			box-shadow: inset 0 2px 0 0 rgb(181 189 194 / 20%);
			padding: 0.4rem 0.75rem;
			border-radius: 0.3rem;
			border-style: solid;
			box-sizing: border-box;
			display: inline-block;
			height: auto;
			margin: 0;
			vertical-align: middle;
			width: 100%;
			transition: background-color 0.5s ease, border-color 0.001s ease;
			color: #202122;
			font-family: inherit;
			font-size: 0.8rem;
			font-weight: 400;
			letter-spacing: 0.02rem;
			line-height: 1.2rem;
		}

		.settings-container {
			margin-bottom: 20px;
		}
		`];
	}

	static coursePlayers = [
		'NewWindowPlayer',
		'EmbeddedPlayer'
	];

	static gradingCalculationMethods = [
		'Highest',
		'Lowest',
		'Average',
		'Last',
		'First',
	];

	constructor() {
		super();

		this.d2lrn = '';
		this.serviceUrl = '';
		this.contentId = '';
		this.tenantId = '';
		this.revisionTag = 'latest';
		this._resourceType = null;

		this._isLoading = true;

		this._displayLatestVersion = true;
		this._gradeObjectAssociation = true;
		this._selectedGradingIndex = 0;
		this._selectedPlayerIndex = 0;
	}

	async connectedCallback() {
		super.connectedCallback();

		if (this.d2lrn !== '') {
			const parsedD2lrn = parse(this.d2lrn);
			this.tenantId = parsedD2lrn.tenantId;
			this.contentId = parsedD2lrn.contentId;
		}

		const httpClient = new ContentServiceBrowserHttpClient({serviceUrl: this.serviceUrl});
		this.client = new ContentServiceApiClient({ tenantId: this.tenantId, httpClient });

		const content = await this.client.content.getItem({id: this.contentId});
		this.content = content;

		let revision;
		if (this.revisionTag === 'latest') {
			revision = content.revisions[content.revisions.length - 1];
		} else {
			revision = content.revisions.find(rev => rev.id === this.revisionTag);
		}

		this._resourceType = revision.type.toLowerCase();
		this._title = content.title;
		this._isLoading = false;
	}

	render() {
		if (this._isLoading) return '';
		return html`
			<div class="settings-container">
				<h3 class="package-title">
					${this._title}
				</h3>
				${ this._resourceType && this._resourceType === 'scorm'
		? html`
					<div class="setting-section">
						<h4 class="section-heading">
						${this.localize('askIfCreateGradeItem')}
						</h4>
						<div class="setting-option">
							<input
								id="create-grade-item-yes"
								class="d2l-input-radio"
								name="grade-item"
								type="radio"
								?checked="${this._gradeObjectAssociation}"
								@change=${this._handleGradeObjectAssociation(true)}
							/>
							<label for="create-grade-item-yes">
								<div class="label-body">${this.localize('yes')}</div>
							</label>
						</div>
						<div class="setting-option">
							<input
								id="create-grade-item-no"
								class="d2l-input-radio"
								name="grade-item"
								type="radio"
								?checked="${!this._gradeObjectAssociation}"
								@change=${this._handleGradeObjectAssociation(false)}
							/>
							<label for="create-grade-item-no">
								<div class="label-body">${this.localize('no')}</div>
							</label>
						</div>
					</div>
					${this._gradeObjectAssociation ? html`
						<div class="setting-section">
							<h4 class="section-heading">
								${this.localize('gradeCalculationMethodTitle')}
							</h4>
							<d2l-dropdown-button
								text=${this.localize(ContentTopicSettings.gradingCalculationMethods[this._selectedGradingIndex].toLowerCase())}
							>
								<d2l-dropdown-menu
									@d2l-menu-item-select="${this._handleSelectedGrading}"
								>
									<d2l-menu label="revisions">
										${this.renderGradingMethodItems()}
									</d2l-menu>
								</d2l-dropdown-menu>
							</d2l-dropdown-button>
						</div>` : html`
						<div className="setting-section warning-message">
							<h5>${this.localize('noGradeItemCreationNote')}</h5>
						</div>
						`
}` : ''
}
				<div class="setting-section">
					<h4 class="section-heading">
						${this.localize('versionControlTitle')}
					</h4>
					<div class="setting-option">
						<input
							id="latest-version"
							class="d2l-input-radio"
							name="version"
							type="radio"
							?checked=${this._displayLatestVersion}
							@change=${this._handleVersionControlChange(true)}
						/>
						<label for="latest-version">
							<div class="label-body">${this.localize('displayLatestVersion')}</div>
						</label>
					</div>
					<div class="setting-option">
						<input
							id="this-version"
							class="d2l-input-radio"
							name="version"
							type="radio"
							?checked=${!this._displayLatestVersion}
							@change=${this._handleVersionControlChange(false)}
						/>
						<label for="this-version">
							<div class="label-body">${this.localize('displayThisVersion')}</div>
						</label>
					</div>
				</div>
				${ this._resourceType && this._resourceType === 'scorm' ? html`
					<div class="setting-section">
						<h4 class="section-heading">
							${this.localize('coursePlayer')}
						</h4>
						<div class="select-container">
							<select
								id="player-options"
								aria-label=${this.localize('playerOptions')}
								value=${this._selectedPlayerIndex}
								@change=${this._handleSelectedPlayerChange}
							>
								<option value="0">${this.localize('openPlayerInNewWindow')}</option>
								<option value="1">${this.localize('useEmbeddedPlayer')}</option>
							</select>
						</div>
					</div>` : ''
}
			</div>
		`;
	}

	getSettings() {
		const settings = {
			contentId: this.content.id,
			revisionTag: this._displayLatestVersion ? 'latest' : this.revisionTag,
			resourceType: this._resourceType,
			openInNewWindow: ContentTopicSettings.coursePlayers[this._selectedPlayerIndex] === 'NewWindowPlayer',
			title: this.content.title,
			gradeCalculationMethod: ContentTopicSettings.gradingCalculationMethods[this._selectedGradingIndex],
			gradeObjectAssociation: this._gradeObjectAssociation
		};
		return settings;
	}

	renderGradingMethodItems() {
		return ContentTopicSettings.gradingCalculationMethods.map((item, index) => {
			return html`<d2l-menu-item grading-index="${index}" text="${this.localize(item.toLowerCase())}"></d2l-menu-item>`;
		});
	}

	_handleGradeObjectAssociation(val) {
		return () => this._gradeObjectAssociation = val;
	}

	_handleSelectedGrading(e) {
		this._selectedGradingIndex = Number.parseInt(e.target.getAttribute('grading-index'));
	}

	_handleSelectedPlayerChange(e) {
		this._selectedPlayerIndex = Number.parseInt(e.target.value);
	}

	_handleVersionControlChange(val) {
		return () => this._displayLatestVersion = val;
	}
}

customElements.define('d2l-content-topic-settings', ContentTopicSettings);
