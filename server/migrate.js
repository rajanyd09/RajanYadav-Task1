require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
  try {
    await db.query(`
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES users(id) ON DELETE CASCADE;
    `);
    
    // Add unique constraint if not exists
    try {
      await db.query(`ALTER TABLE submissions ADD CONSTRAINT unique_assignment_student UNIQUE (assignment_id, student_id);`);
    } catch (e) {
      if (e.code !== '42710') { // 42710 is duplicate_object
        console.error('Constraint error (can be ignored if it exists):', e.message);
      }
    }
    
    console.log('Migration successful.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
