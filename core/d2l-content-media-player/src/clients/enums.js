import Enum from 'enum';

const VideoFormat = new Enum({
	LD: 0,
	HD: 1,
	SD: 2,
	MP3: 3
});

const ContentType = new Enum({
	Video: 1,
	Audio: 2
});

export { VideoFormat, ContentType };
