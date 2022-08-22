import '@brightspace-ui/core/components/colors/colors';
import { css } from 'lit-element/lit-element.js';

export const sharedManageStyles = css`
	.d2l-content-library-manage-container {
		display: flex;
		flex-direction: column;
		margin-bottom: 50px;
	}

	.d2l-content-library-manage-header {
		align-items: center;
		border-bottom: 1px solid var(--d2l-color-mica);
		display: flex;
		justify-content: space-between;
	}

	.d2l-content-library-manage-header .d2l-heading-2 {
		margin-right: 25px;
	}

	.d2l-content-library-manage-num-selected {
		margin: 20px 0;
	}

	.d2l-content-library-manage-options {
		display: flex;
	}

	.d2l-content-library-manage-options d2l-input-search {
		margin-left: auto;
		width: 350px;
	}

	.d2l-content-library-manage-options d2l-button {
		margin-right: 25px;
	}
`;

export const sharedTableStyles = css`
	d2l-table-wrapper {
		margin-top: 20px;
	}

	.d2l-content-library-table-caption {
		display: none;
	}

	.d2l-content-library-table-no-results {
		text-align: center !important;
	}

	.d2l-content-library-th-container {
		align-items: center;
		display: flex;
		white-space: nowrap;
	}

	.d2l-content-library-th-checkbox-container, .d2l-content-library-th-more-options-container {
		width: 10px;
	}

	d2l-input-checkbox {
		margin: 0;
	}
`;

export const sharedEditStyles = css`
	.d2l-content-library-edit-container {
		display: flex;
		flex-direction: column;
		margin-bottom: 50px;
		margin-top: 25px;
	}

	d2l-input-text,
	d2l-labs-accordion-collapse,
	.d2l-content-library-edit-textarea-container,
	.d2l-input-select {
		margin-bottom: 25px;
		max-width: 575px;
	}

	.d2l-content-library-edit-textarea-container textarea {
		resize: vertical;
	}

	d2l-labs-accordion-collapse div[slot=header] {
		border-bottom: 1px solid var(--d2l-color-mica);
	}

	.d2l-content-library-edit-save-changes-button {
		margin-top: 25px;
		width: 150px;
	}
`;

