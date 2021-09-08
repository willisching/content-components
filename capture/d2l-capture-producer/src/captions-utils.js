import parseSRT from 'parse-srt/src/parse-srt.js';

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
 * Takes JSON output from parse-srt and formats each cue object into
 * a JSON format compatible with Mozilla's vtt.js library.
 * @param {array} jsonSrtCues An array of captions cues JSON objects from parse-srt
 * @returns An array of captions cues JSON objects compatible with vtt.js
 */
function _normalizeSrtJsonToVttJson(jsonSrtCues) {
	return jsonSrtCues.map(jsonSrtCue => {
		const jsonVttCue = {};
		jsonVttCue.startTime = jsonSrtCue.start;
		jsonVttCue.endTime = jsonSrtCue.end;
		// parse-srt inserts <br /> for line breaks, but WebVTT uses \n.
		jsonVttCue.text = jsonSrtCue.text.replace('<br />', '\n');
		return jsonVttCue;
	});
}

/**
 * Parses SRT text data into JSON cue objects.
 * @param {string} rawSrtData The text data from an SRT file
 * @returns An array of JSON captions cue objects, each containing properties according to the SRT standard, sorted by ascending timestamp
 */
function parseSrtFile(rawSrtData) {
	let jsonSrtCues;
	try {
		jsonSrtCues = parseSRT(rawSrtData);
	} catch (error) {
		throw new Error('srtParseError');
	}
	jsonSrtCues.sort((cue1, cue2) => cue1.start - cue2.start);
	return _normalizeSrtJsonToVttJson(jsonSrtCues);
}

/**
 * Parses WebVTT text data into JSON cue objects.
 * @param {object} vttParser An instance of Parser from vtt.js
 * @param {string} rawVttData The text data from an WebVTT file
 * @returns An array of JSON captions cue objects, each containing properties according to the WebVTT standard, sorted by ascending timestamp
 */
function parseWebVttFile(vttParser, rawVttData) {
	const cues = [];
	vttParser.oncue = function(cue) {
		cues.push(cue);
	};
	vttParser.onerror = function() {
		throw new Error('vttParseError');
	};
	vttParser.parse(rawVttData);
	vttParser.flush();

	const jsonCues = [];
	for (const cue of cues) {
		jsonCues.push(_vttCueToJson(cue));
	}

	jsonCues.sort((cue1, cue2) => cue1.startTime - cue2.startTime);
	return jsonCues;
}

/**
 * Converts a VTTCue object into a JSON object.
 * @param {object} cue The VTTCue object
 * @returns A JSON object containing all of the cue's properties, minus functions and some properties only used by the VTT processing model
 */
function _vttCueToJson(cue) {
	// Copied from Mozilla's extended library for VTTCue.
	// https://github.com/mozilla/vtt.js/blob/42ca104e8845bfc4485e8579d62cac6feaa00de9/lib/vttcue-extended.js
	const jsonCue = {};
	// Filter out getCueAsHTML as it's a function and hasBeenReset and displayState as
	// they're only used when running the processing model algorithm.
	Object.keys(cue).forEach((key) => {
		if (key !== 'getCueAsHTML' && key !== 'hasBeenReset' && key !== 'displayState') {
			jsonCue[key] = cue[key];
		}
	});
	return jsonCue;
}

export {
	formatTimestampText,
	parseSrtFile,
	parseWebVttFile,
};
