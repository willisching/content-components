import { Container, Shape, Stage, Text } from '@createjs/easeljs';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { bodyCompactStyles, labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import { InternalLocalizeMixin } from './src/internal-localize-mixin.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import constants from './src/constants.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { Timeline } from './src/timeline';

class CaptureProducerTimeline extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			enableCutsAndChapters: { type: Boolean },
			mediaPlayer: { type: Object },
			metadata: { type: Object },
			timelineVisible: { type: Boolean },
			width: { type: Number },
			videoLoaded: { type: Boolean },

			_zoomMultiplier: { type: Number, attribute: false },
			_zoomMultiplierDisplayOpacity: { type: Number, attribute: false },
		};
	}

	static get styles() {
		return [bodyCompactStyles, labelStyles, selectStyles, css`
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

			#timeline-canvas {
				border: ${constants.CANVAS_BORDER_WIDTH}px solid #787878;
			}

			#zoom-multiplier {
				pointer-events: none;
				position: absolute;
				text-align: center;
				top: ${constants.CANVAS_CONTAINER_HEIGHT / 2}px;
				width: 100%;
			}

			#canvas-container {
				height: ${constants.CANVAS_CONTAINER_HEIGHT}px;
				position: relative;
				width: var(--canvas-container-width);
			}
		`];
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
		this._zoomMultiplierFadeIntervalId = null;
		this._zoomHandleDragOffsetY = null;

		this._draggingMark = false;
		this._currentMark = null;
	}

	firstUpdated() {
		super.firstUpdated();

		this.dispatchEvent(new CustomEvent(
			'timeline-first-updated',
			{
				composed: false,
			}
		));

		this.style.setProperty(
			'--canvas-container-width',
			this.width
				? `${this.canvasContainerWidth}px`
				: 'unset'
		);
	}

	render() {
		const zoomMultiplierStyleMap = {
			opacity: this._zoomMultiplierDisplayOpacity
		};

		return html`
			<div class="d2l-video-producer-timeline" style="visibility: ${this.timelineVisible ? 'visible' : 'hidden'};">
				<div id="canvas-container">
					<canvas height="${constants.CANVAS_HEIGHT}px" width="${this.width}px" id="timeline-canvas"></canvas>
					<div id="zoom-multiplier" style=${styleMap(zoomMultiplierStyleMap)}>
						${this._getZoomMultiplierDisplay()}
					</div>
				</div>
				<div class="d2l-video-producer-timeline-controls">
					<div class="d2l-video-producer-timeline-mode-button">
						<input
							type="radio"
							name="d2l-video-producer-timeline-mode"
							id="d2l-video-producer-seek-button"
							?checked="${this._controlMode === constants.CONTROL_MODES.SEEK}"
							/>
						<label for="d2l-video-producer-seek-button" @click="${this._changeToSeekMode}" id="d2l-video-producer-seek-button-label">
							<d2l-icon id="d2l-video-producer-seek-button-icon" icon="tier1:arrow-thin-up"></d2l-icon>
							<d2l-tooltip for="d2l-video-producer-seek-button-label" delay="500">${this.localize(constants.CONTROL_MODES.SEEK)}</d2l-tooltip>
						</label>
					</div>
					<div class="d2l-video-producer-timeline-mode-button">
						<input
							type="radio"
							name="d2l-video-producer-timeline-mode"
							id="d2l-video-producer-mark-button"
							?checked="${this._controlMode === constants.CONTROL_MODES.MARK}"
							/>
						<label for="d2l-video-producer-mark-button" @click="${this._changeToMarkMode}" id="d2l-video-producer-mark-button-label">
							<d2l-icon id="d2l-video-producer-mark-button-icon" icon="tier1:divider-solid"></d2l-icon>
							<d2l-tooltip for="d2l-video-producer-mark-button-label" delay="500">${this.localize(constants.CONTROL_MODES.MARK)}</d2l-tooltip>
						</label>
					</div>
					<div class="d2l-video-producer-timeline-mode-button">
						<input
							type="radio"
							name="d2l-video-producer-timeline-mode"
							id="d2l-video-producer-cut-button"
							?checked="${this._controlMode === constants.CONTROL_MODES.CUT}"
							/>
						<label for="d2l-video-producer-cut-button" @click="${this._changeToCutMode}" id="d2l-video-producer-cut-button-label">
							<d2l-icon id="d2l-video-producer-cut-button-icon" icon="html-editor:cut"></d2l-icon>
							<d2l-tooltip for="d2l-video-producer-cut-button-label" delay="500">${this.localize(constants.CONTROL_MODES.CUT)}</d2l-tooltip>
						</label>
					</div>
				</div>
			</div>`;
	}

	updated(changedProperties) {
		super.updated(changedProperties);

		if (changedProperties.has('enableCutsAndChapters') && this.enableCutsAndChapters) {
			this._configureStage();
			this._configureModes();
		}

		if (this.enableCutsAndChapters && changedProperties.has('metadata') && this.metadata && this.videoLoaded && this._cutsDifferInMetadataAndTimeline()) {
			this._resetTimelineWithNewCuts(this.metadata.cuts);
		}

		this.dispatchEvent(new CustomEvent(
			'timeline-updated',
			{
				composed: true,
				detail: {
					changedProperties,
				}
			}
		));
	}

	get canvasContainerWidth() {
		return this.width + constants.CANVAS_BORDER_WIDTH * 2;
	}

	_addCutToStage(cut) {
		const { inPixels, outPixels } = cut.getPixelsAlongTimeline();

		const displayObject = new Shape();
		const stageX = this._getStageXFromPixelsAlongTimeline(inPixels);
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
		const stageX = this._getStageXFromPixelsAlongTimeline(pixelsAlongTimeline);

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
	_changeToCutMode() {
		this._controlMode = constants.CONTROL_MODES.CUT;
		this._updateMouseEnabledForCuts();
		this._updateMouseEnabledForMarks();
		this._contentMarker.mouseEnabled = false;
		this._hideCursor();
		this.dispatchEvent(new CustomEvent(
			'pause-media-player',
			{
				composed: false,
			}
		));
	}

	_changeToMarkMode() {
		this._controlMode = constants.CONTROL_MODES.MARK;
		this._updateMouseEnabledForCuts();
		this._updateMouseEnabledForMarks();
		this._contentMarker.mouseEnabled = false;
		this._cutHighlight.visible = false;
		this._stage.update();
		this.dispatchEvent(new CustomEvent(
			'pause-media-player',
			{
				composed: false,
			}
		));
	}

	_changeToSeekMode() {
		this._controlMode = constants.CONTROL_MODES.SEEK;
		this._contentMarker.mouseEnabled = true;
		this._updateMouseEnabledForCuts();
		this._updateMouseEnabledForMarks();
		this._cutHighlight.visible = false;
		this._hideCursor();
		this.dispatchEvent(new CustomEvent(
			'change-to-seek-mode',
			{
				composed: true,
			}
		));
	}

	_clampNumBetweenMinAndMax(num, min, max) {
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

	_configureStage() {
		this._timelineCanvas = this.shadowRoot.querySelector('#timeline-canvas');
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

	_fireMetadataChangedEvent({ cuts = this._timeline.getCuts(), chapters = this.metadata.chapters } = {}) {
		// Remove object references to prevent 'cyclic object value' errors when saving metadata.
		// eslint-disable-next-line no-unused-vars
		cuts = cuts.map(({timeline, displayObject, ...cut}) => cut);
		this.dispatchEvent(new CustomEvent(
			'metadata-changed',
			{
				composed: true,
				detail: { cuts, chapters }
			}
		));
	}

	_getCutModeHandlers() {
		const highlightCut = (event) => {
			const pixelsAlongTimeline = this._getPixelsAlongTimelineFromStageX(event.stageX);

			const { leftBoundPixels, rightBoundPixels } = this._timeline.getPixelBoundsAtPoint(pixelsAlongTimeline);

			const lowerStageXBound = this._getStageXFromPixelsAlongTimeline(leftBoundPixels);
			const upperStageXBound = this._getStageXFromPixelsAlongTimeline(rightBoundPixels);

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
		return this._clampNumBetweenMinAndMax(stageX - constants.TIMELINE_OFFSET_X, 0, this._timelineWidth);
	}

	_getRoundedPosition(stageXPosition) {
		const time = this._getTimeFromStageX(stageXPosition);
		const roundedTime = this._getRoundedTime(time);
		return this._getStageXFromTime(roundedTime);
	}

	_getRoundedTime(time) {
		return Math.min(Math.round(time), Math.floor(this.mediaPlayer.duration));
	}

	_getSeekModeHandlers() {
		const me = this;
		const seek = event => {
			if (this.mediaPlayer.duration > 0) {
				const { lowerTimeBound, upperTimeBound } = this._timeline.getTimeBoundsOfTimeline();
				const progress = event.localX / me._timelineWidth;

				this._mouseTime = (upperTimeBound - lowerTimeBound) * progress + lowerTimeBound;
				this.mediaPlayer.currentTime = this._mouseTime;
				this._updateVideoTime();
			}
		};

		const seekMode = {
			timelineMouseUp: () => {},
			timelinePressMove: seek,
			timelinePressUp: () => {
				this._stage.mouseMoveOutside = false;

				if (this._shouldResumePlaying) {
					if (this.mediaPlayer.currentTime < this.mediaPlayer.duration) {
						this.mediaPlayer.play();
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

			this._shouldResumePlaying = !this.mediaPlayer.paused && !this.mediaPlayer.ended;
			this.mediaPlayer.pause();

			seekMode.timelinePressMove(event);
		};

		return seekMode;
	}

	_getStageXFromPixelsAlongTimeline(pixelsAlongTimeline) {
		return pixelsAlongTimeline === null
			? null
			: pixelsAlongTimeline + constants.TIMELINE_OFFSET_X;
	}

	_getStageXFromTime(time) {
		const pixelsAlongTimeline = this._timeline.getPixelsAlongTimelineFromTime(time);

		return this._getStageXFromPixelsAlongTimeline(pixelsAlongTimeline);
	}

	_getTimeFromStageX(stageX) {
		const clampedTimelineStageX = this._clampNumBetweenMinAndMax(stageX, constants.TIMELINE_OFFSET_X, constants.TIMELINE_OFFSET_X + this._timelineWidth);

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
			this._setChapterTimeEvent(this._getTimeFromStageX(event.stageX));
			this._showAndMoveTimeContainer(this._activeChapterTime);
		}
	}

	_setChapterTimeEvent(time) {
		this.dispatchEvent(new CustomEvent(
			'update-chapter-time',
			{
				composed: false,
				detail: {
					time
				}
			}
		));
	}

	_onCanvasMouseMove(event) {
		if (this._zoomHandleDragOffsetY !== null) return;

		const rect = this._timelineCanvas.getBoundingClientRect();

		const x = this._clampNumBetweenMinAndMax(event.clientX - rect.left - constants.TIMELINE_OFFSET_X, 0, this._timelineWidth);

		this._zoomHandle.x = x;

		this._stage.update();
	}
	_onZoomHandleMouseDown(event) {
		this._zoomHandleDragOffsetY = event.stageY - this._zoomHandle.y;
	}

	_onZoomHandlePressMove(event) {
		const newZoomHandleY = this._clampNumBetweenMinAndMax(event.stageY - this._zoomHandleDragOffsetY, constants.ZOOM_HANDLE_OFFSET_Y, constants.ZOOM_HANDLE_OFFSET_Y + constants.ZOOM_HANDLE_MAX_DEPTH);

		if (this._zoomHandle.y === constants.ZOOM_HANDLE_OFFSET_Y) this._timeline.pixelsAlongTimelineToZoomAround = this._getPixelsAlongTimelineFromStageX(event.stageX);

		this._zoomHandle.y = newZoomHandleY;

		this._updateZoomMultiplierFromZoomHandle();

		this._recalculateDisplayObjectsAfterZoomChange();

		this._displayZoomMultiplier();
	}

	_onZoomHandlePressUp() {
		this._zoomHandleDragOffsetY = null;
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

		if (this._activeChapterTime !== null) {
			const time = this._activeChapterTime;
			const pixelsAlongTimeline = this._timeline.getPixelsAlongTimelineFromTime(time);

			if (pixelsAlongTimeline !== null) {
				const stageX = this._getStageXFromPixelsAlongTimeline(pixelsAlongTimeline);

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
			durationSeconds: this.mediaPlayer.duration,
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
			&& (roundedTime >= 0 && roundedTime < this.mediaPlayer.duration)) {
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
			if ((!cut.out || (cut.out >= this.mediaPlayer.duration)) && this.mediaPlayer.currentTime === cut.in) {
				this.mediaPlayer.currentTime = 0;
			}

			// Only interested in the last cut, break the loop.
			return false;
		});

		this._updateTimelineInterval = setInterval(() => {
			// Skip cuts
			const cut = this._timeline.getCutOverTime(this.mediaPlayer.currentTime);
			if (cut) {
				if (!cut.out || (cut.out >= this.mediaPlayer.duration)) {
					this.mediaPlayer.currentTime = cut.in;
					this.mediaPlayer.pause();
				} else {
					this.mediaPlayer.currentTime = cut.out;
				}
			}

			this._updateVideoTime();
		}, 50);
	}

	get _timelineWidth() {
		return this.width - constants.TIMELINE_OFFSET_X * 2;
	}

	_updateCutOnStage(cut) {
		const { inPixels, outPixels } = cut.getPixelsAlongTimeline();
		const width = outPixels - inPixels + 1;
		const stageX = this._getStageXFromPixelsAlongTimeline(inPixels);

		cut.displayObject.setTransform(stageX, constants.TIMELINE_OFFSET_Y);
		cut.displayObject.graphics.clear().beginFill(constants.COLOURS.CUT).drawRect(0, 0, width, this._getTimelineHeight());

		this._stage.update();
	}
	_updateMarkOnStage(mark) {
		const pixelsAlongTimeline = mark.getPixelsAlongTimeline();

		const stageX = this._getStageXFromPixelsAlongTimeline(pixelsAlongTimeline);

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
		if (this._mouseTime && Math.abs(this._mouseTime - this.mediaPlayer.currentTime) < 1) {
			this._mouseTime = null;
		}

		const { lowerTimeBound, upperTimeBound } = this._timeline.getTimeBoundsOfTimeline();

		const time = this._mouseTime || this.mediaPlayer.currentTime;

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
		if (!this.mediaPlayer) return 1;

		const zoomHandleValue = this._getZoomHandleValue();

		// See US130745 for details on this calculation
		this._zoomMultiplier = Math.max(Math.pow(Math.pow((2 * this.mediaPlayer.duration * constants.MARK_WIDTH / this._timelineWidth), 1 / constants.ZOOM_HANDLE_MAX_DEPTH), zoomHandleValue), 1);

		this._timeline.zoomMultiplier = this._zoomMultiplier;
	}

}

customElements.define('d2l-capture-producer-timeline', CaptureProducerTimeline);
