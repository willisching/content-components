# Scripts

- `create-mirror.sh`: Creates a `mirror/` sub-folder containing symlinks to the npm package. The reason for doing this is that the [bsi unbundle script](https://github.com/Brightspace/brightspace-integration/tree/master/unbundle-script) removes the linked package's `node_modules`! Linking to the mirror let's you keep your `node_modules`.
