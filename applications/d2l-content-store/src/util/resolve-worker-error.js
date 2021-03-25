const prefix = 'workerError';
const defaultErrorType = 'UploadFailed';

const getActivityWorkerErrorType = details => {
	if (details && details.Error) {
		const error = JSON.parse(details.Error);
		if (error && error.message) {
			const message = JSON.parse(error.message);
			if (message && message.type) {
				return message.type;
			}
		}
	}

	return defaultErrorType;
};

const getLambdaWorkerErrorType = details => {
	if (details && details.Cause) {
		const cause = JSON.parse(details.Cause);
		if (cause && cause.errorMessage) {
			const errorMessage = JSON.parse(cause.errorMessage);
			if (errorMessage && errorMessage.type) {
				return errorMessage.type;
			}
		}
	}

	return defaultErrorType;
};

export default details => {
	if (details && details.Cause) {
		return `${prefix}${getLambdaWorkerErrorType(details)}`;
	}

	if (details && details.Error) {
		return `${prefix}${getActivityWorkerErrorType(details)}`;
	}

	return `${prefix}${defaultErrorType}`;
};
