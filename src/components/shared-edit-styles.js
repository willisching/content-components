import '@brightspace-ui/core/components/colors/colors';
import { css } from 'lit-element/lit-element.js';

export const sharedEditStyles = css`
	.d2l-capture-central-edit {
		display:flex;
		flex-direction: column;
		margin-bottom: 50px;
		margin-top: 25px;
	}

	d2l-input-text,
	d2l-labs-accordion-collapse,
	.d2l-capture-central-edit-textarea-container {
		margin-bottom: 25px;
		width: 750px;
	}

	.d2l-capture-central-edit-textarea-container textarea {
		resize: vertical;
	}

	d2l-labs-accordion-collapse [slot=header] {
		background-color: var(--d2l-color-gypsum);
	}

	d2l-labs-accordion-collapse [slot=header]:hover {
		background-color: var(--d2l-color-mica);
	}

	d2l-labs-accordion-collapse :not([slot=header]) {
		margin-bottom: 10px;
		margin-top: 10px;
	}

	.d2l-capture-central-edit-save-changes-button {
		margin-top: 25px;
		width: 150px;
	}
`;
