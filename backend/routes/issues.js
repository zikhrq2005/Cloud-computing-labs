const express = require('express');
const issueController = require('../controllers/issues');
const router = express.Router();

router.get('/', issueController.listIssues);
router.post('/', issueController.createIssue);
router.patch('/:id/status', issueController.updateIssueStatus);

module.exports = router;
