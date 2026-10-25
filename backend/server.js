const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const dbPath = path.join(__dirname, '..', 'assignment_tracker.db');
const db = new sqlite3.Database(dbPath);

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const priorities = ['Low', 'Medium', 'High'];
const statuses = ['Pending', 'Completed'];

function sendDbError(res, message, error) {
  console.error(message, error.message);
  return res.status(500).json({ message });
}

function validateAssignment(body, partial = false) {
  const errors = [];
  if (!partial || body.subject !== undefined) {
    if (typeof body.subject !== 'string' || !body.subject.trim() || body.subject.trim().length > 80) errors.push('Subject is required and must be 80 characters or fewer.');
  }
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 140) errors.push('Assignment title is required and must be 140 characters or fewer.');
  }
  if (!partial || body.dueDate !== undefined) {
    if (typeof body.dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate) || Number.isNaN(Date.parse(`${body.dueDate}T00:00:00`))) errors.push('A valid due date is required.');
  }
  if (body.priority !== undefined && !priorities.includes(body.priority)) errors.push('Priority must be Low, Medium, or High.');
  if (body.status !== undefined && !statuses.includes(body.status)) errors.push('Status must be Pending or Completed.');
  if (body.notes !== undefined && (typeof body.notes !== 'string' || body.notes.length > 1000)) errors.push('Notes must be 1000 characters or fewer.');
  return errors;
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Student Assignment Tracker' }));

app.get('/api/assignments', (req, res) => {
  const sql = `SELECT id, subject, title, due_date AS dueDate, priority, status, notes, created_at AS createdAt
               FROM assignments ORDER BY CASE WHEN status = 'Completed' THEN 1 ELSE 0 END,
               due_date ASC, CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, id DESC`;
  db.all(sql, [], (error, rows) => error ? sendDbError(res, 'Failed to load assignments.', error) : res.json(rows));
});

app.post('/api/assignments', (req, res) => {
  const errors = validateAssignment(req.body || {});
  if (errors.length) return res.status(400).json({ message: errors[0], errors });
  const { subject, title, dueDate, priority = 'Medium', notes = '' } = req.body;
  db.run(`INSERT INTO assignments (subject, title, due_date, priority, status, notes) VALUES (?, ?, ?, ?, 'Pending', ?)`,
    [subject.trim(), title.trim(), dueDate, priority, notes.trim()], function (error) {
      if (error) return sendDbError(res, 'Failed to create assignment.', error);
      db.get(`SELECT id, subject, title, due_date AS dueDate, priority, status, notes, created_at AS createdAt FROM assignments WHERE id = ?`, [this.lastID], (readError, row) => {
        if (readError) return sendDbError(res, 'Assignment was created but could not be loaded.', readError);
        res.status(201).json(row);
      });
    });
});

app.put('/api/assignments/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid assignment ID.' });
  const body = req.body || {};
  const errors = validateAssignment(body, true);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });
  const allowed = { subject: 'subject', title: 'title', dueDate: 'due_date', priority: 'priority', status: 'status', notes: 'notes' };
  const fields = Object.keys(allowed).filter(key => body[key] !== undefined);
  if (!fields.length) return res.status(400).json({ message: 'No valid fields provided to update.' });
  const values = fields.map(key => typeof body[key] === 'string' && ['subject', 'title', 'notes'].includes(key) ? body[key].trim() : body[key]);
  const sql = `UPDATE assignments SET ${fields.map(key => `${allowed[key]} = ?`).join(', ')} WHERE id = ?`;
  db.run(sql, [...values, id], function (error) {
    if (error) return sendDbError(res, 'Failed to update assignment.', error);
    if (!this.changes) return res.status(404).json({ message: 'Assignment not found.' });
    db.get(`SELECT id, subject, title, due_date AS dueDate, priority, status, notes, created_at AS createdAt FROM assignments WHERE id = ?`, [id], (readError, row) => {
      if (readError) return sendDbError(res, 'Assignment updated but could not be loaded.', readError);
      res.json(row);
    });
  });
});

app.delete('/api/assignments/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid assignment ID.' });
  db.run('DELETE FROM assignments WHERE id = ?', [id], function (error) {
    if (error) return sendDbError(res, 'Failed to delete assignment.', error);
    if (!this.changes) return res.status(404).json({ message: 'Assignment not found.' });
    res.json({ message: 'Assignment deleted successfully.' });
  });
});

// Create the database schema automatically on first run. Migrations add new columns to older databases.
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    due_date TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Completed')),
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`, (error) => {
    if (error) {
      console.error('Could not initialize database:', error.message);
      process.exitCode = 1;
      return;
    }
    // Support databases created by the earlier version of this project.
    db.all('PRAGMA table_info(assignments)', (pragmaError, columns) => {
      if (pragmaError) return console.error('Could not inspect database schema:', pragmaError.message);
      const names = new Set(columns.map(column => column.name));
      const migrations = [];
      if (!names.has('notes')) migrations.push("ALTER TABLE assignments ADD COLUMN notes TEXT NOT NULL DEFAULT ''");
      if (!names.has('created_at')) migrations.push("ALTER TABLE assignments ADD COLUMN created_at TEXT NOT NULL DEFAULT ''");
      let index = 0;
      const nextMigration = () => {
        if (index >= migrations.length) {
          app.listen(PORT, () => console.log(`Student Assignment Tracker running at http://localhost:${PORT}`));
          return;
        }
        db.run(migrations[index++], (migrationError) => {
          if (migrationError) console.error('Database migration warning:', migrationError.message);
          nextMigration();
        });
      };
      nextMigration();
    });
  });
});

process.on('SIGINT', () => db.close(() => process.exit(0)));
