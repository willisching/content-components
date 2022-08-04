export default class CachedContent {
	constructor({ item }) {
		this.content = item;
	}

	get content() {
		return {
			lastRevTitle: this._title,
			updatedAt: this._updatedAt
		};
	}

	set content(item) {
		this._title = item.title;
		this._updatedAt = item.updatedAt;
	}

	isStale(other) {
		return new Date(other.updatedAt).getTime() >= new Date(this._updatedAt).getTime();
	}
}
