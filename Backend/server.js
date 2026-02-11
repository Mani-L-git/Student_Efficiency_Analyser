const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");

const app = express();

app.use(cors());
app.use(express.json());

const SECRET_KEY = "manikandan_secret_key";

// ✅ MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "2005",
  database: "slea",
});

db.connect((err) => {
  if (err) {  
    console.log("❌ Database connection failed");
  } else {
    console.log("✅ Connected to MySQL");
  }
});

// ✅ LOGIN API
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  console.log("Login attempt:", email, password);

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
      }

      if (result.length === 0) {
        return res.status(400).json({ message: "User not found" });
      }

      const user = result[0];

      if (user.password !== password) {
        return res.status(400).json({ message: "Wrong password" });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        SECRET_KEY,
        { expiresIn: "1h" }
      );

      res.json({
        message: "Login successful",
        token,
        role: user.role,
      });
    }
  );
});

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
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