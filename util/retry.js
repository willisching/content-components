import { sleep } from './delay';

export async function retry(run, { tries = 0, retries, delay = () => 0, onFailedRetry = () => {} }) {
	return new Promise((resolve, reject) => {
		return run()
			.then(val => resolve(val))
			.catch(async err => {
				if (tries >= retries) {
					reject(err);
					return;
				}
				await sleep(delay(tries));
				retry(run, {tries: tries + 1, retries, delay, onFailedRetry}).then(resolve, reject);
			});
	});
}
