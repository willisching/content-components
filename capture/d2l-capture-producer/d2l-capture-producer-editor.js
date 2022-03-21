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
import './src/d2l-video-producer-language-selector.js';
import './src/d2l-video-producer-captions.js';
import './src/d2l-video-producer-chapters.js';
import './d2l-capture-producer-timeline.js';

import { Container, Shape, Stage, Text } from '@createjs/easeljs';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import constants from './src/constants.js';
import { InternalLocalizeMixin } from './src/internal-localize-mixin.js';
import { bodyCompactStyles, labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import { Timeline } from './src/timeline';
import { convertVttCueArrayToVttText, textTrackCueListToArray } from './src/captions-utils.js';

class CaptureProducerEditor extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			captions: { type: Array },
			captionsLoading: { type: Boolean, attribute: 'captions-loading' },
			captionsUrl: { type: String },
			canvasWidth: { type: Number, attribute: 'canvas-width'},
			defaultLanguage: { type: Object },
			enableCutsAndChapters: { type: Boolean },
			format: { type: String },
			languages: { type: Array },
			mediaType: { type: String },
			metadata: { type: Object },
			metadataLoading: { type: Boolean, attribute: 'metadata-loading' },
			selectedLanguage: { type: Object },
			src: { type: String },
			timelineVisible: { type: Boolean, attribute: 'timeline-visible' },

			_activeCue: { type: Object, attribute: false },
			_zoomMultiplier: { type: Number, attribute: false },
			_zoomMultiplierDisplayOpacity: { type: Number, attribute: false },
		};
	}

	static get styles() {
		return [bodyCompactStyles, labelStyles, selectStyles, css`
			.d2l-video-producer-editor {
				display: flex;
				flex-direction: column;
			}

			.d2l-video-producer-video-controls {
				display: flex;
				height: 580px;
				justify-content: space-between;
			}

			.d2l-video-producer-editor d2l-labs-media-player {
				display: flex;
				margin-right: 20px;
				width: 100%;
			}

			.d2l-video-producer-captions-header {
				margin: 10px 0px 10px 0px;
			}

			.d2l-video-producer-timeline {
				display: flex;
				margin-top: 15px;
			}

			.d2l-video-producer-timeline-controls {
				display: inline-flex;
				height: 90px;
				justify-content: center;
				margin-top: 8px;
				position: relative;
				vertical-align: top;
				width: 160px;
				min-width: 160px;
			}

			.d2l-video-producer-timeline-mode-button input[type="radio"] {
				display: none;
			}

			.d2l-video-producer-timeline-mode-button label {
				border-radius: 8px;
				margin: 0 5px 0 5px;
				padding: 12px;
			}

			.d2l-video-producer-timeline-mode-button input[type="radio"]:hover + label {
				background-color: var(--d2l-color-gypsum);
				cursor: pointer;
			}

			.d2l-video-producer-timeline-mode-button input[type="radio"]:checked + label {
				background-color: var(--d2l-color-gypsum);
			}

			#zoom-handle {
				height: ${constants.ZOOM_HANDLE_HEIGHT}px;
				pointer-events: none;
				position: absolute;
				width: ${constants.ZOOM_HANDLE_WIDTH}px;
			}
		`];
	}

	static get content() {
		return this._content;
	}

	constructor() {
		super();

		this._controlMode = constants.CONTROL_MODES.SEEK;
		this._shouldResumePlaying = false;
		this._updateTimelineInterval = null;
		this._mouseTime = null;
		this._mouseDownStageX = null;
		this._stage = null;
		this._timelineCanvas = null;

		this._timeline = null;

		this._zoomMultiplier = 1;
		this._zoomMultiplierDisplayOpacity = 0;
		this._zoomMultiplierDisplayTimestampMilliseconds = null;
		this._zoomMultiplierFadeIntervalId = null;
		this._zoomHandleDragOffsetY = null;

		this._chaptersComponent = null;

		this._draggingMark = false;
		this._currentMark = null;

		this.enableCutsAndChapters = false;

		this._activeCue = null;
		this.captions = [];
		this.captionsUrl = '';
		this.captionsLoading = false;

		this.metadata = { cuts: [], chapters: [] };
		this.metadataLoading = false;
		this.timelineVisible = false;
		this.format = '';
		this.src = '';
		this.languages = [];
		this.defaultLanguage = {};
		this.selectedLanguage = {};
		this._is_IOS = /iPad|iPhone|iPod/.test(navigator.platform);

		this.addEventListener('timeline-first-updated', this.firstUpdatedHelper);
		this.addEventListener('timeline-updated', this.updatedHelper);
		this.addEventListener('change-to-cut-mode', this._changeToCutMode);
		this.addEventListener('change-to-mark-mode', this._changeToMarkMode);
		this.addEventListener('change-to-seek-mode', this._changeToSeekMode);
	}

	render() {
		return html`
			<div class="d2l-video-producer-editor">
				<div class="d2l-video-producer-video-controls">
					<!-- crossorigin needs to be set in order for <track> elements to load sources from different origins. -->
					<d2l-labs-media-player
						controls
						?autoplay="${this._is_IOS}"
						crossorigin="anonymous"
						@cuechange="${this._handleCueChange}"
						@error="${this._handleMediaError}"
						hide-captions-selection
						?hide-seek-bar="${this.enableCutsAndChapters}"
						media-type="${this.mediaType}"
						disable-set-preferences
						@pause="${this._pauseUpdatingVideoTime}"
						@play="${this._startUpdatingVideoTime}"
						@seeking="${this._updateVideoTime}"
						@trackloaded="${this._handleTrackLoaded}"
					>
						<source src="${this.src}" label="${this.format}">
						${this.captionsUrl ? html`<track default-ignore-preferences src="${this.captionsUrl}" srclang="${this._formatCaptionsSrcLang()}" label="${this.selectedLanguage.name}" kind="subtitles">` : ''}
					</d2l-labs-media-player>
					<d2l-tabs>
						${ (this.enableCutsAndChapters ? html`
							<d2l-tab-panel
								selected
								no-padding
								text=${this.localize('tableOfContents')}
							>
								<d2l-video-producer-chapters
									.chapters="${this.metadata && this.metadata.chapters}"
									.defaultLanguage="${this.defaultLanguage}"
									.selectedLanguage="${this.selectedLanguage}"
									?loading="${this.metadataLoading}"
									@add-new-chapter="${this._addNewChapter}"
									@chapters-changed="${this._handleChaptersChanged}"
									@set-chapter-to-current-time="${this._setChapterToCurrentTime}"
								></d2l-video-producer-chapters>
							</d2l-tab-panel>
						` : '')}
						<d2l-tab-panel
							no-padding
							text=${this.localize('closedCaptions')}
						>
							<!-- d2l-tabs hides the tab header if there is only 1 tab panel -->
							${(this.enableCutsAndChapters ? '' : html`
								<div class="d2l-video-producer-captions-header d2l-body-compact">
									${this.localize('closedCaptions')}
								</div>
							`)}
							<d2l-video-producer-captions
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
							></d2l-video-producer-captions>
						</d2l-tab-panel>
					</d2l-tabs>
				</div>
				${(this.enableCutsAndChapters ? html`
					<d2l-capture-producer-timeline
						width=${this.canvasWidth}
						?timelineVisible=${this.timelineVisible}
						_zoomMultiplier=${this._zoomMultiplier}
						.metadata=${this.metadata}
						?enableCutsAndChapters=${this.enableCutsAndChapters}
					></d2l-capture-producer-timeline>
				` : '')}
			</div>
		`;
	}

	get canvasContainerWidth() {
		return this.canvasWidth + constants.CANVAS_BORDER_WIDTH * 2;
	}

	firstUpdatedHelper() {
		super.firstUpdated();

		this._mediaPlayer = this.shadowRoot.querySelector('d2l-labs-media-player');

		// Wait for video to be loaded
		this._mediaPlayer.addEventListener('loadeddata', () => {
			if (this.enableCutsAndChapters && this.metadata) {
				this._resetTimelineWithNewCuts(this.metadata.cuts);
				this._changeToSeekMode();
			}
			this._videoLoaded = true;
			this.dispatchEvent(new CustomEvent('media-loaded', { composed: false }));
		});

		this.style.setProperty(
			'--canvas-container-width',
			this.canvasWidth
				? `${(this.canvasWidth + constants.CANVAS_BORDER_WIDTH * 2)}px`
				: 'unset'
		);
	}

	get mediaPlayer() {
		return this._mediaPlayer || null;
	}

	updatedHelper(e) {
		const changedProperties = e.detail.changedProperties;
		super.updated(changedProperties);
		if (changedProperties.has('enableCutsAndChapters') && this.enableCutsAndChapters) {
			this._chaptersComponent = this.shadowRoot.querySelector('d2l-video-producer-chapters');
			this._chaptersComponent.addEventListener('active-chapter-updated',
				this._handleActiveChapterUpdated.bind(this));
			this._configureStage();
			this._configureModes();
		}
		if (this.enableCutsAndChapters && changedProperties.has('metadata') && this.metadata && this._videoLoaded && this._cutsDifferInMetadataAndTimeline()) {
			this._resetTimelineWithNewCuts(this.metadata.cuts);
		}
	}

	_addCutToStage(cut) {
		const { inPixels, outPixels } = cut.getPixelsAlongTimeline();

		const displayObject = new Shape();
		const stageX = CaptureProducerEditor._getStageXFromPixelsAlongTimeline(inPixels);
		const width = outPixels - inPixels + 1;

		displayObject.setTransform(stageX, constants.TIMELINE_OFFSET_Y);
		displayObject.graphics.beginFill(constants.COLOURS.CUT).drawRect(0, 0, width, this._getTimelineHeight());
		displayObject.alpha = 0.5;

		displayObject.on('click', () => {
			cut.removeFromTimeline();
			this._stage.removeChild(cut.displayObject);
			this._stage.update();

			this._fireMetadataChangedEvent();
		});

		cut.displayObject = displayObject;

		this._stage.addChildAt(displayObject, this._stage.numChildren - this._timeline.getMarksOnTimeline().length - 1);

		this._stage.update();
	}

	_addMarkToStage(mark) {
		const pixelsAlongTimeline = mark.getPixelsAlongTimeline();

		const displayObject = new Shape();
		const stageX = CaptureProducerEditor._getStageXFromPixelsAlongTimeline(pixelsAlongTimeline);

		displayObject.setTransform(stageX + constants.CURSOR_OFFSET_X, constants.CURSOR_OFFSET_Y);
		displayObject.graphics.beginFill(constants.COLOURS.MARK_HIGHLIGHTED).drawRect(0, 0, constants.MARK_WIDTH, this._getMarkHeight());

		displayObject.on('click', () => {
			if (this._draggingMark) return;

			const { cutEndingAtMark, cutStartingAtMark } = mark.removeFromTimeline();

			this._stage.removeChild(mark.displayObject);

			if (cutStartingAtMark) this._stage.removeChild(cutStartingAtMark.displayObject);

			if (cutEndingAtMark) this._updateCutOnStage(cutEndingAtMark);

			if (cutStartingAtMark || cutEndingAtMark) {
				this._fireMetadataChangedEvent();
			}

			this._stage.update();
		});

		displayObject.on('pressup', () => {
			this._draggingMark = false;
		});

		displayObject.on('pressmove', event => {
			const pixelsAlongTimelineToMoveTo = this._getPixelsAlongTimelineFromStageX(event.stageX);

			const returnValue = mark.move(pixelsAlongTimelineToMoveTo);

			if (returnValue) {
				this._updateMarkOnStage(mark);

				const { cutEndingAtMark, cutStartingAtMark } = returnValue;

				if (cutEndingAtMark) this._updateCutOnStage(cutEndingAtMark);

				if (cutStartingAtMark) this._updateCutOnStage(cutStartingAtMark);

				if (cutStartingAtMark || cutEndingAtMark) {
					this._fireMetadataChangedEvent();
				}
			}
			this._draggingMark = true;
		});

		mark.displayObject = displayObject;

		const hitArea = new Shape();
		hitArea.graphics.beginFill(constants.COLOURS.CONTENT_HIT_BOX).drawRect(constants.HITBOX_OFFSET, constants.HITBOX_OFFSET, constants.HITBOX_WIDTH, this._getHitBoxHeight());
		displayObject.hitArea = hitArea;

		this._stage.addChildAt(displayObject, this._stage.numChildren - 1);

		this._clearCurrentMark();

		this._currentMark = mark;

		this._setMarkStyleNormal(this._currentMark);

		this._stage.update();
	}

	//#region Chapter management
	_addNewChapter() {
		this._chaptersComponent.addNewChapter(this._mediaPlayer.currentTime);
	}

	//#region Control mode management
	_changeToCutMode() {
		this._controlMode = constants.CONTROL_MODES.CUT;
		this._mediaPlayer.pause();
		this._updateMouseEnabledForCuts();
		this._updateMouseEnabledForMarks();
		this._contentMarker.mouseEnabled = false;
		this._hideCursor();
	}

	_changeToMarkMode() {
		this._controlMode = constants.CONTROL_MODES.MARK;
		this._mediaPlayer.pause();
		this._updateMouseEnabledForCuts();
		this._updateMouseEnabledForMarks();
		this._contentMarker.mouseEnabled = false;
		this._cutHighlight.visible = false;
		this._stage.update();
	}

	_changeToSeekMode() {
		this._controlMode = constants.CONTROL_MODES.SEEK;
		this._contentMarker.mouseEnabled = true;
		this._updateMouseEnabledForCuts();
		this._updateMouseEnabledForMarks();
		this._cutHighlight.visible = false;
		this._hideCursor();
	}

	static _clampNumBetweenMinAndMax(num, min, max) {
		return Math.max(Math.min(num, max), min);
	}

	_clearCurrentMark() {
		if (this._currentMark) {
			this._setMarkStyleNormal(this._currentMark);
			this._currentMark = null;
		}
	}

	_configureModes() {
		const CurrentControlMode = () => {
			switch (this._controlMode) {
				case constants.CONTROL_MODES.SEEK:
					return this._getSeekModeHandlers();
				case constants.CONTROL_MODES.MARK:
					return this._getMarkModeHandlers();
				case constants.CONTROL_MODES.CUT:
					return this._getCutModeHandlers();
			}
		};

		this._timelineRect.on('pressmove', (event) => { CurrentControlMode().timelinePressMove.bind(this)(event); });
		this._timelineRect.on('pressup', (event) => { CurrentControlMode().timelinePressUp.bind(this)(event); });
		this._timelineRect.on('mousedown', (event) => { CurrentControlMode().timelineMouseDown.bind(this)(event); });
		this._timelineRect.on('click', (event) => { CurrentControlMode().timelineMouseUp.bind(this)(event); });
		this._stage.on('stagemousemove', (event) => { CurrentControlMode().stageMouseMove.bind(this)(event); });
	}

	//#region Timeline management
	_configureStage() {
		this._timelineCanvas = this.shadowRoot.querySelector('d2l-capture-producer-timeline').shadowRoot.querySelector('#timeline-canvas');
		console.log(this._timelineWidth);
		this._timelineCanvas.addEventListener('mousemove', this._onCanvasMouseMove.bind(this));
		this._stage = new Stage(this._timelineCanvas);
		this._stage.enableMouseOver(30);

		this._zoomHandle = new Shape();
		this._zoomHandle.setTransform(this._timelineWidth / 2, constants.ZOOM_HANDLE_OFFSET_Y);
		this._zoomHandle.graphics.beginFill(constants.COLOURS.ZOOM_HANDLE_UNSET).drawRect(0, 0, constants.ZOOM_HANDLE_WIDTH, constants.ZOOM_HANDLE_HEIGHT);
		this._zoomHandle.on('mousedown', this._onZoomHandleMouseDown.bind(this));
		this._zoomHandle.on('pressmove', this._onZoomHandlePressMove.bind(this));
		this._zoomHandle.on('pressup', this._onZoomHandlePressUp.bind(this));
		this._stage.addChild(this._zoomHandle);

		this._timelineRect = new Shape();
		this._timelineRect.setTransform(constants.TIMELINE_OFFSET_X, constants.TIMELINE_OFFSET_Y);
		this._timelineRect.graphics.beginFill(constants.COLOURS.TIMELINE).drawRect(0, 0, this._timelineWidth, this._getTimelineHeight());
		this._stage.addChildAt(this._timelineRect, 0);

		this._playedRect = new Shape();
		this._playedRect.setTransform(constants.TIMELINE_OFFSET_X, constants.TIMELINE_OFFSET_Y);
		this._playedRect.mouseEnabled = false;
		this._stage.addChildAt(this._playedRect, 1);

		const cursorDisplayObj = new Shape();
		cursorDisplayObj.graphics.beginFill(constants.COLOURS.MARK).drawRect(0, 0, constants.MARK_WIDTH, this._getMarkHeight());
		cursorDisplayObj.alpha = 0.7;
		cursorDisplayObj.visible = false;
		cursorDisplayObj.mouseEnabled = false;
		this._stage.addChildAt(cursorDisplayObj, 2);

		this._cursor = {
			time: 0,
			displayObject: cursorDisplayObj
		};

		this._contentMarker = new Shape();
		this._contentMarker.graphics.beginFill(constants.COLOURS.CONTENT).drawRect(0, 0, constants.MARK_WIDTH, this._getMarkHeight());
		this._contentMarker.visible = false;
		this._contentMarker.mouseEnabled = false;

		this._contentMarkerHitBox = new Shape();
		this._contentMarkerHitBox.graphics.beginFill(constants.COLOURS.CONTENT_HIT_BOX).drawRect(constants.HITBOX_OFFSET, constants.HITBOX_OFFSET, constants.HITBOX_WIDTH, this._getHitBoxHeight());
		this._contentMarker.hitArea = this._contentMarkerHitBox;

		this._contentMarker.on('pressmove', (event) => {
			if (this._isMouseOverTimeline(false)) {
				this._moveContentMarker(event);
			} else {
				this._timeContainer.visible = false;
				this._stage.update();
			}
		});
		this._stage.addChildAt(this._contentMarker, 3);

		this._timeContainer = new Container();
		this._timeContainer.x = constants.TIMELINE_OFFSET_X;
		this._timeContainer.y = constants.TIME_CONTAINER_OFFSET_Y;
		this._timeContainer.visible = false;
		this._stage.addChildAt(this._timeContainer, 4);

		const timeTextBorder = new Shape();
		timeTextBorder.graphics.setStrokeStyle(2).beginStroke('#787878').beginFill('white');
		timeTextBorder.graphics.drawRoundRect(0, 0, constants.TIME_TEXT_BORDER_WIDTH, constants.TIME_TEXT_BORDER_HEIGHT, 3);
		this._timeContainer.addChild(timeTextBorder);

		this._timeText = new Text('', '18px Lato', constants.COLOURS.TIME_TEXT);
		this._timeText.lineHeight = 28;
		this._timeText.textBaseLine = 'top';
		this._timeText.x = 10;
		this._timeText.y = 6;
		this._timeContainer.addChild(this._timeText);

		this._cutHighlight = new Shape();
		this._cutHighlight.alpha = 0.3;
		this._cutHighlight.visible = false;
		this._cutHighlight.mouseEnabled = false;
		this._stage.addChildAt(this._cutHighlight, 4);

		this._stage.setChildIndex(this._zoomHandle, this._stage.numChildren - 1);

		this._stage.update();
	}

	_cutsDifferInMetadataAndTimeline() {
		const timelineCutsString = JSON.stringify(this._timeline.getCuts().map(x => ({ in: x.in, out: x.out })));
		const metadataCutsString = JSON.stringify(this.metadata.cuts.map(x => ({ in: x.in, out: x.out })));
		return timelineCutsString !== metadataCutsString;
	}

	_displayZoomMultiplier() {
		clearInterval(this._zoomMultiplierFadeIntervalId);

		this._zoomMultiplierDisplayTimestamp = Date.now();
		this._zoomMultiplierDisplayOpacity = 1;

		this._zoomMultiplierFadeIntervalId = setInterval(() => {
			const millisecondsSinceDisplay = Date.now() - this._zoomMultiplierDisplayTimestamp;

			if (millisecondsSinceDisplay <= constants.ZOOM_MULTIPLIER_DISPLAY.TIME_BEFORE_FADE) return;
			else if (millisecondsSinceDisplay >= constants.ZOOM_MULTIPLIER_DISPLAY.TOTAL_TIME) {
				this._zoomMultiplierDisplayOpacity = 0;

				clearInterval(this._zoomMultiplierFadeIntervalId);
				this._zoomMultiplierFadeIntervalId = null;
				return;
			} else {
				const millisecondsSinceStartedFading = millisecondsSinceDisplay - constants.ZOOM_MULTIPLIER_DISPLAY.TIME_BEFORE_FADE;
				this._zoomMultiplierDisplayOpacity = 1 - millisecondsSinceStartedFading / constants.ZOOM_MULTIPLIER_DISPLAY.FADE_TIME;
			}
		}, constants.ZOOM_MULTIPLIER_DISPLAY.FADE_INTERVAL);
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

	_fireMetadataChangedEvent({ cuts = this._timeline.getCuts(), chapters = this.metadata.chapters } = {}) {
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

	_getCutModeHandlers() {
		const highlightCut = (event) => {
			const pixelsAlongTimeline = this._getPixelsAlongTimelineFromStageX(event.stageX);

			const { leftBoundPixels, rightBoundPixels } = this._timeline.getPixelBoundsAtPoint(pixelsAlongTimeline);

			const lowerStageXBound = CaptureProducerEditor._getStageXFromPixelsAlongTimeline(leftBoundPixels);
			const upperStageXBound = CaptureProducerEditor._getStageXFromPixelsAlongTimeline(rightBoundPixels);

			this._cutHighlight.setTransform(lowerStageXBound, constants.TIMELINE_OFFSET_Y);
			this._cutHighlight.graphics.clear().beginFill(constants.COLOURS.CUT_HIGHLIGHTED).drawRect(0, 0, upperStageXBound - lowerStageXBound, this._getTimelineHeight());
			this._cutHighlight.visible = true;
			this._stage.update();
		};

		const hideCut = () => {
			this._cutHighlight.visible = false;
			this._stage.update();
		};

		return {
			timelineMouseDown: () => {},
			timelineMouseUp: (event) => {
				const pixelsAlongTimeline = this._getPixelsAlongTimelineFromStageX(event.stageX);

				const cut = this._timeline.addCutAtPoint(pixelsAlongTimeline);

				if (cut) {
					this._addCutToStage(cut);
					this._fireMetadataChangedEvent();
				}
			},
			timelinePressMove: () => {},
			timelinePressUp: () => {},
			stageMouseMove: (event) => {
				if (this._isMouseOverTimeline(false)) {
					highlightCut(event);
				} else {
					hideCut();
					this._timeContainer.visible = false;
				}
			}
		};
	}

	_getHitBoxHeight() {
		return constants.HITBOX_HEIGHT_MIN + this._getZoomHandleValue();
	}

	_getMarkHeight() {
		return constants.MARK_HEIGHT_MIN + this._getZoomHandleValue();
	}

	_getMarkModeHandlers() {
		return {
			timelineMouseDown: event => {
				if (this._currentMark) {
					this._mouseDownStageX = event.stageX;
				}
			},
			timelineMouseUp: event => {
				this._clearCurrentMark();

				const pixelsAlongTimeline = this._getPixelsAlongTimelineFromStageX(event.stageX);

				const returnValue = this._timeline.addMarkAtPoint(pixelsAlongTimeline);

				if (!returnValue) {
					this._currentMark = null;
					return;
				}

				const { mark, cut } = returnValue;

				this._addMarkToStage(mark);

				if (cut) {
					this._updateCutOnStage(cut);
					this._fireMetadataChangedEvent();
				}
			},
			timelinePressMove: () => {},
			timelinePressUp: () => {
				// If mark was just removed (=== null), a cut may have changed
				if ((this._draggingMark || this._currentMark === null) && this._cutTimeChanged) {
					this._fireMetadataChangedEvent();
				}
				this._cutTimeChanged = false;
				this._draggingMark = false;
			},
			stageMouseMove: () => {
				if (this._isMouseOverTimeline(false)) {
					this._setCursorOrCurrentMark(this._stage.mouseX);
				} else {
					this._hideCursor();
					this._draggingMark = false;
				}
			}
		};
	}

	_getMarkUnderMouse() {
		const pixelsAlongTimeline = this._getPixelsAlongTimelineFromStageX(this._stage.mouseX);

		let minDiff = null;
		let closestMark = null;

		for (const mark of this._timeline.getMarksOnTimeline()) {
			const pixelsAlongTimelineOfMark = mark.getPixelsAlongTimeline();

			const diff = Math.abs(pixelsAlongTimeline - pixelsAlongTimelineOfMark);

			if (diff > constants.HITBOX_WIDTH / 2) continue;

			if (minDiff === null) minDiff = diff;

			if (diff <= minDiff) {
				minDiff = diff;
				closestMark = mark;
			}
		}

		return closestMark;
	}

	_getPixelsAlongTimelineFromStageX(stageX) {
		return CaptureProducerEditor._clampNumBetweenMinAndMax(stageX - constants.TIMELINE_OFFSET_X, 0, this._timelineWidth);
	}

	_getRoundedPosition(stageXPosition) {
		const time = this._getTimeFromStageX(stageXPosition);
		const roundedTime = this._getRoundedTime(time);
		return this._getStageXFromTime(roundedTime);
	}

	_getRoundedTime(time) {
		return Math.min(Math.round(time), Math.floor(this._mediaPlayer.duration));
	}

	_getSeekModeHandlers() {
		const me = this;
		const seek = event => {
			if (this._mediaPlayer.duration > 0) {
				const { lowerTimeBound, upperTimeBound } = this._timeline.getTimeBoundsOfTimeline();
				const progress = event.localX / me._timelineWidth;

				this._mouseTime = (upperTimeBound - lowerTimeBound) * progress + lowerTimeBound;
				this._mediaPlayer.currentTime = this._mouseTime;
				this._updateVideoTime();
			}
		};

		const seekMode = {
			timelineMouseUp: () => {},
			timelinePressMove: seek,
			timelinePressUp: () => {
				this._stage.mouseMoveOutside = false;

				if (this._shouldResumePlaying) {
					if (this._mediaPlayer.currentTime < this._mediaPlayer.duration) {
						this._mediaPlayer.play();
					}

					this._shouldResumePlaying = false;
				}
			},
			stageMouseMove: () => {
				if (this._isMouseOverContentMarker() && this._activeChapterTime) {
					this._showAndMoveTimeContainer(this._activeChapterTime);
				} else {
					this._timeContainer.visible = false;
					this._stage.update();
				}
			}
		};
		seekMode.timelineMouseDown = event => {
			this._stage.mouseMoveOutside = true;

			this._shouldResumePlaying = !this._mediaPlayer.paused && !this._mediaPlayer.ended;
			this._mediaPlayer.pause();

			seekMode.timelinePressMove(event);
		};

		return seekMode;
	}

	static _getStageXFromPixelsAlongTimeline(pixelsAlongTimeline) {
		return pixelsAlongTimeline === null
			? null
			: pixelsAlongTimeline + constants.TIMELINE_OFFSET_X;
	}

	_getStageXFromTime(time) {
		const pixelsAlongTimeline = this._timeline.getPixelsAlongTimelineFromTime(time);

		return CaptureProducerEditor._getStageXFromPixelsAlongTimeline(pixelsAlongTimeline);
	}

	_getTimeFromStageX(stageX) {
		const clampedTimelineStageX = CaptureProducerEditor._clampNumBetweenMinAndMax(stageX, constants.TIMELINE_OFFSET_X, constants.TIMELINE_OFFSET_X + this._timelineWidth);

		const pixelsAlongTimeline = this._getPixelsAlongTimelineFromStageX(clampedTimelineStageX);

		return this._timeline.getTimeFromPixelsAlongTimeline(pixelsAlongTimeline);
	}

	_getTimelineHeight() {
		return constants.TIMELINE_HEIGHT_MIN + this._getZoomHandleValue();
	}

	_getZoomHandleValue() {
		return this._zoomHandle.y - constants.ZOOM_HANDLE_OFFSET_Y;
	}

	_getZoomMultiplierDisplay() {
		if (this._zoomMultiplier <= 10) return `${Math.round(this._zoomMultiplier * 100)}%`;

		return `${Math.round(this._zoomMultiplier)}x`;
	}

	_handleActiveChapterUpdated({ detail: { chapterTime } }) {
		if (chapterTime !== null) {
			this._activeChapterTime = chapterTime;
			this._contentMarker.visible = true;
			this._contentMarker.mouseEnabled = true;
			const stageX = this._getStageXFromTime(chapterTime);

			if (stageX === null) {
				this._contentMarker.visible = false;
				this._contentMarker.mouseEnabled = false;
				this._timeContainer.visible = false;
			} else {
				this._contentMarker.setTransform(stageX + constants.CURSOR_OFFSET_X, constants.CURSOR_OFFSET_Y);
			}
		} else {
			this._contentMarker.visible = false;
			this._contentMarker.mouseEnabled = false;
			this._timeContainer.visible = false;
		}
		this._stage.update();
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

	_handleMediaError() {
		this.dispatchEvent(new CustomEvent('media-error', { composed: false }));
	}

	_handleMediaPlayerTimeJumped(event) {
		this._mediaPlayer.currentTime = event.detail.time;
		this._updateVideoTime();
	}

	_handleSelectedLanguageChanged(e) {
		this.selectedLanguage = e.detail.selectedLanguage;
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

	_hideCursor() {
		this._cursor.displayObject.visible = false;
		this._timeContainer.visible = false;
		this._stage.update();
	}

	_isMouseOverContentMarker() {
		const underMouse = this._stage.getObjectsUnderPoint(this._stage.mouseX, this._stage.mouseY, 1)[0];
		return this._contentMarker === underMouse;
	}

	_isMouseOverTimeline(directlyOver) {
		const objects = this._stage.getObjectsUnderPoint(this._stage.mouseX, this._stage.mouseY, 1);

		if (directlyOver) {
			return objects[0] === this._timelineRect;
		} else {
			return objects.includes(this._timelineRect);
		}
	}

	_moveContentMarker(event) {
		if (this._controlMode === constants.CONTROL_MODES.SEEK) {
			this._chaptersComponent.setChapterToTime(this._getTimeFromStageX(event.stageX));
			this._showAndMoveTimeContainer(this._activeChapterTime);
		}
	}

	_onCanvasMouseMove(event) {
		if (this._zoomHandleDragOffsetY !== null) return;

		const rect = this._timelineCanvas.getBoundingClientRect();

		const x = CaptureProducerEditor._clampNumBetweenMinAndMax(event.clientX - rect.left - constants.TIMELINE_OFFSET_X, 0, this._timelineWidth);

		this._zoomHandle.x = x;

		this._stage.update();
	}

	_onZoomHandleMouseDown(event) {
		this._zoomHandleDragOffsetY = event.stageY - this._zoomHandle.y;
	}

	_onZoomHandlePressMove(event) {
		const newZoomHandleY = CaptureProducerEditor._clampNumBetweenMinAndMax(event.stageY - this._zoomHandleDragOffsetY, constants.ZOOM_HANDLE_OFFSET_Y, constants.ZOOM_HANDLE_OFFSET_Y + constants.ZOOM_HANDLE_MAX_DEPTH);

		if (this._zoomHandle.y === constants.ZOOM_HANDLE_OFFSET_Y) this._timeline.pixelsAlongTimelineToZoomAround = this._getPixelsAlongTimelineFromStageX(event.stageX);

		this._zoomHandle.y = newZoomHandleY;

		this._updateZoomMultiplierFromZoomHandle();

		this._recalculateDisplayObjectsAfterZoomChange();

		this._displayZoomMultiplier();
	}

	_onZoomHandlePressUp() {
		this._zoomHandleDragOffsetY = null;
	}

	//#region Video time management
	_pauseUpdatingVideoTime() {
		clearInterval(this._updateTimelineInterval);
	}

	_recalculateDisplayObjectsAfterZoomChange() {
		for (const mark of this._timeline.getMarks()) this._stage.removeChild(mark.displayObject);

		for (const cut of this._timeline.getCuts()) this._stage.removeChild(cut.displayObject);

		for (const mark of this._timeline.getMarksOnTimeline()) this._addMarkToStage(mark);

		this._updateMouseEnabledForMarks();

		for (const cut of this._timeline.getCutsOnTimeline()) this._addCutToStage(cut);

		this._updateMouseEnabledForCuts();

		this._contentMarker.graphics.clear().beginFill(constants.COLOURS.CONTENT).drawRect(0, 0, constants.MARK_WIDTH, this._getMarkHeight());
		this._contentMarkerHitBox.graphics.clear().beginFill(constants.COLOURS.CONTENT_HIT_BOX).drawRect(constants.HITBOX_OFFSET, constants.HITBOX_OFFSET, constants.HITBOX_WIDTH, this._getHitBoxHeight());

		if (this._chaptersComponent.activeChapter !== null) {
			const time = this._chaptersComponent.activeChapter.time;
			const pixelsAlongTimeline = this._timeline.getPixelsAlongTimelineFromTime(time);

			if (pixelsAlongTimeline !== null) {
				const stageX = CaptureProducerEditor._getStageXFromPixelsAlongTimeline(pixelsAlongTimeline);

				this._contentMarker.visible = true;
				this._contentMarker.setTransform(stageX + constants.CURSOR_OFFSET_X, constants.CURSOR_OFFSET_Y);
			} else this._contentMarker.visible = false;
		}

		this._cursor.displayObject.graphics.clear().beginFill(constants.COLOURS.MARK).drawRect(0, 0, constants.MARK_WIDTH, this._getMarkHeight());

		this._timelineRect.graphics.clear().beginFill(constants.COLOURS.TIMELINE).drawRect(0, 0, this._timelineWidth, this._getTimelineHeight());

		const newZoomHandleColour = this._getZoomHandleValue() === 0 ? constants.COLOURS.ZOOM_HANDLE_UNSET : constants.COLOURS.ZOOM_HANDLE_SET;
		this._zoomHandle.graphics.clear().beginFill(newZoomHandleColour).drawRect(0, 0, constants.ZOOM_HANDLE_WIDTH, constants.ZOOM_HANDLE_HEIGHT);

		this._updateVideoTime();
	}

	_resetTimelineWithNewCuts(cuts) {
		this._currentMark = null;

		if (this._timeline) {
			for (const cut of this._timeline.getCuts()) this._stage.removeChild(cut.displayObject);

			for (const mark of this._timeline.getMarks()) this._stage.removeChild(mark.displayObject);
		}

		this._timeline = new Timeline({
			durationSeconds: this._mediaPlayer.duration,
			widthPixels: this._timelineWidth,
			cuts,
			zoomMultiplier: this._zoomMultiplier,
			pixelsAlongTimelineToZoomAround: this._timeline?.pixelsAlongTimelineToZoomAround
		});

		for (const mark of this._timeline.getMarksOnTimeline()) this._addMarkToStage(mark);

		this._updateMouseEnabledForMarks();

		for (const cut of this._timeline.getCutsOnTimeline()) this._addCutToStage(cut);

		this._updateMouseEnabledForCuts();
	}

	//#endregion
	_setChapterToCurrentTime() {
		this._chaptersComponent.setChapterToTime(this._mediaPlayer.currentTime);
	}

	_setCursorOrCurrentMark(stageXPosition) {
		if (this._zoomHandleDragOffsetY !== null) return;

		const roundedTime = this._getRoundedTime(this._getTimeFromStageX(stageXPosition));

		// Always start with no mark selected/no cursor shown
		this._cursor.displayObject.visible = false;
		this._timeContainer.visible = false;

		this._clearCurrentMark();

		const setMarkStyleHighlighted = (mark) => {
			mark.graphics.clear().beginFill(constants.COLOURS.MARK_HIGHLIGHTED).drawRect(0, 0, constants.MARK_WIDTH, this._getMarkHeight());
		};

		// Check for mousing over a mark first. This takes precidence over the timeline.
		const markUnderMouse = this._getMarkUnderMouse();
		if (markUnderMouse) {
			this._currentMark = markUnderMouse;
			setMarkStyleHighlighted(markUnderMouse.displayObject);
			this._showAndMoveTimeContainer(markUnderMouse.seconds);
		} else if (this._isMouseOverTimeline(false)
			&& (roundedTime >= 0 && roundedTime < this._mediaPlayer.duration)) {
			this._cursor.time = roundedTime;
			this._cursor.displayObject.visible = true;
			this._cursor.displayObject.setTransform(this._getRoundedPosition(stageXPosition) + constants.CURSOR_OFFSET_X, constants.CURSOR_OFFSET_Y);
			this._showAndMoveTimeContainer(this._cursor.time);
		}

		this._stage.update();
	}

	_setMarkStyleNormal(mark) {
		mark.displayObject.graphics.clear().beginFill(constants.COLOURS.MARK).drawRect(0, 0, constants.MARK_WIDTH, this._getMarkHeight());
	}

	_showAndMoveTimeContainer(time) {
		if (time) {
			this._timeText.text = new Date(time * 1000).toISOString().substr(11, 8);
			this._timeContainer.visible = true;

			const stageX = this._getStageXFromTime(time);
			this._timeContainer.x = Math.min(
				Math.max(stageX + constants.TIME_CONTAINER_OFFSET_X, constants.TIMELINE_OFFSET_X),
				constants.TIMELINE_OFFSET_X + this._timelineWidth - constants.TIME_TEXT_BORDER_WIDTH
			);
			this._timeContainer.y = constants.TIME_CONTAINER_OFFSET_Y + this._getZoomHandleValue();
			this._stage.update();
		}
	}

	_startUpdatingVideoTime() {
		if (!this._timeline) return;

		// Restart video if paused at end cut.
		Object.values(this._timeline.getCuts()).reverse().forEach(cut => {
			if ((!cut.out || (cut.out >= this._mediaPlayer.duration)) && this._mediaPlayer.currentTime === cut.in) {
				this._mediaPlayer.currentTime = 0;
			}

			// Only interested in the last cut, break the loop.
			return false;
		});

		this._updateTimelineInterval = setInterval(() => {
			// Skip cuts
			const cut = this._timeline.getCutOverTime(this._mediaPlayer.currentTime);
			if (cut) {
				if (!cut.out || (cut.out >= this._mediaPlayer.duration)) {
					this._mediaPlayer.currentTime = cut.in;
					this._mediaPlayer.pause();
				} else {
					this._mediaPlayer.currentTime = cut.out;
				}
			}

			this._updateVideoTime();
		}, 50);
	}

	_syncCaptionsWithMediaPlayer() {
		this._fireCaptionsChangedEvent(textTrackCueListToArray(this._mediaPlayer.textTracks[0].cues));
	}

	get _timelineWidth() {
		return this.canvasWidth - constants.TIMELINE_OFFSET_X * 2;
	}

	_updateCutOnStage(cut) {
		const { inPixels, outPixels } = cut.getPixelsAlongTimeline();
		const width = outPixels - inPixels + 1;
		const stageX = CaptureProducerEditor._getStageXFromPixelsAlongTimeline(inPixels);

		cut.displayObject.setTransform(stageX, constants.TIMELINE_OFFSET_Y);
		cut.displayObject.graphics.clear().beginFill(constants.COLOURS.CUT).drawRect(0, 0, width, this._getTimelineHeight());

		this._stage.update();
	}

	_updateMarkOnStage(mark) {
		const pixelsAlongTimeline = mark.getPixelsAlongTimeline();

		const stageX = CaptureProducerEditor._getStageXFromPixelsAlongTimeline(pixelsAlongTimeline);

		mark.displayObject.setTransform(stageX + constants.CURSOR_OFFSET_X, constants.CURSOR_OFFSET_Y);

		this._stage.update();
	}

	_updateMouseEnabledForCuts() {
		this._timeline.getCutsOnTimeline().forEach(cut => cut.displayObject.mouseEnabled = (this._controlMode === constants.CONTROL_MODES.CUT));
	}

	_updateMouseEnabledForMarks() {
		this._timeline.getMarksOnTimeline().forEach(mark => mark.displayObject.mouseEnabled = this._controlMode === constants.CONTROL_MODES.MARK);
	}

	_updateVideoTime() {
		// If the timeline is disabled for the current file format, do nothing.
		if (!this.enableCutsAndChapters) {
			return;
		}

		// Clear the seeked time once the video has caught up
		if (this._mouseTime && Math.abs(this._mouseTime - this._mediaPlayer.currentTime) < 1) {
			this._mouseTime = null;
		}

		const { lowerTimeBound, upperTimeBound } = this._timeline.getTimeBoundsOfTimeline();

		const time = this._mouseTime || this._mediaPlayer.currentTime;

		let width;

		if (time < lowerTimeBound) width = 0;
		else if (time > upperTimeBound) width = this._timelineWidth;
		else {
			const progress = (time - lowerTimeBound) / (upperTimeBound - lowerTimeBound);

			width = this._timelineWidth * progress;
		}

		this._playedRect.graphics.clear().beginFill(constants.COLOURS.TIMELINE_PLAYED).drawRect(0, 0, width, this._getTimelineHeight());
		this._stage.update();
	}

	_updateZoomMultiplierFromZoomHandle() {
		if (!this._mediaPlayer) return 1;

		const zoomHandleValue = this._getZoomHandleValue();

		// See US130745 for details on this calculation
		this._zoomMultiplier = Math.max(Math.pow(Math.pow((2 * this._mediaPlayer.duration * constants.MARK_WIDTH / this._timelineWidth), 1 / constants.ZOOM_HANDLE_MAX_DEPTH), zoomHandleValue), 1);

		this._timeline.zoomMultiplier = this._zoomMultiplier;
	}
}
customElements.define('d2l-capture-producer-editor', CaptureProducerEditor);
