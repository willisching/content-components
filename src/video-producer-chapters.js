import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui/core/components/colors/colors.js';
import { bodyStandardStyles, heading3Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from './internal-localize-mixin.js';

class VideoProducerChapters extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			_activeChapter: { type: Object },
			_chapters: { type: Array },
			_newChapterTitle: { type: String },
		};
	}

	static get styles() {
		return [ bodyStandardStyles, heading3Styles, css`
			.d2l-video-producer-chapters {
				border: 1px solid var(--d2l-color-mica);
				position: relative;
				width: 360px;
			}

			.d2l-video-producer-chapters-heading {
				margin: 0;
				padding: 10px;
			}

			.d2l-video-producer-chapters-container {
				height: 450px;
				overflow-y: scroll;
				padding: 10px;
				position: relative;
			}

			.d2l-video-producer-chapter {
				align-items: center;
				display: flex;
			}

			.d2l-video-producer-chapter-time {
				display: inline-block;
				font-size: 16px;
				margin: 10px;
				vertical-align: middle;
				width: 70px;
			}

			.d2l-video-producer-chapter-time.active-chapter {
				color: var(--d2l-color-celestine);
			}

			.d2l-video-producer-chapter-set-chapter-time-button {
				margin-right: 7px;
			}

			.d2l-video-producer-new-chapter-footer {
				display: flex;
				padding: 4px;
				text-align: center;
			}

			.d2l-video-producer-new-chapter-button,
			.d2l-video-producer-new-chapter-title-input {
				padding: 3px;
			}
		`];
	}

	constructor() {
		super();
		this._disableControls = false;
		this._chapters = [];
		this._newChapterTitle = '';
		this._activeChapter = null;
	}

	_addNewChapter() {
		this.dispatchEvent(new CustomEvent(
			'add-new-chapter',
			{ bubbles: true, composed: false }
		));
	}

	_deleteChapter(chapter) {
		return () => {
			this._updateActiveChapter(null);
			this._chapters = this._chapters.filter(({ time, title }) =>
				!(title === chapter.title && time === chapter.time));
		};
	}

	_getTime(time) {
		return new Date(time * 1000).toISOString().substr(11, 8);
	}

	_handleNewChapterInputTextInput({ target: { value } }) {
		this._newChapterTitle = value;
	}

	_handleNewChapterInputTextEnter({ key }) {
		if (key === 'Enter') {
			this._addNewChapter();
		}
	}

	_selectChapter(chapter) {
		return () => this._updateActiveChapter(chapter);
	}

	_setChapterToCurrentTime(chapter) {
		return () => {
			this._activeChapter = chapter;
			this.dispatchEvent(new CustomEvent(
				'set-chapter-to-current-time',
				{ bubbles: true, composed: false }
			));
		};
	}

	_sortChapters() {
		this._chapters = this._chapters.sort((a, b) => {
			if (a.time < b.time) {
				return -1;
			} else if (a.time > b.time) {
				return 1;
			} else {
				return 0;
			}
		});
		this.requestUpdate();
	}

	_updateActiveChapter(chapter) {
		this._activeChapter = chapter;
		this.dispatchEvent(new CustomEvent(
			'active-chapter-updated',
			{ bubbles: true, composed: false, detail: { chapter: this._activeChapter} }
		));
	}

	addNewChapter(time) {
		if (!this._newChapterTitle) {
			return;
		}

		const chapter = {
			time,
			title: this._newChapterTitle
		};
		this._chapters.push(chapter);
		this._sortChapters();
		this._updateActiveChapter(chapter);

		this._newChapterTitle = '';
		this.shadowRoot.querySelector('.d2l-video-producer-new-chapter-title-input').value = '';
	}

	setChapters(chapters) {
		this._chapters = chapters;
	}

	setChapterToTime(time) {
		for (let i = 0; i < this._chapters.length; i++) {
			const { time: chapterTime, title } = this._chapters[i];
			if (chapterTime === this._activeChapter.time && title === this._activeChapter.title) {
				this._chapters[i].time = time;
				this._sortChapters();
				break;
			}
		}

		const indexOfUpdatedChapter = this._chapters.findIndex(({ time, title }) =>
			time === this._activeChapter.time && title === this._activeChapter.title);
		const inputTextOfUpdatedChapter = [...this.shadowRoot
			.querySelectorAll('.d2l-video-producer-chapter d2l-input-text')
		][indexOfUpdatedChapter];

		this._updateActiveChapter(this._chapters[indexOfUpdatedChapter]);
		inputTextOfUpdatedChapter.focus();
	}

	_renderChapters() {
		if (this._chapters.length === 0) {
			return html`
				<p class="d2l-body-standard">${this.localize('noItems')}</p>
			`;
		}

		return this._chapters.map(chapter => html`
			<div class="d2l-video-producer-chapter">
				<d2l-input-text
					@click=${this._selectChapter(chapter)}
					?hidden="${chapter.active}"
					inline-edit
					class="form-control"
					value=${chapter.title}
				></d2l-input-text>
				<p class="${this._activeChapter === chapter ? 'active-chapter' : ''} d2l-video-producer-chapter-time">
					${this._getTime(chapter.time)}
				</p>
				<d2l-button-icon
					@click="${this._setChapterToCurrentTime(chapter)}"
					class="d2l-video-producer-chapter-set-chapter-time-button"
					icon="tier1:time"
					text=${this.localize('timeToSeekPosition')}
				></d2l-button-icon>
				<d2l-button-icon
					@click="${this._deleteChapter(chapter)}"
					icon="tier1:close-default"
					text="${this.localize('delete')}"
				></d2l-button-icon>
			</div>
		`);
	}

	render() {
		return html`
			<div class="d2l-video-producer-chapters">
				<h3 class="d2l-heading-3 d2l-video-producer-chapters-heading">
					${this.localize('tableOfContents')}
				</h3>
				<div class="d2l-video-producer-chapters-container">
					${this._renderChapters()}
				</div>
				<div class="d2l-video-producer-new-chapter-footer">
					<d2l-button-icon
						?disabled="${!this._newChapterTitle}"
						@click=${this._addNewChapter}
						class="d2l-video-producer-new-chapter-button"
						icon="tier1:plus-default"
						text="${this.localize('addNewChapter')}"
					></d2l-button-icon>
					<d2l-input-text
						@keyup="${this._handleNewChapterInputTextEnter}"
						@input="${this._handleNewChapterInputTextInput}"
						class="d2l-video-producer-new-chapter-title-input"
						placeholder="${this.localize('chapterTitle')}"
					></d2l-input-text>
				</div>
			</div>
		`;
	}
}
customElements.define('d2l-labs-video-producer-chapters', VideoProducerChapters);
