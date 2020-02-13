const { exec } = require('child_process');
const fs = require('fs');

// Add your dependencies that have not been released yet and are not found in BSI
const dependenciesToInstall = ['page'];

const args = process.argv.slice(2);
const bsiPath = args && args[0];

if (bsiPath && fs.existsSync(bsiPath)) {
	const cmdToExecute = `cd ${bsiPath} && npm install ${dependenciesToInstall.join(' ')}`;
	exec(cmdToExecute, err => {
		if (err) {
			console.log('Error:', err);
		} else {
			console.log('BSI installation complete');
		}
	});
} else {
	console.log('Missing first argument for BSI path or is invalid path');
}
