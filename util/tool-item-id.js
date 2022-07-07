export const ToolItemType = {
	Topic: 100
};

export function createToolItemId({ toolItemType, id }) {
	return `${toolItemType}${id}`;
}
