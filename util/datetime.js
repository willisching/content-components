import { getDocumentLocaleSettings } from '@brightspace-ui/intl/lib/common.js';
import { formatDistance } from 'date-fns';
import {
	ar,
	cy,
	da,
	de,
	enUS,
	es,
	fr,
	frCA,
	ja,
	ko,
	nl,
	pt,
	sv,
	tr,
	zhCN,
	zhTW
} from 'date-fns/locale';

const langs = {
	ar,
	cy,
	da,
	de,
	en: enUS,
	es,
	fr,
	'fr-on': frCA,
	ja,
	ko,
	nl,
	pt,
	sv,
	tr,
	zh: zhCN,
	'zh-cn': zhCN,
	'zh-tw': zhTW
};

const fallbackLang = 'en';

const getLocale = () => {
	const l = getDocumentLocaleSettings().language;
	const lang = l.toLowerCase();
	let baseLang;
	if (lang.includes('-')) {
		baseLang = lang.split('-')[0];
	}

	if (langs[lang]) {
		return langs[lang];
	} else if (baseLang && langs[baseLang]) {
		return langs[baseLang];
	} else {
		return langs[fallbackLang];
	}
};

export const getFriendlyDateFromNow = (date) => {
	const locale = getLocale();
	return formatDistance(new Date(date), new Date(), { addSuffix: true, locale });
};
