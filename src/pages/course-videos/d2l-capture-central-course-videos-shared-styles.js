// import '@brightspace-ui/core/components/colors/colors';
import { css } from 'lit-element/lit-element.js';

export const sharedCourseVideoStyles = css`

	.d2l-capture-central-video-thumbnail {
		height: 120px;
		object-fit: cover;
		width: 200px;
	}

	.d2l-capture-central-video-list-item [slot=illustration] {
		position: relative;
	}

	.d2l-capture-central-video-list-content .d2l-heading-3 {
		margin-top: 0;
		margin-bottom: 0;
	}

	.d2l-capture-central-video-thumbnail-duration-overlay {
		background: rgba(0, 0, 0, 0.5); /* Black see-through */
		border-radius: 2px;
		bottom: 0;
		color: white;
		display: flex;
		display: inline-flex;
		height: 26px;
		margin: 4px;
		padding: 3px 4px;
		position: absolute;
		right: 0;
		letter-spacing: 0.5px;
		font-size: 16px;
	}
`;
