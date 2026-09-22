const db = require('../db');

exports.confirmSubmission = async (req, res) => {
  const { assignmentId } = req.params;
  
  try {
    const assignmentResult = await db.query('SELECT id, submission_type FROM assignments WHERE id = $1', [assignmentId]);
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const submissionType = assignmentResult.rows[0].submission_type;

    if (submissionType === 'INDIVIDUAL') {
      const submitResult = await db.query(
        `INSERT INTO submissions (assignment_id, student_id, status, submitted_at) 
         VALUES ($1, $2, 'SUBMITTED', CURRENT_TIMESTAMP) 
         ON CONFLICT ON CONSTRAINT unique_assignment_student
         DO UPDATE SET status = 'SUBMITTED', submitted_at = CURRENT_TIMESTAMP 
         RETURNING *`,
        [assignmentId, req.user.id]
      );
      return res.json({ message: 'Submission confirmed successfully', submission: submitResult.rows[0] });
    } else {
      const memberResult = await db.query('SELECT group_id FROM group_members WHERE user_id = $1', [req.user.id]);
      
      if (memberResult.rows.length === 0) {
        return res.status(403).json({ error: 'You must be part of a group to submit' });
      }
      
      const groupId = memberResult.rows[0].group_id;
      
      const groupResult = await db.query('SELECT creator_id FROM groups WHERE id = $1', [groupId]);
      if (groupResult.rows.length === 0 || groupResult.rows[0].creator_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the Group Leader can confirm this submission.' });
      }

      const submitResult = await db.query(
        `INSERT INTO submissions (assignment_id, group_id, status, submitted_at) 
         VALUES ($1, $2, 'SUBMITTED', CURRENT_TIMESTAMP) 
         ON CONFLICT (assignment_id, group_id) 
         DO UPDATE SET status = 'SUBMITTED', submitted_at = CURRENT_TIMESTAMP 
         RETURNING *`,
        [assignmentId, groupId]
      );

      return res.json({ message: 'Submission confirmed successfully', submission: submitResult.rows[0] });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        s.id as submission_id,
        s.status,
        s.submitted_at,
        a.title as assignment_title,
        g.name as group_name,
        g.id as group_id
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN groups g ON s.group_id = g.id
      ORDER BY s.submitted_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
