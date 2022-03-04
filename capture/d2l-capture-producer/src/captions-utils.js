import parseSRT from 'parse-srt/src/parse-srt.js';
import { compile as compileWebVTT } from './node-vtt-compiler.js';

/**
 * Takes JSON output from parse-srt and formats each cue object into
 * a JSON VTT cue object.
 * @param {array} jsonSrtCues An array of captions cues JSON objects from parse-srt
 * @returns An array of JSON objects containing the following VTT cue properties: start, end, text, identifier
 */
function _convertJsonSrtCuesToVttJsonCues(jsonSrtCues) {
	return jsonSrtCues.map(jsonSrtCue => {
		// parse-srt inserts <br /> for line breaks, but WebVTT uses \n.
		const convertedText = jsonSrtCue.text.replace('<br />', '\n');
		return {
			start: jsonSrtCue.start,
			end: jsonSrtCue.end,
			text: convertedText,
			identifier: '',
			styles: ''
		};
	});
}

/**
 * Converts SRT text into WebVTT text.
 * @param {string} srtText Valid SRT text data
 * @returns A WebVTT string, containing the cues from the SRT text sorted by ascending timestamp
 */
function convertSrtTextToVttText(srtText) {
	let jsonSrtCues;
	try {
		jsonSrtCues = parseSRT(srtText);
	} catch (error) {
		throw new Error('srtParseError');
	}

	jsonSrtCues.sort((cue1, cue2) => cue1.start - cue2.start);
	const vttCues = _convertJsonSrtCuesToVttJsonCues(jsonSrtCues);
	return compileWebVTT({ cues: vttCues, valid: true });
}

/**
 * Converts an array of VTTCues into raw WebVTT text
 * @param {Array} cueArray An array of VTTCue objects
 * @returns A WebVTT string containing the data from the cue array
 */
function convertVttCueArrayToVttText(cueArray) {
	const jsonCues = cueArray.map(cue => {
		return {
			start: cue.startTime,
			end: cue.endTime,
			text: cue.text,
			identifier: '',
			styles: ''
		};
	});
	return compileWebVTT({ cues: jsonCues, valid: true });
}

/**
 * Takes a number of seconds and formats into a timestamp string of the form hh:mm:ss.sss
 * @param {number} timestampInSeconds The timestamp value that will be formatted, in seconds
 * @returns A timestamp string formatted as hh:mm:ss.sss
 */
function formatTimestampText(timestampInSeconds) {
	const hours = Math.floor(timestampInSeconds / 3600);
	const minutes = Math.floor(timestampInSeconds / 60) % 60;
	const seconds = Math.floor(timestampInSeconds % 60);
	const milliseconds = Math.round((timestampInSeconds % 1) * 1000);

	const hoursMinutesSecondsString = [ hours, minutes, seconds ]
		.map(number => (number < 10 ? `0${number}` : number))
		.join(':');
	let millisecondsString = milliseconds.toString();
	if (milliseconds < 10) {
		millisecondsString = `00${milliseconds}`;
	} else if (milliseconds < 100) {
		millisecondsString = `0${milliseconds}`;
	}
	return `${hoursMinutesSecondsString}.${millisecondsString}`;
}

/**
 * Takes a string of and validates that is is of the format hh:mm:ss.sss, hh:mm:ss.ss, hh:mm:ss.s, hh:mm:ss., or hh:mm:ss
 * @param {string} timestampInText A timestamp string in format described above, storing hours, minutes, and seconds to three or less decimal places
 * @returns true if the string is correctly formated, and false if it is not
 */
function validTimestampFormat(timestampInText) { // Timestamp format from function formatTimestampText(timestampInSeconds): 00:00:00.000
	const format = /([\d]{2}:){2}[\d]{2}(\.[\d]{3}|\.[\d]{2}|\.[\d]|\.|)$/;
	return format.test(timestampInText);
}

/**
 * Converts a string timestamp of format hh:mm:ss.sss to seconds
 * @param {string} timestampInText A timestamp string in format
 * @returns
 */
function unformatTimestampText(timestampInText) {
	const hours = parseInt(timestampInText.substring(0, 2));
	const minutes = parseInt(timestampInText.substring(3, 5));
	const seconds = parseFloat(timestampInText.substring(6));
	const timestampInSeconds = (hours * 60 * 60) + (minutes * 60) + seconds;
	return timestampInSeconds;
}

/**
 * Converts a TextTrackCueList into an array of VTTCues.
 * @param {TextTrackCueList} textTrackCueList The TextTrackCueList to convert
 * @returns An array containing the VTTCue objects from textTrackCueList.cues
 */
function textTrackCueListToArray(textTrackCueList) {
	const cueArray = [];
	for (let i = 0; i < textTrackCueList.length; i++) {
		cueArray.push(textTrackCueList[i]);
	}
	return cueArray;
}

export {
	formatTimestampText,
	convertSrtTextToVttText,
	convertVttCueArrayToVttText,
	textTrackCueListToArray,
	validTimestampFormat,
	unformatTimestampText
};
