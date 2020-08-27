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

export const contentFilterToSearchQuery = type => {
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

