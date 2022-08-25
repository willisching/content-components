# d2l-producer

## `producer`

### Usage
(See demo page for a more detailed example)

### HTML Example

```html
	<d2l-producer
		endpoint="http://content-service-staging.brightspace.d2l.com"
		tenant-id="0840bb02-1f06-431d-9ae8-70c18a4dbf6b"
		content-id="c2c54ba6-845c-4711-8aa3-2af37827b344"
	></d2l-producer>
```

### LitElement Example

```js
import '@d2l/content-components/applications/d2l-producer';

const defaultLanguage = { code: 'en-us', name: 'English' };
let selectedLanguage = { code: 'fr-fr', name: 'French' };
const metadata = { cuts: [], chapters: [] };
const handleMetadataChanged = e => (metadata = e.detail);

const contentServiceEndpoint = 'http://content-service-staging.brightspace.d2l.com';
const tenantId = '0840bb02-1f06-431d-9ae8-70c18a4dbf6b';
const contentId='c2c54ba6-845c-4711-8aa3-2af37827b344';

class MyComponent {
	// ...
	render() {
		return html`
			<d2l-producer
				.endpoint="${contentServiceEndpoint}"
				.tenant-id="${tenantId}"
				.content-id="${contentId}"
			></d2l-producer>
		`;
	}
}
```

**Properties:**

| Property | Type | Description |
|--|--|--|
| src | String | Source of the video file. |
| .endpoint | String | API endpoint URL for Content Service. |
| .tenant-id | String | ID of the Brightspace tenant that owns the audio/video content. |
| .content-id | String | ID of the audio/video content object. |

**Events:**

| Event | Description |
|--|--|
| @content-loaded | Fired when the content specified by contentId has been loaded. event.details contains a "content" object possessing the properties of the content object. |

## Developing, Testing and Contributing

After cloning the repo, run `npm install` to install dependencies.

### Running the demos

To start an [es-dev-server](https://open-wc.org/developing/es-dev-server.html) that hosts the demo page and tests:

```shell
npm run start:d2l-producer
```
