import { css, html, LitElement } from 'lit-element/lit-element.js';
import './interactions.js';
import './objectives.js';
import './summary.js';
import '@brightspace-ui/core/components/button/button-subtle.js';
import { InternalLocalizeMixin } from '../../../../mixins/internal-localize-mixin.js';

const states = {
	summary: 'summary',
	interactions: 'interactions',
	objectives: 'objectives'
};

class Activity extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			contextId: { type: String, attribute: 'context-id' },
			serviceUrl: { type: String, attribute: 'service-url' },
			tenantId: { type: String, attribute: 'tenant-id' },
			topicId: { type: String, attribute: 'topic-id' },
			userId: { type: String, attribute: 'user-id' },

			_state: { type: String, attribute: false }
		};
	}

	static get styles() {
		return [
			css`
			.nav-container {
				display: flex;
    			flex-direction: row-reverse;
			}
			nav {
				padding-bottom: 0.5rem;
			}


			`
		];
	}

	constructor() {
		super();
		this._state = states.summary;
	}

	render() {
		return html`
		<div>
			<div class='nav-container'>
				<nav>
					<d2l-button-subtle
						id='summary-button'
						?disabled=${this._state === states.summary}
						@click=${this._goToSummary}
						text=${this.localize('summary')}
						icon='tier1:home'
					></d2l-button-subtle>
						
					<d2l-button-subtle
						id='interactions-button'
						?disabled=${this._state === states.interactions}
						@click=${this._goToInteractions}
						text=${this.localize('interactions')}
						icon='tier1:reporting'
					></d2l-button-subtle>
						
					<d2l-button-subtle
						id='objectives-button'
						?disabled=${this._state === states.objectives}
						@click=${this._goToObjectives}
						text=${this.localize('objectives')}
						icon='tier1:checklist'
					></d2l-button-subtle>
						
				</nav>
			</div>
			${this._renderContents()}
		</div>`;
	}

	async getCsv() {
		const table = this.shadowRoot.querySelector('#activity-table');
		return table.getCsv();
	}

	getState() {
		return this._state;
	}

	_goToInteractions() {
		this._state = states.interactions;
	}

	_goToObjectives() {
		this._state = states.objectives;
	}

	_goToSummary() {
		this._state = states.summary;
	}

	_renderContents() {
		switch (this._state) {
			case states.summary:
				return html`
				<d2l-activity-summary
					id='activity-table'
					context-id=${this.contextId}
					service-url=${this.serviceUrl}
					tenant-id=${this.tenantId}
					topic-id=${this.topicId}
					user-id=${this.userId}
				></d2l-activity-summary>`;
			case states.interactions:
				return html`
				<d2l-activity-interactions
					id='activity-table'
					context-id=${this.contextId}
					service-url=${this.serviceUrl}
					tenant-id=${this.tenantId}
					topic-id=${this.topicId}
					user-id=${this.userId}
				></d2l-activity-interactions>`;
			case states.objectives:
				return html`
				<d2l-activity-objectives
					id='activity-table'
					context-id=${this.contextId}
					service-url=${this.serviceUrl}
					tenant-id=${this.tenantId}
					topic-id=${this.topicId}
					user-id=${this.userId}
				></d2l-activity-objectives>`;
			default:
				break;
		}

		// should never get to this area
		return;
	}

}

customElements.define('d2l-activity', Activity);
