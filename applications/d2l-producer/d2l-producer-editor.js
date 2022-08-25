import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/dialog/dialog-confirm.js';
import '@brightspace-ui/core/components/dropdown/dropdown-button-subtle.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/tabs/tabs.js';
import '@brightspace-ui/core/components/tabs/tab-panel.js';
import '@brightspace-ui/core/components/tooltip/tooltip.js';
import '@brightspace-ui-labs/media-player/media-player.js';
import './src/d2l-producer-language-selector.js';
import './src/d2l-producer-captions.js';
import './src/d2l-producer-chapters.js';
import './src/d2l-producer-timeline.js';
import './src/d2l-producer-timeline-controls.js';

import { css, html, LitElement } from 'lit-element/lit-element.js';
import constants from './src/constants.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { bodyCompactStyles, labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import { convertVttCueArrayToVttText, textTrackCueListToArray } from './src/captions-utils.js';

class ProducerEditor extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			captions: { type: Array },
			captionsLoading: { type: Boolean, attribute: 'captions-loading' },
			captionsUrl: { type: String },
			defaultLanguage: { type: Object },
			enableCutsAndChapters: { type: Boolean },
			finishing: { type: Boolean },
			languages: { type: Array },
			mediaType: { type: String },
			metadata: { type: Object },
			metadataLoading: { type: Boolean, attribute: 'metadata-loading' },
			saving: { type: Boolean },
			selectedLanguage: { type: Object },
			selectedRevisionIsProcessing: { type: Boolean },
			src: { type: String },
			timelineVisible: { type: Boolean, attribute: 'timeline-visible' },

			_controlMode: { type: String, attribute: false},
			mediaPlayerDuration: { type: Number, attribute: false },
			mediaPlayerCurrentTime: { type: Number, attribute: false },
			mediaPlayerPaused: { type: Boolean, attribute: false },
			mediaPlayerEnded: { type: Boolean, attribute: false },
			_activeCue: { type: Object, attribute: false },
		};
	}

	static get styles() {
		return [bodyCompactStyles, labelStyles, selectStyles, css`
			.d2l-producer-timeline-container {
				display: flex;
				margin-top: 15px;
			}

			.d2l-producer-timeline {
				width: ${constants.CANVAS_WIDTH}px;
			}

			.d2l-producer-editor {
				display: flex;
				flex-direction: column;
			}

			.d2l-producer-video-controls {
				display: flex;
				height: 580px;
				justify-content: space-between;
			}

			.d2l-producer-editor d2l-labs-media-player {
				display: flex;
				margin-right: 20px;
				width: 100%;
			}

			.d2l-producer-captions-header {
				margin: 10px 0px 10px 0px;
			}

			.d2l-producer-language-selector {
				float: right;
			}
		`];
	}

	static get content() {
		return this._content;
	}

	constructor() {
		super();

		this._chaptersComponent = null;

		this.enableCutsAndChapters = false;

		this._controlMode = constants.CONTROL_MODES.SEEK;
		this._activeCue = null;
		this.captions = [];
		this.captionsUrl = '';
		this.captionsLoading = false;

		this.mediaPlayerDuration = 0;
		this.mediaPlayerCurrentTime = 0;
		this.mediaPlayerPaused = false;
		this.mediaPlayerEnded = false;

		this.metadata = { cuts: [], chapters: [] };
		this.metadataLoading = false;
		this.timelineVisible = false;
		this.src = '';
		this.languages = [];
		this.defaultLanguage = {};
		this.selectedLanguage = {};
		this._is_IOS = /iPad|iPhone|iPod/.test(navigator.platform);
	}

	firstUpdated() {
		super.firstUpdated();
		this._mediaPlayer = this.shadowRoot.querySelector('d2l-labs-media-player');
	}

	render() {
		return html`
			<div class="d2l-producer-editor">
				<div class="d2l-producer-video-controls">
					<!-- crossorigin needs to be set in order for <track> elements to load sources from different origins. -->
					<d2l-labs-media-player
						controls
						?autoplay="${this._is_IOS}"
						crossorigin="anonymous"
						@cuechange="${this._handleCueChange}"
						@durationchange="${this._handleMediaPlayerUpdate}"
						@error="${this._handleMediaError}"
						hide-captions-selection
						?hide-seek-bar="${this.enableCutsAndChapters}"
						media-type="${this.mediaType}"
						disable-set-preferences
						@pause="${this._pauseUpdatingVideoTime}"
						@play="${this._startUpdatingVideoTime}"
						@seeking="${this.updateVideoTime}"
						@trackloaded="${this._handleTrackLoaded}"
						@loadeddata="${this._handleLoadedData}"
					>
						<source src="${this.src}" label="${this.localize('closedCaptions')}">
						${this.captionsUrl ? html`<track default-ignore-preferences src="${this.captionsUrl}" srclang="${this._formatCaptionsSrcLang()}" label="${this.selectedLanguage.name}" kind="subtitles">` : ''}
					</d2l-labs-media-player>
					<div class="d2l-producer-tabs-and-language-selection">
						${this.languages && this.selectedLanguage ? html`
							<d2l-producer-language-selector
								class="d2l-producer-language-selector"
								?disabled="${this.saving || this.finishing || this.selectedRevisionIsProcessing}"
								.languages="${this.languages}"
								.selectedLanguage="${this.selectedLanguage}"
								@selected-language-changed="${this._handleSelectedLanguageChanged}"
							></d2l-producer-language-selector>
						` : null}
						<d2l-tabs>
							${ (this.enableCutsAndChapters ? html`
								<d2l-tab-panel
									selected
									no-padding
									text=${this.localize('tableOfContents')}
								>
									<d2l-producer-chapters
										.chapters="${this.metadata && this.metadata.chapters}"
										.defaultLanguage="${this.defaultLanguage}"
										.selectedLanguage="${this.selectedLanguage}"
										?loading="${this.metadataLoading}"
										@add-new-chapter="${this._addNewChapter}"
										@chapters-changed="${this._handleChaptersChanged}"
										@set-chapter-to-current-time="${this._setChapterToCurrentTime}"
									></d2l-producer-chapters>
								</d2l-tab-panel>
							` : '')}
							<d2l-tab-panel
								no-padding
								text=${this.localize('closedCaptions')}
							>
								<!-- d2l-tabs hides the tab header if there is only 1 tab panel -->
								${(this.enableCutsAndChapters ? '' : html`
									<div class="d2l-producer-captions-header d2l-body-compact">
										${this.localize('closedCaptions')}
									</div>
								`)}
								<d2l-producer-captions
									.activeCue="${this._activeCue}"
									.captions="${this.captions}"
									.mediaPlayerDuration="${this._mediaPlayer?.duration ?? 0}"
									@captions-cue-added="${this._handleCaptionsCueAdded}"
									@captions-cue-deleted="${this._handleCaptionsCueDeleted}"
									@captions-cue-end-timestamp-edited="${this._handleChangeCaptionsCueEndTime}"
									@captions-cue-start-timestamp-edited="${this._handleChangeCaptionsCueStartTime}"
									@captions-vtt-replaced=${this._handleCaptionsVttReplaced}
									.defaultLanguage="${this.defaultLanguage}"
									.languages="${this.languages}"
									?loading="${this.captionsLoading}"
									@media-player-time-jumped="${this._handleMediaPlayerTimeJumped}"
									.selectedLanguage="${this.selectedLanguage}"
								></d2l-producer-captions>
							</d2l-tab-panel>
						</d2l-tabs>
					</div>
				</div>
				${(this.enableCutsAndChapters ? html`
					<div class="d2l-producer-timeline-container" style="visibility: ${this.timelineVisible ? 'visible' : 'hidden'};">
						<d2l-producer-timeline
							class="d2l-producer-timeline"
							.controlMode=${this._controlMode}
							@pause-media-player=${this._pauseMediaPlayerHandler}
							@play-media-player=${this._playMediaPlayerHandler}
							?enableCutsAndChapters=${this.enableCutsAndChapters}
							.metadata=${this.metadata}
							.mediaPlayerDuration=${this.mediaPlayerDuration}
							.mediaPlayerCurrentTime=${this.mediaPlayerCurrentTime}
							.mediaPlayerPaused=${this.mediaPlayerPaused}
							.mediaPlayerEnded=${this.mediaPlayerEnded}
							@timeline-first-updated=${this.timelineFirstUpdatedHandler}
							@timeline-updated=${this.timelineUpdatedHandler}
							@media-player-update=${this._handleMediaPlayerUpdate}
							@update-chapter-time=${this._setChapterToTimeHandler}
							@update-media-player-current-time=${this.handleMediaPlayerCurrentTimeUpdate}
							?videoLoaded=${this._videoLoaded}
						></d2l-producer-timeline>
						<d2l-producer-timeline-controls
							class="d2l-producer-timeline-controls"
							@change-to-cut-mode=${this.handleCutMode}
							@change-to-mark-mode=${this.handleMarkMode}
							@change-to-seek-mode=${this.handleSeekMode}
						>
						</d2l-producer-timeline-controls>
					</div>
				` : '')}
			</div>
		`;
	}

	handleCutMode() {
		this._controlMode = constants.CONTROL_MODES.CUT;
	}

	handleMarkMode() {
		this._controlMode = constants.CONTROL_MODES.MARK;
	}

	handleMediaPlayerCurrentTimeUpdate({detail: {time}}) {
		this._mediaPlayer.currentTime = time;
		this.mediaPlayerCurrentTime = time;
	}

	handleSeekMode() {
		this._controlMode = constants.CONTROL_MODES.SEEK;
	}

	get mediaPlayer() {
		return this._mediaPlayer || null;
	}

	timelineFirstUpdatedHandler() {
		this._timelineElement = this.shadowRoot.querySelector('d2l-producer-timeline');

		// Wait for video to be loaded
		this._mediaPlayer.addEventListener('loadeddata', () => {
			if (this.enableCutsAndChapters && this.metadata) {
				this._timelineElement.handleLoadedData();
				this._controlMode = constants.CONTROL_MODES.SEEK;
			}
			this._videoLoaded = true;
		});
	}

	timelineUpdatedHandler(e) {
		const changedProperties = e.detail.changedProperties;
		super.updated(changedProperties);
		if (changedProperties.has('enableCutsAndChapters') && this.enableCutsAndChapters) {
			this._chaptersComponent = this.shadowRoot.querySelector('d2l-producer-chapters');
			this._chaptersComponent.addEventListener('active-chapter-updated',
				this._timelineElement.handleActiveChapterUpdated.bind(this._timelineElement));
		}
	}

	updateVideoTime() {
		this._timelineElement.updateVideoTime();
	}

	//#region Chapter management
	_addNewChapter() {
		this._chaptersComponent.addNewChapter(this._mediaPlayer.currentTime);
	}

	//#endregion
	_fireCaptionsChangedEvent(captions) {
		this.dispatchEvent(new CustomEvent(
			'captions-changed',
			{
				composed: false,
				detail: { captions }
			}
		));
	}

	_fireMetadataChangedEvent({ cuts = this._timelineElement.timeline.getCuts(), chapters = this.metadata.chapters } = {}) {
		// Remove object references to prevent 'cyclic object value' errors when saving metadata.
		// eslint-disable-next-line no-unused-vars
		cuts = cuts.map(({timeline, displayObject, ...cut}) => cut);
		this.dispatchEvent(new CustomEvent(
			'metadata-changed',
			{
				composed: false,
				detail: { cuts, chapters }
			}
		));
	}

	_formatCaptionsSrcLang() {
		// Some of the 5-character language codes we receive from the D2L locales endpoint are all lowercase, e.g. "en-us".
		// We need to convert them to mixed case ("en-US") in order to match the spec for <track> element's "srclang" attribute.
		// If the format is incorrect, <track> will not process the captions into cue objects.
		if (this.selectedLanguage.code.length === 5) {
			return `${this.selectedLanguage.code.slice(0, 2)}-${this.selectedLanguage.code.slice(3).toUpperCase()}`;
		}
		return this.selectedLanguage.code;
	}

	//#endregion
	_handleCaptionsCueAdded(event) {
		const newCue = new VTTCue(
			this._mediaPlayer.currentTime,
			this._mediaPlayer.currentTime + constants.NEW_CUE_DEFAULT_DURATION_IN_SECONDS,
			event.detail.text
		);
		if (this._mediaPlayer.textTracks?.length > 0) {
			this._mediaPlayer.textTracks[0].addCue(newCue);
			this._syncCaptionsWithMediaPlayer();
		} else {
			// If there were no captions before, the Media Player won't have any text tracks yet.
			// In this case, we need to make the Media Player load a new text track with the new cue in it.
			const vttString = convertVttCueArrayToVttText([newCue]);
			const localVttUrl = window.URL.createObjectURL(new Blob([vttString], { type: 'text/vtt' }));
			this.dispatchEvent(new CustomEvent('captions-url-changed', {
				detail: { captionsUrl: localVttUrl },
				composed: false
			}));
		}

		setTimeout(() => {
			this._mediaPlayer.currentTime = newCue.startTime + 0.001;
		}, 100); // Give the new cue element time to be drawn.
	}

	_handleCaptionsCueDeleted(event) {
		const cueToDelete = event.detail.cue;
		this._mediaPlayer.textTracks[0].removeCue(cueToDelete);
		this._syncCaptionsWithMediaPlayer();
		this._mediaPlayer.currentTime = this._mediaPlayer.currentTime + 0.001; // Make the Media Player update to stop showing the deleted cue.
	}

	_handleCaptionsVttReplaced(e) {
		const localVttUrl = window.URL.createObjectURL(new Blob([e.detail.vttString], { type: 'text/vtt' }));
		this.dispatchEvent(new CustomEvent('captions-url-changed', {
			detail: { captionsUrl: localVttUrl },
			composed: false
		}));
	}

	_handleChangeCaptionsCueEndTime(event) {
		const originalCue = event.detail.cue;
		const cueDuration = originalCue.endTime - originalCue.startTime;
		const editedCue = new VTTCue(originalCue.startTime, originalCue.endTime, originalCue.text);

		const newEndTime = event.detail.newEndTime ?? this._mediaPlayer.currentTime;
		editedCue.endTime = Math.floor(newEndTime * 1000) / 1000; // WebVTT uses 3-decimal precision.
		if (editedCue.endTime <= editedCue.startTime) {
			editedCue.startTime = Math.max(editedCue.endTime - cueDuration, 0);
		}

		// Make the end time slightly later than the Media Player's current time position.
		// If this is not done, Producer's Media Player will not update to display the cue. (Because the "end time" specifies when to *hide* the cue.)
		// This would be confusing to users, due to the lack of visual feedback.
		if (editedCue.endTime < this._mediaPlayer.duration) {
			editedCue.endTime += 0.001;
		}

		this._mediaPlayer.textTracks[0].addCue(editedCue); // TextTrack.addCue() automatically inserts the cue at the appropriate index based on startTime.
		this._mediaPlayer.textTracks[0].removeCue(originalCue);
		this._syncCaptionsWithMediaPlayer();
	}

	_handleChangeCaptionsCueStartTime(event) {
		const originalCue = event.detail.cue;
		const cueDuration = originalCue.endTime - originalCue.startTime;
		const editedCue = new VTTCue(originalCue.startTime, originalCue.endTime, originalCue.text);

		const newStartTime = event.detail.newStartTime ?? this._mediaPlayer.currentTime;
		editedCue.startTime = Math.floor(newStartTime * 1000) / 1000; // WebVTT uses 3-decimal precision.
		if (editedCue.startTime >= editedCue.endTime) {
			editedCue.endTime = Math.min(editedCue.startTime + cueDuration, this._mediaPlayer.duration);
		}

		this._mediaPlayer.textTracks[0].addCue(editedCue); // TextTrack.addCue() automatically inserts the cue at the appropriate index based on startTime.
		this._mediaPlayer.textTracks[0].removeCue(originalCue);
		this._syncCaptionsWithMediaPlayer();
	}

	_handleChaptersChanged(e) {
		this.metadata = { ...this.metadata, chapters: e.detail.chapters };
		this._fireMetadataChangedEvent();
	}

	_handleCueChange() {
		this._activeCue = this._mediaPlayer.activeCue;
	}

	_handleLoadedData() {
		this.dispatchEvent(new CustomEvent('media-loaded', { composed: false }));
	}

	_handleMediaError() {
		this.dispatchEvent(new CustomEvent('media-error', { composed: false }));
	}

	_handleMediaPlayerTimeJumped(event) {
		this._mediaPlayer.currentTime = event.detail.time;
		this.updateVideoTime();
	}

	_handleMediaPlayerUpdate() {
		this.mediaPlayerDuration = this.mediaPlayer.duration;
		this.mediaPlayerCurrentTime = this.mediaPlayer.currentTime;
		this.mediaPlayerPaused = this.mediaPlayer.paused;
		this.mediaPlayerEnded = this.mediaPlayer.ended;
	}

	_handleSelectedLanguageChanged(e) {
		this.selectedLanguage = e.detail.selectedLanguage;
		this.dispatchEvent(new CustomEvent(
			'selected-language-change',
			{
				composed: false,
				detail: { selectedLanguage: e.detail.selectedLanguage }
			}
		));
	}

	async _handleTrackLoaded() {
		// After loading the track, there might be a slight delay before the Media Player's <track> element loads all of its cues.
		// This happens occasionally for large files.
		let retryCounter = 0;
		if (!this._mediaPlayer?.textTracks?.[0].cues) {
			const waitForMediaPlayerCuesLoaded = resolve => {
				if ((retryCounter === 100) || (this._mediaPlayer?.textTracks?.[0].cues)) {
					resolve();
				} else {
					retryCounter++;
					setTimeout(() => waitForMediaPlayerCuesLoaded(resolve), 100);
				}
			};
			await new Promise(resolve => waitForMediaPlayerCuesLoaded(resolve));
		}

		if (retryCounter < 100) {
			this._fireCaptionsChangedEvent(textTrackCueListToArray(this._mediaPlayer.textTracks[0].cues));
		} else {
			this.dispatchEvent(new CustomEvent('captions-load-error', {
				bubbles: true,
				composed: true,
			}));
		}
	}

	_pauseMediaPlayerHandler() {
		this._mediaPlayer.pause();
	}

	//#region Video time management
	_pauseUpdatingVideoTime() {
		clearInterval(this._timelineElement.updateTimelineInterval);
	}

	_playMediaPlayerHandler() {
		this.mediaPlayer.play();
	}

	//#endregion
	_setChapterToCurrentTime() {
		this._chaptersComponent.setChapterToTime(this._mediaPlayer.currentTime);
	}

	_setChapterToTimeHandler({ detail: {time} }) {
		this._chaptersComponent.setChapterToTime(time);
	}

	_startUpdatingVideoTime() {
		this._timelineElement.startUpdatingVideoTime();
	}

	_syncCaptionsWithMediaPlayer() {
		this._fireCaptionsChangedEvent(textTrackCueListToArray(this._mediaPlayer.textTracks[0].cues));
	}

}
customElements.define('d2l-producer-editor', ProducerEditor);
