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

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ message: "Token missing or malformed" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/* ==========================
   ADMIN + SUPERADMIN ACCESS
========================== */
function verifyAdmin(req, res, next) {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
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

    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = rows[0];

    if (password !== user.password) {
  return res.status(400).json({ message: "Wrong password" });
}


    // ✅ Proper password check
    // const isMatch = compare(password, user.password);

    // if (!isMatch) {
    //   return res.status(400).json({ message: "Wrong password" });
    // }

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
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   ADD STUDENT (ADMIN ONLY)
========================== */
app.post("/add-student", verifyToken, verifyAdmin, async (req, res) => {
  const { name, rollno, email, password } = req.body;

  if (!name || !rollno || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    // Check duplicate email
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    

    await pool.query(
      "INSERT INTO users (name, rollno, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [name, rollno, email, password, "student"]
    );

    res.json({ message: "Student added successfully" });

  } catch (error) {
    console.error("Add Student Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   GET STUDENTS (ADMIN ONLY)
========================== */
app.get("/students", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, rollno, email FROM users WHERE role = 'student'"
    );

    res.json(rows);

  } catch (error) {
    console.error("Fetch Students Error:", error);
    res.status(500).json({ message: "Server error" });
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
    console.error("Fetch Subjects Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   ADD MARKS (ADMIN ONLY)
========================== */
app.post("/add-marks", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, subject_id, grade, sgpa, semester, department } = req.body;

  if (!student_id || !subject_id || !grade || !sgpa || !semester || !department) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    await pool.query(
      `INSERT INTO marks 
       (student_id, subject_id, grade, sgpa, semester, department)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, subject_id, grade, sgpa, semester, department]
    );

    res.json({ message: "Marks added successfully" });

  } catch (error) {
    console.error("Add Marks Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


/* ==========================
   ADD SUBJECT (ADMIN ONLY)
========================== */
app.post("/add-subject", verifyToken, verifyAdmin, async (req, res) => {
  const { subject_name } = req.body;

  if (!subject_name) {
    return res.status(400).json({ message: "Subject name required" });
  }

  try {
    await pool.query(
      "INSERT INTO subjects (subject_name) VALUES (?)",
      [subject_name]
    );

    res.json({ message: "Subject added successfully" });

  } catch (error) {
    console.error("Add Subject Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   GET SINGLE STUDENT (STUDENT)
========================== */
app.get("/student/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, rollno, email FROM users WHERE id = ? AND role = 'student'",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error("Fetch Student Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


/* ==========================
   START SERVER
========================== */
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
