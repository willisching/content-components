const SUPPORTED_VIDEO_EXTENSIONS = ['.avi', '.f4v', '.flv', '.m4v', '.mov', '.mp4', '.webm', '.wmv'];
const SUPPORTED_AUDIO_EXTENSIONS = ['.m4a', '.mp3', '.ogg', '.wav', '.wma'];

export function getExtension(filePath) {
	return filePath.split('.').pop().toLowerCase();
}

export function getSupportedExtensions() {
	return SUPPORTED_VIDEO_EXTENSIONS.concat(SUPPORTED_AUDIO_EXTENSIONS);
}

export function isSupported(filePath) {
	return getSupportedExtensions().includes(`.${getExtension(filePath)}`);
}
