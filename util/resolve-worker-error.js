const PREFIX = 'workerError';
const DEFAULT_ERROR_TYPE = 'UploadFailed';
const AV_CAPS_EXCEEDED = 'AVCapsExceeded';

const getWorkerErrorType = (details, contentType) => {
	if (details && (details.Cause || details.Error)) {
		const error = JSON.parse(details.Cause || details.Error);
		const rawErrorMessage = error && (error.errorMessage || error.message);
		if (rawErrorMessage) {
			const errorMessage = JSON.parse(rawErrorMessage);
			if (errorMessage && errorMessage.type) {
				return errorMessage.type;
			}
		}
	} else if (details && details.cause === 503 && ['Audio', 'Video'].includes(contentType)) {
		return AV_CAPS_EXCEEDED;
	}
	return DEFAULT_ERROR_TYPE;
};

export default (details, contentType) => {
	return `${PREFIX}${getWorkerErrorType(details, contentType)}`;
};
