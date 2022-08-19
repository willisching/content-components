const buildShareLocationStr = (type, id) => `${type}:${id}`;

export const buildOrgUnitShareLocationStr = id => buildShareLocationStr('ou', String(id));

const isSame = (shareLocationObj, shareLocationStr) =>
	shareLocationObj.id.toString() === shareLocationStr.slice(Math.max(0, shareLocationStr.indexOf(':') + 1));

export const getFirstAllowedCurrentShareLocation = (allowedShareLocationObjs, currentShareLocationStrs) =>
	allowedShareLocationObjs &&
	currentShareLocationStrs &&
	allowedShareLocationObjs.find(shareLocationObj =>
		currentShareLocationStrs.some(shareLocationStr =>
			isSame(shareLocationObj, shareLocationStr)));

export const isSharingToAllAllowedShareLocations = (allowedShareLocationObjs, currentShareLocationStrs) =>
	allowedShareLocationObjs &&
	currentShareLocationStrs &&
	allowedShareLocationObjs.every(shareLocationObj =>
		currentShareLocationStrs.find(shareLocationStr =>
			isSame(shareLocationObj, shareLocationStr)));

