import { css, html, LitElement } from 'lit-element/lit-element.js';
import {radioStyles} from '@brightspace-ui/core/components/inputs/input-radio-styles.js';
import { InternalLocalizeMixin } from '../../../mixins/internal-localize-mixin.js';

class Scroller extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			hasMore: { type: Boolean },
			isLoading: { type: Boolean },
		};
	}

	static get styles() {
		return [radioStyles, css`
			.item-container {
				height: 100%;
				overflow-y: auto;
				padding-right: 3px;
				position: relative;
			}

			.padding {
				height: 30px;
			}
		`];
	}

	constructor() {
		super();

		this.items = [];
		this.isLoading = false;
		this.lastItemObserver = null;
	}

	firstUpdated() {
		super.firstUpdated();

		const callback = (entries, observer) => {
			entries.forEach(async entry => {
				if (entry.isIntersecting) {
					observer.unobserve(entry.target);
					if (this.hasMore) {
						this._loadMore();
					}
				}
			});
		};

		const options = {
			root: this.shadowRoot.querySelector('.item-container'),
			rootMargin: '0px',
			threshold: 0.25,
		};

		this.lastItemObserver = new IntersectionObserver(callback, options);

		this._loadMore();
	}

	render() {
		return html`
		<div class="item-container">
			<slot></slot>
			<div class="padding"></div>
		</div>
		`;
	}

	async updated(changedProperties) {
		super.updated();

		if (changedProperties.has('isLoading')) {
			// if items have been retrieved
			if (!this.isLoading) {
				this.lastItemObserver.disconnect();
				const lastElem = this.getLastElement();
				if (this.hasMore && lastElem !== null) {
					this.lastItemObserver.observe(lastElem);
				}
			}
		}
	}

	getLastElement() {
		const slot = this.shadowRoot.querySelector('slot');
		const children = slot.assignedElements({flatten: true});
		if (children.length === 0) return null;
		return children[children.length - 1];
	}

	_loadMore() {
		this.dispatchEvent(new CustomEvent('load-more'));
	}
}

customElements.define('d2l-scroller', Scroller);
