import CachedContent from './cached-content.js';

export const ContentCacheDependencyKey = 'contentCache';

export class ContentCache {
	constructor() {
		this.content = {};
	}

	add(item) {
		this.content[item.id] = new CachedContent({ item });
	}

	get(item) {
		const cachedItem = this.content[item.id];

		if (!cachedItem) {
			return item;
		}

		if (cachedItem.isStale(item)) {
			delete this.content[item.id];
			return item;
		}

		return {
			...item,
			...cachedItem.content
		};
	}
}
