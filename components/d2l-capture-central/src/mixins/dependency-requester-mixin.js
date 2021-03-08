import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';

// Ref: https://youtu.be/x9YDQUJx2uw?t=2160

/* @polymerMixin */
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

export const DependencyRequester = dedupingMixin(_dependencyRequester);
