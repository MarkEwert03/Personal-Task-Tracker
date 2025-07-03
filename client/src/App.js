import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

// --- Helper Functions ---
const tagColors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'dark'];
const getTagColor = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % tagColors.length;
  return `bg-${tagColors[index]}`;
};


// --- Components ---

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      setToken(response.data.accessToken);
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
      <p className="mt-3">
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/register`, { username, password });
      setMessage('Registration successful! You can now log in.');
    } catch (err) {
      setMessage('Error registering user.');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Register</h2>
      {message && <div className="alert alert-info">{message}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Register</button>
      </form>
      <p className="mt-3">
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

const TaskList = ({ token, setToken }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', tags: '' });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(`${API_URL}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(response.data);
      } catch (err) {
        console.error('Error fetching tasks', err);
      }
    };
    fetchTasks();
  }, [token]);

  const handleLogout = () => {
    setToken(null);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/tasks`, newTask, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks([...tasks, response.data]);
      setNewTask({ title: '', description: '', due_date: '', tags: '' });
    } catch (err) {
      console.error('Error adding task', err);
    }
  };

  const handleUpdateTask = async (id, updatedTask) => {
    try {
      await axios.put(`${API_URL}/tasks/${id}`, updatedTask, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.map(task => (task.id === id ? { ...task, ...updatedTask } : task)));
    } catch (err) {
      console.error('Error updating task', err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      console.error('Error deleting task', err);
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Your Tasks</h2>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="mb-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="New task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
          />
          <input
            type="text"
            className="form-control"
            placeholder="Description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <input
            type="date"
            className="form-control"
            value={newTask.due_date}
            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Tags (comma-separated)"
            value={newTask.tags}
            onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
          />
          <button type="submit" className="btn btn-primary">Add Task</button>
        </div>
      </form>

      {/* Task List */}
      <ul className="list-group">
        {tasks.map(task => (
          <li key={task.id} className={`list-group-item d-flex justify-content-between align-items-center ${task.completed ? 'list-group-item-success' : ''}`}>
            <div>
              <h5>{task.title}</h5>
              <p>{task.description}</p>
              {task.tags && (
                <div className="mb-2">
                  {task.tags.split(',').map(tag => (
                    <span key={tag} className={`badge ${getTagColor(tag.trim())} me-1`}>{tag.trim()}</span>
                  ))}
                </div>
              )}
              <small>Due: {task.due_date}</small>
            </div>
            <div>
              <button
                className={`btn btn-sm ${task.completed ? 'btn-warning' : 'btn-success'}`}
                onClick={() => handleUpdateTask(task.id, { ...task, completed: !task.completed })}
              >
                {task.completed ? 'Undo' : 'Complete'}
              </button>
              <button
                className="btn btn-sm btn-danger ms-2"
                onClick={() => handleDeleteTask(task.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleSetToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
    setToken(newToken);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setToken={handleSetToken} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={token ? <TaskList token={token} setToken={handleSetToken} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;