import { dedupeMixin } from '@open-wc/dedupe-mixin';

// Ref: https://youtu.be/x9YDQUJx2uw?t=2160

const _dependencyProvider = superClass => class extends superClass {
	constructor() {
		super();

		this.__providerInstances = new Map();

		this.addEventListener('request-dependency', event => {
			const { key } = event.detail;
			if (this.__providerInstances.has(key)) {
				event.detail.instance = this.__providerInstances.get(key);
				event.stopPropagation();
			}
		});
	}

	provideDependency(key, instance) {
		this.__providerInstances.set(key, instance);
	}
};

const _dependencyRequester = superClass => class extends superClass {
	requestDependency(key) {
		const event = new CustomEvent('request-dependency', {
			detail: { key },
			bubbles: true,
			cancelable: true,
			composed: true // cross shadowDom boundaries
		});

		this.dispatchEvent(event);

		return event.detail.instance;
	}
};

export const DependencyRequester = dedupeMixin(_dependencyRequester);
export const DependencyProvider = dedupeMixin(_dependencyProvider);
