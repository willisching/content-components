import '@brightspace-ui/core/components/dropdown/dropdown.js';
import '@brightspace-ui/core/components/dropdown/dropdown-button.js';
import '@brightspace-ui/core/components/dropdown/dropdown-content.js';
import '@brightspace-ui/core/components/dropdown/dropdown-more.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/inputs/input-search.js';

import 'd2l-card/d2l-card.js';

import { css, html, LitElement } from 'lit-element/lit-element.js';
import { LocalizeMixin } from '@brightspace-ui/core/mixins/localize-mixin.js';

class D2LCaptureCentral extends LocalizeMixin(LitElement) {

	static get properties() {
		return {};
	}

	static get styles() {
		return css`

			:host([hidden]) {
				display: none;
			}

			.header {
				align-self: center;
				grid-column: 2 / 3;
				margin-left: 25px;
			}

			.search-videos {
				align-self: center;
				grid-column: 4 / 5;
				justify-self: end;
				margin: 25px;
				width: 300px;
			}
			.filter-folders {
				align-self: center;
				grid-column: 3 / 4;
				justify-self: end;
			}

			.video-library-container {
				display: flex;
				flex-direction: row;
				justify-content: center;
			}
			.sidebar {
				background-color: white;
				border-right: 1px solid var(--d2l-color-mica);
				box-shadow: 3px 0 3px -2px var(--d2l-color-mica);
				flex-grow: 0;
				flex-shrink: 0;
				grid-row: 1 / row-end;
				overflow-y: auto;
				padding: 1rem 0 0 calc(1rem + 30px);
				width: calc(268px - 1rem - 30px);
			}

			.video-library {
				display: grid;
				grid-row-gap: 50px;
				grid-template-columns: 300px 350px 350px 350px;
				grid-template-rows:  repeat(3, auto);
			}

			.video {
				display: flex;
				flex-direction: column;
				height: 290px;
				margin: auto;
				width: 300px;
			}
			.thumbnail {
				height: 170px;
				object-fit: cover;
				width: 300px;
			}
			.video-info {
				margin-top: -20px;
				overflow-wrap: break-word;
				overflow: hidden;
				word-wrap: break-word;
			}

			.upload-date, .views {
				display: inline-block;
			}

			.card-footer {
				border-top: 1px solid var(--d2l-color-mica);
				display: flex;
				font-size: 14px;
				justify-content: space-between;
			}
			.d2l-card-content {
				padding-top: 0;
			}
		`;
	}

	static async getLocalizeResources(langs) {
		for await (const lang of langs) {
			let translations;
			switch (lang) {
				case 'en':
					translations = await import('./locales/en.js');
					break;
			}

			if (translations && translations.val) {
				return {
					language: lang,
					resources: translations.val
				};
			}
		}

		return null;
	}

	constructor() {
		super();

		function getRandomInt(min, max) {
			min = Math.ceil(min);
			max = Math.floor(max);
			return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
		}

		const searchTerms = ['nature', 'water', 'earth', 'fire', 'air', 'city', 'sky', 'tech', 'food'];
		this.videos = [...Array(9)].map((_, i) => {
			const randomSeconds = getRandomInt(1, 60);
			return {
				thumbnail: `https://source.unsplash.com/random/?${searchTerms[i]}`,
				title: `(${i + 1}) - A newly uploaded video!`,
				duration: `${getRandomInt(0, 20)}:${randomSeconds < 10 ? '0' : ''}${randomSeconds}`,
				uploadDate: 'Today',
				views: getRandomInt(0, 100000)
			};
		});
	}

	render() {
		return html`
			<div class="video-library-container">
				<div class="video-library">
					<h2 class="header">Video Library</h2>
					<div class="sidebar"></div>
					<d2l-dropdown-button class="filter-folders" text="Folders">
						<d2l-dropdown-content>
							Some content...
						</d2l-dropdown-content>
					</d2l-dropdown-button>
					<d2l-input-search
						class="search-videos"
						label="Search for videos"
						placeholder="Search...">
					</d2l-input-search>
					${this.videos.map(video => html`
						<d2l-card class="video" text="Hydrogeology" href="#">
							<img slot="header" alt="" class="thumbnail" src="${video.thumbnail}" />
							<div class="video-info" slot="content">
								${video.title}
							</div>
							<div class="card-footer" slot="footer">
								<div class="upload-date">${video.uploadDate}</div>
								<div class="views">${video.views} views</div>
							</div>
						</d2l-card>
					`)}
				</div>
			</div>
		`;
	}

}
customElements.define('d2l-capture-central', D2LCaptureCentral);
