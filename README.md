# Cloud Issue Tracker

University application used across the Cloud Computing and Cloud Security labs.

## Progress

| Lab | Status |
|---|---|
| 1 — Development workspace | Original environment, HTML, CSS and Git checkpoint retained. |
| 2 — Interactive frontend | Local issue creation/status changes retained; initial issue rendering fixed. |
| 3 — Architecture, REST contract and data service | Design documents and persistent JSON service implemented. |
| 4 — Node.js and Express API | API implemented; all 12 required HTTP checks and 7 additional checks pass automatically, including restart persistence. |
| 5 — Frontend integration and cloud deployment | Not implemented. |

The Lab 4 API is tested separately. The frontend still uses its own browser-memory array; connecting it to the API belongs to Lab 5.

## Run the backend

Use Node.js 22 or later (verified with Node.js 24.15.0).

```powershell
cd backend
npm ci
Copy-Item .env.example .env
npm start
```

The API listens on http://localhost:3000. Use `npm run dev` for automatic restarts when source code changes. Change PORT in .env to use another port, then restart. The .env file and node_modules are ignored by Git; .env.example is safe to share. Preserve existing .env settings instead of copying over them.

## API

| Method | Path | Result |
|---|---|---|
| GET | /api/issues | 200 with all issues, or [] |
| POST | /api/issues | 201 with the new issue |
| PATCH | /api/issues/{id}/status | 200 with the updated issue |

POST accepts title (3–100 characters), description (5–500 characters) and priority (Low, Medium or High). Text is trimmed. The server generates the UUID and creation time and sets status Open. PATCH accepts Open or Resolved. Client-supplied server-owned fields are ignored.

The router selects the controller. The controller validates requests and chooses HTTP responses. The service reads and writes backend/data/issues.json. Errors use `{ "error": { "code": "...", "message": "..." } }`. Unexpected details are logged only on the server.

## Test and review

```powershell
cd backend
npm test
```

Tests start a separate server process on a free port and use a temporary store. They cover T01–T12 from the handouts plus persistence after a real process restart, validation boundaries, invalid body shapes, storage failure/recovery, concurrent writes, missing files and repeated status updates. The supplied seed data stays unchanged.

- [Architecture and trust boundary](docs/lab-03-architecture.md)
- [API contract and examples](docs/api-contract.md)
- [Test plan with actual results](docs/api-test-plan.md)
- [Recorded automated results](evidence/lab-04-test-results.json)
- [Importable Postman collection](evidence/lab-04-postman-collection.json)
- [VS Code REST Client requests](backend/requests.http)

In Postman Desktop, import the collection and run the regular checks in order. The create request saves issueId for subsequent updates. Run the empty-store test separately, following its backup/restore instructions. The collection was generated for import; the recorded results come from automated HTTP tests, not a claimed Postman Desktop run.

## Remaining submission evidence

The code, design documents and automated verification are provided. The handouts also request screenshots from VS Code, Postman and GitHub. Those screenshots and a Postman Desktop run have not been captured; see [the evidence checklist](evidence/README.md). Review and explain the code before submitting it.

## Local storage limits

The service serializes writes within one process and replaces the JSON file atomically. This avoids overlapping writes in the local lab server but does not coordinate multiple server processes. A shared cloud database, authentication and deployment are outside this checkpoint.
