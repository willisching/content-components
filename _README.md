# <%= name %>

[![NPM version](https://img.shields.io/npm/v/<%= packageName %>.svg)](https://www.npmjs.org/package/<%= packageName %>)
[![Dependabot badge](https://flat.badgen.net/dependabot/<%= githubOrg %>/<%= shortName %>?icon=dependabot)](https://app.dependabot.com/)
[![Build status](https://travis-ci.com/<%= packageName %>.svg?branch=master)](https://travis-ci.com/<%= packageName %>)

<%= labsChecklist %><%= description %>

## Installation

To install from NPM:

```shell
npm install <%= packageName %>
```

## Usage

```html
<script type="module">
    import '<%= packageName %>/<%= shortName %>.js';
</script>
<<%= name %>>My element</<%= name %>>
```

**Properties:**

| Property | Type | Description |
|--|--|--|
| | | |

**Accessibility:**

To make your usage of `<%= name %>` accessible, use the following properties when applicable:

| Attribute | Description |
|--|--|
| | |

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

Include either `[increment major]`, `[increment minor]` or `[increment patch]` in your merge commit message to automatically increment the `package.json` version<%= readmeDeployment %>
