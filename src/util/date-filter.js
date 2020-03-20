export const dateFilterToSearchQuery = dateFilter => {
	switch (dateFilter) {
		case 'today':
			return 'now/d';
		case 'yesterday':
			return 'now-1d,now-1d/d';
		case 'last7days':
			return 'now/d';
		case 'last30days':
			return 'now-30d';
		case 'last90days':
			return 'now-90d';
		default:
			return '';
	}
};

export const dateFilters = ['today', 'yesterday', 'last7days', 'last30days', 'last90days'];
