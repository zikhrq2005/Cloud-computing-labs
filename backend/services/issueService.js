const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

// DATA_FILE lets automated tests use a temporary store without changing lab data.
const DATA_FILE = process.env.DATA_FILE
  ? path.resolve(process.env.DATA_FILE)
  : path.join(__dirname, '..', 'data', 'issues.json');
let pendingWrite = Promise.resolve();

async function readIssues() {
  try {
    const issues = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    if (!Array.isArray(issues)) throw new Error('Issue data must be an array.');
    return issues;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeIssues(issues) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const temporaryFile = `${DATA_FILE}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryFile, `${JSON.stringify(issues, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryFile, DATA_FILE);
  } finally {
    await fs.rm(temporaryFile, { force: true });
  }
}

// Serialize the whole read-modify-write operation in this single server process.
function changeIssues(operation) {
  const result = pendingWrite.then(operation);
  pendingWrite = result.catch(() => {});
  return result;
}

function createIssue(input) {
  return changeIssues(async () => {
    const issues = await readIssues();
    const issue = {
      id: randomUUID(),
      title: input.title.trim(),
      description: input.description.trim(),
      priority: input.priority,
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    issues.push(issue);
    await writeIssues(issues);
    return issue;
  });
}

function updateIssueStatus(id, status) {
  return changeIssues(async () => {
    const issues = await readIssues();
    const issue = issues.find((item) => item.id === id);
    if (!issue) return null;
    issue.status = status;
    await writeIssues(issues);
    return issue;
  });
}

module.exports = { readIssues, createIssue, updateIssueStatus };
