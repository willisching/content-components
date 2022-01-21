import { action, decorate, observable, toJS } from 'mobx';

export class PermissionStore {
	constructor(rootStore) {
		this.rootStore = rootStore;

		this.permissions = {};
	}

	getCanManageAllVideos() {
		return this.permissions.canManageAllVideos === 'true';
	}

	getCanManageCaptureCentral() {
		return true; // TODO: update after permission is added
	}

	getCanManageLiveEvents() {
		return this.permissions.canAccessCaptureCentral === 'true' &&
			this.permissions.canManageLiveEvents === 'true';
	}

	getCanViewLiveEvents() {
		return this.permissions.canAccessCaptureCentral === 'true' &&
			this.permissions.canViewLiveEvents === 'true';
	}

	getPermissions() {
		return toJS(this.permissions);
	}

	setPermissions(permissions) {
		this.permissions = permissions;
	}
}

decorate(PermissionStore, {
	// props
	permissions: observable,
	// actions
	setPermissions: action,
});
