import * as querystring from '@chaitin/querystring';
import { action, decorate, observable, toJS } from 'mobx';

export const BASE_PATH = '/d2l/wcs/content-library';
const stripBasePath = path => path.replace(/^\/(d2l\/wcs\/content-library\/)?/, '');

export class RoutingStore {
	constructor(rootStore) {
		this.rootStore = rootStore;

		this.orgUnitId = '';
		this.page = '';
		this.params = {};
		this.previousPage = '';
		this.previousSubView = '';
		this.queryParams = {};
		this.routeCtx = {};
		this.subView = '';
	}

	getPage() {
		return this.page;
	}

	getQueryParams() {
		return toJS(this.queryParams);
	}

	getSubView() {
		return this.subView;
	}

	setPage(page) {
		this.page = page;
	}

	setPreviousPage() {
		this.previousPage = this.page;
		this.previousSubView = this.subView;
	}

	setRouteCtx(routeCtx) {
		if (!(routeCtx && routeCtx.pathname)) {
			return;
		}

		const pathNameWithoutBase = stripBasePath(routeCtx.pathname);
		let page = pathNameWithoutBase;
		let subView = '';
		if (pathNameWithoutBase.includes('/')) {
			[page, subView] = pathNameWithoutBase.split('/');
		}
		const queryParams = querystring.parse(routeCtx.querystring);

		this.orgUnitId = queryParams.ou;
		this.page = page;
		this.params = routeCtx.params;
		this.subView = subView;
		this.queryParams = queryParams;
		this.routeCtx = routeCtx;
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
