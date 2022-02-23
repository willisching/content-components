import '@brightspace-ui/core/components/icons/icon-custom.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';

import { css, html } from 'lit-element/lit-element.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin';
import { PageViewElement } from '../../components/page-view-element';

class D2LCaptureCentralEncoder extends InternalLocalizeMixin(DependencyRequester(PageViewElement)) {
	static get properties() {
		return {
			_encoderDownloads: { type: Array, attribute: false },
		};
	}

	static get styles() {
		return css`
			#d2l-capture-central-encoder-page {
				margin-top: 30px;
				width: 100%;
			}

			#d2l-capture-central-encoder-loading-container {
				display: flex;
				justify-content: center;
				width: 100%;
			}

			#d2l-capture-central-encoder-downloads-container {
				display: flex;
				flex-direction: column;
				margin-left: 30px;
			}

			.d2l-capture-central-encoder-download-link-container {
				align-items: center;
				display: flex;
				flex-direction: row;
				margin-left: 25px;
				margin-bottom: 25px;
			}

			.d2l-capture-central-encoder-download-link {
				margin-left: 10px;
			}
		`;
	}

	async connectedCallback() {
		super.connectedCallback();
		this.captureServiceClient = this.requestDependency('capture-service-client');
		this._encoderDownloads = await this.captureServiceClient.getEncoderUpdates();
		if (this._encoderDownloads) {
			this._reloadEncoderDownloadsOnExpiry();
		}
	}

	render() {
		let content;
		if (!this._encoderDownloads) {
			content = html`
				<div id='d2l-capture-central-encoder-loading-container'>
					<d2l-loading-spinner size="100"></d2l-loading-spinner>
				</div>
			`;
		} else if (this._encoderDownloads.length === 0) {
			content = html`
				<p class="d2l-body-standard">${this.localize('noCaptureEncoderDownloadsAvailable')}</p>
			`;
		} else {
			content = html`
				<div id='d2l-capture-central-encoder-downloads-container'></div>
					<p class="d2l-body-standard">${this.localize('downloadCaptureEncoder')}</p>
					${this._encoderDownloads.map(encoderDownload => this._renderEncoderDownloadLink(encoderDownload))}
				</div>
			`;
		}

		return html`
			<div id="d2l-capture-central-encoder-page">
				${content}
			</div>
		`;
	}

	_getPlatformLinkDetails(shortPlatformName) {
		switch (shortPlatformName.toLowerCase()) {
			case 'mac':
				return {
					langterm: 'mac',
					// https://commons.wikimedia.org/wiki/File:Apple_logo_black.svg
					icon: html`
						<svg xmlns="http://www.w3.org/2000/svg" width="814" height="1000" viewBox="0 0 814 1000" xml:space="preserve">
							<path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
						</svg>
					`
				};
			case 'win':
				return {
					langterm: 'windows',
					// https://commons.wikimedia.org/wiki/File:Windows_logo_-_2021.svg
					icon: html`
						<svg xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" width="58" height="58" version="1.1" viewBox="0 0 48.745 48.747">
							<g fill="#0078d4">
								<rect x="2.2848e-15" y="-.00011033" width="23.105" height="23.105"/>
								<rect x="25.64" y="-.00011033" width="23.105" height="23.105"/>
								<rect x="2.2848e-15" y="25.642" width="23.105" height="23.105"/>
								<rect x="25.64" y="25.642" width="23.105" height="23.105"/>
							</g>
						</svg>
					`
				};
			default:
				throw new Error(`Invalid platform name: ${shortPlatformName}`);
		}
	}

	_reloadEncoderDownloadsOnExpiry() {
		// Edge case: if the signed URLs are configured without an expiration time, there's no need to reload the links.
		if (!this._encoderDownloads.find(encoderDownload => encoderDownload.url.includes('Expires='))) {
			return;
		}

		const expiryTimes = this._encoderDownloads.map(encoderDownload =>
			Number.parseInt(encoderDownload.url.match(/Expires=([^&]*)/)[1], 10)
		);
		const earliestExpiryTimeSeconds = Math.min(...expiryTimes);
		const timeUntilExpiry = (earliestExpiryTimeSeconds * 1000) - Date.now();

		setTimeout(() => {
			this.captureServiceClient.getEncoderUpdates()
				.then(encoderDownloads => {
					this._encoderDownloads = encoderDownloads;
					this._reloadEncoderDownloadsOnExpiry();
				});
		// The HTTP request can take some time, so we load the new URLs slightly earlier than
		// the expiry time to prevent a short span of time where the links have already expired.
		}, timeUntilExpiry - 10000);
	}

	_renderEncoderDownloadLink(encoderDownload) {
		const linkDetails = this._getPlatformLinkDetails(encoderDownload.platform);
		return html`
			<div class="d2l-capture-central-encoder-download-link-container">
				<d2l-icon-custom
					size="tier3"
				>
					${linkDetails.icon}
				</d2l-icon-custom>
				<div class="d2l-capture-central-encoder-download-link d2l-body-standard"><a href="${encoderDownload.url}">${this.localize(linkDetails.langterm)}</a></div>
			</div>
		`;
	}
}

customElements.define('d2l-capture-central-encoder', D2LCaptureCentralEncoder);
