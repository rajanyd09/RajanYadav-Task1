const express = require('express');
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.post('/', requireRole('ADMIN'), assignmentController.createAssignment);
router.get('/', assignmentController.getAssignments);
router.put('/:id', requireRole('ADMIN'), assignmentController.updateAssignment);
router.get('/:id/submissions', requireRole('ADMIN'), assignmentController.getAssignmentSubmissions);

module.exports = router;
