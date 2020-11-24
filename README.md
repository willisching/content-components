# d2l-labs-video-producer

[![NPM version](https://img.shields.io/npm/v/@brightspace-ui-labs/video-producer.svg)](https://www.npmjs.org/package/@brightspace-ui-labs/video-producer)

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

## `video-producer`

### Usage
(See demo page for a more detailed example)
```js
import '@brightspace-ui-labs/video-producer/video-producer.js';

const defaultLanguage = { code: 'en-us', name: 'English' };
let selectedLanguage = { code: 'fr-fr', name: 'French' };
const metadata = { cuts: [], chapters: [] };
const handleMetadataChanged = e => (metadata = e.detail);

class MyComponent {
	// ...
	render() {
		return html`
			<d2l-labs-video-producer
				.defaultLanguage="${defaultLanguage}"
				.metadata="${metadata}"
				.selectedLanguage="${selectedLanguage}"
				@metadata-changed="${handleMetadataChanged}"
				src="..."
			></d2l-labs-video-producer>
		`;
	}
}
```

**Properties:**

| Property | Type | Description |
|--|--|--|
| src | String | Source of the video file. |
| .defaultLanguage | Object | An object representing the default language. Should have two properties: `code` and `name`. |
| .selectedLanguage | Object | An object representing the currently selected language. Should have two properties: `code` and `name`. |
| .metadata | Array | Object containing the cuts and chapters of the video. |

**Events:**

| Event | Description |
|--|--|
| @metadata-changed | Fired when the metadata has changed. This occurs whenever cuts/chapters are added/deleted, and chapter titles/times are updated. |


## `video-producer-language-selector`

### Usage
```js
import '@brightspace-ui-labs/video-producer/video-producer-language-selector.js';

const languages = [
	{ code: 'en-us', name: 'English' },
	{ code: 'fr-fr', name: 'French' },
];
let selectedLanguage = { code: 'fr-fr', name: 'French' };
const handleSelectedLanguageChanged = e => (selectedLanguage = e.detail.selectedLanguage);

class MyComponent {
	// ...
	render() {
		return html`
			<d2l-labs-video-producer-language-selector
				.languages="${languages}"
				.selectedLanguage="${selectedLanguage}"
				@selected-language-changed="${handleSelectedLanguageChanged}"
			></d2l-labs-video-producer-language-selector>
		`;
	}
}
```

**Properties:**

| Property | Type | Description |
|--|--|--|
| .languages | Object | An array of objects representing the available languages to select. Each language object should have two properties: `code` and `name`. |
| .selectedLanguage | Object | An object representing the currently selected language. Should have two properties: `code` and `name`. |

**Events:**

| Event | Description |
|--|--|
| @selected-language-changed | Fired when the selected language has changed. |

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

Releases use the [semantic-release](https://semantic-release.gitbook.io/) tooling and the [angular preset](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) for commit message syntax. Upon release, the version in `package.json` is updated, a tag and GitHub release is created and a new package will be deployed to NPM.

Commits prefixed with `feat` will trigger a minor release, while `fix` or `perf` will trigger a patch release. A commit containing `BREAKING CHANGE` will cause a major release to occur.

Other useful prefixes that will not trigger a release: `build`, `ci`, `docs`, `refactor`, `style` and `test`. More details in the [Angular Contribution Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#type).
