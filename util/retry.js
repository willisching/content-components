import { sleep } from './delay';

export async function retry(run, { retries, delay = () => 0, onFailedRetry = () => {} }) {
	return new Promise(async (resolve, reject) => {
		for(let tries = 0; tries < retries; tries++) {
			let result;
			let done = false;
			await run()
			.then(val => {
				result = val;
				done = true;
			})
			.catch(async err => {
				onFailedRetry({ tries, ...err });
				if(tries === retries - 1) {
					reject(err);
				}
				console.log(delay(tries));
				await sleep(delay(tries));
			});
			if(done) {
				resolve(result);
				return;
			}
		}
	})
}