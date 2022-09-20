import ContentType from './content-type.js';

export function getIcon(type, defaultValue = null) {
	switch (type) {
		case ContentType.AUDIO: return 'tier1:file-audio';
		case ContentType.VIDEO: return 'tier1:file-video';
		default: return defaultValue;
	}
}
