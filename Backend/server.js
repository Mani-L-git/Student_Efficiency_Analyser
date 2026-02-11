const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "2005",
  database: "students"
});

db.connect((err) => {
  if (err) {
    console.log("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

// Insert mark
app.post("/add-mark", (req, res) => {
  const { mark } = req.body;

  const sql = "INSERT INTO marks (mark) VALUES (?)";
  db.query(sql, [mark], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error inserting data");
    } else {
      res.send("Mark added successfully");
    }
  });
});

// Get all marks
app.get("/marks", (req, res) => {
  db.query("SELECT * FROM marks", (err, result) => {
    if (err) {
      res.status(500).send("Error fetching data");
    } else {
      res.json(result);
    }
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});









/*
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./src/config/config.js');



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================
// Global Middleware
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));







// ==========================
// Test Routes
// ==========================
app.get('/', (req, res) => {
  res.send('Logistics App Backend is Running ✅');
});

app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS current_time');
    res.json({ message: 'DB connected ✅', time: rows[0].current_time });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

*/