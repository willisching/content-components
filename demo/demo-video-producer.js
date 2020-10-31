import '../src/video-producer.js';
import '../src/video-producer-chapters.js';

import { html, LitElement } from 'lit-element/lit-element.js';
class DemoVideoProducer extends LitElement {
	static get properties() {
		return {
			errorOccurred: { type: Boolean },
			languages: { type: Array },
			metadata: { type: Object },
			saveComplete: { type: Boolean },
		};
	}

	constructor() {
		super();
		this.fetchAndSetData();
		this.saveComplete = false;
		this.publishComplete = false;
		this.metadata = { cuts: [], chapters: [] };
		this.languages = [];
	}

	async fetchAndSetData() {
		await new Promise(resolve => setTimeout(resolve, 500));
		this.languages = [{
			name: 'English (United States)',
			code: 'en-us',
			isDefault: true,
		}, {
			name: 'Français (Canada)',
			code: 'fr-fr',
			isDefault: false
		}];
		this.metadata = {
			cuts: [{ in: 10, out: 60 }],
			chapters: [{
				time: 50,
				title: {
					'en-us': 'Chapter 1',
					'fr-fr': 'Çhàptêr 1',
				}
			}, {
				time: 150,
				title: {
					'en-us': 'Chapter 2',
					'fr-fr': 'Chaptér 2',
				}
			}, {
				time: 25,
				title: {
					'en-us': 'Ch 1',
					'fr-fr': 'Fr Ch 2'
				}
			}]
		};
	}
	async _handlePublish(e) {
		console.log('Publishing metadata:', e.detail);
		await new Promise(resolve => setTimeout(resolve, 1000));
		this.shadowRoot.querySelector('d2l-labs-video-producer').saveComplete = true;
	}
	async _handleSave(e) {
		console.log('Saving draft metadata:', e.detail);
		await new Promise(resolve => setTimeout(resolve, 1000));
		this.shadowRoot.querySelector('d2l-labs-video-producer').errorOccurred = Math.random() > 0.5 ? true : false;
		this.shadowRoot.querySelector('d2l-labs-video-producer').saveComplete = true;
	}
	render() {
		return html`
			<d2l-labs-video-producer
				.languages=${this.languages}
				.metadata=${this.metadata}
				@publish-metadata=${this._handlePublish}
				@save-metadata=${this._handleSave}
				src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
			></d2l-labs-video-producer>
		`;
	}
}

customElements.define('d2l-labs-video-producer-demo-producer', DemoVideoProducer);
