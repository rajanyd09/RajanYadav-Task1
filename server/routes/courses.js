const express = require('express');
const courseController = require('../controllers/courseController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.post('/', requireRole('ADMIN'), courseController.createCourse);
router.get('/', courseController.getCourses);
router.get('/all', requireRole('STUDENT'), courseController.getAllCoursesForStudents);
router.post('/:id/enroll', requireRole('STUDENT'), courseController.enrollInCourse);
router.get('/:id', courseController.getCourseDetails);
router.get('/:id/all-submissions', requireRole('ADMIN'), courseController.getCourseSubmissions);

module.exports = router;
