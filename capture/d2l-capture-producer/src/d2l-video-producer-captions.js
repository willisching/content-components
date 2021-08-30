import '@brightspace-ui/core/components/colors/colors.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from './internal-localize-mixin.js';

class VideoProducerCaptions extends InternalLocalizeMixin(LitElement) {
	static get styles() {
		return css`
			.d2l-video-producer-captions {
				border: 1px solid var(--d2l-color-mica);
				box-sizing: border-box;
				position: relative;
				width: 360px;
				height: 532px;
			}
		`;
	}

	render() {
		return html`
			<div class="d2l-video-producer-captions">
			</div>
		`;
	}
}

customElements.define('d2l-video-producer-captions', VideoProducerCaptions);
