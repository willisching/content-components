import * as querystring from '@chaitin/querystring';

const stripBasePath = path => path.replace(/^\/(d2l\/contentstore\/)?/, '');

export const UPDATE_PAGE = 'UPDATE_PAGE';
export const LOAD_CONFIG = 'LOAD_CONFIG';

export const loadConfig = ({ ...config }) => ({
	type: LOAD_CONFIG,
	...config
});

export const navigate = path => dispatch => {
	const pageWithQs = stripBasePath(path);
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
		case 'my-objects':
			import('../my-objects.js');
			break;
		case 'some-other-page':
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
