const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = 'your_jwt_secret'; // Replace with a strong secret in a real application

app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./tasks.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the tasks database.');
});

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    tags TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Auth Routes ---
app.post('/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.status(500).send('Error hashing password');
    }
    db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], function(err) {
      if (err) {
        if (err.errno === 19) { // SQLITE_CONSTRAINT error code
          return res.status(400).send('Username already exists');
        } else {
          console.error('Database error during registration:', err.message);
          return res.status(500).send('Database error during registration');
        }
      }
      res.status(201).send({ id: this.lastID });
    });
  });
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      return res.status(400).send('Invalid username or password');
    }
    bcrypt.compare(password, user.password_hash, (err, result) => {
      if (result) {
        const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ accessToken });
      } else {
        res.status(400).send('Invalid username or password');
      }
    });
  });
});

// --- Task Routes ---
app.get('/tasks', authenticateToken, (req, res) => {
  db.all('SELECT * FROM tasks WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json(rows);
    }
  });
});

app.post('/tasks', authenticateToken, (req, res) => {
  const { title, description, due_date, tags } = req.body;
  if (!title) {
    return res.status(400).send('Title is required');
  }
  db.run(
    'INSERT INTO tasks (user_id, title, description, due_date, tags) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, title, description, due_date, tags],
    function(err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.status(201).json({ id: this.lastID, title, description, due_date, completed: 0, tags });
    }
  );
});

app.put('/tasks/:id', authenticateToken, (req, res) => {
  const { title, description, due_date, completed, tags } = req.body;
  db.run(
    'UPDATE tasks SET title = ?, description = ?, due_date = ?, completed = ?, tags = ? WHERE id = ? AND user_id = ?',
    [title, description, due_date, completed, tags, req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      if (this.changes === 0) {
        return res.status(404).send('Task not found or user not authorized');
      }
      res.sendStatus(200);
    }
  );
});

app.delete('/tasks/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    if (this.changes === 0) {
      return res.status(404).send('Task not found or user not authorized');
    }
    res.sendStatus(204);
  });
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});