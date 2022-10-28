import ContentType from './content-type.js';

export const supportedTypeExtensions = {
	[ContentType.AUDIO]: ['.m4a', '.mp3', '.ogg', '.wav', '.wma'],
	[ContentType.VIDEO]: ['.avi', '.f4v', '.flv', '.m4v', '.mov', '.mp4', '.webm', '.wmv'],
	[ContentType.SCORM]: ['.zip'],
	[ContentType.DOCUMENT]: ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.pdf'],
	[ContentType.IMAGE]: ['.jpg', '.jpeg', '.png'],
};

export function getExtension(filePath) {
	const pathParts = filePath.split('.');
	// Ensure that does not mistake an extensionless name for a type
	return pathParts.length > 1 ? `.${pathParts.pop().toLowerCase()}` : null;
}

export function getSupportedExtensions(contentType = Object.keys(supportedTypeExtensions).flat(1)) {
	return contentType.flatMap(mediaType => supportedTypeExtensions[mediaType]);
}

export function isSupported(filePath, contentType) {
	return getSupportedExtensions(contentType).includes(getExtension(filePath));
}

export function isAudioType(filePath) {
	return supportedTypeExtensions[ContentType.AUDIO].includes(getExtension(filePath));
}

export function isVideoType(filePath) {
	return supportedTypeExtensions[ContentType.VIDEO].includes(getExtension(filePath));
}

export function getType(filePath) {
	return Object.keys(supportedTypeExtensions).find(type =>
		supportedTypeExtensions[type].includes(getExtension(filePath))
	);
}
