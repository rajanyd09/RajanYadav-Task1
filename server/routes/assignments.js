const express = require('express');
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.post('/', requireRole('ADMIN'), assignmentController.createAssignment);
router.get('/', assignmentController.getAssignments);

module.exports = router;
