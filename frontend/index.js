import express from 'express';
import mysql from 'mysql2/promise';


const app = express();
const PORT = 3000;

// Database connection config

const dbConfig = {
  host: process.env.DB_HOST || 'mysql_ubuntu',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'mydb'
};

app.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT message FROM messages LIMIT 1');
    await connection.end();
    res.send(`<h1>Hello from Node.js (Ubuntu container)!</h1><p>MySQL says: ${rows[0].message}</p>`);
    } catch (error) {
    console.error(error);
    res.status(500).send('Error:xL');
    }
});

app.listen(PORT, () => console.log(`Node app running on port ${PORT}`));

