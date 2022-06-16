import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/button/button-subtle.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui/core/components/tooltip/tooltip.js';
import { formatFileSize } from '@brightspace-ui/intl/lib/fileSize.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { inputStyles } from '@brightspace-ui/core/components/inputs/input-styles.js';
import { InternalLocalizeMixin } from '../../../mixins/internal-localize-mixin.js';
import { labelStyles, bodyStandardStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { formatTimestampText, convertSrtTextToVttText, validTimestampFormat, unformatTimestampText } from './captions-utils.js';
import { getUniqueId } from '@brightspace-ui/core/helpers/uniqueId';
import constants from './constants.js';
import './d2l-video-producer-auto-generate-captions-dialog';
import 'webvtt-parser/parser.js';

class CaptionsCueListItem extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			active: { type: Boolean },
			cue: { type: Object },
			expanded: { type: Boolean },
			newStartTime: { type: String },
			newEndTime: { type: String },
			startValidationError: { type: String },
			endValidationError: { type: String },
			errors: { type: Object },
			mediaPlayerDuration: { type: Number },
		};
	}

	static get styles() {
		return [ bodyStandardStyles, inputStyles, labelStyles, css`
			.d2l-video-producer-captions-cues-list-item {
				border: 2px solid var(--d2l-color-gypsum);
				background-color: var(--d2l-color-gypsum);
				border-radius: var(--d2l-input-border-radius, 0.3rem);
				display: flex;
				flex-direction: column;
				margin-bottom: 15px;
				padding: 10px;
			}

			.d2l-video-producer-captions-cues-list-item-active {
				background-color: var(--d2l-color-gypsum);
				border: 2px solid var(--d2l-color-primary-accent-action);
				border-radius: var(--d2l-input-border-radius, 0.3rem);
				display: flex;
				flex-direction: column;
				margin-bottom: 15px;
				padding: 10px;
			}

			.d2l-video-producer-captions-cue-main-controls {
				align-items: center;
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				width: 100%;
			}

			.d2l-video-producer-captions-cue-text-input {
				margin-bottom: 10px;
				margin-top: 12px;
				width: 100%;
				/* Disable word wrap and preserve line breaks from uploaded files */
				overflow: auto;
				resize: none;
				white-space: pre;
				/* This is needed to make "white-space: pre;" work on Safari */
				word-wrap: normal;
			}

			.d2l-video-producer-captions-cue-main-controls-buttons {
				align-items: center;
				display: flex;
				flex-direction: column;
			}

			.d2l-video-producer-captions-cue-expanded-controls {
				align-items: flex-end;
				display: flex;
				flex-direction: row;
			}

			.d2l-video-producer-captions-cue-start-end-grid {
				align-items: center;
				display: grid;
				justify-content: space-between;
				padding-left: 2px;
				width: 100%;
			}

			.d2l-video-producer-captions-cue-start-end-grid > p {
				margin-top: 0px;
				margin-bottom: 0px;
			}

			.start-timestamp-row {
				grid-row: 1;
				margin-bottom: 10%;
			}

			.end-timestamp-row {
				grid-row: 2;
				align-self: center;
			}

			.d2l-video-producer-captions-cue-timestamp-label {
				grid-column: 1;
			}

			.d2l-video-producer-captions-cue-timestamp-input {
				grid-column: 2;
				margin-left: auto;
				margin-right: auto;
				width: 90%;
			}

			.d2l-video-producer-captions-sync-cue-button {
				grid-column: 3;
			}

			.d2l-video-producer-captions-error-icon {
				grid-column: 2;
			}
			` ];
	}

	constructor() {
		super();
		this.active = false;
		this.cue = { startTime: 0, endTime: 0, text: '' };
		this.endValidationError = '';
		this._endInputId = getUniqueId();
		this.expanded = false;
		this.mediaPlayerDuration = 0;
		this.newEndTime = formatTimestampText(this.cue.endTime);
		this.newStartTime = formatTimestampText(this.cue.startTime);
		this.startValidationError = '';
		this._startInputId = getUniqueId();
		this.errors = {
			'INVALID_FORMAT': 'invalidFormat',
			'INVALID_TIME': 'invalidTime',
		};
	}

	render() {
		return html`
		<div
			class="d2l-video-producer-captions-cues-list-item${this.active ? '-active' : ''}"
			>
			${this._renderMainControls()}
			${this.expanded ? this._renderExpandedControls() : ''}
		</div>
		`;
	}

	updated(changedProperties) {
		super.updated(changedProperties);
		if (changedProperties.has('cue')) {
			this.newStartTime = formatTimestampText(this.cue.startTime);
			this.newEndTime = formatTimestampText(this.cue.endTime);
			this.startValidationError = '';
			this.endValidationError = '';
		}
	}

	get endTime() {
		return this.cue?.endTime;
	}

	get startTime() {
		return this.cue?.startTime;
	}

	get text() {
		return this.cue?.text;
	}

	_handleDeleteClicked() {
		this.dispatchEvent(new CustomEvent('captions-cue-deleted', {
			detail: { cue: this.cue },
			bubbles: true,
			composed: true,
		}));
	}

	_handleEndTimestampInputTextFocusout() {
		this.endValidationError = this._handleIsInputValidTimestamp(this.newEndTime);
		const newEndTimeInSeconds = unformatTimestampText(this.newEndTime);
		const inputChanged = this.cue.endTime !== newEndTimeInSeconds;
		if (!this.endValidationError && inputChanged) {
			this.dispatchEvent(new CustomEvent('captions-cue-end-timestamp-edited', {
				detail: {
					cue: this.cue,
					newEndTime: unformatTimestampText(this.newEndTime),
				},
				bubbles: true,
				composed: true,
			}));
		}
	}

	_handleFocus() {
		this._jumpToCueStartTime();
	}

	_handleIsInputValidTimestamp(timestampInText) {
		if (!validTimestampFormat(timestampInText)) return 'INVALID_FORMAT';
		const timestampInSeconds = unformatTimestampText(timestampInText);
		if (timestampInSeconds >= this.mediaPlayerDuration) return 'INVALID_TIME';
		return '';
	}

	_handleNewEndTimeInput(event) {
		this.newEndTime = event.target.value;
	}

	_handleNewStartTimeInput(event) {
		this.newStartTime = event.target.value;
	}

	_handleStartTimestampInputTextFocusout() {
		this.startValidationError = this._handleIsInputValidTimestamp(this.newStartTime);
		const newStartTimeInSeconds = unformatTimestampText(this.newStartTime);
		const inputChanged = this.cue.startTime !== newStartTimeInSeconds;
		if (!this.startValidationError && inputChanged) {
			this.dispatchEvent(new CustomEvent('captions-cue-start-timestamp-edited', {
				detail: {
					cue: this.cue,
					newStartTime: unformatTimestampText(this.newStartTime),
				},
				bubbles: true,
				composed: true,
			}));
		}
	}

	_handleSyncEndTimestampClicked() {
		this.endValidationError = '';
		this.dispatchEvent(new CustomEvent('captions-cue-end-timestamp-edited', {
			detail: {
				cue: this.cue,
			},
			bubbles: true,
			composed: true,
		}));
	}

	_handleSyncStartTimestampClicked() {
		this.startValidationError = '';
		this.dispatchEvent(new CustomEvent('captions-cue-start-timestamp-edited', {
			detail: {
				cue: this.cue,
			},
			bubbles: true,
			composed: true,
		}));
	}

	_handleTextInput(event) {
		this.cue.text = event.target.value;
		this._jumpToCueStartTime();
		this.dispatchEvent(new CustomEvent('captions-edited', {
			bubbles: true,
			composed: true,
		}));
	}

	_hideExpandedControls() {
		this.expanded = false;
		this.startValidationError = '';
		this.endValidationError = '';
	}

	_jumpToCueStartTime() {
		this.dispatchEvent(new CustomEvent('media-player-time-jumped', {
			// In Chrome, if a cue's start time overlaps with a cue's end time exactly,
			// (e.g. cueA.endTime = 3.000, cueB.startTime = 3.000)
			// the displayed captions text will flicker back-and-forth between them.
			// To prevent that flickering, we jump a tiny bit ahead of the cue's start time.
			detail: { time: this.cue.startTime + 0.001 },
			bubbles: true,
			composed: true,
		}));
	}

	_renderExpandedControls() {
		const startTimeTooltip = this.startValidationError ?
			html`
				<d2l-tooltip
					id="start-time-tooltip"
					for="${this._startInputId}"
					state="error"
				>${this.localize(this.errors[this.startValidationError], { formattedTime: formatTimestampText(this.mediaPlayerDuration)})}</d2l-tooltip>`
			: null;

		const endTimeTooltip = this.endValidationError ?
			html`
				<d2l-tooltip
					id="end-time-tooltip"
					for="${this._endInputId}"
					state="error"
				>${this.localize(this.errors[this.endValidationError], { formattedTime: formatTimestampText(this.mediaPlayerDuration)})}</d2l-tooltip>`
			: null;

		return html`
			<div class="d2l-video-producer-captions-cue-expanded-controls">
				<div class="d2l-video-producer-captions-cue-start-end-grid">
					<p class="start-timestamp-row d2l-label-text d2l-video-producer-captions-cue-timestamp-label">${this.localize('captionsCueStartTimestamp')}</p>
					<p class="start-timestamp-row d2l-body-standard d2l-video-producer-captions-cue-timestamp-input">
						<d2l-input-text
							aria-invalid="${this.startValidationError !== ''}"
							class="d2l-input-text start-time-input-text"
							id="${this._startInputId}"
							@input="${this._handleNewStartTimeInput}"
							@focusout="${this._handleStartTimestampInputTextFocusout}"
							label="Cue Start Time"
							label-hidden
							maxlength="${constants.MAX_NEW_TIME_CHARACTERS}"
							rows="1"
							value="${this.newStartTime}"
						></d2l-input-text>
						${startTimeTooltip}
					</p>
					<d2l-button-icon
						id="start-time-captions-sync-cue-button"
						class="start-timestamp-row d2l-video-producer-captions-sync-cue-button"
						@click="${this._handleSyncStartTimestampClicked}"
						text=${this.localize('syncStartTimeToTimeline')}
						icon="tier1:time"
					></d2l-button-icon>
					<p class="end-timestamp-row d2l-label-text d2l-video-producer-captions-cue-timestamp-label">${this.localize('captionsCueEndTimestamp')}</p>
					<p class="end-timestamp-row d2l-body-standard d2l-video-producer-captions-cue-timestamp-input">
						<d2l-input-text
							aria-invalid="${this.endValidationError !== ''}"
							class="d2l-input-text end-time-input-text"
							id="${this._endInputId}"
							@input="${this._handleNewEndTimeInput}"
							@focusout="${this._handleEndTimestampInputTextFocusout}"
							label="Cue End Time"
							label-hidden
							maxlength="${constants.MAX_NEW_TIME_CHARACTERS}"
							rows="1"
							value="${this.newEndTime}"
						></d2l-input-text>
						${endTimeTooltip}
					</p>
					<d2l-button-icon
						id="end-timestamp-captions-sync-cue-button"
						class="end-timestamp-row d2l-video-producer-captions-sync-cue-button"
						@click="${this._handleSyncEndTimestampClicked}"
						text=${this.localize('syncEndTimeToTimeline')}
						icon="tier1:time"
					></d2l-button-icon>
				</div>
			</div>
		`;
	}

	_renderMainControls() {
		return html`
			<div class="d2l-video-producer-captions-cue-main-controls">
				<textarea
					aria-label=${this.localize('captionsCueText')}
					class="d2l-input d2l-video-producer-captions-cue-text-input"
					@focus="${this._handleFocus}"
					@input="${this._handleTextInput}"
					maxlength="${constants.MAX_CAPTIONS_CUE_CHARACTERS}"
					rows="2"
				>${this.cue.text}</textarea>
				<div class="d2l-video-producer-captions-cue-main-controls-buttons">
					<d2l-button-icon
						@click="${this._handleDeleteClicked}"
						text=${this.localize('deleteCaptionsCue')}
						icon="tier1:delete"
					></d2l-button-icon>
					${ this.expanded ? (html`
						<d2l-button-icon
							text=${this.localize('hideExpandedCaptionsCueControls')}
							icon="tier1:arrow-collapse"
							@click=${this._hideExpandedControls}
						></d2l-button-icon>
					`) : (html`
						<d2l-button-icon
							text=${this.localize('openExpandedCaptionsCueControls')}
							icon="tier1:arrow-expand"
							@click=${this._showExpandedControls}
						></d2l-button-icon>
					`)}
				</div>
			</div>
		`;
	}

	_showExpandedControls() {
		this.expanded = true;
		this.endValidationError = this._handleIsInputValidTimestamp(this.newEndTime);
		this.startValidationError = this._handleIsInputValidTimestamp(this.newStartTime);
	}

}

