# d2l-content-topic-renderer

Content Service renderer for topics in classic Content.

## Installation

Install from NPM:

```shell
npm install @brightspace/content-components
```

## Usage

```html
<script type="module">
    import '@brightspace/content-components/d2l-content-topic-renderer.js';
</script>
<d2l-content-topic-renderer
	?allow-download=false
	?allow-download-on-error=false
	content-service-endpoint="http://example.org"
	topic-id="12345">
</d2l-content-topic-renderer>
```

**Properties:**

| Property | Type | Description |
|--|--|--|
| allow-download | Boolean | (Optional) (Default: false) An attribute used by d2l-labs-media-player to allow download. |
| allow-download-on-error | Boolean | (Optional) (Default: false) An attribute used by d2l-labs-media-player to allow download on error. |
| content-service-endpoint | String | API endpoint URL for Content Service. |
| topic-id | String | Topic ID of the Content within the LMS. |

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
