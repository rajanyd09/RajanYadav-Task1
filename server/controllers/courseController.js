const db = require('../db');

exports.createCourse = async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const result = await db.query(
      'INSERT INTO courses (title, description, professor_id) VALUES ($1, $2, $3) RETURNING *',
      [title, description, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getCourses = async (req, res) => {
  try {
    if (req.user.role === 'ADMIN') {
      const result = await db.query(`
        SELECT 
          c.*,
          COUNT(DISTINCT ce.student_id) as student_count,
          COUNT(DISTINCT s.id) as submission_count
        FROM courses c
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id
        LEFT JOIN assignments a ON c.id = a.course_id
        LEFT JOIN submissions s ON a.id = s.assignment_id
        WHERE c.professor_id = $1
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `, [req.user.id]);
      res.json(result.rows);
    } else {
      const result = await db.query(`
        SELECT c.* FROM courses c
        JOIN course_enrollments ce ON c.id = ce.course_id
        WHERE ce.student_id = $1
        ORDER BY c.created_at DESC
      `, [req.user.id]);
      res.json(result.rows);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllCoursesForStudents = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM courses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.enrollInCourse = async (req, res) => {
  const { id } = req.params;

  try {
    const groupRes = await db.query('SELECT id FROM groups WHERE creator_id = $1', [req.user.id]);
    let studentIds = [req.user.id];

    if (groupRes.rows.length > 0) {
      const groupId = groupRes.rows[0].id;
      const membersRes = await db.query('SELECT user_id FROM group_members WHERE group_id = $1', [groupId]);
      studentIds = membersRes.rows.map(row => row.user_id);
    }

    for (const studentId of studentIds) {
      await db.query(
        'INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, studentId]
      );
    }

    res.status(200).json({ message: 'Enrolled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getCourseDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const courseRes = await db.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (courseRes.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
    
    const assignmentsRes = await db.query('SELECT * FROM assignments WHERE course_id = $1 ORDER BY created_at DESC', [id]);
    let assignments = assignmentsRes.rows;

    if (req.user && req.user.role === 'STUDENT') {
      const memberResult = await db.query('SELECT group_id FROM group_members WHERE user_id = $1', [req.user.id]);
      const groupId = memberResult.rows.length > 0 ? memberResult.rows[0].group_id : null;

      let query = 'SELECT assignment_id FROM submissions WHERE student_id = $1';
      let params = [req.user.id];

      if (groupId) {
        query += ' OR group_id = $2';
        params.push(groupId);
      }

      const submissionsRes = await db.query(query, params);
      const submittedAssignmentIds = new Set(submissionsRes.rows.map(r => r.assignment_id));

      assignments = assignments.map(a => ({
        ...a,
        is_submitted: submittedAssignmentIds.has(a.id)
      }));
    }
    
    res.json({
      course: courseRes.rows[0],
      assignments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getCourseSubmissions = async (req, res) => {
  const { id } = req.params;
  try {
    const courseRes = await db.query('SELECT professor_id FROM courses WHERE id = $1', [id]);
    if (courseRes.rows.length === 0 || courseRes.rows[0].professor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(`
      SELECT 
        s.id as submission_id,
        s.status,
        s.submitted_at,
        a.title as assignment_title,
        a.submission_type,
        g.name as group_name,
        u.name as student_name,
        u.email as student_email
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      LEFT JOIN groups g ON s.group_id = g.id
      LEFT JOIN users u ON s.student_id = u.id
      WHERE a.course_id = $1
      ORDER BY s.submitted_at DESC
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
