import { action, decorate, observable, toJS } from 'mobx';

export class PermissionStore {
	constructor(rootStore) {
		this.rootStore = rootStore;

		this.permissions = {};
	}

	getCanAccessCaptureCentral() {
		return this.permissions.canAccessCaptureCentral === 'true';
	}

	getCanManageAllVideos() {
		return this.permissions.canManageAllVideos === 'true';
	}

	getCanManageLiveEvents() {
		return this.permissions.canAccessCaptureCentral === 'true' &&
			this.permissions.canManageLiveEvents === 'true';
	}

	getCanTransferOwnership() {
		return this.permissions.canTransferOwnership === 'true';
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
