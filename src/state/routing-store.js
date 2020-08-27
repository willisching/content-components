import * as querystring from '@chaitin/querystring';
import { action, decorate, observable, toJS } from 'mobx';

export const BASE_PATH = '/d2l/wcs/capture-central';
const stripBasePath = path => path.replace(/^\/(d2l\/wcs\/capture-central\/)?/, '');

export class RoutingStore {
	constructor(rootStore) {
		this.rootStore = rootStore;

		this.routeCtx = {};
		this.page = '';
		this.queryParams = {};
		this.subView = '';
		this.orgUnit;
	}

	setRouteCtx(routeCtx) {
		if (!(routeCtx && routeCtx.pathname)) {
			return;
		}

		const pathNameWithoutBase = stripBasePath(routeCtx.pathname);
		let page = pathNameWithoutBase;
		let subView = '';
		let orgUnit;

		if (pathNameWithoutBase.includes('/')) {
			[orgUnit, page, subView] = pathNameWithoutBase.split('/');
		}
		const queryParams = querystring.parse(routeCtx.querystring);

		this.routeCtx = routeCtx;
		this.page = page;
		this.subView = subView;
		this.queryParams = queryParams;
		this.orgUnit = orgUnit;
	}

	getPage() {
		return this.page;
	}

	setPage(page) {
		this.page = page;
	}

	getQueryParams() {
		return toJS(this.queryParams);
	}

	getSubView() {
		return this.subView;
	}

	setSubView(subView) {
		this.subView = subView;
	}
}

decorate(RoutingStore, {
	// props
	page: observable,
	queryParams: observable,
	subView: observable,
	// actions
	setRouteCtx: action,
	setPage: action,
	setSubView: action
});
