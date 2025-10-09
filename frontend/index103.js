import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';  // mysql2 is recommended, install with npm i mysql2

const app = express();
const PORT = 3000;

// ES module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares to parse JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection setup using env vars (passed from Docker Compose)
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mydb',
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
    process.exit(1);  // Exit if DB connection fails
  }
  console.log('Connected to MySQL database');
});

// POST endpoint to handle form submission
app.post('/submit', (req, res) => {
  const { username, email, age } = req.body;

  if (!username || !email || !age) {
    return res.status(400).send('All fields are required!');
  }

  const sql = 'INSERT INTO users (username, email, age) VALUES (?, ?, ?)';
  connection.query(sql, [username, email, age], (err, results) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).send('Error saving user data');
    }
    res.send('Thank you! Your response is submitted.');
  });
});

app.listen(PORT, () => console.log(`Node app running on port ${PORT}`));
