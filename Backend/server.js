const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const pool = require("./src/config/config");

const app = express();

app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.JWT_SECRET || "manikandan_secret_key";

/* ==========================
   JWT VERIFY MIDDLEWARE
========================== */
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader)
    return res.status(403).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err)
      return res.status(401).json({ message: "Invalid token" });

    req.user = decoded;
    next();
  });
}

/* ==========================
   ADMIN ONLY MIDDLEWARE
========================== */
function verifyAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

/* ==========================
   LOGIN API
========================== */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const user = rows[0];

if (user.password !== password) {
  return res.status(400).json({ message: "Wrong password" });
}


    const token = jwt.sign(
      { id: user.id, role: user.role },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      role: user.role,
      id: user.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==========================
   ADD STUDENT (ADMIN ONLY)
========================== */
app.post("/add-student", verifyToken, verifyAdmin, async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, "student"]
    );

    res.json({ message: "Student added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==========================
   GET STUDENTS (ADMIN ONLY)
========================== */
app.get("/students", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email FROM users WHERE role = 'student'"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==========================
   GET SUBJECTS
========================== */
app.get("/subjects", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM subjects");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==========================
   ADD MARKS (ADMIN ONLY)
========================== */
app.post("/add-marks", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { student_id, subject_id, grade, sgpa, semester, department } =
      req.body;

    await pool.query(
      `INSERT INTO marks 
       (student_id, subject_id, grade, sgpa, semester, department)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, subject_id, grade, sgpa, semester, department]
    );

    res.json({ message: "Marks added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==========================
   UPDATE MARKS (ADMIN ONLY)
========================== */
app.put("/update-marks/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { grade, sgpa, semester, department } = req.body;

    await pool.query(
      `UPDATE marks 
       SET grade=?, sgpa=?, semester=?, department=? 
       WHERE id=?`,
      [grade, sgpa, semester, department, req.params.id]
    );

    res.json({ message: "Marks updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==========================
   DELETE MARKS (ADMIN ONLY)
========================== */
app.delete("/delete-marks/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM marks WHERE id=?", [req.params.id]);
    res.json({ message: "Marks deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==========================
   GET ALL MARKS (ADMIN ONLY)
========================== */
app.get("/all-marks", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        marks.*, 
        users.name AS student_name,
        subjects.subject_name
      FROM marks
      JOIN users ON marks.student_id = users.id
      JOIN subjects ON marks.subject_id = subjects.id
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==========================
   GET STUDENT MARKS (PROTECTED)
========================== */
app.get("/student-marks/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          subjects.subject_name,
          marks.grade,
          marks.sgpa,
          marks.semester,
          marks.department
       FROM marks
       INNER JOIN subjects 
       ON marks.subject_id = subjects.id
       WHERE marks.student_id = ?`,
      [req.params.id]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==========================
   GET STUDENT ATTENDANCE (PROTECTED)
========================== */
app.get("/student-attendance/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          subjects.subject_name,
          attendance.attendance_percentage,
          attendance.semester
       FROM attendance
       INNER JOIN subjects
       ON attendance.subject_id = subjects.id
       WHERE attendance.student_id = ?`,
      [req.params.id]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==========================
   START SERVER
========================== */
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
