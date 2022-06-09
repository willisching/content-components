import { css, html, LitElement } from 'lit-element/lit-element.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui/core/components/dropdown/dropdown.js';
import '@brightspace-ui/core/components/dropdown/dropdown-button.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/menu/menu.js';
import '@brightspace-ui/core/components/menu/menu-item.js';
import {radioStyles} from '@brightspace-ui/core/components/inputs/input-radio-styles.js';
import '@brightspace-ui/core/components/button/button.js';
import { InternalLocalizeMixin } from './src/mixins/internal-localize-mixin.js';
import { parse } from '../../util/d2lrn.js';
import { ContentServiceApiClient } from 'd2l-content-service-api-client';
import ContentServiceBrowserHttpClient from 'd2l-content-service-browser-http-client';
import { buildOrgUnitShareLocationStr } from '../../util/sharing.js';

const RecommendedPlayerOptions = Object.freeze({
	embedPlayer: 1,
	newWindow: 2,
});
class ContentProperties extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			d2lrn: { type: String },
			serviceUrl: { type: String },
			canShareTo: { type: Array },
			canSelectShareLocation: { type: Boolean },
			embedFeatureEnabled: { type: Boolean },
			contentId: { type: String },
			tenantId: { type: String },
			revisionTag: { type: String },

			_isLoading: { type: Boolean, attribute: false },
			_resourceType: { type: String, attribute: false },
			_saveButtonDisabled: { type: Boolean, attribute: false },
			_selectedSharingIndex: { type: Number, attribute: false }
		};
	}

	static get styles() {
		return [radioStyles, css`
		.label-body {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			line-height: 1.5rem;
			pointer-events: none;
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

		.label-description {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			pointer-events: none;
			color: #6E7477;
			font-size: 14px;
			line-height: 1rem;
		}

		.input-container #add-sharing {
			margin-right: 15px;
		}

		h4.section-heading {
			font-size: 16px;
			margin-bottom: 10px;
			margin-top: 20px;
			-webkit-text-size-adjust: 100%;
		}

		.section-description {
			margin-top: 0;
			margin-bottom: 6px;
			font-size: 14px;
			color: #6E7477;
			line-height: 1rem;
		}

		.setting-section.navigation .section-heading {
			margin-bottom: 0;
		}

		.package-section .package-name {
			margin-bottom: 10px;
			margin-top: 0;
			font-size: 16px;
		}

		.package-section .package-description {
			margin-bottom: 10px;
			margin-top: 10px;
			font-size: 16px;
		}
		`];
	}

	constructor() {
		super();

		this.contentId = '';
		this.tenantId = '';
		this._resourceType = '';
		this.revisionTag = 'latest';

		this._title = null;
		this._description = null;
		this._shared = null;
		this._playerShowNavBar = null;
		this._reviewRetake = null;
		this._recommendedPlayer = null;

		this._isLoading = true;
		this._selectedSharingIndex = 0;
		this._saveButtonDisabled = false;
	}

	async connectedCallback() {
		super.connectedCallback();
		await this._initProperties();
		this._isLoading = false;
	}

	render() {
		return html`
			<div class="settings-container">
				<h3 class="heading-org-level">${this.localize('editCoursePackageProperties')}</h3>
				<div class="package-section">
					<h4 class="package-name">${this.localize('packageName')}</h4>
					<d2l-input-text
						id="package-name"
						class="form-control"
						type="text"
						placeholder=${this.localize('packageName')}
						maxlength="100"
						label=${this.localize('packageName')}
						label-hidden
						@input=${this._handleTitleChange}
						value=${this._title}
					></d2l-input-text>
					<h4 class="package-description">${this.localize('description')}</h4>
					<d2l-input-text
						id="package-description"
						class="form-control"
						type="text"
						placeholder=${this.localize('description')}
						maxlength="100"
						label=${this.localize('description')}
						label-hidden
						@input=${this._handleDescriptionChange}
						value=${this._description}
					></d2l-input-text>
				</div>
				<div class="setting-section share">
					<h4 class="section-heading">${this.localize('askIfShare')}</h4>
					<div class="setting-option">
						<input
							id="add-sharing"
							class="d2l-input-radio"
							name="sharing"
							type="radio"
							@change="${this._setShared(true)}"
							?checked="${this._shared !== null && this._shared}"
						/>
						${this._renderShareLabel()}
						${this.canSelectShareLocation
		? this._renderSharingDropdown()
		: html``}
				</div>
					<div class="setting-option">
						<input
							id="remove-sharing"
							class="d2l-input-radio"
							name="sharing"
							type="radio"
							@change="${this._setShared(false)}"
							?checked="${this._shared !== null && !this._shared}"
						/>
						<label for="remove-sharing" class="label-body">${this.localize('noKeepToMyself')}</label>
					</div>
				</div>
				${!this._resourceType || this._resourceType === 'audio' || this._resourceType === 'video' ?
		'' : html`
				<div class="setting-section navigation">
					<h4 class="section-heading">${this.localize('coursePlayer')}</h4>
					<div class="section-description">${this.localize('coursePlayerDescription')}</div>
					<div class="setting-option">
						<input
							id="use-embedded-player"
							class="d2l-input-radio"
							name="use-embedded-player"
							type="radio"
							@change="${this._setUseEmbedPlayer(RecommendedPlayerOptions.embedPlayer)}"
							?checked="${this._recommendedPlayer === RecommendedPlayerOptions.embedPlayer}"
						/>
						<label for="use-embedded-player">
							<div class="label-body">${this.localize('useEmbeddedPlayer')}</div>
							<div class="label-description">${this.localize('useEmbeddedPlayerDescription')}</div>
						</label>
					</div>
					<div class="setting-option">
						<input
							id="open-new-window"
							class="d2l-input-radio"
							name="use-embedded-player"
							type="radio"
							@change="${this._setUseEmbedPlayer(RecommendedPlayerOptions.newWindow)}"
							?checked="${this._recommendedPlayer === RecommendedPlayerOptions.newWindow}"
						/>
						<label for="open-new-window">
							<div class="label-body">${this.localize('openPlayerInNewWindow')}</div>
							<div class="label-description">${this.localize('openPlayerInNewWindowDescription')}</div>
						</label>
					</div>
				</div>
				${this.embedFeatureEnabled ? html`
				<div class="setting-section navigation">
					<h4 class="section-heading">${this.localize('navigation')}</h4>
					<div class="section-description">${this.localize('navigationDescription')}</div>
					<div class="setting-option">
						<input
							id="remove-navigation"
							class="d2l-input-radio"
							name="navigation"
							type="radio"
							@change="${this._setShowNavBar(false)}"
							?checked="${this._playerShowNavBar !== null && !this._playerShowNavBar}"
						/>
						<label for="remove-navigation">
							<div class="label-body">${this.localize('playerHideNavBar')}</div>
							<div class="label-description">${this.localize('playerHideNavBarDescription')}</div>
						</label>
					</div>
					<div class="setting-option">
						<input
							id="add-navigation"
							class="d2l-input-radio"
							name="navigation"
							type="radio"
							@change="${this._setShowNavBar(true)}"
							?checked="${this._playerShowNavBar !== null && this._playerShowNavBar}"
						/>
						<label for="add-navigation">
							<div class="label-body">${this.localize('playerShowNavBar')}</div>
							<div class="label-description">${this.localize('playerShowNavBarDescription')}</div>
						</label>
					</div>
				</div>
				` : html``}
				<div class="setting-section navigation">
					<h4 class="section-heading">${this.localize('reviewRetake')}</h4>
					<div class="section-description">${this.localize('reviewRetakeDescription')}</div>
					<div class="setting-option">
						<input
							id="add-review-retake"
							class="d2l-input-radio"
							name="add-review-retake"
							type="radio"
							@change="${this._setReviewRetake(true)}"
							?checked="${this._reviewRetake !== null && this._reviewRetake}"
						/>
						<label for="add-review-retake">
							<div class="label-body">${this.localize('addReviewRetake')}</div>
							<div class="label-description">${this.localize('addReviewRetakeDescription')}</div>
						</label>
					</div>
					<div class="setting-option">
						<input
							id="do-not-add-review-retake"
							class="d2l-input-radio"
							name="add-review-retake"
							type="radio"
							@change="${this._setReviewRetake(false)}"
							?checked="${this._reviewRetake !== null && !this._reviewRetake}"
						/>
						<label for="do-not-add-review-retake">
							<div class="label-body">${this.localize('doNotAddReviewRetake')}</div>
							<div class="label-description">${this.localize('doNotAddReviewRetakeDescription')}</div>
						</label>
					</div>
				</div>
				`}
			</div>
		`;
	}

	renderSharingItems() {
		return this.canShareTo.map((item, index) => {
			const label = item.name;
			return html`<d2l-menu-item sharing-index="${index}" text="${label}"></d2l-menu-item>`;
		});
	}

	async save() {
		const updateLastRevision = (updates) => {
			const updatedLastRevision = Object.assign(
				this.content.revisions.pop(),
				updates);

			return { ...this.content,
				revisions: [
					...this.content.revisions,
					updatedLastRevision,
				]};
		};

		const options = {};
		if (this._playerShowNavBar !== null) {
			options.playerShowNavBar = this._playerShowNavBar;
		}

		if (this._recommendedPlayer !== null) {
			options.recommendedPlayer = this._recommendedPlayer;
		}

		if (this._reviewRetake !== null) {
			options.reviewRetake = this._reviewRetake;
		}

		let sharedWith = this.content.sharedWith;

		if (this._shared !== null) {
			if (this._shared && this.canSelectShareLocation) {
				sharedWith = sharedWith.filter((location) =>
					location !== buildOrgUnitShareLocationStr(String(this.canShareTo[this._selectedSharingIndex].id)));

				sharedWith.push(buildOrgUnitShareLocationStr(String(this.canShareTo[this._selectedSharingIndex].id)));
			} else if (this._shared && !this.canSelectShareLocation) {
				sharedWith = this.canShareTo.map(location => buildOrgUnitShareLocationStr(String(location.id)));
			} else {
				sharedWith = [];
			}
		}

		const updatedContent = Object.assign(updateLastRevision({
			options,
		}), {
			title: this._title,
			description: this._description || null,
			sharedWith
		});

		const item = {
			content: updatedContent,
		};

		await this.client.content.updateItem(item);
	}

	get _contentId() {
		return parse(this.d2lrn).contentId;
	}

	_handleDescriptionChange(e) {
		this._description = e.target.value;
	}

	_handleSelectedSharing(e) {
		this._selectedSharingIndex = Number.parseInt(e.target.getAttribute('sharing-index'));
	}

	_handleTitleChange(e) {
		this._title = e.target.value;
	}

	async _initProperties() {
		if (this.d2lrn !== '') {
			const parsedD2lrn = parse(this.d2lrn);
			this.tenantId = parsedD2lrn.tenantId;
			this.contentId = parsedD2lrn.contentId;
		}
		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.serviceUrl });
		this.client = new ContentServiceApiClient({ httpClient, tenantId: this.tenantId });
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
		this._description = content.description;

		if (this.content.sharedWith === undefined || this.content.sharedWith.length === 0) {
			this._shared = false;
		} else {
			this._shared = true;
			this._selectedSharingIndex = this.canShareTo.findIndex((canShareLocation) =>
				this.content.sharedWith.includes(buildOrgUnitShareLocationStr(String(canShareLocation.id))));
			if (this._selectedSharingIndex === -1) {
				this._selectedSharingIndex = 0;
			}
		}

		this._playerShowNavBar = revision.options ? revision.options.playerShowNavBar : null;
		this._reviewRetake = revision.options
			? revision.options.reviewRetake !== false
			: true;
		this._recommendedPlayer = (revision.options && revision.options.recommendedPlayer)
			|| RecommendedPlayerOptions.embedPlayer;
	}

	_renderShareLabel() {
		if (!this.canSelectShareLocation) {
			return html`<label for="add-sharing" class="label-body">${this.localize('yesShareFileWithAll')}</label>`;
		} else if (this.canShareTo.length === 1) {
			return html`<label for="add-sharing" class="label-body">${this.localize('yesShareFileWithX', { name: this.canShareTo[0].name })}</label>`;
		}
		return html`<label for="add-sharing" class="label-body">${this.localize('yesShareFileWith')}</label>`;
	}

	_renderSharingDropdown() {
		return this.canShareTo.length > 1 ? html`
		<d2l-dropdown-button
			text="${this.canShareTo[this._selectedSharingIndex].name}"
		>
			<d2l-dropdown-menu
				@d2l-menu-item-select="${this._handleSelectedSharing}"
			>
				<d2l-menu label="revisions">
					${this.renderSharingItems()}
				</d2l-menu>
			</d2l-dropdown-menu>
		</d2l-dropdown-button>
		` : html``;
	}

	_setReviewRetake(reviewRetake) {
		return () => this._reviewRetake = reviewRetake;
	}

	_setShared(isShared) {
		return () => this._shared = isShared;
	}

	_setShowNavBar(showNavBar) {
		return () => this._playerShowNavBar = showNavBar;
	}

	_setUseEmbedPlayer(useEmbedPlayer) {
		return () => this._recommendedPlayer = useEmbedPlayer;
	}

	get _tenantId() {
		return parse(this.d2lrn).tenantId;
	}

}

customElements.define('d2l-content-properties', ContentProperties);
