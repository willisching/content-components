
// This is a copy paste of the styles from d2l-table.
// Unfortunately, the custom-style workaround does not seem to work on Edge.

import '@brightspace-ui/core/components/colors/colors';
import { css } from 'lit-element/lit-element.js';

export const d2lTableStyles = css`
	/* Shared Styles */
	:host {
		--d2l-table-border-color: var(--d2l-color-mica);
		--d2l-table-border: 1px solid var(--d2l-table-border-color);
		--d2l-table-border-radius: 0.3rem;
		--d2l-table-header-background-color: var(--d2l-color-regolith);

		--d2l-table-light-border-color: var(--d2l-color-gypsum);
		--d2l-table-light-border: 1px solid var(--d2l-table-light-border-color);
		--d2l-table-light-header-background-color: #fff;

		--d2l-table-body-background-color: #fff;
		--d2l-table-row-background-color-active: var(--d2l-color-celestine-plus-2);
		--d2l-table-row-border-color-active-selected: var(--d2l-color-celestine-plus-1);
		--d2l-table-row-background-color-active-selected: #EBF5FC;
		--d2l-table-row-border-color-selected: var(--d2l-color-celestine-plus-1);
		--d2l-table-row-background-color-selected: var(--d2l-color-celestine-plus-2);
	}

	/* Table Styles */
	.d2l-table {
		background-color:transparent;
		border-collapse:separate!important;
		border-spacing:0;
		display:table;
		font-size: 0.8rem;
		font-weight: 400;
		width:100%;
	}

	.d2l-table > thead {
		display:table-header-group;
	}

	.d2l-table > tfoot {
		display:table-footer-group;
		background-color:var(--d2l-table-body-background-color);
	}

	.d2l-table > tbody {
		display: table-row-group;
		background-color:var(--d2l-table-body-background-color);
	}

	.d2l-table > * > tr {
		display:table-row;
	}

	d2l-table-wrapper[type="default"] .d2l-table > * > tr > td,
	d2l-table-wrapper[type="default"] .d2l-table > * > tr > th {
		border-right:var(--d2l-table-border);
		border-top:var(--d2l-table-border);
		display:table-cell;
		font-weight: inherit;
		height: 41px; /* min-height to be 62px including border */
		padding: 0.5rem 1rem;
		text-align: left;
		vertical-align:middle;
	}

	d2l-table-wrapper[type="light"] .d2l-table > * > tr > td,
	d2l-table-wrapper[type="light"] .d2l-table > * > tr > th {
		border-top: var(--d2l-table-light-border);
		display: table-cell;
		font-weight: inherit;
		height: 1.15rem; /* min-height to be 48px including border */
		padding: 0.6rem;
		text-align: left;
		vertical-align: middle;
	}

	d2l-table-wrapper[type="default"] .d2l-table-cell-first,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table-cell-last {
		border-left: var(--d2l-table-border);
	}
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table-cell-first:not(.d2l-table-cell-last) {
		border-left: 0;
	}

	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table > * > tr > td,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table > * > tr > th,
	:host([dir="rtl"]) d2l-table-wrapper[type="light"] .d2l-table > * > tr > td,
	:host([dir="rtl"]) d2l-table-wrapper[type="light"] .d2l-table > * > tr > th {
		text-align: right;
	}

	d2l-table-wrapper[type="default"] .d2l-table > thead > tr > th,
	d2l-table-wrapper[type="default"] .d2l-table > * > tr[header] > th {
		background-color:var(--d2l-table-header-background-color);
		color:var(--d2l-color-ferrite);
		font-family: inherit;
		font-size:.7rem;
		height: 27px; /* min-height to be 48px including border */
		line-height:1rem;
		margin:1rem 0;
		padding: 0.5rem 1rem;
	}

	d2l-table-wrapper[type="light"] .d2l-table > thead > tr > th,
	d2l-table-wrapper[type="light"] .d2l-table > * > tr[header] > th {
		background-color:var(--d2l-table-light-header-background-color);
		color: var(--d2l-color-ferrite);
		font-family: inherit;
		font-size: 0.7rem;
		font-weight: normal;
		height: 1.15rem; /* min-height to be 48px including border */
		line-height: 1rem;
		padding: 0.6rem;
	}

	d2l-table-wrapper[type="light"] .d2l-table > thead > tr.d2l-table-row-first > th,
	d2l-table-wrapper[type="light"] .d2l-table > * > tr[header].d2l-table-row-first  > th {
		border-top: none;
	}

	/* border radiuses */

	d2l-table-wrapper[type="default"] .d2l-table-row-first > .d2l-table-cell-first {
		border-top-left-radius: var(--d2l-table-border-radius);
	}
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table-row-first > .d2l-table-cell-first:not(.d2l-table-cell-last) {
		border-top-left-radius: 0;
	}
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table-row-first > .d2l-table-cell-first {
		border-top-right-radius: var(--d2l-table-border-radius);
	}

	d2l-table-wrapper[type="default"] .d2l-table-row-first > .d2l-table-cell-last {
		border-top-right-radius: var(--d2l-table-border-radius);
	}
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table-row-first > .d2l-table-cell-last:not(.d2l-table-cell-first) {
		border-top-right-radius: 0;
	}
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table-row-first > .d2l-table-cell-last {
		border-top-left-radius: var(--d2l-table-border-radius);
	}

	d2l-table-wrapper[type="default"] .d2l-table-row-last > .d2l-table-cell-first {
		border-bottom-left-radius: var(--d2l-table-border-radius);
	}
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table-row-last > .d2l-table-cell-first:not(.d2l-table-cell-last){
		border-bottom-left-radius: 0;
	}
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table-row-last > .d2l-table-cell-first {
		border-bottom-right-radius: var(--d2l-table-border-radius);
	}

	d2l-table-wrapper[type="default"] .d2l-table-row-last > .d2l-table-cell-last {
		border-bottom-right-radius: var(--d2l-table-border-radius);
	}
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table-row-last > .d2l-table-cell-last:not(.d2l-table-cell-first) {
		border-bottom-right-radius: 0;
	}
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table-row-last > .d2l-table-cell-last {
		border-bottom-left-radius: var(--d2l-table-border-radius);
	}

	d2l-table-wrapper[type="default"] .d2l-table-row-last > * {
		border-bottom: var(--d2l-table-border);
	}

	d2l-table-wrapper[type="light"] .d2l-table-row-last > * {
		border-bottom: var(--d2l-table-light-border);
	}

	/* active rows or un-selected hover rows */
	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[active],
	d2l-table-wrapper[type="default"] .d2l-table[selectable] > tbody > tr:not([selected]):hover,
	d2l-table-wrapper[type="light"] .d2l-table > tbody > tr[active],
	d2l-table-wrapper[type="light"] .d2l-table[selectable] > tbody > tr:not([selected]):hover {
		background-color: var(--d2l-table-row-background-color-active);
	}

	/* selected rows */

	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[selected],
	d2l-table-wrapper[type="light"] .d2l-table > tbody > tr[selected] {
		background-color: var(--d2l-table-row-background-color-selected);
	}

	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[selected] > .d2l-table-cell-last,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[selected] > .d2l-table-cell-first {
		border-right-color: var(--d2l-table-row-border-color-selected);
	}
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[selected] > .d2l-table-cell-last {
		border-right-color: var(--d2l-table-border-color);
	}
	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[selected] > .d2l-table-cell-first,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[selected] > .d2l-table-cell-last {
		border-left-color: var(--d2l-table-row-border-color-selected);
	}

	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[selected] > td,
	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[selected] > th,
	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[selected] + tr > td,
	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[selected] + tr > th,
	d2l-table-wrapper[type="light"] .d2l-table > tbody > tr[selected] > td,
	d2l-table-wrapper[type="light"] .d2l-table > tbody > tr[selected] > th,
	d2l-table-wrapper[type="light"] .d2l-table > tbody > tr[selected] + tr > td,
	d2l-table-wrapper[type="light"] .d2l-table > tbody > tr[selected] + tr > th {
		border-top-color: var(--d2l-table-row-border-color-selected);
	}

	d2l-table-wrapper[type="default"] .d2l-table-row-last[selected] > td,
	d2l-table-wrapper[type="default"] .d2l-table-row-last[selected] > th,
	d2l-table-wrapper[type="light"] .d2l-table-row-last[selected] > td,
	d2l-table-wrapper[type="light"] .d2l-table-row-last[selected] > th {
		border-bottom-color:var(--d2l-table-row-border-color-selected);
	}

	/* active + selected rows */

	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[active][selected],
	d2l-table-wrapper[type="default"] .d2l-table[selectable] > tbody > tr[selected]:hover,
	d2l-table-wrapper[type="light"] .d2l-table > tbody > tr[active][selected],
	d2l-table-wrapper[type="light"] .d2l-table[selectable] > tbody > tr[selected]:hover {
		background-color:var(--d2l-table-row-background-color-active-selected);
	}

	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[active][selected] > .d2l-table-cell-last,
	d2l-table-wrapper[type="default"] .d2l-table[selectable] > tbody > tr[selected]:hover > .d2l-table-cell-last,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[active][selected] > .d2l-table-cell-first,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table[selectable] > tbody > tr[selected]:hover > .d2l-table-cell-first {
		border-right-color: var(--d2l-table-row-border-color-active-selected);
	}
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[active][selected] > .d2l-table-cell-last,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table[selectable] > tbody > tr[selected]:hover > .d2l-table-cell-last {
		border-right-color: var(--d2l-table-border-color);
	}
	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[active][selected] > .d2l-table-cell-first,
	d2l-table-wrapper[type="default"] .d2l-table[selectable] > tbody > tr[selected]:hover > .d2l-table-cell-first,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table[selectable] > tbody > tr[selected]:hover > .d2l-table-cell-last,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[active][selected] > .d2l-table-cell-last {
		border-left-color: var(--d2l-table-row-border-color-active-selected);
	}

	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[active][selected] > td,
	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[active][selected] > th,
	d2l-table-wrapper[type="default"] .d2l-table[selectable] > tbody > tr[selected]:hover > td,
	d2l-table-wrapper[type="default"] .d2l-table[selectable] > tbody > tr[selected]:hover > th,
	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[active][selected] + tr > td,
	d2l-table-wrapper[type="default"] .d2l-table > tbody > tr[active][selected] + tr > th,
	d2l-table-wrapper[type="default"] .d2l-table[selectable] > tbody > tr[selected]:hover + tr > td,
	d2l-table-wrapper[type="default"] .d2l-table[selectable] > tbody > tr[selected]:hover + tr > th,
	d2l-table-wrapper[type="light"] .d2l-table > tbody > tr[active][selected] > td,
	d2l-table-wrapper[type="light"] .d2l-table > tbody > tr[active][selected] > th,
	d2l-table-wrapper[type="light"] .d2l-table[selectable] > tbody > tr[selected]:hover > td,
	d2l-table-wrapper[type="light"] .d2l-table[selectable] > tbody > tr[selected]:hover > th,
	d2l-table-wrapper[type="light"] .d2l-table > tbody > tr[active][selected] + tr > td,
	d2l-table-wrapper[type="light"] .d2l-table > tbody > tr[active][selected] + tr > th,
	d2l-table-wrapper[type="light"] .d2l-table[selectable] > tbody > tr[selected]:hover + tr > td,
	d2l-table-wrapper[type="light"] .d2l-table[selectable] > tbody > tr[selected]:hover + tr > th {
		border-top-color:var(--d2l-table-row-border-color-active-selected);
	}

	d2l-table-wrapper[type="default"] .d2l-table-row-last[active][selected] > td,
	d2l-table-wrapper[type="default"] .d2l-table-row-last[active][selected] > th,
	d2l-table-wrapper[type="default"] .d2l-table[selectable] > tbody > .d2l-table-row-last[selected]:hover > td,
	d2l-table-wrapper[type="default"] .d2l-table[selectable] > tbody > .d2l-table-row-last[selected]:hover > th,
	d2l-table-wrapper[type="light"] .d2l-table-row-last[active][selected] > td,
	d2l-table-wrapper[type="light"] .d2l-table-row-last[active][selected] > th,
	d2l-table-wrapper[type="light"] .d2l-table[selectable] > tbody > .d2l-table-row-last[selected]:hover > td,
	d2l-table-wrapper[type="light"] .d2l-table[selectable] > tbody > .d2l-table-row-last[selected]:hover > th {
		border-bottom-color:var(--d2l-table-row-border-color-active-selected);
	}

	/* no-column-border */
	d2l-table-wrapper[type="default"] .d2l-table[no-column-border] > tbody > tr > td:not(.d2l-table-cell-last),
	d2l-table-wrapper[type="default"] .d2l-table[no-column-border] > tbody > tr > th:not(.d2l-table-cell-last) {
		border-right: none;
	}
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table[no-column-border] > tbody > tr > .d2l-table-cell-last {
		border-right: none;
	}
	:host([dir="rtl"]) d2l-table-wrapper[type="default"] .d2l-table[no-column-border] > tbody > tr > .d2l-table-cell-first {
		border-right: var(--d2l-table-border);
	}

	/* sticky-headers */

	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] table,
	:host([dir="rtl"]) d2l-table-wrapper[type="light"][sticky-headers] table {
		padding-left: 20px;
	}

	d2l-table-wrapper[type="default"][sticky-headers] tr,
	d2l-table-wrapper[type="light"][sticky-headers] tr {
		background-color: inherit;
	}

	d2l-table-wrapper[type="default"][sticky-headers] tr[header] th,
	d2l-table-wrapper[type="default"][sticky-headers] thead tr th,
	d2l-table-wrapper[type="light"][sticky-headers] tr[header] th,
	d2l-table-wrapper[type="light"][sticky-headers] thead tr th {
		position: -webkit-sticky;
		position: sticky;
		top: 0;
	}

	d2l-table-wrapper[type="default"][sticky-headers] tr[header] th,
	d2l-table-wrapper[type="default"][sticky-headers] thead tr th {
		border-bottom: var(--d2l-table-border);
	}

	d2l-table-wrapper[type="light"][sticky-headers] tr[header] th,
	d2l-table-wrapper[type="light"][sticky-headers] thead tr th {
		border-bottom: var(--d2l-table-light-border);
	}

	d2l-table-wrapper[type="default"][sticky-headers] td[sticky].d2l-table-cell-first,
	d2l-table-wrapper[type="default"][sticky-headers] th[sticky].d2l-table-cell-first,
	d2l-table-wrapper[type="default"][sticky-headers] td[sticky]:first-child,
	d2l-table-wrapper[type="default"][sticky-headers] th[sticky]:first-child,
	d2l-table-wrapper[type="light"][sticky-headers] td[sticky].d2l-table-cell-first,
	d2l-table-wrapper[type="light"][sticky-headers] th[sticky].d2l-table-cell-first,
	d2l-table-wrapper[type="light"][sticky-headers] td[sticky]:first-child,
	d2l-table-wrapper[type="light"][sticky-headers] th[sticky]:first-child {
		left: -5px;
	}

	d2l-table-wrapper[type="default"][sticky-headers] tr[header] + tr[header] [sticky].d2l-table-cell-first,
	d2l-table-wrapper[type="default"][sticky-headers] thead tr + tr [sticky]:first-child,
	d2l-table-wrapper[type="light"][sticky-headers] tr[header] + tr[header] [sticky].d2l-table-cell-first,
	d2l-table-wrapper[type="light"][sticky-headers] thead tr + tr [sticky]:first-child {
		left: 0;
	}

	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] td[sticky].d2l-table-cell-first,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] th[sticky].d2l-table-cell-first,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] td[sticky]:first-child,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] th[sticky]:first-child,
	:host([dir="rtl"]) d2l-table-wrapper[type="light"][sticky-headers] td[sticky].d2l-table-cell-first,
	:host([dir="rtl"]) d2l-table-wrapper[type="light"][sticky-headers] th[sticky].d2l-table-cell-first,
	:host([dir="rtl"]) d2l-table-wrapper[type="light"][sticky-headers] td[sticky]:first-child,
	:host([dir="rtl"]) d2l-table-wrapper[type="light"][sticky-headers] th[sticky]:first-child {
		right: -5px;
	}

	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] tr[header] + tr[header] [sticky].d2l-table-cell-first,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] thead tr + tr [sticky]:first-child,
	:host([dir="rtl"]) d2l-table-wrapper[type="light"][sticky-headers] tr[header] + tr[header] [sticky].d2l-table-cell-first,
	:host([dir="rtl"]) d2l-table-wrapper[type="light"][sticky-headers] thead tr + tr [sticky]:first-child {
		right: 0;
	}

	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] tr[header]:not(.d2l-table-row-first) th,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] tr[header]:not(.d2l-table-row-first) td,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] thead tr:not(:first-child) th {
		border-left: var(--d2l-table-border);
	}

	d2l-table-wrapper[type="default"][sticky-headers] tr[header]:not(.d2l-table-row-first) th,
	d2l-table-wrapper[type="default"][sticky-headers] tr[header]:not(.d2l-table-row-first) td,
	d2l-table-wrapper[type="default"][sticky-headers] thead tr:not(:first-child) th,
	d2l-table-wrapper[type="light"][sticky-headers] tr[header]:not(.d2l-table-row-first) th,
	d2l-table-wrapper[type="light"][sticky-headers] tr[header]:not(.d2l-table-row-first) td,
	d2l-table-wrapper[type="light"][sticky-headers] thead tr:not(:first-child) th {
		position: -webkit-sticky;
		position: sticky;
		top: -5px;
		border-left: none;
		border-top: none;
	}

	d2l-table-wrapper[type="default"][sticky-headers] tr[header]:not(.d2l-table-row-first) th,
	d2l-table-wrapper[type="default"][sticky-headers] tr[header]:not(.d2l-table-row-first) td,
	d2l-table-wrapper[type="default"][sticky-headers] thead tr:not(:first-child) th {
		border-bottom: var(--d2l-table-border);
	}

	d2l-table-wrapper[type="light"][sticky-headers] tr[header]:not(.d2l-table-row-first) th,
	d2l-table-wrapper[type="light"][sticky-headers] tr[header]:not(.d2l-table-row-first) td,
	d2l-table-wrapper[type="light"][sticky-headers] thead tr:not(:first-child) th {
		border-bottom: var(--d2l-table-light-border);
	}

	d2l-table-wrapper[type="default"][sticky-headers] tr[header] th,
	d2l-table-wrapper[type="default"][sticky-headers] tr[header] td,
	d2l-table-wrapper[type="default"][sticky-headers] thead tr th {
		position: -webkit-sticky;
		position: sticky;
		top: -5px;
	}

	d2l-table-wrapper[type="light"][sticky-headers] tr[header] th,
	d2l-table-wrapper[type="light"][sticky-headers] tr[header] td,
	d2l-table-wrapper[type="light"][sticky-headers] thead tr th {
		position: -webkit-sticky;
		position: sticky;
		top: -3.5px;
	}

	d2l-table-wrapper[type="default"][sticky-headers] tbody tr:not([header]) td,
	d2l-table-wrapper[type="default"][sticky-headers] tbody tr:not([header]) th {
		border-top: var(--d2l-table-border);
		border-bottom: none;
	}

	d2l-table-wrapper[type="light"][sticky-headers] tbody tr:not([header]) td,
	d2l-table-wrapper[type="light"][sticky-headers] tbody tr:not([header]) th {
		border-top: var(--d2l-table-light-border);
		border-bottom: none;
	}

	d2l-table-wrapper[type="default"][sticky-headers] tr[header] + tr:not([header]) td,
	d2l-table-wrapper[type="default"][sticky-headers] tr[header] + tr:not([header]) th,
	d2l-table-wrapper[type="default"][sticky-headers] tbody tr:not([header]):not([selected]):first-child td,
	d2l-table-wrapper[type="default"][sticky-headers] tbody tr:not([header]):not([selected]):first-child th,
	d2l-table-wrapper[type="light"][sticky-headers] tr[header] + tr:not([header]) td,
	d2l-table-wrapper[type="light"][sticky-headers] tr[header] + tr:not([header]) th,
	d2l-table-wrapper[type="light"][sticky-headers] tbody tr:not([header]):not([selected]):first-child td,
	d2l-table-wrapper[type="light"][sticky-headers] tbody tr:not([header]):not([selected]):first-child th  {
		border-top: none;
		border-bottom: none;
	}

	d2l-table-wrapper[type="default"][sticky-headers] .d2l-table > thead > tr[header] + tr:not([header])[selected] > td,
	d2l-table-wrapper[type="default"][sticky-headers] .d2l-table > tbody > tr[header] + tr:not([header])[selected] > td,
	d2l-table-wrapper[type="default"][sticky-headers] tr[header] + tr:not([header])[selected] th,
	d2l-table-wrapper[type="default"][sticky-headers] tbody tr[selected]:first-child td,
	d2l-table-wrapper[type="default"][sticky-headers] tbody tr[selected]:first-child th {
		border-top: var(--d2l-table-border);
		border-top-color: var(--d2l-table-row-border-color-selected);
	}

	d2l-table-wrapper[type="light"][sticky-headers] .d2l-table > thead > tr[header] + tr:not([header])[selected] > td,
	d2l-table-wrapper[type="light"][sticky-headers] .d2l-table > tbody > tr[header] + tr:not([header])[selected] > td,
	d2l-table-wrapper[type="light"][sticky-headers] tr[header] + tr:not([header])[selected] th,
	d2l-table-wrapper[type="light"][sticky-headers] tbody tr[selected]:first-child td,
	d2l-table-wrapper[type="light"][sticky-headers] tbody tr[selected]:first-child th {
		border-top: var(--d2l-table-light-border);
		border-top-color: var(--d2l-table-row-border-color-selected);
	}

	d2l-table-wrapper[type="default"][sticky-headers] tr[header] th[sticky],
	d2l-table-wrapper[type="default"][sticky-headers] tr[header] td[sticky],
	d2l-table-wrapper[type="default"][sticky-headers] thead > tr > th[sticky],
	d2l-table-wrapper[type="light"][sticky-headers] tr[header] th[sticky],
	d2l-table-wrapper[type="light"][sticky-headers] tr[header] td[sticky],
	d2l-table-wrapper[type="light"][sticky-headers] thead > tr > th[sticky] {
		z-index: 3;
		left: 0;
	}

	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] th[sticky],
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] td[sticky],
	:host([dir="rtl"]) d2l-table-wrapper[type="light"][sticky-headers] th[sticky],
	:host([dir="rtl"]) d2l-table-wrapper[type="light"][sticky-headers] td[sticky] {
		right: 0;
	}

	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table-cell-last,
	:host([dir="rtl"]) d2l-table-wrapper[type="light"][sticky-headers] .d2l-table-cell-last {
		border-left: none;
	}

	d2l-table-wrapper[type="default"][sticky-headers] tbody :not([header]) [sticky],
	d2l-table-wrapper[type="light"][sticky-headers] tbody :not([header]) [sticky]{
		position: -webkit-sticky;
		position: sticky;
		left: 0;
		z-index: 1;
		background-color: inherit;
	}

	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table > thead > tr > td,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table > tbody > tr > td,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table th {
		border-left: var(--d2l-table-border);
		border-right: none;
	}

	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table [selected] .d2l-table-cell-last,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table > thead > tr[selected] > td:last-child,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table > tbody > tr[selected] > td:last-child {
		border-left: var(--d2l-table-border);
		border-left-color: var(--d2l-table-row-border-color-selected);
	}

	d2l-table-wrapper[type="default"][sticky-headers] .d2l-table tr[selected] th,
	d2l-table-wrapper[type="default"][sticky-headers] .d2l-table tr[selected] td {
		border-top: var(--d2l-table-border);
		border-top-color: var(--d2l-table-row-border-color-selected);
	}

	d2l-table-wrapper[type="light"][sticky-headers] .d2l-table tr[selected] th,
	d2l-table-wrapper[type="light"][sticky-headers] .d2l-table tr[selected] td {
		border-top: var(--d2l-table-light-border);
		border-top-color: var(--d2l-table-row-border-color-selected);
	}

	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table .d2l-table-cell-first,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table > thead > tr > td:first-child,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table > tbody > tr > td:first-child,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table th:first-child {
		border-right: var(--d2l-table-border);
	}

	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table [selected] .d2l-table-cell-first,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table > thead > tr[selected] > td:first-child,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table > tbody > tr[selected] > td:first-child,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table [selected] th:first-child {
		border-right-color: var(--d2l-table-row-border-color-selected);
	}

	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table [selected] .d2l-table-cell-first,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table [selected] > thead > tr > td:first-child,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table [selected] > tbody > tr > td:first-child,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table [selected] + :not([selected]) .d2l-table-cell-last,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table [selected] + :not([selected]) td:last-child {
		border-left: var(--d2l-table-border);
	}

	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table [header] + [header] > td,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table [header] + [header] > th,
	:host([dir="rtl"]) d2l-table-wrapper[type="default"][sticky-headers] .d2l-table thead tr:not(:first-child) th {
		border-right: none;
	}

	d2l-table-wrapper[type="default"][sticky-headers] .d2l-table > tbody > tr.d2l-table-row-last > td,
	d2l-table-wrapper[type="default"][sticky-headers] .d2l-table > tbody > tr.d2l-table-row-last > th {
		border-bottom: var(--d2l-table-border)
	}

	d2l-table-wrapper[type="light"][sticky-headers] .d2l-table > tbody > tr.d2l-table-row-last > td,
	d2l-table-wrapper[type="light"][sticky-headers] .d2l-table > tbody > tr.d2l-table-row-last > th {
		border-bottom: var(--d2l-table-light-border)
	}

	d2l-table-wrapper[type="default"][sticky-headers] .d2l-table tr[selected].d2l-table-row-last td,
	d2l-table-wrapper[type="default"][sticky-headers] .d2l-table tr[selected].d2l-table-row-last th,
	d2l-table-wrapper[type="light"][sticky-headers] .d2l-table tr[selected].d2l-table-row-last td,
	d2l-table-wrapper[type="light"][sticky-headers] .d2l-table tr[selected].d2l-table-row-last th {
		border-bottom-color: var(--d2l-table-row-border-color-selected);
	}

	d2l-table-wrapper[type="default"][sticky-headers] .d2l-table > tbody > tr.d2l-table-row-first.d2l-table-row-last > td.d2l-table-cell-first.d2l-table-cell-last {
		border-top: var(--d2l-table-border);
		border-bottom: var(--d2l-table-border);
	}

	d2l-table-wrapper[type="light"][sticky-headers] .d2l-table > tbody > tr.d2l-table-row-first.d2l-table-row-last > td.d2l-table-cell-first.d2l-table-cell-last {
		border-top: var(--d2l-table-light-border);
		border-bottom: var(--d2l-table-light-border);
	}
`;
