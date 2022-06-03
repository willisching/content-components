import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export default [
	{
		input: './applications/d2l-capture-central/src/util/iot-client.js',
		output: {
			dir: 'build',
			format: 'es',
			exports: 'named',
			name: 'iotClient',
		},
		plugins: [
			resolve({
				preferBuiltins: false,
				browser: true,
			}),
			commonjs({
				transformMixedEsModules: true,
			}),
			nodePolyfills(),
			json(),
		],
	}];
