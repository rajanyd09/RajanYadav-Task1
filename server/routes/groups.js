const express = require('express');
const groupController = require('../controllers/groupController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.post('/', requireRole('STUDENT'), groupController.createGroup);
router.post('/:id/members', requireRole('STUDENT'), groupController.addMember);
router.get('/my-group', requireRole('STUDENT'), groupController.getMyGroup);
router.get('/', requireRole('ADMIN'), groupController.getAllGroups);
router.delete('/:id/members/:userId', groupController.removeMember);

module.exports = router;
