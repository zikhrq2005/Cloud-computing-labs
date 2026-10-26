# Lab 3 and Lab 4 Evidence

## Provided

- lab-04-test-results.json: actual results from 19 automated HTTP checks.
- lab-04-server.log: request/startup/error logs captured from the isolated test server. The intentional corrupt-file test produces a logged error; clients receive a generic 500.
- lab-04-postman-collection.json: generated Postman v2.1 collection with response assertions. This is importable but was not exported from a Postman Desktop run.
- ../docs/api-test-plan.md: expected and actual results, with reproduction steps.

## Screenshots still to capture for the handouts

Lab 3:

1. Working Lab 2 frontend.
2. Architecture document in VS Code Markdown Preview.
3. API contract showing all three endpoints.
4. Success and error JSON examples.
5. Positive and negative test cases.
6. Backend structure and the three exported data-service functions.
7. GitHub commit containing the Lab 3 work.

Lab 4:

1. Backend terminal startup message and logged requests.
2. Postman GET returning 200 with at least one issue.
3. Postman POST returning 201 with a server-generated ID.
4. Postman PATCH returning 200 with changed status.
5. Controlled 400 and 404 responses.
6. Completed actual-result/pass-fail table.
7. GitHub commit showing controllers/issues.js and .env.example, with .env absent.

Use real screenshots after running the requests. Automated results are supplied separately and should not be described as Postman screenshots.
