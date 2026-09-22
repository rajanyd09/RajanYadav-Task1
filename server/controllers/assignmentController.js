const db = require('../db');

exports.createAssignment = async (req, res) => {
  const { title, description, due_date, onedrive_link, course_id, submission_type } = req.body;
  const created_by = req.user.id;
  const type = submission_type || 'GROUP';

  if (!title || !due_date || !onedrive_link || !course_id) {
    return res.status(400).json({ error: 'Title, due_date, course_id, and onedrive_link are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO assignments (title, description, due_date, onedrive_link, course_id, submission_type, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, description, due_date, onedrive_link, course_id, type, created_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM assignments ORDER BY due_date ASC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateAssignment = async (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, onedrive_link, submission_type } = req.body;
  
  try {
    const assignmentRes = await db.query('SELECT course_id FROM assignments WHERE id = $1', [id]);
    if (assignmentRes.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });
    
    const courseRes = await db.query('SELECT professor_id FROM courses WHERE id = $1', [assignmentRes.rows[0].course_id]);
    if (courseRes.rows.length === 0 || courseRes.rows[0].professor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(
      'UPDATE assignments SET title = $1, description = $2, due_date = $3, onedrive_link = $4, submission_type = $5 WHERE id = $6 RETURNING *',
      [title, description, due_date, onedrive_link, submission_type, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAssignmentSubmissions = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        s.id as submission_id,
        s.status,
        s.submitted_at,
        g.name as group_name,
        u.name as student_name,
        u.email as student_email
      FROM submissions s
      LEFT JOIN groups g ON s.group_id = g.id
      LEFT JOIN users u ON s.student_id = u.id
      WHERE s.assignment_id = $1
      ORDER BY s.submitted_at DESC
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
