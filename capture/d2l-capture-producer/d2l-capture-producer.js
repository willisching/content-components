import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui-labs/media-player/media-player.js';
import './src/d2l-video-producer-chapters.js';

import { Container, Shape, Stage, Text } from '@createjs/easeljs';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import constants from './src/constants.js';
import { InternalLocalizeMixin } from './src/internal-localize-mixin.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import { styleMap } from 'lit-html/directives/style-map';
import { Timeline } from './src/timeline';

class CaptureProducer extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			defaultLanguage: { type: Object },
			metadata: { type: Object },
			selectedLanguage: { type: Object },
			src: { type: String, reflect: true },
			_loading: { type: Boolean, attribute: false },
			_videoLoaded: { type: Boolean, attribute: false },
			_zoomHandleCurrentOffsetX: { type: Boolean, attribute: false },
			_zoomHandleDepth: { type: Number, attribute: false },
			_zoomMultiplierDisplayOpacity: { type: Number, attribute: false },
		};
	}

	static get styles() {
		return [selectStyles, css`
			.d2l-video-producer {
				display: flex;
				flex-direction: column;
			}
			.d2l-video-producer-video-controls {
				display: flex;
				height: 580px;
				justify-content: space-between;
			}

			.d2l-video-producer d2l-labs-media-player {
				display: flex;
				margin-right: 20px;
				width: 100%;
			}

			.d2l-video-producer-timeline {
				display: flex;
				margin-top: 15px;
			}

			.d2l-video-producer-timeline-controls {
				display: inline-flex;
				height: 90px;
				justify-content: center;
				vertical-align: top;
				width: 170px;
			}

			.d2l-video-producer-timeline-controls d2l-button-icon {
				margin: 0 4px;
			}

			#timeline-canvas {
				border: ${constants.CANVAS_BORDER_WIDTH}px solid #787878;
			}

			#zoom-handle {
				height: ${constants.ZOOM_HANDLE_HEIGHT}px;
				pointer-events: none;
				position: absolute;
				width: ${constants.ZOOM_HANDLE_WIDTH}px;
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
				width: ${constants.CANVAS_CONTAINER_WIDTH}px;
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

		this._zoomHandleDepth = 0;
		this._zoomHandleCurrentOffsetX = constants.TIMELINE_WIDTH / 2;
		this._zoomMultiplierDisplayOpacity = 0;
		this._zoomMultiplierDisplayTimestampMilliseconds = null;
		this._zoomMultiplierFadeIntervalId = null;

		this._chaptersComponent = null;

		this._draggingMark = false;
		this._currentMark = null;

		this.metadata = { cuts: [], chapters: [] };
		this.src = '';
		this.selectedLanguage = {};
		this._videoLoaded = false;
	}

	firstUpdated() {
		super.firstUpdated();

		this._video = this.shadowRoot.querySelector('d2l-labs-media-player');
		this._chapters = this.shadowRoot.querySelector('d2l-video-producer-chapters');
		this._configureStage();
		this._configureModes();

		this._chapters.addEventListener('active-chapter-updated',
			this._handleActiveChapterUpdated.bind(this));

		// Wait for video to be loaded
		this._video.addEventListener('loadeddata', () => {
			if (this.metadata) {
				this._resetTimelineWithNewCuts(this.metadata.cuts);
			}
			this._videoLoaded = true;
			this._changeToSeekMode();
		});

		this._chaptersComponent = this.shadowRoot.querySelector('d2l-video-producer-chapters');
	}

	render() {
		const zoomHandleStyleMap = {
			backgroundColor: this._zoomHandleDepth === 0 ? 'var(--d2l-color-mica)' : 'var(--d2l-color-celestine)',
			left: `${this._getZoomHandleLeft()}px`,
			top: `${this._getZoomHandleTop()}px`
		};

		const zoomMultiplierStyleMap = {
			opacity: this._zoomMultiplierDisplayOpacity
		};
		return html`
			<div class="d2l-video-producer">
				<div class="d2l-video-producer-video-controls">
					<d2l-labs-media-player
						@pause="${this._pauseUpdatingVideoTime}"
						@play="${this._startUpdatingVideoTime}"
						@seeking="${this._updateVideoTime}"
						controls
						src="${this.src}"
					></d2l-labs-media-player>
					<d2l-video-producer-chapters
						.chapters="${this.metadata && this.metadata.chapters}"
						.defaultLanguage="${this.defaultLanguage}"
						.selectedLanguage="${this.selectedLanguage}"
						?loading="${this._loading}"
						@add-new-chapter="${this._addNewChapter}"
						@chapters-changed="${this._handleChaptersChanged}"
						@set-chapter-to-current-time="${this._setChapterToCurrentTime}"
					></d2l-video-producer-chapters>
				</div>
				<div class="d2l-video-producer-timeline">
					<div id="canvas-container">
						<canvas height="${constants.CANVAS_HEIGHT}px" width="${constants.CANVAS_WIDTH}px" id="timeline-canvas"></canvas>
						<div id="zoom-handle" style=${styleMap(zoomHandleStyleMap)}></div>
						<div id="zoom-multiplier" style=${styleMap(zoomMultiplierStyleMap)}>
							${this._getZoomMultiplierDisplay()}
						</div>
					</div>
					<div class="d2l-video-producer-timeline-controls">
						<d2l-button-icon @click="${this._changeToSeekMode}" text="${this.localize(constants.CONTROL_MODES.SEEK)}" icon="tier1:divider-solid"></d2l-button-icon>
						<d2l-button-icon @click="${this._changeToMarkMode}" text="${this.localize(constants.CONTROL_MODES.MARK)}" icon="tier1:edit"></d2l-button-icon>
						<d2l-button-icon @click="${this._changeToCutMode}" text="${this.localize(constants.CONTROL_MODES.CUT)}" icon="html-editor:cut"></d2l-button-icon>
					</div>
				</div>
			</div>
		`;
	}

	updated(changedProperties) {
		super.updated(changedProperties);
		if (changedProperties.has('metadata') && this.metadata && this._videoLoaded) {
			this._resetTimelineWithNewCuts(this.metadata.cuts);
		}
	}

	_addCutToStage(cut) {
		const [inPixels, outPixels] = cut.getPixelsAlongTimeline();

		const displayObject = new Shape();
		const stageX = CaptureProducer._getStageXFromPixelsAlongTimeline(inPixels);
		const width = outPixels - inPixels + 1;

		displayObject.setTransform(stageX, constants.TIMELINE_OFFSET_Y);
		displayObject.graphics.beginFill('#FF0000').drawRect(0, 0, width, constants.TIMELINE_HEIGHT_MIN);
		displayObject.alpha = 0.5;

		displayObject.on('click', () => {
			cut.removeFromTimeline();
			this._stage.removeChild(cut.displayObject);
			this._stage.update();
		});

		cut.displayObject = displayObject;

		this._stage.addChildAt(displayObject, this._stage.numChildren - this._timeline.getMarksOnTimeline().length);

		this._stage.update();
	}

	_addMarkToStage(mark) {
		const pixelsAlongTimeline = mark.getPixelsAlongTimeline();

		const displayObject = new Shape();
		const stageX = CaptureProducer._getStageXFromPixelsAlongTimeline(pixelsAlongTimeline);

		displayObject.setTransform(stageX + constants.CURSOR_OFFSET_X, constants.CURSOR_OFFSET_Y);
		displayObject.graphics.beginFill('#797979').drawRect(0, 0, constants.MARK_WIDTH, constants.MARK_HEIGHT);

		displayObject.on('click', () => {
			if (this._draggingMark) return;

			const [extendedCut, removedCut] = mark.removeFromTimeline();

			this._stage.removeChild(mark.displayObject);

			if (removedCut) this._stage.removeChild(removedCut.displayObject);

			if (extendedCut) this._updateCutOnStage(extendedCut);

			this._stage.update();
		});

		displayObject.on('pressup', () => {
			this._draggingMark = false;
		});

		displayObject.on('pressmove', event => {
			const pixelsAlongTimelineToMoveTo = CaptureProducer._getPixelsAlongTimelineFromStageX(event.stageX);

			const returnValue = mark.move(pixelsAlongTimelineToMoveTo);

			if (returnValue) {
				this._updateMarkOnStage(mark);

				const [cutEndingAtMark, cutStartingAtMark] = returnValue;

				if (cutEndingAtMark) this._updateCutOnStage(cutEndingAtMark);

				if (cutStartingAtMark) this._updateCutOnStage(cutStartingAtMark);
			}
			this._draggingMark = true;
		});

		mark.displayObject = displayObject;

		const hitArea = new Shape();
		hitArea.graphics.beginFill('#FFF').drawRect(constants.HITBOX_OFFSET, constants.HITBOX_OFFSET, constants.HITBOX_WIDTH, constants.HITBOX_HEIGHT);
		displayObject.hitArea = hitArea;

		this._stage.addChild(displayObject);

		this._clearCurrentMark();

		this._currentMark = mark;

		this._setMarkStyleNormal(this._currentMark);

		this._stage.update();
	}

	//#region Chapter management
	_addNewChapter() {
		this._chapters.addNewChapter(this._video.currentTime);
	}

	//#region Control mode management
	_changeToCutMode() {
		this._controlMode = constants.CONTROL_MODES.CUT;
		this._video.pause();
		this._updateMouseEnabledForCuts();
		this._updateMouseEnabledForMarks();
		this._contentMarker.mouseEnabled = false;
		this._hideCursor();
	}

	_changeToMarkMode() {
		this._controlMode = constants.CONTROL_MODES.MARK;
		this._video.pause();
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

	static _clampBetweenMinAndMax(num, min, max) {
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
		this._timelineCanvas = this.shadowRoot.querySelector('#timeline-canvas');
		this._timelineCanvas.addEventListener('mousemove', this._onCanvasMouseMove.bind(this));
		this._timelineCanvas.addEventListener('mousedown', this._onCanvasMouseDown.bind(this));
		this._stage = new Stage(this._timelineCanvas);
		this._stage.enableMouseOver(30);

		this._timelineRect = new Shape();
		this._timelineRect.setTransform(constants.TIMELINE_OFFSET_X, constants.TIMELINE_OFFSET_Y);
		this._timelineRect.graphics.beginFill('#000000').drawRect(0, 0, constants.TIMELINE_WIDTH, constants.TIMELINE_HEIGHT_MIN);
		this._stage.addChild(this._timelineRect);

		this._playedRect = new Shape();
		this._playedRect.setTransform(10, constants.TIMELINE_OFFSET_Y);
		this._playedRect.mouseEnabled = false;
		this._stage.addChild(this._playedRect);

		this._cursorDisplayObj = new Shape();
		this._cursorDisplayObj.graphics.beginFill('#BCBCBC').drawRect(0, 0, constants.MARK_WIDTH, constants.MARK_HEIGHT);
		this._cursorDisplayObj.alpha = 0.7;
		this._cursorDisplayObj.visible = false;
		this._cursorDisplayObj.mouseEnabled = false;
		this._stage.addChild(this._cursorDisplayObj);

		this._cursor = {
			time: 0,
			displayObject: this._cursorDisplayObj
		};

		this._contentMarker = new Shape();
		this._contentMarker.graphics.beginFill('#0099CC').drawRect(0, 0, constants.MARK_WIDTH, constants.MARK_HEIGHT);
		this._contentMarker.visible = false;
		this._contentMarker.mouseEnabled = false;

		this._contentMarkerHitBox = new Shape();
		this._contentMarkerHitBox.graphics.beginFill('#FFF').drawRect(constants.HITBOX_OFFSET, constants.HITBOX_OFFSET, constants.HITBOX_WIDTH, constants.HITBOX_HEIGHT);
		this._contentMarker.hitArea = this._contentMarkerHitBox;

		this._contentMarker.on('pressmove', (event) => {
			if (this._isMouseOverTimeline(false)) {
				this._moveContentMarker(event);
			} else {
				this._timeContainer.visible = false;
				this._stage.update();
			}
		});
		this._stage.addChild(this._contentMarker);

		this._timeContainer = new Container();
		this._timeContainer.x = 10;
		this._timeContainer.y = constants.TIME_CONTAINER_OFFSET_Y;
		this._timeContainer.visible = false;
		this._stage.addChild(this._timeContainer);

		this._timeTextBorder = new Shape();
		this._timeTextBorder.graphics.setStrokeStyle(2).beginStroke('#787878').beginFill('white');
		this._timeTextBorder.graphics.drawRoundRect(0, 0, constants.TIME_TEXT_BORDER_WIDTH, constants.TIME_TEXT_BORDER_HEIGHT, 3);
		this._timeContainer.addChild(this._timeTextBorder);

		this._timeText = new Text('', '18px Lato', '#616769'); // --d2l-color-ferrite
		this._timeText.lineHeight = 28;
		this._timeText.textBaseLine = 'top';
		this._timeText.x = 10;
		this._timeText.y = 6;
		this._timeContainer.addChild(this._timeText);

		this._cutHighlight = new Shape();
		this._cutHighlight.alpha = 0.3;
		this._cutHighlight.visible = false;
		this._cutHighlight.mouseEnabled = false;
		this._stage.addChild(this._cutHighlight);

		this._stage.update();
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
	_fireMetadataChangedEvent({ cuts = this._timeline.getCuts(), chapters = this.metadata.chapters } = {}) {
		this.dispatchEvent(new CustomEvent(
			'metadata-changed',
			{
				composed: false,
				detail: { cuts, chapters }
			}
		));
	}

	_getCutFromTime(time) {
		for (const cut of this._timeline.getCuts()) if (cut.isOverTime(time)) return cut;

		return null;
	}

	_getCutModeHandlers() {
		const highlightCut = (event) => {
			const pixelsAlongTimeline = CaptureProducer._getPixelsAlongTimelineFromStageX(event.stageX);

			const [lowerPixelBound, upperPixelBound] = this._timeline.getPixelBoundsAtPoint(pixelsAlongTimeline);

			const lowerStageXBound = CaptureProducer._getStageXFromPixelsAlongTimeline(lowerPixelBound);
			const upperStageXBound = CaptureProducer._getStageXFromPixelsAlongTimeline(upperPixelBound);

			this._cutHighlight.setTransform(lowerStageXBound, constants.TIMELINE_OFFSET_Y);
			this._cutHighlight.graphics.clear().beginFill('#B8B8B8').drawRect(0, 0, upperStageXBound - lowerStageXBound, constants.TIMELINE_HEIGHT_MIN);
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
				const pixelsAlongTimeline = CaptureProducer._getPixelsAlongTimelineFromStageX(event.stageX);

				const cut = this._timeline.addCutToTimelineAtPoint(pixelsAlongTimeline);

				if (cut) this._addCutToStage(cut);
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

	_getMarkModeHandlers() {
		return {
			timelineMouseDown: event => {
				if (this._currentMark) {
					this._mouseDownStageX = event.stageX;
				}
			},
			timelineMouseUp: event => {
				this._clearCurrentMark();

				const pixelsAlongTimeline = CaptureProducer._getPixelsAlongTimelineFromStageX(event.stageX);

				const returnValue = this._timeline.addMarkToTimelineAtPoint(pixelsAlongTimeline);

				if (!returnValue) return;

				const [mark, cut] = returnValue;

				this._addMarkToStage(mark);

				if (cut) this._updateCutOnStage(cut);
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
		const underMouse = this._stage.getObjectsUnderPoint(this._stage.mouseX, this._stage.mouseY, 1)[0];

		for (const mark of this._timeline.getMarksOnTimeline()) {
			if (mark.displayObject === underMouse) return mark;
		}

		return null;
	}

	static _getPixelsAlongTimelineFromStageX(stageX) {
		return CaptureProducer._clampBetweenMinAndMax(stageX - constants.TIMELINE_OFFSET_X, 0, constants.TIMELINE_WIDTH);
	}

	_getPixelsBelowTimeline(y) {
		const rect = this._timelineCanvas.getBoundingClientRect();

		const height = this._timelineRect.graphics._activeInstructions[0].h;

		// return Math.round(y - rect.top - constants.TIMELINE_OFFSET_Y - constants.TIMELINE_HEIGHT_MIN - constants.CANVAS_BORDER_WIDTH);
		return Math.round(y - rect.top - constants.TIMELINE_OFFSET_Y - height - constants.CANVAS_BORDER_WIDTH);
	}

	_getRoundedPosition(stageXPosition) {
		const time = this._getTimeFromStageX(stageXPosition);
		const roundedTime = this._getRoundedTime(time);
		return this._getStageXFromTime(roundedTime);
	}

	_getRoundedTime(time) {
		return Math.min(Math.round(time), Math.floor(this._video.duration));
	}

	_getSeekModeHandlers() {
		const seek = event => {
			if (this._video.duration > 0) {
				this._mouseTime = this._video.duration * CaptureProducer._clampBetweenMinAndMax(event.localX / constants.TIMELINE_WIDTH, 0, 1);
				this._video.currentTime = this._mouseTime;
				this._updateVideoTime();
			}
		};

		const seekMode = {
			timelineMouseUp: () => {},
			timelinePressMove: seek,
			timelinePressUp: () => {
				this._stage.mouseMoveOutside = false;

				if (this._shouldResumePlaying) {
					if (this._video.currentTime < this._video.duration) {
						this._video.play();
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

			this._shouldResumePlaying = !this._video.paused && !this._video.ended;
			this._video.pause();

			seekMode.timelinePressMove(event);
		};

		return seekMode;
	}

	static _getStageXFromPixelsAlongTimeline(pixelsAlongTimeline) {
		if (pixelsAlongTimeline === null) return null;

		return pixelsAlongTimeline + constants.TIMELINE_OFFSET_X;
	}

	_getStageXFromTime(time) {
		const pixelsAlongTimeline = this._timeline.getPixelsAlongTimelineFromTime(time);

		return CaptureProducer._getStageXFromPixelsAlongTimeline(pixelsAlongTimeline);
	}

	_getTimeFromStageX(stageX) {
		const clampedTimelineStageX = CaptureProducer._clampBetweenMinAndMax(stageX, constants.TIMELINE_OFFSET_X, constants.TIMELINE_OFFSET_X + constants.TIMELINE_WIDTH);

		const pixelsAlongTimeline = CaptureProducer._getPixelsAlongTimelineFromStageX(clampedTimelineStageX);

		return this._timeline.getTimeFromPixelsAlongTimeline(pixelsAlongTimeline);
	}

	_getZoomHandleLeft() {
		return this._zoomHandleCurrentOffsetX + constants.CANVAS_BORDER_WIDTH;
	}

	_getZoomHandleTop() {
		return constants.TIMELINE_OFFSET_Y + constants.TIMELINE_HEIGHT_MIN + constants.CANVAS_BORDER_WIDTH + this._zoomHandleDepth;
	}

	_getZoomMultiplier() {
		if (!this._video) return 1;

		return Math.max(Math.pow(Math.pow((2 * this._video.duration * constants.MARK_WIDTH / constants.TIMELINE_WIDTH), 1 / constants.ZOOM_HANDLE_MAX_DEPTH), this._zoomHandleDepth), 1);
	}

	_getZoomMultiplierDisplay() {
		const zoomMultiplier = this._getZoomMultiplier();

		if (zoomMultiplier <= 10) return `${Math.round(zoomMultiplier * 100)}%`;
		else return `${Math.round(zoomMultiplier)}x`;
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
	_handleChaptersChanged(e) {
		this._fireMetadataChangedEvent({ chapters: e.detail.chapters });
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

	get _loading() {
		return !(
			this.metadata
			&& this._videoLoaded
			&& this.selectedLanguage
			&& this.selectedLanguage.code
		);
	}

	_moveContentMarker(event) {
		if (this._controlMode === constants.CONTROL_MODES.SEEK) {
			this._chapters.setChapterToTime(this._getTimeFromStageX(event.stageX));
			this._showAndMoveTimeContainer(this._activeChapterTime);
		}
	}

	_onCanvasMouseDown(event) {
		const pixelsBelowTimeline = this._getPixelsBelowTimeline(event.clientY);

		if (pixelsBelowTimeline >= 0) this._onCanvasMouseMove(event);
	}

	_onCanvasMouseMove(event) {
		const rect = this._timelineCanvas.getBoundingClientRect();

		const leftClickIsHeld = event.buttons ? event.buttons === 1 : event.which === 1;

		const pixelsAlongTimeline = event.clientX - rect.left - constants.TIMELINE_OFFSET_X;
		const clampedPixelsAlongTimeline = CaptureProducer._clampBetweenMinAndMax(pixelsAlongTimeline, 0, constants.TIMELINE_WIDTH);

		if (leftClickIsHeld) {
			const y = this._getPixelsBelowTimeline(event.clientY);
			if (y < 0) return;

			const newZoomHandleDepth = CaptureProducer._clampBetweenMinAndMax(y, 0, constants.ZOOM_HANDLE_MAX_DEPTH);

			if (this._zoomHandleDepth === 0 && newZoomHandleDepth !== 0) { // increasing zoom from unzoomed state
				this._timeline.pixelsAlongTimelineToZoomAround = clampedPixelsAlongTimeline;
			}

			this._zoomHandleDepth = newZoomHandleDepth;

			this._timeline.zoomMultiplier = this._getZoomMultiplier();

			this._recalculateDisplayObjectsOnTimeline();

			this._displayZoomMultiplier();
		} else {
			this._zoomHandleCurrentOffsetX = clampedPixelsAlongTimeline;
		}
	}

	//#region Video time management
	_pauseUpdatingVideoTime() {
		clearInterval(this._updateTimelineInterval);
	}

	_recalculateDisplayObjectsOnTimeline() {
		for (const cut of this._timeline.getCuts()) this._stage.removeChild(cut.displayObject);

		for (const mark of this._timeline.getMarks()) this._stage.removeChild(mark.displayObject);

		for (const cut of this._timeline.getCutsOnTimeline()) this._addCutToStage(cut);

		this._updateMouseEnabledForCuts();

		for (const mark of this._timeline.getMarksOnTimeline()) this._addMarkToStage(mark);

		this._updateMouseEnabledForMarks();

		const activeChapter = this._chaptersComponent.activeChapter;

		if (activeChapter !== null) {
			const time = this._chaptersComponent.activeChapter.time;
			const pixelsAlongTimeline = this._timeline.getPixelsAlongTimelineFromTime(time);

			if (pixelsAlongTimeline !== null) {
				const stageX = CaptureProducer._getStageXFromPixelsAlongTimeline(pixelsAlongTimeline);

				this._contentMarker.graphics.clear().beginFill('#0099CC').drawRect(0, 0, constants.MARK_WIDTH, constants.MARK_HEIGHT);
				this._contentMarker.setTransform(stageX + constants.CURSOR_OFFSET_X, constants.CURSOR_OFFSET_Y);
			}
		}
	}

	_resetTimelineWithNewCuts(cuts) {
		this._currentMark = null;

		if (this._timeline) {
			for (const cut of this._timeline.getCuts()) this._stage.removeChild(cut.displayObject);

			for (const mark of this._timeline.getMarks()) this._stage.removeChild(mark.displayObject);
		}

		this._timeline = new Timeline(Math.ceil(this._video.duration), constants.TIMELINE_WIDTH, cuts, this._getZoomMultiplier(), this._timeline?.pixelsAlongTimelineToZoomAround);

		for (const cut of this._timeline.getCutsOnTimeline()) this._addCutToStage(cut);

		this._updateMouseEnabledForCuts();

		for (const mark of this._timeline.getMarksOnTimeline()) this._addMarkToStage(mark);

		this._updateMouseEnabledForMarks();
	}

	//#endregion
	_setChapterToCurrentTime() {
		this._chapters.setChapterToTime(this._video.currentTime);
	}

	_setCursorOrCurrentMark(stageXPosition) {
		const roundedTime = this._getRoundedTime(this._getTimeFromStageX(stageXPosition));

		// Always start with no mark selected/no cursor shown
		this._cursor.displayObject.visible = false;
		this._timeContainer.visible = false;

		this._clearCurrentMark();

		const setMarkStyleHighlighted = (mark) => {
			mark.graphics.clear().beginFill('#797979').drawRect(0, 0, constants.MARK_WIDTH, constants.MARK_HEIGHT);
		};

		// Check for mousing over a mark first. This takes precidence over the timeline.
		const markUnderMouse = this._getMarkUnderMouse();
		if (markUnderMouse) {
			this._currentMark = markUnderMouse;
			setMarkStyleHighlighted(markUnderMouse.displayObject);
			this._showAndMoveTimeContainer(markUnderMouse.seconds);
		} else if (this._isMouseOverTimeline(false)) {
			this._cursor.time = roundedTime;
			this._cursor.displayObject.visible = true;
			this._cursor.displayObject.setTransform(this._getRoundedPosition(stageXPosition) + constants.CURSOR_OFFSET_X, constants.CURSOR_OFFSET_Y);
			this._showAndMoveTimeContainer(this._cursor.time);
		}

		this._stage.update();
	}

	_setMarkStyleNormal(mark) {
		mark.displayObject.graphics.clear().beginFill('#BCBCBC').drawRect(0, 0, constants.MARK_WIDTH, constants.MARK_HEIGHT);
	}

	_showAndMoveTimeContainer(time) {
		if (time) {
			this._timeText.text = new Date(time * 1000).toISOString().substr(11, 8);
			this._timeContainer.visible = true;

			const stageX = this._getStageXFromTime(time);
			this._timeContainer.x = Math.min(
				Math.max(stageX + constants.TIME_CONTAINER_OFFSET_X, constants.TIMELINE_OFFSET_X),
				constants.TIMELINE_OFFSET_X + constants.TIMELINE_WIDTH - constants.TIME_TEXT_BORDER_WIDTH
			);
			this._stage.update();
		}
	}

	_startUpdatingVideoTime() {
		// Restart video if paused at end cut.
		Object.values(this._cuts).reverse().forEach(cut => {
			if (cut.endTimeMS === 0 && this._video.currentTime === cut.startTimeMS / 1000) {
				this._video.currentTime = 0;
			}

			// Only interested in the last cut, break the loop.
			return false;
		});

		this._updateTimelineInterval = setInterval(() => {
			// Skip cuts
			const cut = this._getCutFromTime(this._video.currentTime * 1000);
			if (cut) {
				if (cut.endTimeMS === 0) {
					this._video.currentTime = cut.startTimeMS / 1000;
					this._video.pause();
				} else {
					this._video.currentTime = cut.endTimeMS / 1000;
				}
			}

			this._updateVideoTime();
		}, 50);
	}

	_updateCutOnStage(cut) {
		const [inPixels, outPixels] = cut.getPixelsAlongTimeline();
		const width = outPixels - inPixels + 1;
		const stageX = CaptureProducer._getStageXFromPixelsAlongTimeline(inPixels);

		cut.displayObject.setTransform(stageX, constants.TIMELINE_OFFSET_Y);
		cut.displayObject.graphics.clear().beginFill('#FF0000').drawRect(0, 0, width, constants.TIMELINE_HEIGHT_MIN);

		this._stage.update();
	}

	_updateMarkOnStage(mark) {
		const pixelsAlongTimeline = mark.getPixelsAlongTimeline();

		const stageX = CaptureProducer._getStageXFromPixelsAlongTimeline(pixelsAlongTimeline);

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
		// Clear the seeked time once the video has caught up
		if (this._mouseTime && Math.abs(this._mouseTime - this._video.currentTime) < 1) {
			this._mouseTime = null;
		}
		const width = Math.min(constants.TIMELINE_WIDTH, constants.TIMELINE_WIDTH * ((this._mouseTime || this._video.currentTime) / this._video.duration));

		this._playedRect.graphics.clear().beginFill('#0066CC').drawRect(0, 0, width, constants.TIMELINE_HEIGHT_MIN);
		this._stage.update();
	}
}
customElements.define('d2l-capture-producer', CaptureProducer);
