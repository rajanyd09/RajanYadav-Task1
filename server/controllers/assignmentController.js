const db = require('../db');

exports.createAssignment = async (req, res) => {
  const { title, description, due_date, onedrive_link } = req.body;
  const created_by = req.user.id;

  if (!title || !due_date || !onedrive_link) {
    return res.status(400).json({ error: 'Title, due_date, and onedrive_link are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO assignments (title, description, due_date, onedrive_link, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, due_date, onedrive_link, created_by]
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
