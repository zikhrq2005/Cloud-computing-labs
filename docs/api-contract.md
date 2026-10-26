# API Contract: Issues API

Local base URL: http://localhost:3000. Requests and responses use JSON. No authentication is implemented in these local labs.

## Data Dictionary: Issue

| Field | Type | Owner | Rule |
|---|---|---|---|
| id | string | Server | Unique UUID for new issues; immutable. The supplied ISS-101 seed remains valid. |
| title | string | Client | Required; trimmed; 3–100 characters. |
| description | string | Client | Required; trimmed; 5–500 characters. |
| priority | string enum | Client | Exactly Low, Medium or High. |
| status | string enum | Server / controlled update | Exactly Open or Resolved; new issues start Open. |
| createdAt | ISO 8601 string | Server | Creation timestamp; immutable. |

Lengths use JavaScript string.length after trim. Values are case-sensitive. Extra fields are ignored, never copied into stored data. Request bodies for POST and PATCH must be JSON objects. This contract follows the handout's formal data dictionary: Open and Resolved, rather than the lowercase statuses in its introductory illustration.

## 1. View All Issues

`GET /api/issues` has no request body. Success: 200 with an array of complete issues, or [] when none exist. Errors: 500 INTERNAL_ERROR.

```json
[{"id":"ISS-101","title":"Unable to access Wi-Fi","description":"Connection fails in the teaching lab.","priority":"High","status":"Open","createdAt":"2026-09-01T09:00:00.000Z"}]
```

## 2. Create an Issue

`POST /api/issues`, with `Content-Type: application/json`:

```json
{"title":"Printer unavailable","description":"The shared printer is not responding.","priority":"Medium"}
```

Success: 201 with the full resource below (ID and time are illustrative). Client-supplied id, status and createdAt are ignored. Only title, description and priority are copied. Validation checks title, then description, then priority and returns the first error.

```json
{"id":"f2b8f331-c4c7-4a3a-a825-f136edc916b1","title":"Printer unavailable","description":"The shared printer is not responding.","priority":"Medium","status":"Open","createdAt":"2026-10-27T10:00:00.000Z"}
```

Errors: 400 VALIDATION_ERROR, 415 UNSUPPORTED_MEDIA_TYPE, 500 INTERNAL_ERROR.

## 3. Change Issue Status

`PATCH /api/issues/{id}/status`, with `Content-Type: application/json`:

```json
{"status":"Resolved"}
```

Success: 200 with the full updated issue. All fields other than status remain unchanged. Setting the same status again succeeds. Validation precedes the ID lookup.

```json
{"id":"ISS-101","title":"Unable to access Wi-Fi","description":"Connection fails in the teaching lab.","priority":"High","status":"Resolved","createdAt":"2026-09-01T09:00:00.000Z"}
```

Errors: 400 VALIDATION_ERROR, 404 ISSUE_NOT_FOUND, 415 UNSUPPORTED_MEDIA_TYPE, 500 INTERNAL_ERROR.

## Error Responses

```json
{"error":{"code":"VALIDATION_ERROR","message":"Title must contain between 3 and 100 characters."}}
```

| HTTP status | Code | Condition |
|---|---|---|
| 400 | VALIDATION_ERROR | Invalid/missing fields, non-object body or malformed JSON. Bodies above the 100 KB parser limit are also rejected with this code. |
| 404 | ISSUE_NOT_FOUND | Valid status update, but the issue ID does not exist. |
| 404 | ROUTE_NOT_FOUND | No supported endpoint matches the method and path. |
| 415 | UNSUPPORTED_MEDIA_TYPE | POST/PATCH lacks application/json or uses an unsupported encoding/charset. |
| 500 | INTERNAL_ERROR | Unexpected storage or server failure; details are logged only on the server. |

Missing bodies with application/json are rejected as 400. Malformed JSON returns `Request body is not valid JSON.` The request logger runs before parsing, so failed requests are logged as well. The JSON parser runs before routing; malformed JSON can therefore be rejected even on an unknown route.