customElements.define('d2l-video-producer-captions-cues-list-item', CaptionsCueListItem);

class VideoProducerCaptions extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			activeCue: { type: Object },
			captions: { type: Array },
			defaultLanguage: { type: Object },
			languages: { type: Array },
			loading: { type: Boolean },
			selectedLanguage: { type: Object },

			_autoGenerateDialogOpened: { type: Boolean, attribute: false },
			_currentVisibleCueBatch: { type: Number, attribute: false },
			_newCueText: { type: String, attribute: false },
			_numberOfVisibleCuesInList: { type: Number, attribute: false },
			_renderingCues: { type: Boolean, attribute: false },
		};
	}

	static get styles() {
		return [ labelStyles, css`
			.d2l-video-producer-captions {
				align-items: center;
				border: 1px solid var(--d2l-color-mica);
				box-sizing: border-box;
				display: flex;
				flex-direction: column;
				height: ${constants.TABS_BODY_HEIGHT}px;
				justify-content: center;
				position: relative;
				width: 360px;
			}

			.d2l-video-producer-captions-editor-top-buttons {
				background-color: white;
				border-bottom: 1px solid var(--d2l-color-mica);
				display: flex;
				flex-direction: row;
				justify-content: space-around;
				left: 0;
				position: absolute;
				top: 0;
				width: 100%;
				z-index: 100;
			}

			.d2l-video-producer-no-captions-message {
				margin-left: 20px;
				margin-right: 20px;
				margin-top: 65%;
				text-align: center;
			}

			.d2l-video-producer-captions-cues-list {
				display: flex;
				flex-direction: column;
				height: ${constants.TABS_CONTAINER_HEIGHT}px;
				margin-top: 43px;
				overflow-x: hidden;
				overflow-y: scroll;
				padding: 0px 10px 10px 0px;
				width: 95%;
			}

			.d2l-video-producer-preparing-captions-overlay {
				align-items: center;
				background-color: rgba(255, 255, 255, 0.8);
				display: flex;
				flex-direction: column;
				height: ${constants.TABS_CONTAINER_HEIGHT}px;
				justify-content: center;
				left: 0;
				position: absolute;
				top: 0;
				width: 95%;
			}

			.d2l-video-producer-captions-bottom-bar {
				background-color: white;
				border-top: 1px solid var(--d2l-color-mica);
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				margin-top: auto;
				padding-bottom: 8px;
				padding-top: 8px;
				width: 100%;
			}
		`];
	}

	constructor() {
		super();
		this.activeCue = null;
		this.captions = [];
		this.mediaPlayerDuration = 0;
		this.languages = [];
		this._autoGenerateDialogOpened = false;
		this._currentVisibleCueBatch = 0;
		this._newCueText = '';
		this._numberOfVisibleCuesInList = 0;
		this._renderingCues = false;

		this._onFilesAdded = this._onFilesAdded.bind(this);
	}

	render() {
		return html`
			<div class="d2l-video-producer-captions">
				${this._renderContent()}
				<d2l-alert-toast
					id="d2l-video-producer-captions-alert-toast"
				></d2l-alert-toast>
			</div>
		`;
	}

	updated(changedProperties) {
		changedProperties.forEach((oldValue, propName) => {
			if ((propName === 'loading') || (propName === 'activeCue') || (propName === 'captions')) {
				if (propName === 'loading') {
					this._currentVisibleCueBatch = 0;
				}
				if (!this.loading && this.captions?.length > 0 && this.activeCue) {
					this._updateVisibleCueBatch()
						.then(() => {
							this._scrollToActiveCue();
						});
				}
			}
		});
	}

	_dispatchCaptionsVttReplaced(vttString) {
		this.dispatchEvent(new CustomEvent('captions-vtt-replaced', {
			detail: { vttString },
			composed: false
		}));
	}

	_handleClearAllClicked() {
		this._dispatchCaptionsVttReplaced('WEBVTT'); // WebVTT file with no cues.
	}

	_handleInsertNewCue() {
		this.dispatchEvent(new CustomEvent('captions-cue-added', {
			detail: { text: this._newCueText },
			bubbles: true,
			composed: true,
		}));
		this._newCueText = '';
	}

	_handleNewCueTextInput(event) {
		this._newCueText = event.target.value;
	}

	_handleNewCueTextKeyPress(event) {
		if (event.keyCode === constants.ADD_NEW_CUE_KEY_CODE) {
			this._handleInsertNewCue();
		}
	}

	_handleNextCuesBatchClick() {
		// Find the first cue in the next batch that doesn't overlap with any cues in this batch,
		// and make the Media Player jump to it.

		const nextCueBatch = this._currentVisibleCueBatch + 1;
		const lastCueInCurrentBatch = this.captions[(nextCueBatch * constants.NUM_OF_VISIBLE_CUES) - 1];

		let newActiveCue;
		let i = nextCueBatch * constants.NUM_OF_VISIBLE_CUES;
		while (!newActiveCue && (i < this.captions.length)) {
			const cue = this.captions[i];
			if (cue.startTime > lastCueInCurrentBatch.endTime) {
				newActiveCue = cue;
			}
			i++;
		}

		if (newActiveCue) {
			this.dispatchEvent(new CustomEvent('media-player-time-jumped', {
				detail: { time: newActiveCue.startTime + 0.001 },
				bubbles: true,
				composed: true,
			}));
		}
	}

	_handlePreviousCuesBatchClick() {
		// Find the latest cue in the previous batch that doesn't overlap with any cues in this batch,
		// and make the Media Player jump to it.

		const firstCueInCurrentBatch = this.captions[this._currentVisibleCueBatch * constants.NUM_OF_VISIBLE_CUES];
		let newActiveCue;
		let i = (this._currentVisibleCueBatch * constants.NUM_OF_VISIBLE_CUES) - 1;
		while (!newActiveCue && (i > 0)) {
			const cue = this.captions[i];
			if (cue.endTime < firstCueInCurrentBatch.startTime) {
				newActiveCue = cue;
			}
			i--;
		}

		if (newActiveCue) {
			this.dispatchEvent(new CustomEvent('media-player-time-jumped', {
				detail: { time: newActiveCue.startTime + 0.001 },
				bubbles: true,
				composed: true,
			}));
		}

	}

	_onAutoGenerateClicked() {
		this._autoGenerateDialogOpened = true;
	}

	_onAutoGenerateDialogClosed() {
		this._autoGenerateDialogOpened = false;
	}

	_onFilesAdded(event) {
		if (!(event?.target?.files?.length === 1)) {
			return;
		}

		const file = event.target.files[0];
		const extension = file.name.split('.').pop();
		if (!['srt', 'vtt'].includes(extension.toLowerCase())) {
			this._openAlertToast({type: 'critical', text: this.localize('captionsInvalidFileType') });
		} else if (file.size > constants.MAX_CAPTIONS_UPLOAD_SIZE_IN_BYTES) {
			this._openAlertToast({type: 'critical', text: this.localize('captionsFileTooLarge', { localizedMaxFileSize: formatFileSize(constants.MAX_CAPTIONS_UPLOAD_SIZE_IN_BYTES) }) });
		} else {
			const fileReader = new FileReader();
			fileReader.addEventListener('load', event => {
				try {
					const vttText = extension === 'vtt' ? event.target.result : convertSrtTextToVttText(event.target.result);
					const {errors} = new window.WebVTTParser().parse(vttText, 'metadata');
					if (errors && errors.length > 0) {
						throw new Error(JSON.stringify(errors));
					}
					this._dispatchCaptionsVttReplaced(vttText);
				} catch (error) {
					console.error(error);
					this._openAlertToast({type: 'critical', text: this.localize('captionsInvalidContent') });
					return;
				}
			});
			fileReader.addEventListener('error', () => {
				this._openAlertToast({type: 'critical', text: this.localize('captionsReadError') });
			});
			fileReader.readAsText(file, 'UTF-8');
		}
	}

	_onUploadClicked() {
		this.shadowRoot.querySelector('#d2l-video-producer-captions-file-uploader').click();
	}

	_openAlertToast({type, text}) {
		const alertToast = this.shadowRoot.querySelector('#d2l-video-producer-captions-alert-toast');
		alertToast.setAttribute('open', 'open');
		alertToast.setAttribute('type', type);
		alertToast.innerText = text;
	}

	_renderBottomBar() {
		return html`
			<div class="d2l-video-producer-captions-bottom-bar">
				<d2l-button-icon
					class="d2l-video-producer-captions-add-cue-button"
					@click="${this._handleInsertNewCue}"
					?disabled="${this._renderingCues || !this._newCueText}"
					icon="tier1:plus-default"
					text="${this.localize('insertNewCaptionsAtCurrentTime')}"
				></d2l-button-icon>
				<d2l-input-text
					?disabled="${this._renderingCues}"
					@input="${this._handleNewCueTextInput}"
					@keypress="${this._handleNewCueTextKeyPress}"
					label="${this.localize('newCaptionsText')}"
					label-hidden
					placeholder="${this.localize('newCaptionsTextPlaceholder')}"
					value="${this._newCueText}"
				></d2l-input-text>
				<d2l-button-icon
					class="d2l-video-producer-captions-clear-all-button"
					@click="${this._handleClearAllClicked}"
					?disabled="${this.captions.length === 0 || this._renderingCues}"
					icon="tier1:blocked"
					text="${this.localize('clearAll')}"
				></d2l-button-icon>
			</div>
		`;
	}

	_renderContent() {
		if (this.loading) {
			return this._renderLoadingIndicator();
		} else {
			return html`
				${this._renderTopButtons()}
				${this.captions?.length > 0 ? this._renderCuesList() : this._renderEmptyCaptionsMessage()}
				${this._renderBottomBar()}
				<input
					accept=".srt,.vtt"
					@change="${this._onFilesAdded}"
					id="d2l-video-producer-captions-file-uploader"
					style="display: none;"
					type="file"
				></input>
				<d2l-video-producer-auto-generate-captions-dialog
					@d2l-dialog-close="${this._onAutoGenerateDialogClosed}"
					.languages="${this.languages}"
					.opened="${this._autoGenerateDialogOpened}"
					.selectedLanguage="${this.selectedLanguage}"
				></d2l-video-producer-auto-generate-captions-dialog>
			`;
		}
	}

	_renderCuesList() {
		const cuesListStart = this._currentVisibleCueBatch * constants.NUM_OF_VISIBLE_CUES;
		const cuesListEnd = cuesListStart + constants.NUM_OF_VISIBLE_CUES;
		return html`
			${this._renderingCues ? this._renderPreparingCaptionsOverlay() :
		html`<div class="d2l-video-producer-captions-cues-list">
			${this._currentVisibleCueBatch > 0 ? this._renderPreviousCuesBatchButton() : ''}
			${this.captions.slice(cuesListStart, cuesListEnd).map(cue => html`
				<d2l-video-producer-captions-cues-list-item
					?active="${this.activeCue && (cue.startTime === this.activeCue.startTime) && (cue.endTime === this.activeCue.endTime)}"
					.cue="${cue}"
					.mediaPlayerDuration="${this.mediaPlayerDuration}"
				></d2l-video-producer-captions-cues-list-item>
			`)}
			${((this._currentVisibleCueBatch + 1) * constants.NUM_OF_VISIBLE_CUES) < this.captions?.length ? this._renderNextCuesBatchButton() : ''}
		</div>`}
		`;
	}

	_renderEmptyCaptionsMessage() {
		return html`
			<p class="d2l-body-standard d2l-video-producer-no-captions-message">${this.localize('noCaptions', { language: this.selectedLanguage.name })}</p>
		`;
	}

	_renderLoadingIndicator() {
		return html`<d2l-loading-spinner size="150"></d2l-loading-spinner>`;
	}

	_renderNextCuesBatchButton() {
		return html`
			<d2l-button-subtle
				@click="${this._handleNextCuesBatchClick}"
				icon="tier1:chevron-down"
				text="${this.localize('viewNextCues', { cueBatchSize: constants.NUM_OF_VISIBLE_CUES })}"
			></d2l-button-subtle>
		`;
	}

	_renderPreparingCaptionsOverlay() {
		return html`
			<div class="d2l-video-producer-preparing-captions-overlay">
				<d2l-loading-spinner size="100"></d2l-loading-spinner>
				<p class="d2l-body-standard">${this.localize('preparingCaptions')}</p>
			</div>
		`;
	}

	_renderPreviousCuesBatchButton() {
		return html`
			<d2l-button-subtle
				@click="${this._handlePreviousCuesBatchClick}"
				icon="tier1:chevron-up"
				text="${this.localize('viewPreviousCues', { cueBatchSize: constants.NUM_OF_VISIBLE_CUES })}"
			></d2l-button-subtle>
		`;
	}

	_renderTopButtons() {
		return html`
			<div class="d2l-video-producer-captions-editor-top-buttons">
				<d2l-button-subtle
					text="${this.localize('autoGenerate')}"
					icon="tier1:manual-run"
					?disabled="${!this.selectedLanguage.autoCaptions}"
					@click="${this._onAutoGenerateClicked}"
				></d2l-button-subtle>
				<d2l-button-subtle
					text="${this.localize('upload')}"
					icon="tier1:upload"
					@click="${this._onUploadClicked}"
				></d2l-button-subtle>
			</div>
		`;
	}

	async _scrollToActiveCue() {
		// The active cue might have changed before the captions tab finished loading.
		const waitUntilLoadingFinished = resolve => {
			if (this.loading) {
				setTimeout(() => waitUntilLoadingFinished(resolve), 100);
			} else {
				resolve();
			}
		};
		await new Promise(resolve => waitUntilLoadingFinished(resolve));

		if (!this.activeCue) return;

		// Make sure the cue list element is finished drawing along with its cue list item elements.
		let captionsCuesList = this.shadowRoot.querySelector('.d2l-video-producer-captions-cues-list');
		if (!(captionsCuesList?.childNodes?.length >= this._numberOfVisibleCuesInList)) {
			const waitUntilListIsReady = resolve => {
				captionsCuesList = this.shadowRoot.querySelector('.d2l-video-producer-captions-cues-list');
				if (captionsCuesList?.childNodes?.length >= this._numberOfVisibleCuesInList) {
					resolve();
				} else {
					setTimeout(() => waitUntilListIsReady(resolve), 100);
				}
			};
			await new Promise(resolve => waitUntilListIsReady(resolve));
		}

		for (const cueListItem of captionsCuesList.childNodes) {
			if (
				(cueListItem.startTime === this.activeCue.startTime) &&
				(cueListItem.endTime === this.activeCue.endTime) &&
				(cueListItem.text === this.activeCue.text)
			) {
				cueListItem.scrollIntoView({block: 'nearest', inline: 'nearest'});
				break;
			}
		}
	}

	async _updateVisibleCueBatch() {
		this._renderingCues = true;

		let activeCueIndex;
		let i = 0;
		while ((!activeCueIndex) && (i < this.captions.length)) {
			const cue = this.captions[i];
			if (
				(cue.startTime === this.activeCue.startTime) &&
				(cue.endTime === this.activeCue.endTime) &&
				(cue.text === this.activeCue.text)
			) {
				activeCueIndex = i;
			}
			i++;
		}
		if (!activeCueIndex) {
			// The cue was deleted and the list hasn't finished updating yet.
			// In this case, the current batch shouldn't change.
			this._renderingCues = false;
			return;
		}

		const newCueBatch = Math.floor(activeCueIndex / constants.NUM_OF_VISIBLE_CUES);
		if (newCueBatch !== this._currentVisibleCueBatch) {
			this._currentVisibleCueBatch = newCueBatch;
			await new Promise(resolve => {
				setTimeout(resolve, 500);
			});
		}

		this._renderingCues = false;
	}
}

customElements.define('d2l-video-producer-captions', VideoProducerCaptions);
