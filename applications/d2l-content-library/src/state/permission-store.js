import { action, decorate, observable, toJS } from 'mobx';

export class PermissionStore {
	constructor(rootStore) {
		this.rootStore = rootStore;

		this.permissions = {};
	}

	getCanAccessContentLibrary() {
		return this.permissions.canAccessContentLibrary === 'true';
	}

	getCanManageAllObjects() {
		return this.permissions.canManageAllObjects === 'true';
	}

	getCanTransferOwnership() {
		return this.permissions.canTransferOwnership === 'true';
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
