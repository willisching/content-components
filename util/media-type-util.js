export const supportedTypeExtensions = {
	Audio: ['.m4a', '.mp3', '.ogg', '.wav', '.wma'],
	Video: ['.avi', '.f4v', '.flv', '.m4v', '.mov', '.mp4', '.webm', '.wmv'],
	Scorm: ['.zip'],
};

export function getExtension(filePath) {
	const pathParts = filePath.split('.');
	// Ensure that does not mistake an extensionless name for a type
	return pathParts.length > 1 ? `.${pathParts.pop().toLowerCase()}` : null;
}

export function getSupportedExtensions() {
	return Object.values(supportedTypeExtensions).flat(1);
}

export function isSupported(filePath) {
	return getSupportedExtensions().includes(getExtension(filePath));
}

export function isAudioType(filePath) {
	return supportedTypeExtensions.Audio.includes(getExtension(filePath));
}

export function isVideoType(filePath) {
	return supportedTypeExtensions.Video.includes(getExtension(filePath));
}

export function getType(filePath) {
	return Object.keys(supportedTypeExtensions).find(type =>
		supportedTypeExtensions[type].includes(getExtension(filePath))
	);
}
