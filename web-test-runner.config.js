import { playwrightLauncher } from '@web/test-runner-playwright';

function getPattern(type) {
	return [
		`+(applications|core)/**/*.${type}.js`
	];
}

export default {
	files: getPattern('test'),
	nodeResolve: true,
	groups: [
		{
			name: 'aXe',
			files: getPattern('axe'),
			browsers: [
				playwrightLauncher({
					async createPage({ context }) {
						const page = await context.newPage();
						await page.emulateMedia({ reducedMotion: 'reduce' });
						return page;
					}
				})
			]
		}
	],
	testFramework: {
		config: {
			ui: 'bdd',
			timeout: '20000',
		}
	},
	testRunnerHtml: testFramework =>
		`<html lang="en">
			<body>
				<script src="node_modules/@brightspace-ui/core/tools/resize-observer-test-error-handler.js"></script>
				<script type="module" src="${testFramework}"></script>
			</body>
		</html>`
};
