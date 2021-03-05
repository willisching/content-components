import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';

// Ref: https://youtu.be/x9YDQUJx2uw?t=2160

/* @polymerMixin */
export const _dependencyProvider = superClass => class extends superClass {
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

export const DependencyProvider = dedupingMixin(_dependencyProvider);
