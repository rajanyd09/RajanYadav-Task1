const db = require('../db');

exports.createGroup = async (req, res) => {
  const { name } = req.body;
  const creator_id = req.user.id;
  
  if (!name) return res.status(400).json({ error: 'Group name is required' });

  try {
    const existingMembership = await db.query('SELECT * FROM group_members WHERE user_id = $1', [creator_id]);
    if (existingMembership.rows.length > 0) {
      return res.status(400).json({ error: 'You are already a member of a group' });
    }

    await db.query('BEGIN');
    
    const groupResult = await db.query(
      'INSERT INTO groups (name, creator_id) VALUES ($1, $2) RETURNING id, name, created_at',
      [name, creator_id]
    );
    const groupId = groupResult.rows[0].id;
    
    await db.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [groupId, creator_id]
    );
    
    await db.query('COMMIT');
    res.status(201).json(groupResult.rows[0]);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addMember = async (req, res) => {
  const { email } = req.body;
  const groupId = req.params.id;
  
  if (!email) return res.status(400).json({ error: 'User email is required' });

  try {
    const userResult = await db.query('SELECT id, role FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    if (user.role !== 'STUDENT') {
      return res.status(400).json({ error: 'Can only add students to a group' });
    }
    
    const checkGroup = await db.query('SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, req.user.id]);
    if (checkGroup.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const checkUserMembership = await db.query('SELECT * FROM group_members WHERE user_id = $1', [user.id]);
    if (checkUserMembership.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a member of a group' });
    }

    await db.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [groupId, user.id]
    );
    
    res.status(200).json({ message: 'User added to group successfully' });
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'User is already in this group' });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

exports.getMyGroup = async (req, res) => {
  try {
    const memberResult = await db.query('SELECT group_id FROM group_members WHERE user_id = $1', [req.user.id]);
    
    if (memberResult.rows.length === 0) {
      return res.status(404).json({ message: 'You are not in any group' });
    }
    
    const groupId = memberResult.rows[0].group_id;
    
    const groupDetails = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    const members = await db.query(`
      SELECT u.id, u.name, u.email 
      FROM users u 
      JOIN group_members gm ON u.id = gm.user_id 
      WHERE gm.group_id = $1
    `, [groupId]);
    
    res.json({
      ...groupDetails.rows[0],
      members: members.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllGroups = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        g.id, 
        g.name, 
        COALESCE(
          json_agg(
            json_build_object('id', u.id, 'name', u.name, 'email', u.email)
          ) FILTER (WHERE u.id IS NOT NULL), '[]'
        ) as members
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN users u ON gm.user_id = u.id
      GROUP BY g.id, g.name
      ORDER BY g.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.removeMember = async (req, res) => {
  const groupId = req.params.id;
  const userId = req.params.userId;

  try {
    const checkGroup = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (checkGroup.rows.length === 0) return res.status(404).json({ error: 'Group not found' });
    
    // Allow if ADMIN, or if STUDENT is the creator, or if the user is removing themselves
    if (req.user.role !== 'ADMIN' && checkGroup.rows[0].creator_id !== req.user.id && req.user.id !== userId) {
       return res.status(403).json({ error: 'Not authorized to remove this member' });
    }

    // Prevent removing the creator
    if (checkGroup.rows[0].creator_id === userId) {
        return res.status(400).json({ error: 'Cannot remove the group creator' });
    }

    await db.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
