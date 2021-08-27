import { assert } from '@open-wc/testing';
import { Timeline } from '../src/timeline.js';

describe('timeline.js', () => {
	let timeline;

	beforeEach(() => {
		timeline = new Timeline({
			durationSeconds: 120,
			widthPixels: 30,
			zoomMultiplier: 2
		});
	});

	describe('Timeline', () => {
		describe('addCutAtPoint', () => {
			it('should create a cut over the entire duration when there are no other cuts or marks, regardless of zoom multiplier', () => {
				const durationSeconds = 120;
				const widthPixels = 30;

				for (let zoomMultiplier = 1; zoomMultiplier <= 2; zoomMultiplier++) {
					for (let pixelsAlongTimeline = 0; pixelsAlongTimeline <= widthPixels; pixelsAlongTimeline++) {
						const t = new Timeline({
							durationSeconds,
							widthPixels,
							zoomMultiplier,
						});

						const cut = t.addCutAtPoint(pixelsAlongTimeline);

						assert.equal(cut.in, 0);
						assert.equal(cut.out, durationSeconds);
						assert.equal(cut.displayObject, null);
						assert.equal(cut.timeline, t);
					}
				}
			});

			it('should create a cut from the left bounding mark on the timeline over the remaining duration, when there is only 1 mark and it is to the left of the point', () => {
				const { mark } = timeline.addMarkAtPoint(1);

				const cut = timeline.addCutAtPoint(15);

				assert.equal(cut.in, mark.seconds);
				assert.equal(cut.out, timeline.durationSeconds);
			});

			it('should create a cut from the left bounding mark on the timeline over the remaining duration, when there is only 1 mark and it is at the point', () => {
				const cutPoint = 15;

				const { mark } = timeline.addMarkAtPoint(cutPoint);

				const cut = timeline.addCutAtPoint(cutPoint);

				assert.equal(cut.in, mark.seconds);
				assert.equal(cut.out, timeline.durationSeconds);
			});

			it('should create a cut from the left bounding mark off the timeline over the remaining duration, when there is only 1 mark and it is off the timeline and comes before the point', () => {
				timeline.zoomMultiplier = 1;

				const { mark } = timeline.addMarkAtPoint(1);

				timeline.zoomMultiplier = 2;

				const cut = timeline.addCutAtPoint(15);

				assert.equal(cut.in, mark.seconds);
				assert.equal(cut.out, timeline.durationSeconds);
			});

			it('should create a cut from the left bounding mark on the timeline over the remaining duration, when there is 1 mark on the timeline to the left of the point and another mark to the left of the timeline', () => {
				timeline.zoomMultiplier = 1;

				const { mark: markOffTimeline } = timeline.addMarkAtPoint(1);

				timeline.zoomMultiplier = 2;

				const { mark: markOnTimeline } = timeline.addMarkAtPoint(10);

				const cut = timeline.addCutAtPoint(15);

				assert.notEqual(markOffTimeline.seconds, markOnTimeline.seconds);
				assert.equal(cut.in, markOnTimeline.seconds);
				assert.equal(cut.out, timeline.durationSeconds);
			});

			it('should create a cut from the closest left bounding mark on the timeline over the remaining duration, when there are multiple marks on the timeline to the left of the point', () => {
				const { mark: fartherMark } = timeline.addMarkAtPoint(13);
				const { mark: closerMark } = timeline.addMarkAtPoint(14);

				const cut = timeline.addCutAtPoint(15);

				assert.notEqual(fartherMark.seconds, closerMark.seconds);
				assert.equal(cut.in, closerMark.seconds);
				assert.equal(cut.out, timeline.durationSeconds);
			});

			it('should create a cut from the start of the duration to the right bounding mark on the timeline, when there is only 1 mark and it is to the right of the point', () => {
				const { mark } = timeline.addMarkAtPoint(25);

				const cut = timeline.addCutAtPoint(15);

				assert.equal(cut.in, 0);
				assert.equal(cut.out, mark.seconds);
			});

			it('should create a cut from the start of the duration to the right bounding mark off the timeline, when there is only 1 mark and it is off the timeline and comes after the point', () => {
				timeline.zoomMultiplier = 1;

				const { mark } = timeline.addMarkAtPoint(25);

				timeline.zoomMultiplier = 2;

				const cut = timeline.addCutAtPoint(15);

				assert.equal(cut.in, 0);
				assert.equal(cut.out, mark.seconds);
			});

			it('should create a cut from the start of the duration to the right bounding mark on the timeline, when there is 1 mark on the timeline to the right of the point and another mark to the right of the timeline', () => {
				timeline.zoomMultiplier = 1;

				const { mark: markOffTimeline } = timeline.addMarkAtPoint(25);

				timeline.zoomMultiplier = 2;

				const { mark: markOnTimeline } = timeline.addMarkAtPoint(20);

				const cut = timeline.addCutAtPoint(15);

				assert.notEqual(markOffTimeline.seconds, markOnTimeline.seconds);
				assert.equal(cut.in, 0);
				assert.equal(cut.out, markOnTimeline.seconds);
			});

			it('should create create a cut from the start of the duration to the closest right bounding mark on the timeline, when there are multiple marks on the timeline to the right of the point', () => {
				const { mark: fartherMark } = timeline.addMarkAtPoint(25);
				const { mark: closerMark } = timeline.addMarkAtPoint(20);

				const cut = timeline.addCutAtPoint(15);

				assert.notEqual(fartherMark.seconds, closerMark.seconds);
				assert.equal(cut.in, 0);
				assert.equal(cut.out, closerMark.seconds);
			});

			it('should create a cut from the left bounding mark on the timeline to the right bounding mark on the timeline, when those are the only 2 marks', () => {
				const { mark: leftBoundingMark } = timeline.addMarkAtPoint(5);
				const { mark: rightBoundingMark } = timeline.addMarkAtPoint(25);

				const cut = timeline.addCutAtPoint(15);

				assert.notEqual(leftBoundingMark.seconds, rightBoundingMark.seconds);
				assert.equal(cut.in, leftBoundingMark.seconds);
				assert.equal(cut.out, rightBoundingMark.seconds);
			});
		});

		describe('addMarkAtPoint', () => {
			it('should add a mark on the timeline when the timeline is empty', () => {
				const markPoint = 15;
				const { mark, cut } = timeline.addMarkAtPoint(markPoint);

				assert.equal(cut, null);
				assert.equal(mark.seconds, timeline.getTimeFromPixelsAlongTimeline(markPoint));
				assert.equal(mark.displayObject, null);
				assert.equal(mark.timeline, timeline);
			});

			it('should not add a mark to the timeline when a mark already exists at that time', () => {
				timeline.zoomMultiplier = 1;

				const time = 32;

				const { mark: originalMark, cut } = timeline.addMarkAtPoint(timeline.getPixelsAlongTimelineFromTime(time));

				timeline.zoomMultiplier = 2;

				const returnValue = timeline.addMarkAtPoint(timeline.getPixelsAlongTimelineFromTime(time));

				assert.equal(cut, null);
				assert.equal(returnValue, null);
				assert.equal(originalMark.seconds, timeline.getTimeFromPixelsAlongTimeline(1));
			});

			it("should add the mark on the timeline, when a cut exists but not affect the cut when the cut is not over the new mark's time", () => {
				timeline.addMarkAtPoint(10);
				const originalCut = timeline.addCutAtPoint(9);

				const { in: originalCutIn, out: originalCutOut } = originalCut;

				const newMarkPoint = 15;

				const { mark: newMark, cut } = timeline.addMarkAtPoint(newMarkPoint);

				assert.equal(cut, null);
				assert.equal(newMark.seconds, timeline.getTimeFromPixelsAlongTimeline(newMarkPoint));
				assert.equal(originalCut.in, originalCutIn);
				assert.equal(originalCut.out, originalCutOut);
			});

			it("should add a mark on the timeline and shorten a cut, when the cut exists over the new mark's time", () => {
				const { mark: originalMark } = timeline.addMarkAtPoint(10);
				const originalCut = timeline.addCutAtPoint(15);

				const numCutsBefore = timeline.getCuts().length;

				const newMarkPoint = 20;

				const { mark: newMark, cut } = timeline.addMarkAtPoint(newMarkPoint);

				assert.equal(cut, originalCut);
				assert.equal(newMark.seconds, timeline.getTimeFromPixelsAlongTimeline(newMarkPoint));
				assert.equal(cut.in, originalMark.seconds);
				assert.equal(cut.out, newMark.seconds);
				assert.equal(timeline.getCuts().length, numCutsBefore);
			});
		});

		describe('getCutOverTime', () => {
			const leftBoundPixels = 10;
			const rightBoundPixels = 20;
			let cut;

			beforeEach(() => {
				timeline.addMarkAtPoint(leftBoundPixels);
				timeline.addMarkAtPoint(rightBoundPixels);
				cut = timeline.addCutAtPoint(15);
			});

			it('should return null, when the time is before the only cut starts', () => {
				const timeToCheck = timeline.getTimeFromPixelsAlongTimeline(leftBoundPixels - 1);

				assert.equal(timeline.getCutOverTime(timeToCheck), null);
			});

			it('should return null, when the time is after the only cut ends', () => {
				const timeToCheck = timeline.getTimeFromPixelsAlongTimeline(rightBoundPixels + 1);

				assert.equal(timeline.getCutOverTime(timeToCheck), null);
			});

			it('should return null, when the time at the end of the cut', () => {
				const timeToCheck = timeline.getTimeFromPixelsAlongTimeline(rightBoundPixels);

				assert.equal(timeline.getCutOverTime(timeToCheck), null);
			});

			it('should return a cut, when the time is between (non-inclusive) the start and end of the cut', () => {
				const timeToCheck = timeline.getTimeFromPixelsAlongTimeline(13);

				assert.equal(timeline.getCutOverTime(timeToCheck), cut);
			});

			it('should return a cut, when the time is at the start of the cut', () => {
				const timeToCheck = timeline.getTimeFromPixelsAlongTimeline(leftBoundPixels);

				assert.equal(timeline.getCutOverTime(timeToCheck), cut);
			});
		});

		describe('getCuts', () => {
			it('should return an empty array, when there are no cuts', () => {
				assert.equal(0, timeline.getCuts().length);
			});

			it('should return the cuts in ascending order', () => {
				timeline.zoomMultiplier = 1;

				timeline.addMarkAtPoint(0);
				timeline.addMarkAtPoint(2);
				const cut1 = timeline.addCutAtPoint(1);

				timeline.zoomMultiplier = 2;

				timeline.addMarkAtPoint(5);

				timeline.addMarkAtPoint(6);
				timeline.addMarkAtPoint(7);
				const cut2 = timeline.addCutAtPoint(6);

				const cut3 = timeline.addCutAtPoint(8);

				const cuts = timeline.getCuts();
				const expectedCuts = [cut1, cut2, cut3];

				assert.equal(cuts.length, expectedCuts.length);

				for (let i = 0; i < expectedCuts.length; i++) assert.equal(cuts[i], expectedCuts[i]);
			});
		});

		describe('getCutsOnTimeline', () => {
			beforeEach(() => {
				timeline.zoomMultiplier = 1;

				timeline.addMarkAtPoint(1).mark;
				timeline.addCutAtPoint(0);

				timeline.addMarkAtPoint(timeline.widthPixels - 1).mark;
				timeline.addCutAtPoint(timeline.widthPixels - 1);

				timeline.zoomMultiplier = 2;
			});

			it('should return an empty array, when there are only cuts off the timeline', () => {
				assert.equal(0, timeline.getCutsOnTimeline().length);
			});

			it('should only return the cuts that are on the timeline, when there are some cuts off the timeline', () => {
				timeline.addMarkAtPoint(3);
				timeline.addMarkAtPoint(5);
				const cut1 = timeline.addCutAtPoint(2);
				const cut2 = timeline.addCutAtPoint(4);

				timeline.addMarkAtPoint(6);

				timeline.addMarkAtPoint(8);
				timeline.addMarkAtPoint(9);
				const cut3 = timeline.addCutAtPoint(8);

				const cut4 = timeline.addCutAtPoint(10);

				const cuts = timeline.getCutsOnTimeline();
				const expectedCuts = [cut1, cut2, cut3, cut4];

				assert.equal(cuts.length, expectedCuts.length);

				for (let i = 0; i < expectedCuts.length; i++) assert.equal(cuts[i], expectedCuts[i]);
			});
		});

		describe('getMarkAtTime', () => {
			it('should return null, when there is no mark at the time', () => {
				const pixelsAlongTimeline = 10;
				const time = timeline.getTimeFromPixelsAlongTimeline(pixelsAlongTimeline);

				timeline.addMarkAtPoint(pixelsAlongTimeline);

				assert.equal(timeline.getMarkAtTime(time + 1), null);
			});

			it('should return a mark, when the mark is on the timeline and at the same time', () => {
				const pixelsAlongTimeline = 10;
				const time = timeline.getTimeFromPixelsAlongTimeline(pixelsAlongTimeline);

				const { mark } = timeline.addMarkAtPoint(pixelsAlongTimeline);

				assert.isTrue(mark.isOnTimeline());
				assert.equal(timeline.getMarkAtTime(time), mark);
			});

			it('should return a mark, when the mark is off the timeline and at the same time', () => {
				timeline.zoomMultiplier = 1;

				const nonZoomedPixelsAlongTimeline = 2;
				const time = timeline.getTimeFromPixelsAlongTimeline(nonZoomedPixelsAlongTimeline);

				const { mark } = timeline.addMarkAtPoint(nonZoomedPixelsAlongTimeline);

				timeline.zoomMultiplier = 2;

				assert.isFalse(mark.isOnTimeline());
				assert.equal(timeline.getMarkAtTime(time), mark);
			});
		});

		describe('getMarks', () => {
			it('should return an empty array, when there are no marks', () => {
				assert.equal(0, timeline.getMarks().length);
			});

			it('should return the marks in ascending order', () => {
				timeline.zoomMultiplier = 1;

				const { mark: mark1 } = timeline.addMarkAtPoint(0);
				const { mark: mark2 } = timeline.addMarkAtPoint(2);
				timeline.addCutAtPoint(1);

				timeline.zoomMultiplier = 2;

				const { mark: mark3 } = timeline.addMarkAtPoint(5);

				const { mark: mark4 } = timeline.addMarkAtPoint(6);
				const { mark: mark5 } = timeline.addMarkAtPoint(7);
				timeline.addCutAtPoint(6);

				timeline.addCutAtPoint(8);

				const marks = timeline.getMarks();
				const expectedMarks = [mark1, mark2, mark3, mark4, mark5];

				assert.equal(marks.length, expectedMarks.length);

				for (let i = 0; i < expectedMarks.length; i++) assert.equal(marks[i], expectedMarks[i]);
			});
		});

		describe('getMarksOnTimeline', () => {
			beforeEach(() => {
				timeline.zoomMultiplier = 1;

				timeline.addMarkAtPoint(1).mark;
				timeline.addCutAtPoint(0);

				timeline.addMarkAtPoint(timeline.widthPixels - 1).mark;
				timeline.addCutAtPoint(timeline.widthPixels - 1);

				timeline.zoomMultiplier = 2;
			});

			it('should return an empty array, when there are only marks off the timeline', () => {
				assert.equal(0, timeline.getMarksOnTimeline().length);
			});

			it('should only return marks that are on the timeline, when there are some marks off the timeline', () => {
				const { mark: mark1 } = timeline.addMarkAtPoint(5);

				const { mark: mark2 } = timeline.addMarkAtPoint(6);
				const { mark: mark3 } = timeline.addMarkAtPoint(7);
				timeline.addCutAtPoint(6);

				timeline.addCutAtPoint(8);

				const marks = timeline.getMarksOnTimeline();
				const expectedMarks = [mark1, mark2, mark3];

				assert.equal(marks.length, expectedMarks.length);

				for (let i = 0; i < expectedMarks.length; i++) assert.equal(marks[i], expectedMarks[i]);
			});
		});

		describe('getPixelBoundsAtPoint', () => {
			it('should return the start of the timeline and the end of the timeline, when there are no marks', () => {
				const { leftBoundPixels, rightBoundPixels } = timeline.getPixelBoundsAtPoint(2);

				assert.equal(leftBoundPixels, 0);
				assert.equal(rightBoundPixels, timeline.widthPixels);
			});

			it('should return the start of the timeline and the end of the timeline, when there are marks off the timeline', () => {
				timeline.zoomMultiplier = 1;

				timeline.addMarkAtPoint(2);
				timeline.addCutAtPoint(1);
				timeline.addMarkAtPoint(27);

				timeline.zoomMultiplier = 2;

				const { leftBoundPixels, rightBoundPixels } = timeline.getPixelBoundsAtPoint(2);

				assert.equal(leftBoundPixels, 0);
				assert.equal(rightBoundPixels, timeline.widthPixels);
			});

			it('should return the point of the closest previous mark on the timeline and the closest next mark on the timeline', () => {
				timeline.zoomMultiplier = 1;

				timeline.addMarkAtPoint(2);
				timeline.addCutAtPoint(1);
				timeline.addMarkAtPoint(27);

				timeline.zoomMultiplier = 2;

				const closestPreviousMarkPoint = 10;
				timeline.addMarkAtPoint(closestPreviousMarkPoint - 3);
				timeline.addMarkAtPoint(closestPreviousMarkPoint);

				const closestNextMarkPoint = 20;
				timeline.addMarkAtPoint(closestNextMarkPoint);
				timeline.addMarkAtPoint(closestNextMarkPoint + 2);

				const { leftBoundPixels, rightBoundPixels } = timeline.getPixelBoundsAtPoint(17);

				assert.equal(leftBoundPixels, closestPreviousMarkPoint);
				assert.equal(rightBoundPixels, closestNextMarkPoint);
			});

			it('should return the point of the mark at the same point on the timeline and the closest next mark on the timeline', () => {
				timeline.zoomMultiplier = 1;

				timeline.addMarkAtPoint(2);
				timeline.addCutAtPoint(1);
				timeline.addMarkAtPoint(27);

				timeline.zoomMultiplier = 2;

				const closestPreviousMarkPoint = 10;
				timeline.addMarkAtPoint(closestPreviousMarkPoint - 3);
				timeline.addMarkAtPoint(closestPreviousMarkPoint);

				const closestNextMarkPoint = 20;
				timeline.addMarkAtPoint(closestNextMarkPoint);
				timeline.addMarkAtPoint(closestNextMarkPoint + 2);

				const { leftBoundPixels, rightBoundPixels } = timeline.getPixelBoundsAtPoint(closestPreviousMarkPoint);

				assert.equal(leftBoundPixels, closestPreviousMarkPoint);
				assert.equal(rightBoundPixels, closestNextMarkPoint);
			});
		});

		describe('getPixelsAlongTimelineFromTime', () => {
			it('should return null, when time is to the left of the timeline', () => {
				assert.equal(timeline.getPixelsAlongTimelineFromTime(15), null);
			});

			it('should return null, when the time is to the right of the timeline', () => {
				assert.equal(timeline.getPixelsAlongTimelineFromTime(115), null);
			});

			it('should return the number of pixels along the timeline from the time, when zooming around the center of the timeline', () => {
				[[30, 0], [32, 1], [45, 8], [56, 13], [60, 15], [82, 26], [90, 30]].forEach(t => {
					const [time, expectedPixelsAlongTimeline] = t;

					assert.equal(timeline.getPixelsAlongTimelineFromTime(time), expectedPixelsAlongTimeline);
				});
			});

			it('should return the number of pixels along the timeline from the time, when zooming around a non-centre point on the timeline', () => {
				timeline.pixelsAlongTimelineToZoomAround = 10;

				[[10, 0], [15, 3], [17, 4], [30, 10], [41, 16], [45, 18], [67, 29]].forEach(t => {
					const [time, expectedPixelsAlongTimeline] = t;

					assert.equal(timeline.getPixelsAlongTimelineFromTime(time), expectedPixelsAlongTimeline);
				});
			});
		});

		describe('getTimeBoundsOfTimeline', () => {
			it('should return 0 and the duration of the timeline, when the timeline is not zoomed', () => {
				timeline.zoomMultiplier = 1;

				const { lowerTimeBound, upperTimeBound } = timeline.getTimeBoundsOfTimeline();

				assert.equal(lowerTimeBound, 0);
				assert.equal(upperTimeBound, timeline.durationSeconds);
			});

			it('should return the time bounds of the timeline, when the timeline is zoomed around the centre point', () => {
				const { lowerTimeBound, upperTimeBound } = timeline.getTimeBoundsOfTimeline();

				assert.equal(lowerTimeBound, 30);
				assert.equal(upperTimeBound, 90);
			});

			it('should return the time bounds of the timeline, when the timeline is zoomed around a non-centre point', () => {
				timeline.pixelsAlongTimelineToZoomAround = 10;

				const { lowerTimeBound, upperTimeBound } = timeline.getTimeBoundsOfTimeline();

				assert.equal(lowerTimeBound, 10);
				assert.equal(upperTimeBound, 70);
			});
		});

		describe('getTimeFromPixelsAlongTimeline', () => {
			it('should return the time from the pixels along the timeline, when zooming around the centre of the timeline', () => {
				[[30, 0], [32, 1], [46, 8], [56, 13], [60, 15], [82, 26], [90, 30]].forEach(t => {
					const [expectedTime, pixelsAlongTimeline] = t;

					assert.equal(timeline.getTimeFromPixelsAlongTimeline(pixelsAlongTimeline), expectedTime);
				});
			});

			it('should return the time from the pixels along the timeline, when zooming around a non-centre point of the timeline', () => {
				timeline.pixelsAlongTimelineToZoomAround = 10;

				[[10, 0], [16, 3], [18, 4], [30, 10], [42, 16], [46, 18], [68, 29]].forEach(t => {
					const [expectedTime, pixelsAlongTimeline] = t;

					assert.equal(timeline.getTimeFromPixelsAlongTimeline(pixelsAlongTimeline), expectedTime);
				});
			});
		});
	});

	describe('Mark', () => {
		describe('getPixelsAlongTimeline', () => {
			it('should return null when it is off the timeline', () => {
				timeline.zoomMultiplier = 1;

				const { mark } = timeline.addMarkAtPoint(1);

				timeline.zoomMultiplier = 2;

				assert.equal(mark.getPixelsAlongTimeline(), null);
			});

			it('should return the point along the timeline at which it rests', () => {
				const pixelsAlongTimeline = 1;

				const { mark } = timeline.addMarkAtPoint(pixelsAlongTimeline);

				timeline.zoomMultiplier = 2;

				assert.equal(mark.getPixelsAlongTimeline(), pixelsAlongTimeline);
			});
		});

		describe('isOnTimeline', () => {
			it('should return true if it is on the timeline', () => {
				const { mark } = timeline.addMarkAtPoint(10);

				assert.isTrue(mark.isOnTimeline());
			});

			it('should return false if it is not on the timeline', () => {
				timeline.zoomMultiplier = 1;

				const { mark } = timeline.addMarkAtPoint(1);

				timeline.zoomMultiplier = 2;

				assert.isFalse(mark.isOnTimeline());
			});
		});

		describe('move', () => {
			it('should do nothing and return null, when trying to move the mark to the same point along the timeline', () => {
				const pixelsAlongTimeline = 3;

				const { mark } = timeline.addMarkAtPoint(pixelsAlongTimeline);

				const originalSeconds = mark.seconds;

				const returnValue = mark.move(pixelsAlongTimeline);

				assert.equal(returnValue, null);
				assert.equal(mark.seconds, originalSeconds);
			});

			it('should do nothing and return null, when trying to move the mark forward and there is a mark between it and the point to move to', () => {
				const { mark } = timeline.addMarkAtPoint(5);
				timeline.addMarkAtPoint(8);

				const originalSeconds = mark.seconds;

				const returnValue = mark.move(15);

				assert.equal(returnValue, null);
				assert.equal(mark.seconds, originalSeconds);
			});

			it('should do nothing and return null, when trying to move the mark backward, and there is a mark between it and the point to move to', () => {
				const { mark } = timeline.addMarkAtPoint(15);
				timeline.addMarkAtPoint(8);

				const originalSeconds = mark.seconds;

				const returnValue = mark.move(5);

				assert.equal(returnValue, null);
				assert.equal(mark.seconds, originalSeconds);
			});

			it('should move the mark, when the mark is not connected to any cuts', () => {
				timeline.addMarkAtPoint(2);
				timeline.addMarkAtPoint(4);
				timeline.addCutAtPoint(3);

				const { mark } = timeline.addMarkAtPoint(6);

				timeline.addMarkAtPoint(10);
				timeline.addMarkAtPoint(14);
				timeline.addCutAtPoint(11);

				const pixelsToMoveTo = 8;

				const { cutEndingAtMark, cutStartingAtMark } = mark.move(pixelsToMoveTo);

				const timeToMoveTo = timeline.getTimeFromPixelsAlongTimeline(pixelsToMoveTo);

				assert.equal(mark.seconds, timeToMoveTo);
				assert.equal(cutEndingAtMark, null);
				assert.equal(cutStartingAtMark, null);
			});

			it('should move the mark, shorten the cut ending at it, and lengthen the cut starting at it, when the mark is connected to 2 cuts and is moved backwards', () => {
				timeline.addMarkAtPoint(2);
				timeline.addMarkAtPoint(4);
				timeline.addCutAtPoint(3);

				const { mark } = timeline.addMarkAtPoint(6);
				timeline.addMarkAtPoint(10);
				const cut1 = timeline.addCutAtPoint(5);
				const cut2 = timeline.addCutAtPoint(7);

				const pixelsToMoveTo = 5;

				const { cutEndingAtMark, cutStartingAtMark } = mark.move(pixelsToMoveTo);

				const timeToMoveTo = timeline.getTimeFromPixelsAlongTimeline(pixelsToMoveTo);

				assert.equal(mark.seconds, timeToMoveTo);
				assert.equal(cutEndingAtMark, cut1);
				assert.equal(cutStartingAtMark, cut2);
				assert.equal(cutEndingAtMark.out, timeToMoveTo);
				assert.equal(cutStartingAtMark.in, timeToMoveTo);
			});

			it('should move the mark, lengthen the cut ending at it, and shorten the cut starting at it, when the mark is connected to 2 cuts and is moved forwards', () => {
				timeline.addMarkAtPoint(2);
				timeline.addMarkAtPoint(4);
				timeline.addCutAtPoint(3);

				const { mark } = timeline.addMarkAtPoint(6);
				timeline.addMarkAtPoint(10);
				const cut1 = timeline.addCutAtPoint(5);
				const cut2 = timeline.addCutAtPoint(7);

				const pixelsToMoveTo = 8;

				const { cutEndingAtMark, cutStartingAtMark } = mark.move(pixelsToMoveTo);

				const timeToMoveTo = timeline.getTimeFromPixelsAlongTimeline(pixelsToMoveTo);

				assert.equal(mark.seconds, timeToMoveTo);
				assert.equal(cutEndingAtMark, cut1);
				assert.equal(cutStartingAtMark, cut2);
				assert.equal(cutEndingAtMark.out, timeToMoveTo);
				assert.equal(cutStartingAtMark.in, timeToMoveTo);
			});
		});

		describe('removeFromTimeline', () => {
			it('should remove it from the timeline, when it is not connected to any cuts', () => {
				const { mark } = timeline.addMarkAtPoint(5);

				const { cutEndingAtMark, cutStartingAtMark } = mark.removeFromTimeline();

				assert.equal(cutEndingAtMark, null);
				assert.equal(cutStartingAtMark, null);
				assert.equal(0, timeline.getMarks().length);
			});

			it('should remove it from the timeline, lengthen the cut that ends at it, and remove the cut that starts at it, when it is connected to 2 cuts', () => {
				const { mark } = timeline.addMarkAtPoint(5);
				const { mark: nextMark } = timeline.addMarkAtPoint(8);
				const cut1 = timeline.addCutAtPoint(3);
				const cut2 = timeline.addCutAtPoint(6);

				const { cutEndingAtMark, cutStartingAtMark } = mark.removeFromTimeline();

				const remainingCuts = timeline.getCuts();
				const remainingMarks = timeline.getMarks();

				assert.equal(cutEndingAtMark, cut1);
				assert.equal(cutStartingAtMark, cut2);
				assert.equal(remainingCuts.length, 1);
				assert.equal(remainingCuts[0], cutEndingAtMark);
				assert.equal(cutEndingAtMark.in, 0);
				assert.equal(cutEndingAtMark.out, nextMark.seconds);
				assert.equal(remainingMarks.length, 1);
				assert.equal(remainingMarks[0], nextMark);
			});
		});
	});

	describe('Cut', () => {
		describe('getPixelsAlongTimeline', () => {
			it('should return null, when it is entirely to the left of the timeline', () => {
				timeline.zoomMultiplier = 1;

				timeline.addMarkAtPoint(1);
				const cut = timeline.addCutAtPoint(0);

				timeline.zoomMultiplier = 2;

				assert.equal(cut.getPixelsAlongTimeline(), null);
			});

			it('should return 0 to the end of the it, when it begins to the left of the timeline and ends on the timeline', () => {
				timeline.zoomMultiplier = 1;

				timeline.addMarkAtPoint(1);

				timeline.zoomMultiplier = 2;

				const markPoint = 15;
				timeline.addMarkAtPoint(markPoint);
				const cut = timeline.addCutAtPoint(14);

				const { inPixels, outPixels } = cut.getPixelsAlongTimeline();

				assert.equal(inPixels, 0);
				assert.equal(outPixels, markPoint);
			});

			it('should return 0 to the end of the timeline, when it begins to the left of the timeline and ends to the right of the timeline', () => {
				timeline.zoomMultiplier = 1;

				timeline.addMarkAtPoint(1);
				const cut = timeline.addCutAtPoint(2);

				timeline.zoomMultiplier = 2;

				const { inPixels, outPixels } = cut.getPixelsAlongTimeline();

				assert.equal(inPixels, 0);
				assert.equal(outPixels, timeline.widthPixels);
			});

			it('should return the start to the end of it, when it begins and ends on the timeline', () => {
				const startPoint = 5;
				timeline.addMarkAtPoint(startPoint);

				const endPoint = 10;
				timeline.addMarkAtPoint(endPoint);

				const cut = timeline.addCutAtPoint(6);

				const { inPixels, outPixels } = cut.getPixelsAlongTimeline();

				assert.equal(inPixels, startPoint);
				assert.equal(outPixels, endPoint);
			});

			it('should return the start to the end of the timeline, when it begins on the timeline and ends to the right of the timeline', () => {
				const startPoint = 5;
				timeline.addMarkAtPoint(startPoint);

				const cut = timeline.addCutAtPoint(6);

				const { inPixels, outPixels } = cut.getPixelsAlongTimeline();

				assert.equal(inPixels, startPoint);
				assert.equal(outPixels, timeline.widthPixels);
			});

			it('should return null, when it is entirely to the right of the timeline', () => {
				timeline.zoomMultiplier = 1;

				timeline.addMarkAtPoint(28);
				const cut = timeline.addCutAtPoint(29);

				timeline.zoomMultiplier = 2;

				assert.equal(cut.getPixelsAlongTimeline(), null);
			});
		});

		describe('isOnTimeline', () => {
			it('should return false, when it is entirely to the left of the timeline', () => {
				timeline.zoomMultiplier = 1;

				timeline.addMarkAtPoint(1);
				const cut = timeline.addCutAtPoint(0);

				timeline.zoomMultiplier = 2;

				assert.isFalse(cut.isOnTimeline());
			});

			it('should return true, when it begins to the left of the timeline and ends on the timeline', () => {
				timeline.zoomMultiplier = 1;

				timeline.addMarkAtPoint(1);

				timeline.zoomMultiplier = 2;

				timeline.addMarkAtPoint(15);
				const cut = timeline.addCutAtPoint(14);

				assert.isTrue(cut.isOnTimeline());
			});

			it('should return true, when it begins to the left of the timeline and ends to the right of the timeline', () => {
				timeline.zoomMultiplier = 1;

				timeline.addMarkAtPoint(1);
				const cut = timeline.addCutAtPoint(2);

				timeline.zoomMultiplier = 2;

				assert.isTrue(cut.isOnTimeline());
			});

			it('should return true, when it begins and ends on the timeline', () => {
				timeline.addMarkAtPoint(5);

				timeline.addMarkAtPoint(10);

				const cut = timeline.addCutAtPoint(6);

				assert.isTrue(cut.isOnTimeline());
			});

			it('should return true, when it begins on the timeline and ends to the right of the timeline', () => {
				timeline.addMarkAtPoint(5);

				const cut = timeline.addCutAtPoint(6);

				assert.isTrue(cut.isOnTimeline());
			});

			it('should return false, when it is entirely to the right of the timeline', () => {
				timeline.zoomMultiplier = 1;

				timeline.addMarkAtPoint(28);
				const cut = timeline.addCutAtPoint(29);

				timeline.zoomMultiplier = 2;

				assert.isFalse(cut.isOnTimeline());
			});
		});

		describe('isOverTime', () => {
			it('should return false, when the time is before a cut', () => {
				const point = 10;
				const time = timeline.getTimeFromPixelsAlongTimeline(point);
				timeline.addMarkAtPoint(point);
				const cut = timeline.addCutAtPoint(point);

				assert.isFalse(cut.isOverTime(time - 1));
			});

			it('should return false, when the time is after a cut', () => {
				const point = 10;
				const time = timeline.getTimeFromPixelsAlongTimeline(point);
				timeline.addMarkAtPoint(point);
				const cut = timeline.addCutAtPoint(point - 1);

				assert.isFalse(cut.isOverTime(time));
			});

			it('should return true, when the time is during the cut', () => {
				const point = 10;
				const time = timeline.getTimeFromPixelsAlongTimeline(point);
				timeline.addMarkAtPoint(point);
				const cut = timeline.addCutAtPoint(point);

				assert.isTrue(cut.isOverTime(time));
			});
		});

		describe('removeFromTimeline', () => {
			it('should remove it from the timeline', () => {
				const point1 = 5;
				const point2 = 10;
				const { mark: mark1 } = timeline.addMarkAtPoint(point1);
				const { mark: mark2 } = timeline.addMarkAtPoint(point2);

				const cut1 = timeline.addCutAtPoint(point1 - 1);
				const cut2 = timeline.addCutAtPoint(point1);

				cut2.removeFromTimeline();

				const remainingCuts = timeline.getCuts();

				assert.equal(remainingCuts.length, 1);
				assert.equal(remainingCuts[0], cut1);
				assert.equal(mark1.seconds, timeline.getTimeFromPixelsAlongTimeline(point1));
				assert.equal(mark2.seconds, timeline.getTimeFromPixelsAlongTimeline(point2));
			});
		});
	});
});
