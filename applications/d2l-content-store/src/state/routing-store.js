import { action, decorate, observable, toJS } from 'mobx';
import * as querystring from '@chaitin/querystring';

export const BASE_PATH = '/d2l/contentstore';
const stripBasePath = path => path.replace(/^\/(d2l\/contentstore\/)?/, '');

export class RoutingStore {
	constructor(rootStore) {
		this.rootStore = rootStore;

		this.routeCtx = {};
		this.page = '';
		this.queryParams = {};
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

	setRouteCtx(routeCtx) {
		const pathNameWithoutBase = routeCtx && routeCtx.pathname && stripBasePath(routeCtx.pathname);
		const page = pathNameWithoutBase.includes('/') ?
			pathNameWithoutBase.slice(0, pathNameWithoutBase.indexOf('/')) :
			pathNameWithoutBase;
		const subView = pathNameWithoutBase.includes('/') ?
			pathNameWithoutBase.slice(pathNameWithoutBase.indexOf('/') + 1) :
			'';
		const queryParams = querystring.parse(routeCtx.querystring);

		this.routeCtx = routeCtx;
		this.page = page;
		this.subView = subView;
		this.queryParams = queryParams;
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
