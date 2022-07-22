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

export function toString({company, product, service, region, tenantId, resourceType, resource}) {
	return [
		company,
		product,
		service,
		region,
		tenantId,
		resourceType,
		resource
	].join(':');
}

export function build({region, tenantId, resourceType, contentId, revisionTag}) {
	return toString({
		company: 'd2l',
		product: 'brightspace',
		service: 'content',
		region,
		tenantId,
		resourceType,
		resource: `${contentId}${revisionTag ? `/${revisionTag}` : '/latest'}`
	});
}
