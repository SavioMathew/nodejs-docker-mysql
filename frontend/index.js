import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';  // Use promise-based API for async/await

const app = express();
const PORT = 3000;

// ES module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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
      await new Promise((res) => setTimeout(res, 3000));  // Wait 3 seconds before retry
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

    if (!username || !email || !age) {
      return res.status(400).send('All fields are required!');
    }

    const sql = 'INSERT INTO users (username, email, age) VALUES (?, ?, ?)';
    connection.query(sql, [username, email, age])
      .then(() => res.send('Thank you! Your response is submitted.'))
      .catch((err) => {
        console.error('Insert error:', err);
        res.status(500).send('Error saving user data');
      });
  });

  app.listen(PORT, () => console.log(`Node app running on port ${PORT}`));
})();
