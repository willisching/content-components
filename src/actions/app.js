const basePath = '/d2l/contentstore';

export const UPDATE_PAGE = 'UPDATE_PAGE';

export const navigate = path => dispatch => {
	let pageWithQs = path;
	if (path.includes(basePath)) {
		pageWithQs = path.substring(basePath.length + 1);
	}

	const page = pageWithQs.includes('?') ? pageWithQs.substring(0, pageWithQs.indexOf('?')) : pageWithQs;

	dispatch(loadPage(page, {}));
};

const loadPage = (page, queryParams) => dispatch => {
	switch (page) {
		case 'some-other-page':
			page = 'some-other-page';
			import('../some-other-page.js');
			break;
		default:
			page = '404';
			import('../d2l-content-store-404.js');
			break;
	}

	dispatch(updatePage(page, queryParams));
};

const updatePage = (page, queryParams) => ({
	type: UPDATE_PAGE,
	page,
	queryParams,
});
