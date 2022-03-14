# d2l-content-media-player

Media player for Content Service audio/video.

## Installation

Install from NPM:

```shell
npm install @brightspace/content-components
```

## Usage

```html
<script type="module">
    import '@brightspace/content-components/d2l-content-media-player.js';
</script>
<d2l-content-media-player
	?allow-download=true
	?allow-download-on-error=true
	content-service-endpoint="http://example.org"
	context-id="12345"
	context-type="topic"
	d2lrn="d2lrn"
></d2l-content-media-player>
```

**Properties:**

| Property | Type | Description |
|--|--|--|
| allow-download | Boolean | (Optional) (Default: false) An attribute used by d2l-labs-media-player to allow download. |
| allow-download-on-error | Boolean | (Optional) (Default: false) An attribute used by d2l-labs-media-player to allow download on error. |
| content-service-endpoint | String | API endpoint URL for Content Service. |
| context-id | String | Context id of the media. Corresponds to the context type provided. |
| context-type | String | Context type of the media. Can be 'topic' or 'placement' |
| d2lrn | String | D2LRN for the media. |

## Developing, Testing and Contributing

After cloning the repo, run `npm install` to install dependencies.

### Linting

```shell
# eslint and lit-analyzer
npm run lint

# eslint only
npm run lint:eslint
```

### Testing

```shell
# lint & run headless unit tests
npm test

# unit tests only
npm run test:headless

# debug or run a subset of local unit tests
npm run test:headless:watch
```

