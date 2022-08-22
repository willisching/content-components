# Content Components

A collection of components used for content in Brightspace.

## Components

### Applications
* [d2l-content-library](applications/d2l-content-library)


### Core
* [d2l-captions-manager](core/d2l-captions-manager)
* [d2l-bulk-complete](core/bulk-complete)
* [d2l-drop-uploader](core/drop-uploader)
* [d2l-topic-preview](core/topic-preview)
* [d2l-upload-progress](core/upload-progress)
* [d2l-content-activity-renderer](core/d2l-content-activity-renderer)
* [d2l-content-media-player](core/d2l-content-media-player)
* [d2l-content-properties](core/d2l-content-properties)
* [d2l-content-renderer](core/d2l-content-renderer)
* [d2l-content-scorm-player](core/d2l-content-scorm-player)
* [d2l-content-selector](core/d2l-content-selector)
* [d2l-content-selector-list](core/d2l-content-selector-list)
* [d2l-content-topic-renderer](core/d2l-content-topic-renderer)
* [d2l-content-topic-settings](core/d2l-content-topic-settings)
* [d2l-content-uploader](core/d2l-content-uploader)

### Capture
* [d2l-capture-producer](capture/d2l-capture-producer)

## Developing, Testing and Contributing

After cloning the repo, run `npm install` to install dependencies.

### Testing

To lint:

```shell
npm run lint
```

To run local unit tests:

```shell
npm run test:local
```

To run both linting and unit tests:

```shell
npm test
```


To run with local instance of bsi:
```shell
npm link
cd ../<your-brightspace-integration-dir>
npm link @d2l/content-components
```

### Visual Diff Testing

This repo uses the [@brightspace-ui/visual-diff utility](https://github.com/BrightspaceUI/visual-diff/) to compare current snapshots against a set of golden snapshots stored in source control.

The golden snapshots in source control must be updated by the [visual-diff GitHub Action](https://github.com/BrightspaceUI/actions/tree/main/visual-diff).  If a pull request results in visual differences, a draft pull request with the new goldens will automatically be opened against its branch.

To run the tests locally to help troubleshoot or develop new tests, first install these dependencies:

```shell
npm install @brightspace-ui/visual-diff@X mocha@Y puppeteer@Z  --no-save
```

Replace `X`, `Y` and `Z` with [the current versions](https://github.com/BrightspaceUI/actions/tree/main/visual-diff#current-dependency-versions) the action is using.

Then run the tests:

```shell
# run visual-diff tests
npx mocha './**/*.visual-diff.js' -t 10000
# subset of visual-diff tests:
npx mocha './**/*.visual-diff.js' -t 10000 -g some-pattern
# update visual-diff goldens
npx mocha './**/*.visual-diff.js' -t 10000 --golden
```


## Versioning & Releasing

> TL;DR: Commits prefixed with `fix:` and `feat:` will trigger patch and minor releases when merged to `master`. Read on for more details...

The [semantic-release GitHub Action](https://github.com/BrightspaceUI/actions/tree/main/semantic-release) is called from the `release.yml` GitHub Action workflow to handle version changes and releasing.

### Version Changes

All version changes should obey [semantic versioning](https://semver.org/) rules:
1. **MAJOR** version when you make incompatible API changes,
2. **MINOR** version when you add functionality in a backwards compatible manner, and
3. **PATCH** version when you make backwards compatible bug fixes.

The next version number will be determined from the commit messages since the previous release. Our semantic-release configuration uses the [Angular convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) when analyzing commits:
* Commits which are prefixed with `fix:` or `perf:` will trigger a `patch` release. Example: `fix: validate input before using`
* Commits which are prefixed with `feat:` will trigger a `minor` release. Example: `feat: add toggle() method`
* To trigger a MAJOR release, include `BREAKING CHANGE:` with a space or two newlines in the footer of the commit message
* Other suggested prefixes which will **NOT** trigger a release: `build:`, `ci:`, `docs:`, `style:`, `refactor:` and `test:`. Example: `docs: adding README for new component`

To revert a change, add the `revert:` prefix to the original commit message. This will cause the reverted change to be omitted from the release notes. Example: `revert: fix: validate input before using`.

### Langterms
To rename or cleanup langterms, use https://github.com/bearfriend/messageformat-validator
`npm i -g messageformat-validator`
Add missing langterms:
`mfv -p lang/ -s en add-missing`
Remove extraneous langterms:
`mfv -p lang/ -s en remove-extraneous`
Rename langterm:
`mfv -p lang/ -s en rename <old key> <new key>`

### Releases

When a release is triggered, it will:
* Update the version in `package.json`
* Tag the commit
* Create a GitHub release (including release notes)
* Deploy a new package to CodeArtifact

### Releasing from Maintenance Branches

Occasionally you'll want to backport a feature or bug fix to an older release. `semantic-release` refers to these as [maintenance branches](https://semantic-release.gitbook.io/semantic-release/usage/workflow-configuration#maintenance-branches).

Maintenance branch names should be of the form: `+([0-9])?(.{+([0-9]),x}).x`.

Regular expressions are complicated, but this essentially means branch names should look like:
* `1.15.x` for patch releases on top of the `1.15` release (after version `1.16` exists)
* `2.x` for feature releases on top of the `2` release (after version `3` exists)
