const issueService = require('../services/issueService');
const priorities = new Set(['Low', 'Medium', 'High']);
const statuses = new Set(['Open', 'Resolved']);

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function checkText(value, label, min, max) {
  if (typeof value !== 'string') return `${label} is required.`;
  const length = value.trim().length;
  if (length < min || length > max) {
    return `${label} must contain between ${min} and ${max} characters.`;
  }
  return null;
}

function checkBody(req, res) {
  if (!req.get('Content-Type') || !req.get('Content-Type').match(/^application\/json(?:\s*;|\s*$)/i)) {
    sendError(res, 415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
    return false;
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Request body must be a JSON object.');
    return false;
  }
  return true;
}

async function listIssues(req, res, next) {
  try {
    res.status(200).json(await issueService.readIssues());
  } catch (error) { next(error); }
}

async function createIssue(req, res, next) {
  try {
    if (!checkBody(req, res)) return;
    const { title, description, priority } = req.body;
    const problem = checkText(title, 'Title', 3, 100)
      || checkText(description, 'Description', 5, 500)
      || (!priorities.has(priority) && 'Priority must be Low, Medium or High.');
    if (problem) return sendError(res, 400, 'VALIDATION_ERROR', problem);
    res.status(201).json(await issueService.createIssue({ title, description, priority }));
  } catch (error) { next(error); }
}

async function updateIssueStatus(req, res, next) {
  try {
    if (!checkBody(req, res)) return;
    const { status } = req.body;
    if (!statuses.has(status)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Status must be Open or Resolved.');
    }
    const issue = await issueService.updateIssueStatus(req.params.id, status);
    if (!issue) return sendError(res, 404, 'ISSUE_NOT_FOUND', 'Issue not found.');
    res.status(200).json(issue);
  } catch (error) { next(error); }
}

module.exports = { listIssues, createIssue, updateIssueStatus };
