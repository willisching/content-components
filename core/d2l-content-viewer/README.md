# d2l-content-viewer

Media player for content in the Content Service

## Installation

To install from NPM:

```shell
npm install @brightspace/content-components
```

## Usage

```html
<script type="module">
	import '@brightspace/content-components/core/d2l-content-viewer.js';
</script>
<d2l-content-viewer org-unit-id="<org unit id>" topic-id="<topic id>">My element</d2l-content-viewer>
<d2l-content-viewer activity="<hypermedia entity with content service resource>">My element</d2l-content-viewer>
```

**Attributes:**

| Attribute | Type | Default | Description |
|--|--|--|--|
| activity | String |  | The hypermedia entity used to fetch the media and captions resource. Required unless `orgUnitId` and `topicId` are configured. |
| allowDownload | Boolean | false | An attribtue used by d2l-labs-media-player to allow download. |
| allowDownloadOnError | Boolean | false | An attribtue used by d2l-labs-media-player to allow download on error. |
| captionsHref | String |  | [Deprecated] The url used to fetch the captions resource. |
| framed | Boolean | false | Determines whether to use framed or unframed auth for d2l-fetch when using the hypermedia entity. |
| orgUnitId | Number |  | The orgUnitId in which the content is being loaded. Required unless `activity` is configured. |
| topicId | Number |  | The topicId in which the content is being loaded. Required unless `activity` is configured. |
| href | String |  | [Deprecated] The url used to fetch the media resource. |

**Properties:**

| Property | Type | Get/Set | Description |
|--|--|--|--|
| captionSignedUrls | Array | Get & Set | An array of caption signed url objects. Each signed url object contains the signed url value, locale, and the amount of time until the signed url expires. |

**Events:**

| Event | Description |
|--|--|
| @cs-content-loaded | Dispatched when both the media and captions resources are loaded. |

## Developing, Testing and Contributing

After cloning the repo, run `npm install` to install dependencies.

### Linting

```shell
# eslint and lit-analyzer
npm run lint

# eslint only
npm run lint:eslint

# lit-analyzer only
npm run lint:lit
```

### Testing

```shell
# lint, unit test and visual-diff test
npm test

# lint only
npm run lint

# unit tests only
npm run test:headless

# debug or run a subset of local unit tests
# then navigate to `http://localhost:9876/debug.html`
npm run test:headless:watch
```

## Versioning, Releasing & Deploying

All version changes should obey [semantic versioning](https://semver.org/) rules.

Include either `[increment major]`, `[increment minor]` or `[increment patch]` in your merge commit message to automatically increment the `package.json` version and create a tag.
