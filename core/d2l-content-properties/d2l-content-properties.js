import { css, html, LitElement } from 'lit-element/lit-element.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui/core/components/dropdown/dropdown.js';
import '@brightspace-ui/core/components/dropdown/dropdown-button.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/menu/menu.js';
import '@brightspace-ui/core/components/menu/menu-item.js';
import { radioStyles } from '@brightspace-ui/core/components/inputs/input-radio-styles.js';
import { SkeletonMixin } from '@brightspace-ui/core/components/skeleton/skeleton-mixin.js';
import '@brightspace-ui/core/components/button/button.js';
import { ContentServiceApiClient } from '@d2l/content-service-api-client';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { parse } from '../../util/d2lrn.js';
import { buildOrgUnitShareLocationStr } from '../../util/sharing.js';
import PlayerOption from '../../util/player-option.js';
import ContentType from '../../util/content-type.js';

class ContentProperties extends SkeletonMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			d2lrn: { type: String },
			serviceUrl: { type: String },
			canShareTo: { type: Array },
			canSelectShareLocation: { type: Boolean },
			contentId: { type: String },
			tenantId: { type: String },
			revisionTag: { type: String },
			totalFiles: { type: Number },
			progress: { type: Number },

			_resourceType: { type: String, attribute: false },
			_saveButtonDisabled: { type: Boolean, attribute: false },
			_selectedSharingIndex: { type: Number, attribute: false },
		};
	}

	static get styles() {
		return [super.styles, radioStyles, css`
		.label-body {
			display: inline-block;
			flex-wrap: wrap;
			align-items: center;
			line-height: 1.5rem;
			pointer-events: none;
			height: 30px;
		}

		.setting-section .setting-option {
			display: flex;
			font-size: 16px;
			margin-bottom: 5px;
		}

		.radio-container {
			width: 26px;
			height: 26px;
			margin-top: 3px;
			margin-right: 10px;
		}

		.radio-container input[type="radio"] {
			margin-top: -6px;
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

		.sharing-dropdown-container {
			margin-left: 10px;
			margin-top: -4px;
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

		.settings-container {
			margin-bottom: 20px;
		}
		`];
	}

	constructor() {
		super();

		this.revisionTag = 'latest';

		this._title = null;
		this._description = null;
		this._shared = null;
		this._playerShowNavBar = null;
		this._reviewRetake = null;
		this._recommendedPlayer = null;
		this._selectedSharingIndex = 0;
		this._saveButtonDisabled = false;
		this.skeleton = true;
	}

	async connectedCallback() {
		super.connectedCallback();
		await this._initProperties();
		this.skeleton = false;
	}

	render() {
		return html`
			<div class="settings-container d2l-skeletize-container">
				<h3 class="heading-org-level d2l-skeletize d2l-skeletize-55">${this.totalFiles > 1 ? this.localize('editCoursePackagePropertiesBulk', { 0: this.progress, 1: this.totalFiles }) : this.localize('editCoursePackageProperties')}</h3>
				<div class="package-section">
					<h4 class="package-name d2l-skeletize d2l-skeletize-15">${this.localize('packageName')}</h4>
					<d2l-input-text
						?skeleton=${this.skeleton}
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
					<h4 class="package-description d2l-skeletize d2l-skeletize-15">${this.localize('description')}</h4>
					<d2l-input-text
						?skeleton=${this.skeleton}
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
				${this.canShare() ? this._renderSharingSection() : ''}
				${this._shouldRenderPlayerOptions() ? this._renderPlayerOptions() : ''}
				${this._shouldRenderNavBarOptions() ? this._renderNavBarOptions() : ''}
				${this._shouldRenderReviewRetakeOptions() ? this._renderReviewRetakeOptions() : ''}
			</div>
		`;
	}

	canShare() {
		return this.canShareTo?.length > 0;
	}

	renderSharingItems() {
		return this.canShareTo.map((item, index) => {
			const label = item.name;
			return html`<d2l-menu-item sharing-index="${index}" text="${label}"></d2l-menu-item>`;
		});
	}

	async save() {
		const updateLastRevision = updates => {
			const updatedLastRevision = Object.assign(
				this.content.revisions.pop(),
				updates);

			return { ...this.content,
				revisions: [
					...this.content.revisions,
					updatedLastRevision,
				] };
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

		let sharedWith = this.content.sharedWith || [];

		if (this._shared !== null) {
			// Remove sharedWith locations that are in canShareTo and then add the location we're
			// trying to share to. We do this instead of replacing the sharedWith value to ensure
			// that we don't remove share locations that were added in a different course context.
			// For instance, if we first share in Course A and then in Course B, we don't want to
			// remove the sharing to Course A just because we're now sharing it in Course B.
			sharedWith = sharedWith.filter(o => !this.canShareTo.find(c => buildOrgUnitShareLocationStr(c.id) === o));

			if (this._shared && this.canSelectShareLocation) {
				sharedWith.push(buildOrgUnitShareLocationStr(this.canShareTo[this._selectedSharingIndex].id));
			} else if (this._shared && !this.canSelectShareLocation) {
				for (const o of this.canShareTo) {
					const shareLocation = buildOrgUnitShareLocationStr(o.id);
					if (!sharedWith.includes(shareLocation)) {
						sharedWith.push(shareLocation);
					}
				}
			}
		}

		const updatedContent = Object.assign(updateLastRevision({
			options,
		}), {
			title: this._title,
			description: this._description || null,
			sharedWith,
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
		const content = await this.client.content.getItem({ id: this.contentId });
		this.content = content;

		const revision = this.revisionTag === 'latest' ? content.revisions[content.revisions.length - 1] : content.revisions.find(rev => rev.id === this.revisionTag);

		this._resourceType = revision.type;

		this._title = content.title;
		this._description = content.description;

		if (!this.content.sharedWith || this.content.sharedWith.length === 0 || !this.canShareTo) {
			this._shared = false;
		} else {
			this._shared = true;
			this._selectedSharingIndex = this.canShareTo.findIndex(canShareLocation =>
				this.content.sharedWith.includes(buildOrgUnitShareLocationStr(String(canShareLocation.id))));
			if (this._selectedSharingIndex === -1) {
				this._selectedSharingIndex = 0;
			}
		}

		this._playerShowNavBar = revision.options ? revision.options.playerShowNavBar : null;

		this._reviewRetake = revision.options?.reviewRetake ?? false;
		this._recommendedPlayer = revision?.options?.recommendedPlayer;
		if (this._recommendedPlayer === undefined) {
			this._recommendedPlayer = PlayerOption.EMBEDDED;
		}
	}

	_renderNavBarOptions() {
		return html`<div class="setting-section navigation">
			<h4 class="section-heading d2l-skeletize d2l-skeletize-40">${this.localize('navigation')}</h4>
			<div class="section-description d2l-skeletize d2l-skeletize-50">${this.localize('navigationDescription')}</div>
			<div class="setting-option">
				<div class="radio-container d2l-skeletize">
					<input
						id="remove-navigation"
						class="d2l-input-radio"
						name="navigation"
						type="radio"
						@change="${this._setShowNavBar(false)}"
						?checked="${this._playerShowNavBar !== null && !this._playerShowNavBar}"
					/>
				</div>
				<label for="remove-navigation">
					<div class="label-body d2l-skeletize">${this.localize('playerHideNavBar')}</div>
					<div class="label-description d2l-skeletize">${this.localize('playerHideNavBarDescription')}</div>
				</label>
			</div>
			<div class="setting-option">
				<div class="radio-container d2l-skeletize">
					<input
						id="add-navigation"
						class="d2l-input-radio"
						name="navigation"
						type="radio"
						@change="${this._setShowNavBar(true)}"
						?checked="${this._playerShowNavBar !== null && this._playerShowNavBar}"
					/>
				</div>
				<label for="add-navigation">
					<div class="label-body d2l-skeletize">${this.localize('playerShowNavBar')}</div>
					<div class="label-description d2l-skeletize">${this.localize('playerShowNavBarDescription')}</div>
				</label>
			</div>
		</div>`;
	}

	_renderPlayerOptions() {
		return html`<div class="setting-section navigation">
			<h4 class="section-heading d2l-skeletize d2l-skeletize-35">${this.localize('coursePlayer')}</h4>
			<div class="section-description d2l-skeletize d2l-skeletize-45">${this.localize('coursePlayerDescription')}</div>
			<div class="setting-option">
				<div class="radio-container d2l-skeletize">
					<input
						id="use-embedded-player"
						class="d2l-input-radio"
						name="use-embedded-player"
						type="radio"
						@change="${this._setUseEmbedPlayer(PlayerOption.EMBEDDED)}"
						?checked="${this._recommendedPlayer === PlayerOption.EMBEDDED}"
					/>
				</div>
				<label for="use-embedded-player">
					<div class="label-body d2l-skeletize">${this.localize('useEmbeddedPlayerDefault')}</div>
					<div class="label-description d2l-skeletize">${this.localize('useEmbeddedPlayerDescription')}</div>
				</label>
			</div>
			<div class="setting-option">
				<div class="radio-container d2l-skeletize">
					<input
						id="open-new-window"
						class="d2l-input-radio"
						name="use-embedded-player"
						type="radio"
						@change="${this._setUseEmbedPlayer(PlayerOption.NEW_WINDOW)}"
						?checked="${this._recommendedPlayer === PlayerOption.NEW_WINDOW}"
					/>
				</div>
				<label for="open-new-window">
					<div class="label-body d2l-skeletize">${this.localize('openPlayerInNewWindow')}</div>
					<div class="label-description d2l-skeletize">${this.localize('openPlayerInNewWindowDescription')}</div>
				</label>
			</div>
		</div>`;
	}

	_renderReviewRetakeOptions() {
		return html`<div class="setting-section navigation">
			<h4 class="section-heading d2l-skeletize d2l-skeletize-45">${this.localize('reviewRetake')}</h4>
			<div class="section-description d2l-skeletize d2l-skeletize-55">${this.localize('reviewRetakeDescription')}</div>
			<div class="setting-option">
				<div class="radio-container d2l-skeletize">
					<input
						id="do-not-add-review-retake"
						class="d2l-input-radio"
						name="add-review-retake"
						type="radio"
						@change="${this._setReviewRetake(false)}"
						?checked="${this._reviewRetake !== null && !this._reviewRetake}"
					/>
				</div>
				<label for="do-not-add-review-retake">
					<div class="label-body d2l-skeletize">${this.localize('doNotAddReviewRetake')}</div>
					<div class="label-description d2l-skeletize">${this.localize('doNotAddReviewRetakeDescription')}</div>
				</label>
			</div>
			<div class="setting-option">
				<div class="radio-container d2l-skeletize">
					<input
						id="add-review-retake"
						class="d2l-input-radio"
						name="add-review-retake"
						type="radio"
						@change="${this._setReviewRetake(true)}"
						?checked="${this._reviewRetake !== null && this._reviewRetake}"
					/>
				</div>
				<label for="add-review-retake">
					<div class="label-body d2l-skeletize">${this.localize('addReviewRetake')}</div>
					<div class="label-description d2l-skeletize">${this.localize('addReviewRetakeDescription')}</div>
				</label>
			</div>
		</div>`;
	}

	_renderShareLabel() {
		if (!this.canSelectShareLocation) {
			return html`<label for="add-sharing" class="label-body d2l-skeletize">${this.localize('yesShareFileWithAll')}</label>`;
		}

		if (this.canShareTo.length === 1) {
			return html`<label for="add-sharing" class="label-body d2l-skeletize">${this.localize('yesShareFileWithX', { name: this.canShareTo[0].name })}</label>`;
		}

		return html`<label for="add-sharing" class="label-body d2l-skeletize">${this.localize('yesShareFileWith')}</label>`;
	}

	_renderSharingDropdown() {
		return this.canShareTo.length > 1 && this.canSelectShareLocation ? html`
			<div class="d2l-skeletize sharing-dropdown-container">
				<d2l-dropdown-button
					text="${this.canShareTo[this._selectedSharingIndex].name}"
					class="sharing-dropdown"
				>
					<d2l-dropdown-menu
						@d2l-menu-item-select="${this._handleSelectedSharing}"
					>
						<d2l-menu label="revisions">
							${this.renderSharingItems()}
						</d2l-menu>
					</d2l-dropdown-menu>
				</d2l-dropdown-button>
			</div>
		` : html``;
	}

	_renderSharingSection() {
		return html`<div class="setting-section share">
			<h4 class="section-heading d2l-skeletize d2l-skeletize-30">${this.localize('askIfShare')}</h4>
			<div class="setting-option">
				<div class="radio-container d2l-skeletize">
					<input
						id="add-sharing"
						class="d2l-input-radio"
						name="sharing"
						type="radio"
						@change="${this._setShared(true)}"
						?checked="${this._shared !== null && this._shared}"
					/>
				</div>
				${this._renderShareLabel()}
				${this._renderSharingDropdown()}
			</div>
			<div class="setting-option">
				<div class="radio-container d2l-skeletize">
					<input
						id="remove-sharing"
						class="d2l-input-radio"
						name="sharing"
						type="radio"
						@change="${this._setShared(false)}"
						?checked="${this._shared !== null && !this._shared}"
					/>
				</div>
				<label for="remove-sharing" class="label-body d2l-skeletize">${this.localize('noKeepToMyself')}</label>
			</div>
		</div>`;
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

	_shouldRenderNavBarOptions() {
		return this.skeleton || this._resourceType === ContentType.SCORM;
	}

	_shouldRenderPlayerOptions() {
		return this.skeleton || this._resourceType === ContentType.SCORM;
	}

	_shouldRenderReviewRetakeOptions() {
		return this.skeleton || this._resourceType === ContentType.SCORM;
	}
}

customElements.define('d2l-content-properties', ContentProperties);
