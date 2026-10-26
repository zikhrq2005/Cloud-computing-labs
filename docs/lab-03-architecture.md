# Lab 3 — Cloud Issue Tracker Architecture

## 1. Application Goal

Let users report technical problems, view reported issues and mark them Open or Resolved. The local JSON store demonstrates persistence before a cloud database is introduced.

## 2. Functional Scope

- Create an issue with a title, description and priority.
- View all issues, including an empty collection.
- Change an existing issue's status.

The frontend presents the form and cards. The API validates requests and chooses HTTP responses. The service owns file access and generates IDs and timestamps. Authentication, deletion and cloud deployment are outside Labs 3–4. The Lab 2 frontend remains independent until Lab 5.

## 3. Request Flow

```text
API client -> HTTP -> server.js -> routes/issues.js
                                   -> controllers/issues.js (validation)
                                      -> services/issueService.js
                                         -> data/issues.json
API client <- JSON + status code <-------- result/error
```

Create: POST /api/issues sends title, description and priority. After validation, the service adds a UUID, status Open and an ISO timestamp, persists the issue and returns it with 201.

View: GET /api/issues reads the file and returns the array with 200. A missing file or empty collection returns [].

Change status: PATCH /api/issues/{id}/status validates Open or Resolved, updates only that field and returns the full issue with 200. A valid status with an unknown ID returns 404.

JSON.stringify converts objects to JSON text; JSON.parse converts JSON text back to objects. Express parses incoming application/json bodies before the controller runs.

## 4. Trust Boundaries

```text
User-controlled                        Application-controlled
Browser / Postman -- untrusted HTTP --> API validation --> data service
                 <-- JSON response ---
```

Browser checks improve usability but can be bypassed. The API checks types, trimmed lengths and allowed values on every write. POST ignores client-supplied id, status and createdAt; the service generates authoritative values. PATCH accepts only status. The browser never accesses the data file directly. Unexpected errors are logged on the server and return a generic message without stack traces. The frontend renders issue text with textContent rather than HTML.

The JSON store is a single-process teaching store. Writes are serialized within this process to avoid lost updates and use a temporary file followed by rename so readers see a complete file. Multiple processes or cloud replicas still require a database. It is not a production storage solution.
