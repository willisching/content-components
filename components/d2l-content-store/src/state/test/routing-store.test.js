import { assert } from '@open-wc/testing';
import { toJS } from 'mobx';
import { RoutingStore } from '../routing-store.js';

describe('Routing Store', () => {
	let store;

	beforeEach(() => {
		store = new RoutingStore();
	});

	it('routing ctx is saved', () => {
		const testCtx = {
			pathname: '/d2l/contentstore/main',
			querystring: ''
		};
		store.setRouteCtx(testCtx);

		assert.deepEqual(toJS(store.routeCtx), testCtx);
	});

	it('with only page', () => {
		store.setRouteCtx({
			pathname: '/d2l/contentstore/404',
			querystring: ''
		});

		assert.equal(store.page, '404');
		assert.equal(store.subView, '');
		assert.deepEqual(store.queryParams, {});
	});

	it('with query params', () => {
		store.setRouteCtx({
			pathname: '/d2l/contentstore/123/files',
			querystring: 'foo=bar&number=5'
		});

		assert.equal(store.page, '123');
		assert.equal(store.subView, 'files');
		assert.deepEqual(toJS(store.queryParams), { foo: 'bar', number: '5' });
	});

	it('without query params', () => {
		store.setRouteCtx({
			pathname: '/d2l/contentstore/manage/files',
			querystring: ''
		});

		assert.equal(store.page, 'manage');
		assert.equal(store.subView, 'files');
		assert.deepEqual(store.queryParams, {});
	});
});
