import SirenParse from 'siren-parser';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';

export default class HypermediaClient {
	constructor({ entity, framed }) {
		this.entity = SirenParse(entity);
		this.client = new ContentServiceBrowserHttpClient({ framed });
	}

	async getResourceEntity() {
		if (!this.entity.hasLinkByClass('content-service-resource')) {
			return null;
		}

		const { href } = this.entity.getLinkByClass('content-service-resource');
		try {
			const resourceResponse = await this.client.callGet({
				path: href
			});
			const resourceEntity = SirenParse(resourceResponse);
			return resourceEntity;
		} catch (e) {
			if (e.cause === 404) {
				return null;
			}
			throw e;
		}
	}
}
