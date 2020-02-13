import { RoutingStore } from './routing-store.js';

export class RootStore {
	constructor() {
		this.routingStore = new RoutingStore(this);
	}
}

export const rootStore = new RootStore();
