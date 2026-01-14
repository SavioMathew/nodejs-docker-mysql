import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3000;

// ES module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Token map
const TOKENS = {
  health: 'health-123',
  metrics: 'metrics-123',
};

// Middleware to check token
function tokenAuth(expectedToken) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).send('Authorization header missing');

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || parts[1] !== expectedToken) {
      return res.status(403).send('Invalid token');
    }

    next();
  };
}

// Retry function to connect to MySQL
async function connectWithRetry() {
  let connection;
  const maxRetries = 10;
  let retries = 0;

  while (!connection && retries < maxRetries) {
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      });
      console.log('Connected to MySQL database');
    } catch (err) {
      retries++;
      console.error(`MySQL connection failed (attempt ${retries}): ${err.message}`);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }

  if (!connection) {
    console.error('Could not connect to MySQL after multiple attempts.');
    process.exit(1);
  }

  return connection;
}

(async () => {
  const connection = await connectWithRetry();

  // POST endpoint to handle form submission
  app.post('/submit', (req, res) => {
    const { username, email, age } = req.body;
    if (!username || !email || !age) return res.status(400).send('All fields are required!');

    const sql = 'INSERT INTO users (username, email, age) VALUES (?, ?, ?)';
    connection.query(sql, [username, email, age])
      .then(() => res.send('Thank you! Your response is submitted.'))
      .catch((err) => {
        console.error('Insert error:', err);
        res.status(500).send('Error saving user data');
      });
  });

  // 🔴 Health endpoint
  app.get('/health', tokenAuth(TOKENS.health), (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    });
  });

  // 🔴 Metrics endpoint
  app.get('/metrics', tokenAuth(TOKENS.metrics), async (req, res) => {
    try {
      const [rows] = await connection.query('SELECT COUNT(*) AS userCount FROM users');
      res.json({
        totalUsers: rows[0].userCount,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Metrics error:', err);
      res.status(500).send('Error fetching metrics');
    }
  });

  app.listen(PORT, () => console.log(`Node app running on port ${PORT}`));
})();

