import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui-labs/accordion/accordion-collapse.js';

import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles, labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { inputStyles } from '@brightspace-ui/core/components/inputs/input-styles.js';
import { PageViewElement } from '../../components/page-view-element.js';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import { sharedEditStyles } from '../../components/shared-styles.js';

class D2LCaptureUploadVideo extends DependencyRequester(PageViewElement) {

	static get styles() {
		return [inputStyles, heading2Styles, labelStyles, selectStyles, sharedEditStyles, css`
			.d2l-capture-central-edit-presentation-options {
				margin: 10px 0;
			}
			.d2l-capture-central-edit-presentation-options d2l-icon {
				color: var(--d2l-color-celestine);
				margin-bottom: 5px;
				margin-right: 5px;
			}

			.d2l-capture-central-upload-video-guidelines {
				width: 750px;
				margin-bottom: 20px;
			}

			.d2l-capture-central-upload-video-guidelines div {
				margin-bottom: 20px;
			}

			#d2l-capture-central-upload-video-folder {
				width: 750px;
			}

			d2l-labs-accordion-collapse .d2l-capture-central-upload-video-file-button {
				margin-top: 20px;
			}
		`];
	}

	constructor() {
		super();
		this._folders = [{
			name: 'None',
		}, {
			name: 'Folder 1',
		}];

		this.codec = 'h.264';
		this.formats = '.mp4, .flv, .f4v, .m4v, .mov';
		this.bitrate = '150-4000 kbps';

	}

	render() {
		const { codec, formats, bitrate } = this;
		return html`
			<div class="d2l-capture-central-edit-container">
				<d2l-breadcrumbs>
					<d2l-breadcrumb @click=${this._goTo('/admin')} href="#" text="${this.localize('captureCentral')}"></d2l-breadcrumb>
					<d2l-breadcrumb-current-page text="${this.localize('uploadVideo')}"></d2l-breadcrumb-current-page>
				</d2l-breadcrumbs>
				<div class="d2l-heading-2">${this.localize('uploadVideo')}</div>
				<div class="d2l-capture-central-upload-video-guidelines">
					<div>${this.localize('uploadVideoNonCaptureGuideline')}</div>
					<div>${this.localize('uploadVideoCodecGuideline', { codec })}</div>
					<div>${this.localize('uploadVideoFormatsGuideline', { formats })}</div>
					<div>${this.localize('uploadVideoBitrateGuideline', { bitrate })}</div>
					<div>${this.localize('uploadVideoInsufficientBandwidthGuideline')}</div>
				</div>
				<d2l-labs-accordion-collapse opened flex no-icons>
					<div slot="header">${this.localize('uploadVideoStepOne')}</div>
					<d2l-button class="d2l-capture-central-upload-video-file-button">${this.localize('uploadFile')}</d2l-button>
				</d2l-labs-accordion-collapse>
				<d2l-labs-accordion-collapse opened flex no-icons>
					<div slot="header">${this.localize('uploadVideoStepTwo')}</div>
					<d2l-input-text
						label="${this.localize('title')}"
						placeholder="${this.localize('title')}"
					></d2l-input-text>
					<d2l-input-text
						label="${this.localize('presenter')}"
						placeholder="${this.localize('presenter')}"
					></d2l-input-text>
					<label for="d2l-capture-central-upload-video-folder" class="d2l-label-text">
						${this.localize('folder')}
					</label>
					<select id="d2l-capture-central-upload-video-folder" class="d2l-input-select">
						${this._folders.map(folder => (html`<option>${folder.name}</option>`))}
					</select>
				</d2l-labs-accordion-collapse>
				<d2l-button
					class="d2l-capture-central-edit-save-changes-button"
					primary
				>${this.localize('saveChanges')}
				</d2l-button>
			</div>
		`;
	}
}

window.customElements.define('d2l-capture-central-upload-video', D2LCaptureUploadVideo);
