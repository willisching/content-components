# d2l-labs-video-producer

[![NPM version](https://img.shields.io/npm/v/@brightspace-ui-labs/video-producer.svg)](https://www.npmjs.org/package/@brightspace-ui-labs/video-producer)
[![Dependabot badge](https://flat.badgen.net/dependabot/BrightspaceUILabs/video-producer?icon=dependabot)](https://app.dependabot.com/)
[![Build status](https://travis-ci.com/@brightspace-ui-labs/video-producer.svg?branch=master)](https://travis-ci.com/@brightspace-ui-labs/video-producer)

> Note: this is a ["labs" component](https://github.com/BrightspaceUI/guide/wiki/Component-Tiers). While functional, these tasks are prerequisites to promotion to BrightspaceUI "official" status:
>
> - [ ] [Design organization buy-in](https://github.com/BrightspaceUI/guide/wiki/Before-you-build#working-with-design)
> - [ ] [design.d2l entry](http://design.d2l/)
> - [ ] [Architectural sign-off](https://github.com/BrightspaceUI/guide/wiki/Before-you-build#web-component-architecture)
> - [x] [Continuous integration](https://github.com/BrightspaceUI/guide/wiki/Testing#testing-continuously-with-travis-ci)
> - [ ] [Cross-browser testing](https://github.com/BrightspaceUI/guide/wiki/Testing#cross-browser-testing-with-sauce-labs)
> - [ ] [Unit tests](https://github.com/BrightspaceUI/guide/wiki/Testing#testing-with-polymer-test) (if applicable)
> - [ ] [Accessibility tests](https://github.com/BrightspaceUI/guide/wiki/Testing#automated-accessibility-testing-with-axe)
> - [ ] [Visual diff tests](https://github.com/BrightspaceUI/visual-diff)
> - [ ] [Localization](https://github.com/BrightspaceUI/guide/wiki/Localization) with Serge (if applicable)
> - [x] Demo page
> - [x] README documentation



## Installation

To install from NPM:

```shell
npm install @brightspace-ui-labs/video-producer
```

## Usage

```html
<script type="module">
    import '@brightspace-ui-labs/video-producer/video-producer.js';
</script>
<d2l-labs-video-producer
	src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
></d2l-labs-video-producer>
```

See the demo page for example implementation and usage.

**Properties:**

| Property | Type | Description |
|--|--|--|
| src | String | Source of the video file. |
| languages | Array | Array of locale languages. |
| metadata | Array | Object containing the cuts and chapters of the video. |
| error-occurred | Boolean | Set to `true` to indicate that an error occurred. Setting `save-complete` to `true` will trigger the alert to show an error message. |
| save-complete | Boolean | Set to `true` to indicate that saving/publishing of the metadata is complete, and display an alert. If `error-occurred` is also `true`, an error message will be displayed instead. |

**Events:**

| Event | Description |
|--|--|
| get-metadata | Fired when the video has loaded, indicating that metadata can be loaded. |
| save-metadata | Fired when the save button is clicked. |
| publish-metadata | Fired when the publish button is clicked. |

## Developing, Testing and Contributing

After cloning the repo, run `npm install` to install dependencies.

### Running the demos

To start an [es-dev-server](https://open-wc.org/developing/es-dev-server.html) that hosts the demo page and tests:

```shell
npm start
```

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

Include either `[increment major]`, `[increment minor]` or `[increment patch]` in your merge commit message to automatically increment the `package.json` version, create a tag, and trigger a deployment to NPM.
