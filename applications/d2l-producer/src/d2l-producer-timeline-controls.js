import { css, html, LitElement } from 'lit-element/lit-element.js';
import { bodyCompactStyles, labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import { InternalLocalizeMixin } from '../../../mixins/internal-localize-mixin.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import constants from './constants.js';

class VideoProducerTimelineControls extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			controlMode: { type: Boolean }
		};
	}

	static get styles() {
		return [bodyCompactStyles, labelStyles, selectStyles, css`
			.d2l-producer-timeline-controls {
				display: inline-flex;
				height: 90px;
				justify-content: center;
				margin-top: 8px;
				position: relative;
				vertical-align: top;
				width: 160px;
				min-width: 160px;
			}

			.d2l-producer-timeline-mode-button input[type="radio"] {
				display: none;
			}

			.d2l-producer-timeline-mode-button label {
				border-radius: 8px;
				margin: 0 5px 0 5px;
				padding: 12px;
			}

			.d2l-producer-timeline-mode-button input[type="radio"]:hover + label {
				background-color: var(--d2l-color-gypsum);
				cursor: pointer;
			}

			.d2l-producer-timeline-mode-button input[type="radio"]:checked + label {
				background-color: var(--d2l-color-gypsum);
			}
		`];
	}

	constructor() {
		super();

		this.controlMode = constants.CONTROL_MODES.SEEK;
	}

	firstUpdated() {
		this.dispatchEvent(new CustomEvent('control-buttons-first-updated'));
	}

	render() {
		return html`
			<div class="d2l-producer-timeline-controls">
				<div class="d2l-producer-timeline-mode-button">
					<input
						type="radio"
						name="d2l-producer-timeline-mode"
						id="d2l-producer-seek-button"
						?checked="${this.controlMode === constants.CONTROL_MODES.SEEK}"
						/>
					<label for="d2l-producer-seek-button" @click="${this._changeToSeekMode}" id="d2l-producer-seek-button-label">
						<d2l-icon id="d2l-producer-seek-button-icon" icon="tier1:arrow-thin-up"></d2l-icon>
						<d2l-tooltip for="d2l-producer-seek-button-label" delay="500">${this.localize(constants.CONTROL_MODES.SEEK)}</d2l-tooltip>
					</label>
				</div>
				<div class="d2l-producer-timeline-mode-button">
					<input
						type="radio"
						name="d2l-producer-timeline-mode"
						id="d2l-producer-mark-button"
						?checked="${this.controlMode === constants.CONTROL_MODES.MARK}"
						/>
					<label for="d2l-producer-mark-button" @click="${this._changeToMarkMode}" id="d2l-producer-mark-button-label">
						<d2l-icon id="d2l-producer-mark-button-icon" icon="tier1:divider-solid"></d2l-icon>
						<d2l-tooltip for="d2l-producer-mark-button-label" delay="500">${this.localize(constants.CONTROL_MODES.MARK)}</d2l-tooltip>
					</label>
				</div>
				<div class="d2l-producer-timeline-mode-button">
					<input
						type="radio"
						name="d2l-producer-timeline-mode"
						id="d2l-producer-cut-button"
						?checked="${this.controlMode === constants.CONTROL_MODES.CUT}"
						/>
					<label for="d2l-producer-cut-button" @click="${this._changeToCutMode}" id="d2l-producer-cut-button-label">
						<d2l-icon id="d2l-producer-cut-button-icon" icon="html-editor:cut"></d2l-icon>
						<d2l-tooltip for="d2l-producer-cut-button-label" delay="500">${this.localize(constants.CONTROL_MODES.CUT)}</d2l-tooltip>
					</label>
				</div>
			</div>`;
	}

	_changeToCutMode() {
		this.dispatchEvent(new CustomEvent('change-to-cut-mode'));
	}

	_changeToMarkMode() {
		this.dispatchEvent(new CustomEvent('change-to-mark-mode'));
	}

	_changeToSeekMode() {
		this.dispatchEvent(new CustomEvent('change-to-seek-mode'));
	}

}

customElements.define('d2l-producer-timeline-controls', VideoProducerTimelineControls);
