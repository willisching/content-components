const constants = {
	// Timeline
	TIMELINE_HEIGHT: 30,
	TIMELINE_WIDTH: 990,
	TIMELINE_OFFSET_X: 10,
	TIMELINE_OFFSET_Y: 12,

	// Cursor
	CURSOR_OFFSET_X: -5,
	get CURSOR_OFFSET_Y() {
		return constants.TIMELINE_OFFSET_Y - 5;
	},

	// Hitbox
	HITBOX_WIDTH: 20,
	HITBOX_HEIGHT: 50,
	HITBOX_OFFSET: -5,

	// Mark
	MARK_WIDTH: 10,
	MARK_HEIGHT: 40,

	// Time text
	TIME_TEXT_BORDER_HEIGHT: 30,
	TIME_TEXT_BORDER_WIDTH: 94,
	get TIME_CONTAINER_OFFSET_X() {
		return -(constants.TIME_TEXT_BORDER_WIDTH / 2);
	},
	get TIME_CONTAINER_OFFSET_Y() {
		return constants.TIMELINE_OFFSET_Y + 40;
	},

	// Cue Types
	CUETYPES: {
		Media: 0,
		Chapter: 1,
		Cut: 2,
		Caption: 3,
		Metadata: 4
	},
};
export default constants;
