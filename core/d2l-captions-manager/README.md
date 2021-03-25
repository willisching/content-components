# d2l-captions-manager

Component used for legacy videos captions management.

**Attributes:**

| Attribute | Type | Default | Description |
|--|--|--|--|
| valence-host | String | null | Used for the valence API endpoint for uploading, retrieving, and removal of captions files.
| org-unit-id | String | null | The org unit id associated to the legacy video to manage captions for.
| topic-id | String | null | The topic id associated to the legacy video to manage captions for.

**Events:**

| Event | Description |
|--|--|
| d2l-captions-manager-captions-changed | Dispatched when a captions file is uploaded or deleted. |
| d2l-captions-manager-telemetry | Dispatched for specific workflows for further telemetry logging. |
| d2l-captions-manager-invalid-file-type | Dispatched when trying to upload an invalid file type. |
| d2l-captions-manager-error-uploading | Dispatched when there's an error while uploading. |
| d2l-captions-manager-error-deleting | Dispatched when there's an error while deleting. |
