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
			mediaPlayerDuration: { type: Number },
			metadata: { type: Object },
			timelineVisible: { type: Boolean },
			width: { type: Number },
			_videoLoaded: { type: Boolean },
			_zoomMultiplier: { type: Number },
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

	firstUpdated() {
		super.firstUpdated();

		this.dispatchEvent(new CustomEvent(
			'timeline-first-updated',
			{
				composed: false,
				detail: {
					resetTimelineWithNewCuts: this._resetTimelineWithNewCuts.bind(this),
					changeToSeekMode: this._changeToSeekMode.bind(this),
				}
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

		if (this.enableCutsAndChapters && changedProperties.has('metadata') && this.metadata && this._videoLoaded && this._cutsDifferInMetadataAndTimeline()) {
			this._resetTimelineWithNewCuts(this.metadata.cuts);
		}

		this.dispatchEvent(new CustomEvent(
			'timeline-updated',
			{
				composed: true,
				detail: { changedProperties }
			}
		));
	}

	get canvasContainerWidth() {
		return this.width + constants.CANVAS_BORDER_WIDTH * 2;
	}

	_changeToCutMode() {
		this._controlMode = constants.CONTROL_MODES.CUT;
		this._updateMouseEnabledForCuts();
		this._updateMouseEnabledForMarks();
		this._contentMarker.mouseEnabled = false;
		this._hideCursor();
		this.dispatchEvent(new CustomEvent(
			'change-to-cut-mode',
			{
				composed: true,
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
			'change-to-mark-mode',
			{
				composed: true,
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

	_cutsDifferInMetadataAndTimeline() {
		const timelineCutsString = JSON.stringify(this._timeline.getCuts().map(x => ({ in: x.in, out: x.out })));
		const metadataCutsString = JSON.stringify(this.metadata.cuts.map(x => ({ in: x.in, out: x.out })));
		return timelineCutsString !== metadataCutsString;
	}

	_getTimelineHeight() {
		return constants.TIMELINE_HEIGHT_MIN + this._getZoomHandleValue();
	}

	_getZoomHandleValue() {
		return this._zoomHandle.y - constants.ZOOM_HANDLE_OFFSET_Y;
	}

	_getMarkHeight() {
		return constants.MARK_HEIGHT_MIN + this._getZoomHandleValue();
	}

	_getHitBoxHeight() {
		return constants.HITBOX_HEIGHT_MIN + this._getZoomHandleValue();
	}

	_getZoomMultiplierDisplay() {
		if (this._zoomMultiplier <= 10) return `${Math.round(this._zoomMultiplier * 100)}%`;

		return `${Math.round(this._zoomMultiplier)}x`;
	}

	_hideCursor() {
		this._cursor.displayObject.visible = false;
		this._timeContainer.visible = false;
		this._stage.update();
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

	_updateMouseEnabledForCuts() {
		this._timeline.getCutsOnTimeline().forEach(cut => cut.displayObject.mouseEnabled = (this._controlMode === constants.CONTROL_MODES.CUT));
	}

	_updateMouseEnabledForMarks() {
		this._timeline.getMarksOnTimeline().forEach(mark => mark.displayObject.mouseEnabled = this._controlMode === constants.CONTROL_MODES.MARK);
	}

	_resetTimelineWithNewCuts(cuts) {
		this._currentMark = null;

		if (this._timeline) {
			for (const cut of this._timeline.getCuts()) this._stage.removeChild(cut.displayObject);

			for (const mark of this._timeline.getMarks()) this._stage.removeChild(mark.displayObject);
		}

		this._timeline = new Timeline({
			durationSeconds: this.mediaPlayerDuration,
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
}

customElements.define('d2l-capture-producer-timeline', CaptureProducerTimeline);
