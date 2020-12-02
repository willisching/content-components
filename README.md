# d2l-content-store-add-content

[![Dependabot badge](https://flat.badgen.net/dependabot/Brightspace/content-store-add-content?icon=dependabot)](https://app.dependabot.com/)
[![Build status](https://travis-ci.com/brightspace/content-store-add-content.svg?branch=master)](https://travis-ci.com/brightspace/content-store-add-content)

Dialog for adding content.

## Usage

```html
<script type="module">
    import 'd2l-content-store-add-content/d2l-content-store-add-content.js';
</script>
<d2l-content-store-add-content
	tenant-id="00000000-0000-0000-0000-000000000000"
	api-endpoint="https://api.us-east-1.content-service.brightspace.com"
	>My element</d2l-content-store-add-content>
```

**Properties:**

| Property | Type | Description |
|--|--|--|
|tenant-id|String (required)|ID of the Brightspace Tenant that the content will be added to|
|api-endpoint|String (required)|URL of the Content Service instance that will manage the added content|

**Accessibility:**

To make your usage of `d2l-content-store-add-content` accessible, use the following properties when applicable:

| Attribute | Description |
|--|--|
| | |

## Developing, Testing and Contributing

### Integrating with a Local BSI Instance

1. After cloning the repo, run `npm install` to install dependencies.
2. Create a local clone of [BSI](https://github.com/Brightspace/brightspace-integration). In its directory, run `npm install`.
3. cd to your local `d2l-content-store-add-content` repo.\
   Run: `node ./scripts/install-missing-bsi-dependencies.js <path to your local BSI instance>`\
   and: `npm link`
4. cd to your BSI clone and run `npm link d2l-content-store-add-content`.

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

### Visual Diff Testing

This repo uses the [@brightspace-ui/visual-diff utility](https://github.com/BrightspaceUI/visual-diff/) to compare current snapshots against a set of golden snapshots stored in source control.

```shell
# run visual-diff tests
npm run test:diff

# subset of visual-diff tests:
npm run test:diff -- -g some-pattern

# update visual-diff goldens
npm run test:diff:golden
```

Golden snapshots in source control must be updated by Travis CI. To trigger an update, press the "Regenerate Goldens" button in the pull request `visual-difference` test run.

## Versioning, Releasing & Deploying

All version changes should obey [semantic versioning](https://semver.org/) rules.

Include either `[increment major]`, `[increment minor]` or `[increment patch]` in your merge commit message to automatically increment the `package.json` version and create a tag.
