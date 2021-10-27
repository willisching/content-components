import Enum from 'enum';

const VideoFormat = new Enum({
	LD: 0,
	HD: 1,
	SD: 2,
	MP3: 3
});

const ContentType = new Enum({
	Doc: 0,
	Docx: 1,
	Gif: 2,
	GoogleDrive: 3,
	Jpg: 4,
	M4a: 5,
	M4v: 6,
	Mov: 7,
	Mp3: 8,
	Mp4: 9,
	Odp: 10,
	Odt: 11,
	Office365: 12,
	Pdf: 13,
	Png: 14,
	Pps: 15,
	Ppsx: 16,
	Ppt: 17,
	Pptx: 18,
	Rtf: 19,
	Txt: 20,
	Scorm: 21,
	UnprocessedFile: 22,
	Video: 23,
	Xls: 24,
	Xlsx: 25,
	Audio: 26
});

export { VideoFormat, ContentType };
