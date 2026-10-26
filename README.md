# Cloud Issue Tracker 
Starter application used across the Cloud Computing and Cloud Security 
labs. 
## Lab 1 - Development environment verified - Static HTML structure created - CSS interface created - Git repository prepared

## Current progress

Progress reviewed against the repository files and commit history on 27 October 2026. This records committed work, not a claim that every lab requirement has been tested or assessed.

| Lab | Repository status | Evidence / remaining work |
| --- | --- | --- |
| 1 — Local development workspace | Recorded as completed | Original Lab 1 checklist above. |
| 2 — JavaScript, DOM, Node.js and npm | Frontend implementation present; verification/fixes outstanding | Commit `d54b3db` (`lab2`, 3 October 2026) adds issue rendering, form submission, status toggling and npm setup. An initial `renderIssues()` call is still missing, so sample issues are not displayed on page load. |
| 3 — REST API design and data services | Started; incomplete | Commit `a9fc14e` (`lab 03`, 13 October 2026) adds backend scaffolding and sample JSON data. The service, routes, request file and `erver.js` are empty. |
| 4 — Node.js and Express API | No working API in the reviewed files | `backend/server.js` is absent and the backend package has no Express dependency or start script. |
| 5 — Cloud deployment | Completion not established | No running backend or deployment verification was established by this review. |

**Latest lab worked on: Lab 3.** Lab 1 is the last lab explicitly recorded as completed; Lab 2 has substantial implementation but should be checked before marking it fully complete.

### Next steps

1. Add the initial frontend render call and verify issue creation and status changes.
2. Complete Lab 3's data-service implementation and required design/test evidence using the lab handout.
3. Implement and test the Express API for Lab 4 before proceeding to cloud deployment.
