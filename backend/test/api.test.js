const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');

test('Lab 3/4 HTTP acceptance and persistence checks', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'cloud-labs-'));
  const dataFile = path.join(directory, 'issues.json');
  const seed = JSON.parse(await fs.readFile(path.join(__dirname, '../data/issues.json'), 'utf8'));
  await fs.writeFile(dataFile, JSON.stringify(seed));
  const results = [];
  let child;
  let baseUrl;
  let logs = '';
  async function start() {
    child = fork(path.join(__dirname, 'server-helper.cjs'), [], {
      env: { ...process.env, DATA_FILE: dataFile, NODE_ENV: 'test' },
      silent: true
    });
    child.stdout.on('data', (chunk) => { logs += chunk; });
    child.stderr.on('data', (chunk) => { logs += chunk; });
    const port = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server startup timed out.')), 10000);
      child.once('message', (message) => { clearTimeout(timer); resolve(message.port); });
      child.once('error', (error) => { clearTimeout(timer); reject(error); });
      child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Server exited: ${code}`)); });
    });
    baseUrl = `http://127.0.0.1:${port}`;
  }
  async function stop() {
    if (!child || child.exitCode !== null) return;
    const exited = once(child, 'exit');
    child.kill();
    await exited;
  }
  t.after(async () => { await stop(); await fs.rm(directory, { recursive: true, force: true }); });
  await start();

  async function request(method = 'GET', route = '/api/issues', body, type = 'application/json') {
    const response = await fetch(baseUrl + route, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': type },
      body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
    });
    assert.match(response.headers.get('content-type'), /application\/json/);
    return { status: response.status, body: await response.json() };
  }
  function error(result, status, code) {
    assert.equal(result.status, status);
    assert.deepEqual(Object.keys(result.body), ['error']);
    assert.deepEqual(Object.keys(result.body.error).sort(), ['code', 'message']);
    assert.equal(result.body.error.code, code);
    assert.equal(typeof result.body.error.message, 'string');
  }
  const valid = { title: 'Printer unavailable', description: 'The shared printer is not responding.', priority: 'Medium' };
  let created;
  let resolved;
  async function check(id, description, run) {
    await t.test(`${id}: ${description}`, async () => {
      try {
        const actual = await run();
        results.push({ id, description, actual, passed: true });
      } catch (failure) {
        results.push({ id, description, actual: failure.message, passed: false });
        throw failure;
      }
    });
  }
  await check('T01', 'View issues', async () => {
    const r = await request(); assert.equal(r.status, 200); assert.deepEqual(r.body, seed);
    return `200; JSON array with ${r.body.length} seed issue(s)`;
  });
  await check('T02', 'Create valid issue', async () => {
    const r = await request('POST', '/api/issues', valid); assert.equal(r.status, 201);
    created = r.body; assert.equal(created.status, 'Open');
    assert.match(created.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.equal(new Date(created.createdAt).toISOString(), created.createdAt);
    assert.deepEqual(Object.keys(created).sort(), ['createdAt', 'description', 'id', 'priority', 'status', 'title']);
    for (const key of Object.keys(valid)) assert.equal(created[key], valid[key]);
    return '201; complete issue, UUID, Open status and ISO timestamp';
  });
  await check('T03', 'Missing title', async () => {
    const r = await request('POST', '/api/issues', { description: valid.description, priority: 'Medium' });
    error(r, 400, 'VALIDATION_ERROR'); assert.equal(r.body.error.message, 'Title is required.');
    return '400 VALIDATION_ERROR; Title is required.';
  });
  await check('T04', 'Invalid priority', async () => {
    error(await request('POST', '/api/issues', { ...valid, priority: 'Critical' }), 400, 'VALIDATION_ERROR');
    return '400 VALIDATION_ERROR';
  });
  await check('T05', 'Resolve existing issue', async () => {
    const r = await request('PATCH', `/api/issues/${created.id}/status`, { status: 'Resolved', title: 'Ignored' });
    assert.equal(r.status, 200); resolved = { ...created, status: 'Resolved' }; assert.deepEqual(r.body, resolved);
    return '200; Resolved, all other fields unchanged';
  });
  await check('T06', 'Invalid status', async () => {
    error(await request('PATCH', `/api/issues/${created.id}/status`, { status: 'Deleted' }), 400, 'VALIDATION_ERROR');
    return '400 VALIDATION_ERROR';
  });
  await check('T07', 'Unknown issue', async () => {
    error(await request('PATCH', '/api/issues/does-not-exist/status', { status: 'Resolved' }), 404, 'ISSUE_NOT_FOUND');
    return '404 ISSUE_NOT_FOUND';
  });
  await check('T08', 'Empty collection', async () => {
    const original = await fs.readFile(dataFile);
    try {
      await fs.writeFile(dataFile, '[]'); const r = await request();
      assert.equal(r.status, 200); assert.deepEqual(r.body, []);
    } finally { await fs.writeFile(dataFile, original); }
    return '200; []';
  });
  await check('T09', 'Ignore client-owned attempts at server fields', async () => {
    const r = await request('POST', '/api/issues', { ...valid, id: 'HACKED-1', status: 'Resolved', createdAt: '2000-01-01T00:00:00.000Z' });
    assert.equal(r.status, 201); assert.notEqual(r.body.id, 'HACKED-1'); assert.equal(r.body.status, 'Open');
    assert.notEqual(r.body.createdAt, '2000-01-01T00:00:00.000Z');
    const stored = JSON.parse(await fs.readFile(dataFile, 'utf8')).find((issue) => issue.id === r.body.id);
    assert.deepEqual(stored, r.body);
    return '201; server-generated values returned and stored';
  });
  await check('T10', 'Non-JSON body', async () => {
    error(await request('POST', '/api/issues', 'title=Printer', 'text/plain'), 415, 'UNSUPPORTED_MEDIA_TYPE');
    return '415 UNSUPPORTED_MEDIA_TYPE';
  });
  await check('T11', 'Malformed JSON', async () => {
    const r = await request('POST', '/api/issues', '{"title":"Printer",}');
    error(r, 400, 'VALIDATION_ERROR'); assert.equal(r.body.error.message, 'Request body is not valid JSON.');
    assert.equal((await request()).status, 200);
    return '400 VALIDATION_ERROR; subsequent GET succeeds';
  });
  await check('T12', 'Unknown route', async () => {
    error(await request('PATCH', '/api/fake-url'), 404, 'ROUTE_NOT_FOUND');
    return '404 ROUTE_NOT_FOUND';
  });
  await check('T13', 'Persistence across a new server process', async () => {
    assert.deepEqual(JSON.parse(await fs.readFile(dataFile, 'utf8')).find((i) => i.id === created.id), resolved);
    await stop(); await start();
    assert.deepEqual((await request()).body.find((i) => i.id === created.id), resolved);
    return 'Same ID and Resolved status after stopping and restarting Node';
  });
  await check('T14', 'Text boundaries and types', async () => {
    const before = await fs.readFile(dataFile, 'utf8');
    for (const changes of [{ title: '  ' }, { title: 'Hi' }, { title: 'x'.repeat(101) }, { title: 123 }, { description: 'four' }, { description: 'x'.repeat(501) }, { description: null }, { priority: 'high' }]) {
      error(await request('POST', '/api/issues', { ...valid, ...changes }), 400, 'VALIDATION_ERROR');
    }
    assert.equal(await fs.readFile(dataFile, 'utf8'), before);
    for (const [title, description] of [[' abc ', ' abcde '], ['x'.repeat(100), 'y'.repeat(500)]]) {
      const r = await request('POST', '/api/issues', { ...valid, title, description });
      assert.equal(r.status, 201); assert.equal(r.body.title, title.trim()); assert.equal(r.body.description, description.trim());
    }
    return 'Invalid types/lengths rejected without writes; min/max lengths and trimming pass';
  });
  await check('T15', 'Invalid body shapes and PATCH media type', async () => {
    for (const body of ['null', '[]', '"text"', '{}']) {
      error(await request('POST', '/api/issues', body), 400, 'VALIDATION_ERROR');
      error(await request('PATCH', `/api/issues/${created.id}/status`, body), 400, 'VALIDATION_ERROR');
    }
    error(await request('PATCH', `/api/issues/${created.id}/status`, 'Resolved', 'text/plain'), 415, 'UNSUPPORTED_MEDIA_TYPE');
    error(await request('POST', '/api/issues'), 415, 'UNSUPPORTED_MEDIA_TYPE');
    const r = await fetch(baseUrl + '/api/issues', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    assert.equal(r.status, 400);
    return 'Invalid bodies return 400; wrong/missing media type returns 415';
  });
  await check('T16', 'Storage failure and recovery', async () => {
    const before = await fs.readFile(dataFile);
    try {
      await fs.writeFile(dataFile, '{broken');
      const r = await request(); error(r, 500, 'INTERNAL_ERROR');
      assert.equal(r.body.error.message, 'An unexpected server error occurred.');
      error(await request('POST', '/api/issues', valid), 500, 'INTERNAL_ERROR');
      assert.equal(await fs.readFile(dataFile, 'utf8'), '{broken');
    } finally { await fs.writeFile(dataFile, before); }
    assert.equal((await request('POST', '/api/issues', valid)).status, 201);
    return 'Generic 500 without data overwrite; writes recover after file repair';
  });
  await check('T17', 'Concurrent writes', async () => {
    const before = (await request()).body.length;
    const writes = await Promise.all(Array.from({ length: 10 }, (_, i) => request('POST', '/api/issues', { ...valid, title: `Concurrent ${i}` })));
    writes.forEach((r) => assert.equal(r.status, 201));
    assert.equal(new Set(writes.map((r) => r.body.id)).size, 10);
    assert.equal((await request()).body.length, before + 10);
    return '10 simultaneous creates persisted with unique IDs and no lost records';
  });
  await check('T18', 'Missing data file', async () => {
    const before = await fs.readFile(dataFile);
    try {
      await fs.unlink(dataFile); const r = await request(); assert.equal(r.status, 200); assert.deepEqual(r.body, []);
      assert.equal((await request('POST', '/api/issues', valid)).status, 201);
      assert.equal(JSON.parse(await fs.readFile(dataFile, 'utf8')).length, 1);
    } finally { await fs.writeFile(dataFile, before); }
    return 'Missing store returns []; next create recreates it';
  });
  await check('T19', 'Reopen and repeat status update', async () => {
    for (let i = 0; i < 2; i++) {
      const r = await request('PATCH', `/api/issues/${created.id}/status`, { status: 'Open' });
      assert.equal(r.status, 200); assert.deepEqual(r.body, created);
    }
    return '200 for reopen and repeated Open update; immutable fields preserved';
  });
  if (process.env.LAB_REPORT) {
    await fs.writeFile(process.env.LAB_REPORT, JSON.stringify({ runner: 'Node.js test runner with real HTTP requests; not a Postman UI run', node: process.version, results }, null, 2) + '\n');
    await fs.writeFile(path.join(path.dirname(process.env.LAB_REPORT), 'lab-04-server.log'), logs);
  }
});
