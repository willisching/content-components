import { formatTimestampText, parseSrtFile, parseWebVttFile } from '../src/captions-utils.js';
import { assert } from '@open-wc/testing';
import sinon from 'sinon';

describe('captions-utils.js', () => {
	describe('formatTimestampText', () => {
		it('works for timestamps < 1 minute', () => {
			const expected = '00:00:37.000';
			const actual = formatTimestampText(37);
			assert.equal(actual, expected);
		});

		it('works for timestamps > 1 minute and < 1 hour', () => {
			const expected = '00:28:06.000';
			const actual = formatTimestampText(1686);
			assert.equal(actual, expected);
		});

		it('works for timestamps > 1 hour', () => {
			const expected = '01:41:05.000';
			const actual = formatTimestampText(6065);
			assert.equal(actual, expected);
		});

		it('works for timestamps that contain milliseconds', () => {
			const expected = '01:41:05.456';
			const actual = formatTimestampText(6065.456);
			assert.equal(actual, expected);
		});
	});

	describe('parseSrtFile', () => {
		it('parses a valid SRT file into an array of JSON captions cue objects, sorted by start timestamp', () => {
			const srtFileData = `1
00:00:00,000 --> 00:00:02,000
Lorem ipsum dolor sit amet, consectetur adipiscing
elit.

2
00:00:03,000 --> 00:01:02,321
Etiam ac lorem at dolor egestas
ultricies non at lacus.

3
00:00:02,000 --> 00:00:03,000
Nulla massa ante, suscipit nec
suscipit in, tincidunt et tellus.

4
00:01:02,321 --> 00:01:02,600
Praesent sollicitudin ac urna sed porttitor.`;
			const expected = [
				{
					text: 'Lorem ipsum dolor sit amet, consectetur adipiscing\nelit.',
					startTime: 0,
					endTime: 2,
				},
				{
					text: 'Nulla massa ante, suscipit nec\nsuscipit in, tincidunt et tellus.',
					startTime: 2,
					endTime: 3,
				},
				{
					text: 'Etiam ac lorem at dolor egestas\nultricies non at lacus.',
					startTime: 3,
					endTime: 62.321,
				},
				{
					text: 'Praesent sollicitudin ac urna sed porttitor.',
					startTime: 62.321,
					endTime: 62.600,
				},
			];
			const actual = parseSrtFile(srtFileData);
			assert.deepEqual(actual, expected);
		});

		it('when given invalid SRT data, throws an error containing the name of a localized error string', () => {
			const invalidSrtData = `1
00:00:00,000|00:00:02,000
Lorem ipsum dolor sit amet, consectetur adipiscing
elit.`;
			try {
				parseSrtFile(invalidSrtData);
				assert.fail('Did not throw an error');
			} catch (error) {
				assert.equal(error.message, 'srtParseError');
			}
		});
	});

	describe('parseWebVttFile', () => {
		it('parses a valid WebVTT file into an array of JSON captions cue objects, sorted by start timestamp', () => {
			const vttFileData = `WEBVTT

00:01.000 --> 00:03.000
<v Roger Bingham>We are
in New York City

00:06.000 --> 00:08.000
<v Roger Bingham>from the American Museum of Natural History

00:03.000 --> 00:06.000
<v Roger Bingham>We’re actually at the Lucern Hotel, just down the street

00:08.000 --> 00:10.000
<v Roger Bingham>And with me is Neil deGrasse Tyson`;

			const vttParserMock = {};
			vttParserMock.parse = sinon.spy();
			vttParserMock.flush = sinon.stub();
			vttParserMock.flush.callsFake(() => {
				if (vttParserMock.parse.calledWith(vttFileData)) {
					const unsortedCues = [
						{
							startTime: 1,
							endTime: 3,
							text: '<v Roger Bingham>We are\nin New York City',
						},
						{
							startTime: 6,
							endTime: 8,
							text: '<v Roger Bingham>from the American Museum of Natural History',
						},
						{
							startTime: 3,
							endTime: 6,
							text: '<v Roger Bingham>We’re actually at the Lucern Hotel, just down the street',
						},
						{
							startTime: 8,
							endTime: 10,
							text: '<v Roger Bingham>And with me is Neil deGrasse Tyson',
						},
					];
					unsortedCues.forEach(cue => {
						vttParserMock.oncue(cue);
					});
				}
			});

			const expected = [
				{
					startTime: 1,
					endTime: 3,
					text: '<v Roger Bingham>We are\nin New York City',
				},
				{
					startTime: 3,
					endTime: 6,
					text: '<v Roger Bingham>We’re actually at the Lucern Hotel, just down the street',
				},
				{
					startTime: 6,
					endTime: 8,
					text: '<v Roger Bingham>from the American Museum of Natural History',
				},
				{
					startTime: 8,
					endTime: 10,
					text: '<v Roger Bingham>And with me is Neil deGrasse Tyson',
				},
			];
			const actual = parseWebVttFile(vttParserMock, vttFileData);
			assert.deepEqual(actual, expected);
		});

		it('when given invalid WebVTT data, throws an error containing the name of a localized error string', () => {
			const invalidVttFileData = `00:01.000 --> 00:03.000
<v Roger Bingham>We are
in New York City`;

			const vttParserMock = {};
			vttParserMock.parse = sinon.spy();
			vttParserMock.flush = sinon.stub();
			vttParserMock.flush.callsFake(() => {
				if (vttParserMock.parse.calledWith(invalidVttFileData)) {
					vttParserMock.onerror();
				}
			});

			try {
				parseWebVttFile(vttParserMock, invalidVttFileData);
				assert.fail('Did not throw an error');
			} catch (error) {
				assert.equal(error.message, 'vttParseError');
			}
		});
	});
});
