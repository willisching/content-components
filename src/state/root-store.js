import { RoutingStore } from './routing-store.js';

export class RootStore {
	constructor() {
		this.routingStore = new RoutingStore(this);
		this.orgUnit = 0;
		this.appTop = 0;
	}
}

export const rootStore = new RootStore();
