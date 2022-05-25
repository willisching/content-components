export function randomizeDelay(delay = 30000, range = 5000) {
	const low = delay - range;
	const random = Math.round(Math.random() * range * 2);
	return low + random;
}

export async function sleep(delay = 0) {
	await new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, delay);
	});
}
