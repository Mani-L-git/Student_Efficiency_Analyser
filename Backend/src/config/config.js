const mysql = require("mysql2/promise");
require("dotenv").config();

/* ==========================
   MYSQL CONNECTION POOL
========================== */
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "2005",
  database: process.env.DB_NAME || "mp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/* ==========================
   TEST CONNECTION
========================== */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL database successfully!");
    connection.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
}

testConnection();

module.exports = pool;
