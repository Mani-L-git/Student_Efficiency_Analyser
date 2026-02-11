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