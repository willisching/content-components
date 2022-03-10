# d2l-content-renderer

Renderer for Content Service, which determines which components to use based on the content type in the D2LRN.

## Installation

Install from NPM:

```shell
npm install @brightspace/content-components
```

## Usage

```html
<script type="module">
    import '@brightspace/content-components/d2l-content-renderer.js';
</script>
<d2l-content-renderer
	content-service-endpoint="http://example.org"
	context-id="12345"
	context-type="topic"
	d2lrn="d2lrn"
></d2l-content-renderer>
```

**Properties:**

| Property | Type | Description |
|--|--|--|
| content-service-endpoint | String | API endpoint URL for Content Service. |
| context-id | String | Context id of the content. Corresponds to the context type provided. |
| context-type | String | Context type of the content. Can be 'topic' or 'placement' |
| d2lrn | String | D2LRN for the content. |

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
