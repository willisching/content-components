// See: https://github.com/Brightspace/d2l-content-service/blob/master/shared/util/enums.js#L85
//
// Audio
// Doc
// Docx
// Gif
// GoogleDrive
// Jpg
// M4a
// M4v
// Mov
// Mp3
// Mp4
// Odp
// Odt
// Office365
// Pdf
// Png
// Pps
// Ppsx
// Ppt
// Pptx
// Rtf
// Scorm
// Txt
// UnprocessedFile
// Video
// Xls
// Xlsx

export const typeToIcon = type => {
	switch (type.toLowerCase()) {
		case '':
			return 'no-entry';
		case 'scorm':
			return 'scorm';
		case 'video':
		case 'm4v':
		case 'mp4':
		case 'mov':
			return 'file-video';
		case 'audio':
		case 'm4a':
		case 'mp3':
			return 'file-audio';
		case 'gif':
		case 'jpg':
		case 'png':
			return 'file-image';
		case 'odp':
		case 'pps':
		case 'ppsx':
		case 'ppt':
		case 'pptx':
			return 'file-presentation';
		default:
			return 'file-document';
	}
};

export const typeToColors = type => {
	switch (type.toLowerCase()) {
		case '':
			return ['white', 'white'];
		case 'video':
			return ['celestine', 'white'];
		default:
			return ['carnelian', 'white'];
	}
};

export const typeLocalizationKey = type => {
	switch (type.toLowerCase()) {
		case 'scorm':
			return fullKey('Scorm');
		case 'video':
			return fullKey('VideoNote');
		default:
			return null;
	}
};

const fullKey = key => `contentType${key}`;

export default {
	toColors: typeToColors,
	toIcon: typeToIcon,
	localizationKey: typeLocalizationKey
};
