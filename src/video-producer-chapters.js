import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import { bodySmallStyles, bodyStandardStyles, heading3Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from './internal-localize-mixin.js';

class VideoProducerChapters extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			chapters: { type: Object },
			defaultLanguage: { type: String, attribute: 'default-language' },
			loading: { type: Boolean },
			selectedLanguage: { type: String, reflect: true, attribute: 'selected-language' },
			selectedLanguageName: { type: String, reflect: true, attribute: 'selected-language-name' },
			_activeChapterIndex: { type: Number },
			_newChapterTitle: { type: String },
		};
	}

	static get styles() {
		return [  bodySmallStyles, bodyStandardStyles, heading3Styles, css`
			d2l-loading-spinner {
				margin: auto;
			}

			.d2l-video-producer-chapters {
				border: 1px solid var(--d2l-color-mica);
				position: relative;
				width: 360px;
			}

			.d2l-video-producer-chapters-heading {
				margin: 0;
				padding: 10px 10px 0;
			}

			.d2l-video-producer-chapters-heading .d2l-body-small.hidden {
				visibility: hidden;
			}

			.d2l-video-producer-chapters-container {
				display: flex;
				flex-direction: column;
				height: 450px;
				overflow-y: scroll;
				padding: 10px;
				position: relative;
			}

			.d2l-video-producer-chapter {
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
		this.loading = true;
		this.chapters = [];
		this._newChapterTitle = '';
		this._activeChapterIndex = null;
	}

	get _sortedChapters() {
		return this.chapters.map((chapter, index) => ({
			...chapter,
			originalIndex: index // Used to index into this.chapters
		})).sort((a, b) => parseFloat(a.time) - parseFloat(b.time));
	}

	get _editingOverrides() {
		return this.selectedLanguage !== this.defaultLanguage;
	}

	_addNewChapter() {
		this.dispatchEvent(new CustomEvent(
			'add-new-chapter',
			{ bubbles: true, composed: false }
		));
	}

	_deleteChapter(index) {
		return () => {
			this._updateActiveChapterIndex(null);
			this.chapters.splice(index, 1);
			this.requestUpdate();
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

	_selectChapter(index) {
		return () => this._updateActiveChapterIndex(index);
	}

	_setChapterToCurrentTime(index) {
		return () => {
			this._activeChapterIndex = index;
			this.dispatchEvent(new CustomEvent(
				'set-chapter-to-current-time',
				{ bubbles: true, composed: false }
			));
		};
	}

	_updateChapterTitle(index) {
		return event => {
			this.chapters[index].title[this.selectedLanguage] = event.target.value;
		};
	}

	_updateActiveChapterIndex(index) {
		this._activeChapterIndex = index;
		this.dispatchEvent(new CustomEvent(
			'active-chapter-updated',
			{ bubbles: true, composed: false, detail: {
				chapterTime: index === null ? null : this.chapters[index].time
			}}
		));
	}

	addNewChapter(chapterTime) {
		if (!this._newChapterTitle) {
			return;
		}

		this.chapters.push({
			time: chapterTime,
			title: {
				[this.selectedLanguage]: this._newChapterTitle,
			}
		});
		this._updateActiveChapterIndex(this.chapters.length - 1);

		this._newChapterTitle = '';
		this.shadowRoot.querySelector('.d2l-video-producer-new-chapter-title-input').value = '';
	}

	setChapterToTime(chapterTime) {
		this.chapters[this._activeChapterIndex].time = chapterTime;

		const indexOfUpdatedChapter = this._sortedChapters.findIndex(({ originalIndex }) =>
			originalIndex === this._activeChapterIndex);

		const inputTextOfUpdatedChapter = [...this.shadowRoot
			.querySelectorAll('.d2l-video-producer-chapter d2l-input-text')
		][indexOfUpdatedChapter];

		this._updateActiveChapterIndex(this._activeChapterIndex);
		inputTextOfUpdatedChapter.focus();
		this.requestUpdate();
	}

	_renderChapters() {
		if (this.loading) {
			return html`<d2l-loading-spinner size="150"></d2l-loading-spinner>`;
		}

		if (this.chapters.length === 0) {
			return html`
				<p class="d2l-body-standard">${this.localize('noItems')}</p>
			`;
		}

		return this._sortedChapters.map(({ time, title, originalIndex }) => {
			const chapterTitle = title[this.selectedLanguage] || '';
			const fallbackTitle = title[this.defaultLanguage] || '';
			return html`
				<div class="d2l-video-producer-chapter">
					<d2l-input-text
						@click=${this._selectChapter(originalIndex)}
						@change=${this._updateChapterTitle(originalIndex)}
						inline-edit
						class="form-control"
						value=${chapterTitle}
						placeholder=${fallbackTitle}
					></d2l-input-text>
					<p class="${this._activeChapterIndex === originalIndex ? 'active-chapter' : ''} d2l-video-producer-chapter-time">
						${this._getTime(time)}
					</p>
					<d2l-button-icon
						@click="${this._setChapterToCurrentTime(originalIndex)}"
						class="d2l-video-producer-chapter-set-chapter-time-button"
						icon="tier1:time"
						text=${this.localize('timeToSeekPosition')}
					></d2l-button-icon>
					<d2l-button-icon
						@click="${this._deleteChapter(originalIndex)}"
						icon="tier1:close-default"
						text="${this.localize('delete')}"
					></d2l-button-icon>
				</div>
			`;
		});
	}

	render() {
		return html`
			<div class="d2l-video-producer-chapters">
				<h3 class="d2l-heading-3 d2l-video-producer-chapters-heading">
					${this.localize('tableOfContents')}
					<div class="d2l-body-small ${this._editingOverrides ? '' : 'hidden'}">
						${this.localize('editingOverrides', { language: this.selectedLanguageName })}
					</div>
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
