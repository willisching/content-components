import { action, decorate, observable, toJS } from 'mobx';

export class PermissionStore {
	constructor(rootStore) {
		this.rootStore = rootStore;

		this.permissions = {};
	}

	setPermissions(permissions) {
		this.permissions = permissions;
	}

	getPermissions() {
		return toJS(this.permissions);
	}

	getCanViewLiveEvents() {
		return this.permissions.canAccessCaptureCentral === 'true' &&
			this.permissions.canViewLiveEvents === 'true';
	}

	getCanManageCaptureCentral() {
		return true; // TODO: update after permission is added
	}

	getCanManageLiveEvents() {
		return this.permissions.canAccessCaptureCentral === 'true' &&
			this.permissions.canManageLiveEvents === 'true';
	}
}

decorate(PermissionStore, {
	// props
	permissions: observable,
	// actions
	setPermissions: action,
});
