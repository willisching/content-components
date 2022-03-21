import { css, html, LitElement } from 'lit-element/lit-element.js';
import { bodyCompactStyles, labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import { InternalLocalizeMixin } from './src/internal-localize-mixin.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import constants from './src/constants.js';
import { styleMap } from 'lit-html/directives/style-map.js';

class CaptureProducerTimeline extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			width: { type: Number },
			timelineVisible: { type: Boolean },
			_zoomMultiplier: { type: Number },
			enableCutsAndChapters: { type: Boolean },
			metadata: { type: Object },
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
				composed: true,
			}
		));

		this.style.setProperty(
			'--canvas-container-width',
			this.width
				? `${(this.width + constants.CANVAS_BORDER_WIDTH * 2)}px`
				: 'unset'
		);
	}

	constructor() {
		super();
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
		this.dispatchEvent(new CustomEvent(
			'timeline-updated',
			{
				composed: true,
				detail: { changedProperties }
			}
		));
	}

	_changeToCutMode() {
		this.dispatchEvent(new CustomEvent(
			'change-to-cut-mode',
			{
				composed: true,
			}
		));
	}

	_changeToMarkMode() {
		this.dispatchEvent(new CustomEvent(
			'change-to-mark-mode',
			{
				composed: true,
			}
		));
	}

	_changeToSeekMode() {
		this.dispatchEvent(new CustomEvent(
			'change-to-seek-mode',
			{
				composed: true,
			}
		));
	}

	_getZoomMultiplierDisplay() {
		if (this._zoomMultiplier <= 10) return `${Math.round(this._zoomMultiplier * 100)}%`;

		return `${Math.round(this._zoomMultiplier)}x`;
	}
}

customElements.define('d2l-capture-producer-timeline', CaptureProducerTimeline);