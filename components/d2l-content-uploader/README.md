# d2l-content-uploader

Dialog for adding content.

## Usage

```html
<script type="module">
    import 'd2l-content-uploader/d2l-content-uploader.js';
</script>
<d2l-content-uploader
	tenant-id="00000000-0000-0000-0000-000000000000"
	api-endpoint="https://api.us-east-1.content-service.brightspace.com"
	>My element</d2l-content-uploader>
```

**Properties:**

| Property | Type | Description |
|--|--|--|
|tenant-id|String (required)|ID of the Brightspace Tenant that the content will be added to|
|api-endpoint|String (required)|URL of the Content Service instance that will manage the added content|

**Accessibility:**

To make your usage of `d2l-content-uploadert` accessible, use the following properties when applicable:

| Attribute | Description |
|--|--|
| | |

## Developing, Testing and Contributing

### Integrating with a Local BSI Instance

1. After cloning the repo, run `npm install` to install dependencies.
2. Create a local clone of [BSI](https://github.com/Brightspace/brightspace-integration). In its directory, run `npm install`.
3. cd to your local `d2l-content-uploader` repo.\
   Run: `node ./scripts/install-missing-bsi-dependencies.js <path to your local BSI instance>`\
   and: `npm link`
4. cd to your BSI clone and run `npm link d2l-content-uploader`.

### Running the demos

This Web Component does not possess a demo because it must be integrated into Brightspace in order to function.

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
# lint, unit test
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
