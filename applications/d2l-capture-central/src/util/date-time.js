import { formatDate, formatDateTime } from '@brightspace-ui/intl/lib/dateTime.js';
import { getLanguage } from '@brightspace-ui/intl/lib/common.js';

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const thirtySeconds = 30 * second;
const halfHour = 30 * minute;
const hourAndHalf = 90 * minute;
const fortyFiveMinutes = 45 * minute;
const threeAndAHalfDays = 84 * hour;
const sixHours = 6 * hour;

const defaultRtf = Intl && Intl.RelativeTimeFormat &&
	new Intl.RelativeTimeFormat(getLanguage(), {
		localeMatcher: 'best fit',
		numeric: 'auto',
		style: 'long'
	});

const midnightTime = dateTime =>
	new Date(
		dateTime.getFullYear(),
		dateTime.getMonth(),
		dateTime.getDate()
	).getTime();

const noonTime = dateTime =>
	new Date(
		dateTime.getFullYear(),
		dateTime.getMonth(),
		dateTime.getDate(),
		12
	).getTime();

// Adapted from:
// https://search.d2l.dev/xref/lms/lp/framework/web/D2L.LP.Web/UI/JavaScript/Globalization/Formatting/DateTime/DateTimeFormatter.js?r=438b5dc3#125
//
// but modified to work with:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat
//
const formatRelative = formatFunction => (inputDate, {
	absoluteFormat = 'short',
	origin = new Date(),
	onUpdate = null,
	rtf = defaultRtf
} = {}) => {
	let timerId = 0;

	const run = formatFunction => (inputDate, {
		absoluteFormat = 'short',
		origin = new Date(),
		onUpdate = null,
		rtf = defaultRtf
	} = {}) => {
		const midnight = midnightTime(origin);
		const noon = noonTime(origin);
		const now = origin.getTime();

		const sameDay = midnightTime(inputDate) === midnight;
		const timespan = inputDate.getTime() - origin.getTime();
		const timespanFromNoon = inputDate.getTime() - noon;
		const timespanAbs = Math.abs(timespan);
		const isPast = timespan < 0;

		let text;
		let timeout;
		if (rtf && timespanAbs < thirtySeconds) {
			text = rtf.format(Math.round(timespan / second), 'second');
			timeout = isPast ?
				thirtySeconds - timespanAbs :
				thirtySeconds + timespanAbs;
		} else if (rtf && timespanAbs < fortyFiveMinutes) {
			text = rtf.format(Math.round(timespan / minute), 'minute');
			timeout = minute;
		} else if (rtf && (timespanAbs < sixHours || sameDay)) {
			const minutes = (timespanAbs % hour);
			text = rtf.format(Math.round(timespan / hour), 'hour');
			timeout = (isPast ? hourAndHalf - minutes : halfHour + minutes) % hour;
		} else if (rtf && Math.abs(timespanFromNoon) < threeAndAHalfDays) {
			text = rtf.format(Math.round(timespanFromNoon / day), 'day');
			timeout = noon - now + (now < noon ? 0 : day);
		} else {
			text = formatFunction(inputDate, { format: absoluteFormat });
			timeout = -1;
		}

		if (timeout > 0) {
			timeout = Math.max(timeout, 1000);
		}

		if (onUpdate) {
			const updateResult = onUpdate(text, { nextUpdateInMilliseconds: timeout });
			const shouldCancel = updateResult === false;
			if (!shouldCancel && timeout > 0) {
				timerId = setTimeout(() => {
					run(formatFunction)(inputDate, {
						absoluteFormat,
						onUpdate,
						rtf
					});
				}, timeout);
			}
		}

		return text;
	};

	const stop = () => {
		clearTimeout(timerId);
		timerId = 0;
	};

	const text = run(formatFunction)(inputDate, {
		absoluteFormat,
		origin,
		onUpdate,
		rtf
	});

	if (onUpdate) {
		return { text, stop };
	}

	return text;
};

export const getTimeZoneOrTimeZoneOffset = () => {
	if (Intl && Intl.DateTimeFormat) {
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		if (timeZone) return timeZone;
	}

	const date = new Date();
	const offsetInMinutes = date.getTimezoneOffset();
	const hours = Math.floor(offsetInMinutes / 60);
	const minutes = offsetInMinutes % 60;

	return `${offsetInMinutes > 0 ? '-' : '+'}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const millisecondsPer = { second, minute, hour, day };
export const formatRelativeDate = formatRelative(formatDate);
export const formatRelativeDateTime = formatRelative(formatDateTime);
