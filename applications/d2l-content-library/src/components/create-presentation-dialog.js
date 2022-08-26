import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/dialog/dialog.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';

import { css, html, LitElement } from 'lit-element/lit-element.js';
import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';
import { heading2Styles, bodyStandardStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { InternalLocalizeMixin } from '../../../../mixins/internal-localize-mixin.js';
import isMobile from 'ismobilejs';

class D2LContentLibraryCreatePresentationDialog extends DependencyRequester(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			tenantId: { type: String, attribute: 'tenant-id' },
			_encoderDownloads: { type: Array, attribute: false },
		};
	}

	static get styles() {
		return [bodyStandardStyles, heading2Styles, css`
			#d2l-content-library-create-presentation-dialog-content {
				margin-top: 30px;
				min-height: 264px;
				padding-bottom: 25px;
				width: 100%;
			}

			#d2l-content-library-create-presentation-loading-container {
				display: flex;
				justify-content: center;
				width: 100%;
			}

			#d2l-content-library-create-presentation-buttons-container {
				display: flex;
				flex-direction: row;
				margin-top: 35px;
			}

			.d2l-content-library-create-presentation-button {
				margin-right: 10px;
			}
		`];
	}

	async connectedCallback() {
		super.connectedCallback();

		this.captureServiceClient = this.requestDependency('capture-service-client');

		if (isMobile(window.navigator).any) {
			this._userPlatform = 'mobile';
		} else if (navigator.userAgent.includes('Macintosh')) {
			this._userPlatform = 'mac';
		} else if (navigator.userAgent.includes('Windows')) {
			this._userPlatform = 'win';
		} else {
			this._userPlatform = 'unknown';
		}
	}

	render() {
		let content;
		if (!this._encoderDownloads && this._userPlatform !== 'mobile') {
			content = html`
				<div id='d2l-content-library-create-presentation-loading-container'>
					<d2l-loading-spinner size="100"></d2l-loading-spinner>
				</div>
			`;
		} else if (this._encoderDownloads && this._encoderDownloads.length === 0) {
			content = html`
				<p class="d2l-body-standard">${this.localize('noCaptureEncoderDownloadsAvailable')}</p>
			`;
		} else if (this._userPlatform === 'mobile') {
			content = html`
				<div id='d2l-content-library-create-presentation-downloads-container'>
					<p class="d2l-body-standard">${this.localize('captureEncoderDescription')}</p>
					<p class="d2l-body-standard"><b>${this.localize('captureEncoderDesktopOnly')}</b></p>
				</div>
			`;
		} else {
			const instructionsText = this._userPlatform === 'unknown' ? html`
				<p class="d2l-body-standard"><b>${this.localize('captureEncoderUnsupportedPlatform')}</b></p>
			` : html`
				<p class="d2l-body-standard">${this.localize('captureEncoderLaunchInstructions')}</p>
			`;
			content = html`
				<div id='d2l-content-library-create-presentation-downloads-container'></div>
					<p class="d2l-body-standard">${this.localize('captureEncoderDescription')}</p>
					${instructionsText}
					<div id="d2l-content-library-create-presentation-buttons-container">
						<d2l-button
							class="d2l-content-library-create-presentation-button"
							@click="${this._launchEncoder}"
							?disabled="${this._userPlatform === 'unknown'}"
							primary
						>
							${this.localize('launch')}
						</d2l-button>
						${this._encoderDownloads.map(encoderDownload => this._renderEncoderDownloadButton(encoderDownload))}
					</div>
				</div>
			`;
		}

		return html`
			<d2l-dialog
				id="containing-dialog"
				title-text="${this.localize('captureEncoder')}"
				width="700"
			>
				<div id="d2l-content-library-create-presentation-dialog-content">
					${content}
				</div>
			</d2l-dialog>
		`;
	}

	async open() {
		this.shadowRoot.getElementById('containing-dialog').open();

		if (!this._encoderDownloads && this._userPlatform !== 'mobile') {
			await this._loadEncoderDownloads();
			if (this._encoderDownloads && this._encoderDownloads.length > 0) {
				this._reloadEncoderDownloadsOnExpiry();
			}
		}
	}

	_getEncoderDownloadText(platform) {
		switch (platform.toLowerCase()) {
			case 'mac':
				return this.localize('downloadForMac');
			case 'win':
				return this.localize('downloadForWindows');
			default:
				throw new Error(`Invalid platform name: ${platform}`);
		}
	}

	_launchEncoder() {
		window.location.href = `d2lce://configure?tenantId=${this.tenantId}`;
	}

	async _loadEncoderDownloads() {
		this._encoderDownloads = await this.captureServiceClient.getEncoderUpdates();

		if (this._encoderDownloads && this._encoderDownloads.length > 0) {
			const downloadMatchingUserPlatform = this._encoderDownloads.find(encoderDownload => encoderDownload.platform === this._userPlatform);
			if (downloadMatchingUserPlatform && this._encoderDownloads[0].url !== downloadMatchingUserPlatform.url) {
				// Move the download matching the user's platform to the start of the list so that it shows up first on the page.
				const reorderedEncoderDownloads = this._encoderDownloads.filter(encoderDownload => encoderDownload.url !== downloadMatchingUserPlatform.url);
				reorderedEncoderDownloads.unshift(downloadMatchingUserPlatform);
				this._encoderDownloads = reorderedEncoderDownloads;
			}
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
			this._loadEncoderDownloads()
				.then(() => {
					this._reloadEncoderDownloadsOnExpiry();
				});
		// The HTTP request can take some time, so we load the new URLs slightly earlier than
		// the expiry time to prevent a short span of time where the links have already expired.
		}, timeUntilExpiry - 10000);
	}

	_renderEncoderDownloadButton(encoderDownload) {
		const downloadText = this._getEncoderDownloadText(encoderDownload.platform);
		const downloadEncoderFromUrl = () => {
			// We use this approach to force the browser to open a download prompt without opening a new tab.
			const tempDownloadAnchor = document.createElement('a');
			tempDownloadAnchor.href = encoderDownload.url;
			tempDownloadAnchor.target = '_self';
			tempDownloadAnchor.download = encoderDownload.url;
			tempDownloadAnchor.click();
		};
		return html`
			<d2l-button
				class="d2l-content-library-create-presentation-button"
				@click="${downloadEncoderFromUrl}"
				size="tier3"
			>
				${downloadText}
			</d2l-button>
		`;
	}
}

customElements.define('d2l-content-library-create-presentation-dialog', D2LContentLibraryCreatePresentationDialog);
