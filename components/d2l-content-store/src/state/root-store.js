import { RoutingStore } from './routing-store.js';
import { Uploader } from './uploader.js';

export class RootStore {
	constructor() {
		this.routingStore = new RoutingStore(this);
		this.uploader = new Uploader({ apiClient: {} });

		this.appTop = 0;
	}
}

export const rootStore = new RootStore();
