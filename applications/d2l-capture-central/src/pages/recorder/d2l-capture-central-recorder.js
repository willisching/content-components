import '@brightspace-ui/core/components/button/button.js';
import '../../../../../capture/d2l-capture-recorder.js';

import { css, html } from 'lit-element/lit-element.js';
import { PageViewElement } from '../../components/page-view-element';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin';
import { InternalLocalizeMixin } from '../../../../../mixins/internal-localize-mixin';

class D2LCaptureCentralRecorder extends DependencyRequester(InternalLocalizeMixin(PageViewElement)) {
	static get properties() {
		return {
			_nextButtonDisabled: { type: Boolean, attribute: false }
		};
	}

	static get styles() {
		return css`
			.d2l-capture-central-recorder {
				padding-top: 25px;
			}
		`;
	}

	constructor() {
		super();
		this._nextButtonDisabled = true;
	}

	connectedCallback() {
		super.connectedCallback();
		this.tenantId = this.requestDependency('tenant-id');
		this.contentServiceEndpoint = this.requestDependency('content-service-endpoint');
	}

	render() {
		return html`
			<div class="d2l-capture-central-recorder">
				<d2l-capture-recorder
					tenant-id="${this.tenantId}"
					content-service-endpoint="${this.contentServiceEndpoint}"
					recording-duration-limit="3"
					@capture-clip-completed=${this._handleCaptureClipCompletedEvent}
				></d2l-capture-recorder>
				<div>
					<d2l-button
						@click=${this._handleNextButtonClick}
						?disabled="${this._nextButtonDisabled}"
						primary
					>
						${this.localize('next')}
					</d2l-button>
					<d2l-button
					>
						${this.localize('cancel')}
					</d2l-button>
				</div>
			</div>
    `;
	}

	_handleCaptureClipCompletedEvent() {
		this._nextButtonDisabled = false;
	}

	_handleNextButtonClick() {
		const recorder = this.shadowRoot.querySelector('d2l-capture-recorder');
		if (recorder.fileSelected) {
			recorder.uploadSelectedFile();
			this._nextButtonDisabled = true;
		}
	}
}

customElements.define('d2l-capture-central-recorder', D2LCaptureCentralRecorder);
