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

export const contentTypeFilters = [
	'audio',
	'video',
	'image',
	'document',
	'presentation',
	'spreadsheet',
	'pdf',
	'googledrive',
	'onedrive',
	'scorm'
];

export const filterToTypes = type => {
	switch (type.toLowerCase()) {
		case 'scorm':
			return 'Scorm';
		case 'audio':
			return 'Audio,M4a,Mp3';
		case 'video':
			return 'Video,M4v,Mp4,Mov';
		case 'image':
			return 'Gif,Jpg,Png';
		case 'pdf':
			return 'Pdf';
		case 'spreadsheet':
			return 'Xls,Xlsx';
		case 'presentation':
			return 'Odp,Pps,Ppsx,Ppt,Pptx';
		case 'document':
			return 'Doc,Docx,Odt,Rtf,Txt';
		case 'onedrive':
			return 'Office365';
		case 'googledrive':
			return 'GoogleDrive';
		default:
			return '';
	}
};

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

export const useNewWindowForDownload = type => {
	switch (type.toLowerCase()) {
		case 'scorm':
		case 'pdf':
		case 'unprocessedfile':
			return false;
		default:
			return true;
	}
};

const fullKey = key => `contentType${key}`;

export default {
	toColors: typeToColors,
	toIcon: typeToIcon,
	localizationKey: typeLocalizationKey
};
