import * as querystring from '@chaitin/querystring';

const basePath = '/d2l/contentstore';

export const UPDATE_PAGE = 'UPDATE_PAGE';

export const navigate = path => dispatch => {
	let pageWithQs = path;
	if (path.includes(basePath)) {
		pageWithQs = path.slice(basePath.length + 1);
	}

	const page = pageWithQs.includes('?') ? pageWithQs.slice(0, pageWithQs.indexOf('?')) : pageWithQs;
	const queryString = pageWithQs.includes('?') ? pageWithQs.slice(pageWithQs.indexOf('?') + 1) : '';
	const queryParams = querystring.parse(queryString);

	window.scrollTo(0, 0);

	dispatch(loadPage(page, queryParams));
};

const loadPage = (page, queryParams) => dispatch => {
	switch (page) {
		// Load Polyfills
		/* eslint-disable no-unused-expressions */
		case 'some-other-page':
			page = 'some-other-page';
			import('../some-other-page.js');
			break;
		default:
			page = '404';
			import('../d2l-content-store-404.js');
			break;
		/* eslint-enable no-unused-expressions */
	}

	dispatch(updatePage(page, queryParams));
};

const updatePage = (page, queryParams) => ({
	type: UPDATE_PAGE,
	page,
	queryParams
});
