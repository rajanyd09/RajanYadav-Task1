const express = require('express');
const submissionController = require('../controllers/submissionController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.post('/:assignmentId/confirm', requireRole('STUDENT'), submissionController.confirmSubmission);
router.get('/', requireRole('ADMIN'), submissionController.getSubmissions);

module.exports = router;
