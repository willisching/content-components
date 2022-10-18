import { css, html, LitElement } from 'lit-element/lit-element.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import './src/topic-summary.js';
import './src/user-summary.js';
import './src/topic-detail.js';
import './src/user-detail.js';
import './src/activity.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';

const tabStates = {
	topic: 'topic',
	user: 'user'
};

const subStates = {
	summary: 'summary',
	detail: 'detail',
	activity: 'activity',
};

const breadcrumbNavOrder = [subStates.summary, subStates.detail, subStates.activity];

class ScormReports extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			contextId: { type: String, attribute: 'context-id' },
			serviceUrl: { type: String, attribute: 'service-url' },
			tenantId: { type: String, attribute: 'tenant-id' },

			_tabState: { type: String, attribute: false },
			_subState: { type: String, attribute: false },
			_topicId: { type: String, attribute: false },
			_userId: { type: String, attribute: false },

			_navList: { type: Array, attribute: false}
		};
	}

	static get styles() {
		return css`

			.action-container {
				margin: 0;
				padding: 0;
				padding-bottom: 1rem;
			}

			.tabs-header {
				margin-bottom: -2px;
				z-index: 1;
				position: relative;
			}

			.tabs-header button {
				border-color: transparent;
				border-radius: 6px 6px 0 0;
				background-color: transparent;
				font-size: 16px;
				font-weight: normal;
				padding: 14px 30px;
			}

			.tabs-header button.selected {
				border: solid;
				border-color: #d3d9e3;
				border-radius: 6px 6px 0 0;
				border-bottom: solid 1px white;
				font-weight: bold;
			}

			.tabs-container {
				border: solid 1px #d3d9e3;
				box-sizing: border-box;
				padding: 10px;
				z-index: 0;
				overflow: auto;
			}

			.tabs-header button:hover, .tabs-header button:focus {
				text-decoration: underline;
				color: #1c5295;
				box-shadow: none;
			}

			d2l-breadcrumbs {
				color: #202122;
				font-family: inherit;
				font-weight: 400;
				line-height: 1rem;
				letter-spacing: 0.02rem;
				padding: 0;
				list-style: none outside none;
				margin: 15px 20px;
			}
		`;
	}

	constructor() {
		super();
		this._tabState = tabStates.topic;
		this._subState = subStates.summary;
		this._topicId = null;
		this._userId = null;
		this._navList = [];
	}

	firstUpdated() {
		super.firstUpdated();
		this._navList = [this.localize('content')];
	}

	render() {
		return html`
			<div class='action-container'>
				<d2l-button @click=${this._exportCsv}>
					${this.localize('exportStatistics')}
				</d2l-button>
			</div>
			<div>
				<div class='tabs-header'>
					<button
						id='topic-tab-button'
						class=${this._tabState === tabStates.topic ? 'selected' : ''}
						@click=${this._goToTopicSummary}
					>
						${this.localize('content')}
					</button>
					<button
						id='user-tab-button'
						class=${this._tabState === tabStates.user ? 'selected' : ''}
						@click=${this._goToUserSummary}
					>
						${this.localize('users')}
					</button>
				</div>
				<div class='tabs-container'>
					${this._renderBreadcrumbs()}
					${this._renderContents()}
				</div>
			</div>
		`;
	}

	_downloadCsv(filename, data) {
		const anchor = document.createElement('a');
		anchor.href = `data:text/plain;charset=utf-8,${ encodeURIComponent(data)}`;
		anchor.download = filename;

		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
	}

	async _exportCsv() {
		const table = this.shadowRoot.querySelector('#reports-table');
		let filename;
		if (this._subState === subStates.activity) {
			const activityTable = table.shadowRoot.querySelector('#activity-table');
			filename = `${activityTable.getState()}.csv`;
		} else {
			filename = `${this._tabState}-${this._subState}.csv`;
		}
		const data = await table.getCsv();

		this._downloadCsv(filename, data);
	}

	_goToActivity({detail: { topicId, userId, name }}) {
		this._topicId = topicId;
		this._userId = userId;
		this._subState = subStates.activity;
		this._navList.push(name);
	}

	_goToTopicDetails({ detail: { topicId, name } }) {
		this._topicId = topicId;
		this._tabState = tabStates.topic;
		this._subState = subStates.detail;
		this._navList.push(name);
	}

	_goToTopicSummary() {
		this._tabState = tabStates.topic;
		this._subState = subStates.summary;
		this._navList = [this.localize('content')];
	}

	_goToUserDetails({ detail: { userId, name } }) {
		this._userId = userId;
		this._tabState = tabStates.user;
		this._subState = subStates.detail;
		this._navList.push(name);
	}

	_goToUserSummary() {
		this._tabState = tabStates.user;
		this._subState = subStates.summary;
		this._navList = [this.localize('users')];
	}

	_navBack(ind) {
		return () => {
			this._navList = this._navList.slice(0, ind + 1);
			this._subState = breadcrumbNavOrder[ind];
		};
	}

	_renderBreadcrumbs() {
		return html`
		<d2l-breadcrumbs>
		${this._navList.map((text, ind) => {
		if (ind === this._navList.length - 1) {
			return html`<d2l-breadcrumb-current-page text=${text} href="#"></d2l-breadcrumb-current-page>`;
		}
		return html`<d2l-breadcrumb text=${text} @click=${this._navBack(ind)} href="#"></d2l-breadcrumb>`;
	})
}
		</d2l-breadcrumbs>`;
	}

	_renderContents() {
		switch (this._subState) {
			case subStates.summary:
				if (this._tabState === tabStates.topic) {
					return html`
					<d2l-topic-summary
						id='reports-table'
						context-id=${this.contextId}
						service-url=${this.serviceUrl}
						tenant-id=${this.tenantId}
						@go-topic-detail=${this._goToTopicDetails}
					></d2l-topic-summary>`;
				} else {
					return html`
					<d2l-user-summary
						id='reports-table'
						context-id=${this.contextId}
						service-url=${this.serviceUrl}
						tenant-id=${this.tenantId}
						@go-user-detail=${this._goToUserDetails}
					></d2l-user-summary>`;
				}
			case subStates.detail:
				if (this._tabState === tabStates.topic) {
					return html`
					<d2l-topic-detail
						id='reports-table'
						context-id=${this.contextId}
						service-url=${this.serviceUrl}
						tenant-id=${this.tenantId}
						topic-id=${this._topicId}
						@go-activity=${this._goToActivity}
					></d2l-topic-detail>`;
				} else {
					return html`
					<d2l-user-detail
						id='reports-table'
						context-id=${this.contextId}
						service-url=${this.serviceUrl}
						tenant-id=${this.tenantId}
						user-id=${this._userId}
						@go-activity=${this._goToActivity}
					></d2l-user-detail>`;
				}
			case subStates.activity:
				return html`<d2l-activity
					id='reports-table'
					context-id=${this.contextId}
					service-url=${this.serviceUrl}
					tenant-id=${this.tenantId}
					user-id=${this._userId}
					topic-id=${this._topicId}
				></d2l-activity>`;
			default:
				break;
		}
	}

}

customElements.define('d2l-scorm-reports', ScormReports);
