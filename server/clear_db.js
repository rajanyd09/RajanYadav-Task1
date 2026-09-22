require('dotenv').config();
const db = require('./db');

async function clearDB() {
  try {
    console.log('Clearing database...');
    
    // Truncate all tables except users, CASCADE will handle foreign keys
    await db.query('TRUNCATE TABLE submissions, assignments, course_enrollments, courses, group_members, groups CASCADE;');
    console.log('Truncated all tables except users.');
    
    // Delete all users except ADMINs
    const res = await db.query("DELETE FROM users WHERE role != 'ADMIN' RETURNING *;");
    console.log(`Deleted ${res.rowCount} non-admin users.`);
    
    console.log('Database cleared successfully, keeping only ADMIN details.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDB();
