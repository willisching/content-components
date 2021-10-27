const constants = {
	// Control Modes
	CONTROL_MODES: {
		SEEK: 'seek',
		MARK: 'mark',
		CUT: 'cut',
	},

	// Canvas
	CANVAS_BORDER_WIDTH: 1,
	get CANVAS_CONTAINER_HEIGHT() {
		return constants.CANVAS_HEIGHT + constants.CANVAS_BORDER_WIDTH * 2;
	},
	get CANVAS_CONTAINER_WIDTH() {
		return constants.CANVAS_WIDTH + constants.CANVAS_BORDER_WIDTH * 2;
	},
	get CANVAS_HEIGHT() {
		return constants.TIMELINE_OFFSET_Y + constants.TIMELINE_HEIGHT_MIN + constants.ZOOM_HANDLE_HEIGHT + constants.TIME_TEXT_BORDER_HEIGHT + constants.ZOOM_HANDLE_MAX_DEPTH + constants.TIMELINE_OFFSET_Y;
	},
	CANVAS_WIDTH: 985,

	// Captions
	ADD_NEW_CUE_KEY_CODE: 13, // 13 is the "Enter" key in Javascript
	MAX_CAPTIONS_UPLOAD_SIZE_IN_BYTES: 1024 * 1024 * 1024,
	NEW_CUE_DEFAULT_DURATION_IN_SECONDS: 3,
	NUM_OF_VISIBLE_CAPTIONS_CUES: 50,

	// Timeline
	TIMELINE_HEIGHT_MIN: 30,
	get TIMELINE_WIDTH() {
		return constants.CANVAS_WIDTH - constants.TIMELINE_OFFSET_X * 2;
	},
	get TIMELINE_OFFSET_X() {
		return constants.ZOOM_HANDLE_WIDTH / 2;
	},
	TIMELINE_OFFSET_Y: 12,

	// Zoom
	get ZOOM_HANDLE_OFFSET_Y() {
		return constants.TIMELINE_OFFSET_Y + constants.TIMELINE_HEIGHT_MIN;
	},
	ZOOM_HANDLE_WIDTH: 30,
	ZOOM_HANDLE_HEIGHT: 10,
	get ZOOM_HANDLE_MAX_DEPTH() {
		return constants.TIMELINE_HEIGHT_MIN * 3;
	},
	ZOOM_MULTIPLIER_DISPLAY: {
		TOTAL_TIME: 2000,
		FADE_INTERVAL: 10,
		FADE_TIME: 500,
		get TIME_BEFORE_FADE() {
			return constants.ZOOM_MULTIPLIER_DISPLAY.TOTAL_TIME - constants.ZOOM_MULTIPLIER_DISPLAY.FADE_TIME;
		},
	},

	// Cursor
	get CURSOR_OFFSET_X() {
		return -constants.MARK_WIDTH / 2;
	},
	get CURSOR_OFFSET_Y() {
		return constants.TIMELINE_OFFSET_Y - 5;
	},

	// Hitbox
	HITBOX_WIDTH: 20,
	HITBOX_HEIGHT: 50,
	HITBOX_OFFSET: -5,

	// Mark
	MARK_WIDTH: 10,
	MARK_HEIGHT_MIN: 40,

	// Time text
	TIME_TEXT_BORDER_HEIGHT: 30,
	TIME_TEXT_BORDER_WIDTH: 94,
	get TIME_CONTAINER_OFFSET_X() {
		return -(constants.TIME_TEXT_BORDER_WIDTH / 2);
	},
	get TIME_CONTAINER_OFFSET_Y() {
		return constants.TIMELINE_OFFSET_Y + constants.TIMELINE_HEIGHT_MIN + constants.CANVAS_BORDER_WIDTH + constants.ZOOM_HANDLE_HEIGHT;
	},

	// Cue Types
	CUETYPES: {
		Media: 0,
		Chapter: 1,
		Cut: 2,
		Caption: 3,
		Metadata: 4
	},

	// Colours
	COLOURS: {
		CONTENT: '#0099CC',
		CONTENT_HIT_BOX: '#FFFFFF',
		CUT: '#FF0000',
		CUT_HIGHLIGHTED: '#B8B8B8',
		MARK: '#BCBCBC',
		MARK_HIGHLIGHTED: '#797979',
		TIME_TEXT: '#616769',
		TIMELINE: '#000000',
		TIMELINE_PLAYED: '#0066CC',
		ZOOM_HANDLE_SET: '#006FBF',
		ZOOM_HANDLE_UNSET: '#CDD5DC',
	},
};
export default constants;
