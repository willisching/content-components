const SUPPORTED_AUDIO_EXTENSIONS = ['.m4a', '.mp3', '.ogg', '.wav', '.wma'];
const SUPPORTED_VIDEO_EXTENSIONS = ['.avi', '.f4v', '.flv', '.m4v', '.mov', '.mp4', '.webm', '.wmv'];

export function getExtension(filePath) {
	return filePath.split('.').pop().toLowerCase();
}

export function getSupportedExtensions() {
	return [...SUPPORTED_AUDIO_EXTENSIONS, ...SUPPORTED_VIDEO_EXTENSIONS];
}

export function isSupported(filePath) {
	return getSupportedExtensions().includes(`.${getExtension(filePath)}`);
}

export function isAudioType(filePath) {
	return SUPPORTED_AUDIO_EXTENSIONS.includes(`.${getExtension(filePath)}`);
}
