// copy of /applications/d2l-content-uploader; need to keep until smart curriculum uploader imports are changed

const PREFIX = 'workerError';
const DEFAULT_ERROR_TYPE = 'UploadFailed';

const getWorkerErrorType = details => {
	if (details && (details.Cause || details.Error)) {
		const error = JSON.parse(details.Cause || details.Error);
		const rawErrorMessage = error && (error.errorMessage || error.message);
		if (rawErrorMessage) {
			const errorMessage = JSON.parse(rawErrorMessage);
			if (errorMessage && errorMessage.type) {
				return errorMessage.type;
			}
		}
	}
	return DEFAULT_ERROR_TYPE;
};

export default details => `${PREFIX}${getWorkerErrorType(details)}`;
