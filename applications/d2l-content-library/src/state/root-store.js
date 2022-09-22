import { PermissionStore } from './permission-store.js';
import { RoutingStore } from './routing-store.js';
import { Uploader } from '../../../../util/uploader.js';

export class RootStore {
	constructor() {
		this.routingStore = new RoutingStore(this);
		this.uploader = new Uploader({
			apiClient: {},
			clientApp: 'LmsCapture',
			waitForProcessing: true
		});
		this.permissionStore = new PermissionStore(this);
		this.appTop = 0;
	}
}

export const rootStore = new RootStore();
