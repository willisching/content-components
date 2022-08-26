import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
	input: 'node_modules/recordrtc/RecordRTC.min.js',
	plugins: [
		nodeResolve(),
		commonjs()
	],
	output: {
		file: 'core/d2l-media-web-recording/util/recordrtc.js',
		format: 'es',
		compact: true,
	}
};
