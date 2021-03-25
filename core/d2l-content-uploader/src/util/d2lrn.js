export function parse(urn) {
	const [
		company,
		product,
		service,
		region,
		tenantId,
		resourceType,
		resource,
		...more
	] = urn.split(':');

	if (resource === undefined || more.length > 0) {
		throw new Error(`Invalid D2LRN: "${urn}"`);
	}

	const [contentId, revisionId] = resource.split('/');

	return {
		company,
		product,
		service,
		region,
		tenantId,
		contentId,
		revisionId,
		resourceType,
		resource,
	};
}
