import Moment from 'moment/src/moment';

export const getFriendlyDate = (date) => {
	const dt = Moment(date);
	const f = 'MMMM Do, YYYY';
	return dt.format(f);
};

export const getFriendlyDateTime = (date) => {
	const dt = Moment(date);
	const f = 'MMMM Do, YYYY, h:mm A';
	return dt.format(f);
};

export const getFriendlyDateFromNow = (date) => {
	const dt = Moment(date);
	return dt.fromNow();
};
