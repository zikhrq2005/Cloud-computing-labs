# API Test Plan and Results

Verification: Node.js test runner with real HTTP requests to a child server, using a temporary data file. The real backend/data/issues.json is never modified by the test suite. These are automated results, not Postman screenshots. Runtime: v24.15.0.

Reproduce from backend: `npm test`. To refresh the JSON report in PowerShell: `$env:LAB_REPORT = "../evidence/lab-04-test-results.json"; npm test; Remove-Item Env:LAB_REPORT`.

| Test ID | Request / check | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|
| T01 | View issues | 200; JSON array | 200; JSON array with 1 seed issue(s) | Pass |
| T02 | Create valid issue | 201; complete new issue | 201; complete issue, UUID, Open status and ISO timestamp | Pass |
| T03 | Missing title | 400 VALIDATION_ERROR | 400 VALIDATION_ERROR; Title is required. | Pass |
| T04 | Invalid priority | 400 VALIDATION_ERROR | 400 VALIDATION_ERROR | Pass |
| T05 | Resolve existing issue | 200; full issue with Resolved status | 200; Resolved, all other fields unchanged | Pass |
| T06 | Invalid status | 400 VALIDATION_ERROR | 400 VALIDATION_ERROR | Pass |
| T07 | Unknown issue | 404 ISSUE_NOT_FOUND | 404 ISSUE_NOT_FOUND | Pass |
| T08 | Empty collection | 200; [] | 200; [] | Pass |
| T09 | Ignore client-owned attempts at server fields | 201; server-owned fields ignore supplied values | 201; server-generated values returned and stored | Pass |
| T10 | Non-JSON body | 415 UNSUPPORTED_MEDIA_TYPE | 415 UNSUPPORTED_MEDIA_TYPE | Pass |
| T11 | Malformed JSON | 400 VALIDATION_ERROR; server remains available | 400 VALIDATION_ERROR; subsequent GET succeeds | Pass |
| T12 | Unknown route | 404 ROUTE_NOT_FOUND | 404 ROUTE_NOT_FOUND | Pass |
| T13 | Persistence across a new server process | Created data survives process restart | Same ID and Resolved status after stopping and restarting Node | Pass |
| T14 | Text boundaries and types | Correct validation, trimming and boundaries | Invalid types/lengths rejected without writes; min/max lengths and trimming pass | Pass |
| T15 | Invalid body shapes and PATCH media type | Controlled client errors | Invalid bodies return 400; wrong/missing media type returns 415 | Pass |
| T16 | Storage failure and recovery | Generic 500; recovery after repair | Generic 500 without data overwrite; writes recover after file repair | Pass |
| T17 | Concurrent writes | All concurrent writes persist | 10 simultaneous creates persisted with unique IDs and no lost records | Pass |
| T18 | Missing data file | Missing store handled correctly | Missing store returns []; next create recreates it | Pass |
| T19 | Reopen and repeat status update | Reopening and repeated updates succeed | 200 for reopen and repeated Open update; immutable fields preserved | Pass |

## Manual Postman reproduction

Import evidence/lab-04-postman-collection.json into Postman Desktop. Start the backend with npm start. Run Regular acceptance checks in order; T02 stores the returned ID for T05/T06. T08 is in a separate folder because it requires backing up the data file, replacing it with [], sending the request and restoring the original content. See the request description.

For a manual restart check: create an issue, record its ID, stop and restart npm start, then GET and confirm the same ID. The automated T13 check already performs a genuine child-process restart.

The generated collection and recorded automated results are ready. A Postman Desktop run and the handout-specific VS Code/Postman/GitHub screenshots have not been captured. Capture these for submission; do not present the automated log as a Postman screenshot.
