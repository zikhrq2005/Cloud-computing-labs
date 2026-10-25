# Cloud Issue Tracker

A coursework starter project for Cloud Computing and Cloud Security labs, organized into a static frontend and a backend directory.

## Repository layout

| Path | Contents |
|---|---|
| `frontend/index.html` | Frontend HTML |
| `frontend/css/style.css` | Interface styling |
| `frontend/js/app.js` | Frontend JavaScript |
| `backend/` | Backend package and route/service files |
| `backend/data/issues.json` | Issue data file |
| `evidence/lab1/` | Lab screenshots |

## Current status

The earlier lab milestone records development environment setup, HTML structure, CSS, and Git repository preparation.

Backend integration is incomplete: `backend/erver.js` is empty, the backend package has no start script, and its test script is a placeholder. This repository should not yet be treated as a working full-stack deployment.

## Preview the frontend

Open `frontend/index.html` to inspect the interface. For a local HTTP preview, run the following from the repository root with Python installed:

```sh
python -m http.server 8000 --directory frontend
```

Then visit http://localhost:8000. Serving static files does not start an API or verify frontend/backend integration.

The existing frontend npm start script references `http-server`, but the package does not declare that dependency.

## Next steps

- Implement and document the backend entry point.
- Declare required dependencies and add working start commands.
- Connect and verify the issue workflow.
- Document API endpoints and add meaningful tests.
- Add a deployment walkthrough and explain the relevant cloud/security decisions.
