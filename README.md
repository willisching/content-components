# lit-element-template

Template for creating BrightspaceUI lit elements.

With this template you get:

* Project boilerplate including: README, .editorconfig, .gitignore, package.json, polymer.json, CODEOWNERS and LICENSE (Apache-2.0)
* A basic LitElement scaffold
* Demo page for the element
* Test page for the element
* Travis CI ready-to-go
* Local tests that do linting using ESLint and unit tests
* Cross-browser testing from Travis CI using Sauce Labs
* npm publish setup

## Setup

This assumes you have node installed.

1. Follow the Github instructions [here](https://help.github.com/en/articles/creating-a-repository-from-a-template) to create a new repository from this template, then clone the new repository on your local machine.
3. Run the script, entering information as prompted (e.g., for repo name, description, etc.):
```
node setup/configure-repo.js
```

After the script successfully runs, follow the instructions on the generated README for usage of your new component. The setup directory can now be removed from your component repo.

### Sauce Labs

To do cross-browser testing using Sauce Labs, the API key needs to be encrypted into the .travis.yml file.

To learn more about how to set this up, see the [testing](https://github.com/BrightspaceUI/guide/wiki/Testing) section of The Guide.

### Versioning

A `GITHUB_RELEASE_TOKEN` needs to be encrypted into the .travis.yml file in order for the auto-versioning mentioned in the `Versioning, Releasing & Deploying` section of the generated README to work.

### Publishing

If you use `'publish': true` in your `config` object in configure-repo.js, your package.json and .travis.yml files will be setup for future public publishing with `npm`. To complete getting the publishing to work:
* A `d2l-travis-deploy` API key needs to be encrypted and added into the .travis.yml file under `# d2l-travis-deploy: ...` (replace the `...` with the token used for generating the key).
* Once you are ready to publish your element, navigate to the root directory of your package and use the command `npm publish --access public` (see [here](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages#publishing-scoped-public-packages) for more information).

### Localization

To have localization setup by the configure-repo.js script, type "yes" to the Localization prompt, then select if resources should be statically or dynamically imported. See [here](https://github.com/BrightspaceUI/core/blob/master/mixins/localize-mixin.md#language-resources) for more information.

## Developing and Contributing

Pull requests welcome!
