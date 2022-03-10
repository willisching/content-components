# d2l-content-activity-renderer

Content renderer for activities (Hypermedia entities).

## Installation

Install from NPM:

```shell
npm install @brightspace/content-components
```

## Usage

```html
<script type="module">
    import '@brightspace/content-components/d2l-content-activity-renderer.js';
</script>
<d2l-content-activity-renderer
	?allow-download=false
	?allow-download-on-error=false
	activity=${JSON.stringify(activity)}
	framed
	topic-id="12345">
</d2l-content-activity-renderer>
```

**Properties:**

| Property | Type | Description |
|--|--|--|
| activity | String | Activity (Hypermedia entity) for the content. Should be passed in using JSON.stringify. |
| allow-download | Boolean | (Optional) (Default: false) An attribute used by d2l-labs-media-player to allow download. |
| allow-download-on-error | Boolean | (Optional) (Default: false) An attribute used by d2l-labs-media-player to allow download on error. |
| framed | Boolean | (Optional) (Default: false) Determines whether to use framed or unframed auth for d2l-fetch when using the hypermedia entity. |
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
