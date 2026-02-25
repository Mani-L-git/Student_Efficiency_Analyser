const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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
   ROLE MIDDLEWARES
========================== */
function verifyAdmin(req, res, next) {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

function verifySuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Super Admin access required" });
  }
  next();
}

/* ==========================
   LOGIN API
========================== */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(400).json({ message: "User not found" });

    const user = rows[0];

    if (password !== user.password) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, department: user.department },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token, role: user.role, id: user.id, department: user.department });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   SUPERADMIN — ADD ADMIN
========================== */
app.post("/superadmin/add-admin", verifyToken, verifySuperAdmin, async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password || !department) {
    return res.status(400).json({ message: "All fields required" });
  }

  const validDepts = ["IT", "Mechanical", "Civil"];
  if (!validDepts.includes(department)) {
    return res.status(400).json({ message: "Invalid department. Use IT, Mechanical, or Civil" });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    await pool.query(
      "INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, 'admin', ?)",
      [name, email, password, department]
    );

    res.json({ message: `Admin (${department}) added successfully` });
  } catch (error) {
    console.error("Add Admin Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   SUPERADMIN — GET ALL ADMINS
========================== */
app.get("/superadmin/admins", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, department, created_at FROM users WHERE role = 'admin'"
    );
    res.json(rows);
  } catch (error) {
    console.error("Fetch Admins Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   SUPERADMIN — DELETE ADMIN
========================== */
app.delete("/superadmin/admin/:id", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = ? AND role = 'admin'", [req.params.id]);
    res.json({ message: "Admin removed successfully" });
  } catch (error) {
    console.error("Delete Admin Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   SUPERADMIN — ANNOUNCEMENTS
========================== */
// Get all announcements
app.get("/announcements", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM announcements ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Fetch Announcements Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add announcement (superadmin only)
app.post("/superadmin/announcement", verifyToken, verifySuperAdmin, async (req, res) => {
  const { title, message, target } = req.body; // target: 'all' | 'IT' | 'Mechanical' | 'Civil'

  if (!title || !message) {
    return res.status(400).json({ message: "Title and message required" });
  }

  try {
    await pool.query(
      "INSERT INTO announcements (title, message, target) VALUES (?, ?, ?)",
      [title, message, target || "all"]
    );
    res.json({ message: "Announcement posted successfully" });
  } catch (error) {
    console.error("Add Announcement Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete announcement (superadmin only)
app.delete("/superadmin/announcement/:id", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM announcements WHERE id = ?", [req.params.id]);
    res.json({ message: "Announcement deleted" });
  } catch (error) {
    console.error("Delete Announcement Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   SUPERADMIN — DASHBOARD STATS
========================== */
app.get("/superadmin/stats", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const [[{ totalStudents }]] = await pool.query(
      "SELECT COUNT(*) as totalStudents FROM users WHERE role = 'student'"
    );
    const [[{ totalAdmins }]] = await pool.query(
      "SELECT COUNT(*) as totalAdmins FROM users WHERE role = 'admin'"
    );
    const [[{ totalMarks }]] = await pool.query("SELECT COUNT(*) as totalMarks FROM marks");

    // Students per department
    const [deptStats] = await pool.query(
      "SELECT department, COUNT(*) as count FROM users WHERE role = 'student' AND department IS NOT NULL GROUP BY department"
    );

    res.json({ totalStudents, totalAdmins, totalMarks, deptStats });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   ADD STUDENT (ADMIN — dept restricted)
========================== */
app.post("/add-student", verifyToken, verifyAdmin, async (req, res) => {
  const { name, rollno, email, password } = req.body;

  if (!name || !rollno || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  // Get admin's department from JWT token
  const adminDepartment = req.user.department;

  if (!adminDepartment) {
    return res.status(403).json({ message: "Admin has no department assigned" });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    await pool.query(
      "INSERT INTO users (name, rollno, email, password, role, department) VALUES (?, ?, ?, ?, 'student', ?)",
      [name, rollno, email, password, adminDepartment]
    );

    res.json({ message: `Student added to ${adminDepartment} department successfully` });
  } catch (error) {
    console.error("Add Student Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   GET STUDENTS (ADMIN — dept restricted)
========================== */
app.get("/students", verifyToken, verifyAdmin, async (req, res) => {
  try {
    let rows;

    if (req.user.role === "superadmin") {
      // Superadmin sees all students
      [rows] = await pool.query(
        "SELECT id, name, rollno, email, department FROM users WHERE role = 'student'"
      );
    } else {
      // Admin sees only their department's students
      [rows] = await pool.query(
        "SELECT id, name, rollno, email, department FROM users WHERE role = 'student' AND department = ?",
        [req.user.department]
      );
    }

    res.json(rows);
  } catch (error) {
    console.error("Fetch Students Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});




/* ==========================
   GRADE CALCULATOR HELPER
   (add this above your routes)
========================== */
function calculateGrade(marks) {
  if (marks >= 91) return { grade: "O",  gradePoints: 10 };
  if (marks >= 81) return { grade: "A+", gradePoints: 9  };
  if (marks >= 71) return { grade: "A",  gradePoints: 8  };
  if (marks >= 61) return { grade: "B+", gradePoints: 7  };
  if (marks >= 56) return { grade: "B",  gradePoints: 6  };
  if (marks >= 51) return { grade: "C",  gradePoints: 5  };
  return               { grade: "F",  gradePoints: 0  };
}


// ============================================================
//  REPLACE these two routes in your server.js
//  (Find the existing /subjects GET and /add-subject POST)
// ============================================================


/* ==========================
   GET SUBJECTS (dept filtered)
========================== */
app.get("/subjects", verifyToken, async (req, res) => {
  try {
    let rows;

    if (req.user.role === "superadmin") {
      [rows] = await pool.query("SELECT * FROM subjects ORDER BY department, subject_name");
    } else if (req.user.role === "admin") {
      [rows] = await pool.query(
        "SELECT * FROM subjects WHERE department = ? ORDER BY subject_name",
        [req.user.department]
      );
    } else {
      // Student
      const [userRows] = await pool.query(
        "SELECT department FROM users WHERE id = ?",
        [req.user.id]
      );
      const dept = userRows[0]?.department;
      [rows] = await pool.query(
        "SELECT * FROM subjects WHERE department = ? ORDER BY subject_name",
        [dept]
      );
    }

    res.json(rows);
  } catch (error) {
    console.error("Fetch Subjects Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


/* ==========================
   ADD SUBJECT (admin only — auto dept)
========================== */
app.post("/add-subject", verifyToken, verifyAdmin, async (req, res) => {
  const { subject_name, credits } = req.body;

  if (!subject_name || !credits) {
    return res.status(400).json({ message: "Subject name and credits required" });
  }

  const department = req.user.department;
  if (!department) {
    return res.status(403).json({ message: "Admin has no department assigned" });
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM subjects WHERE subject_name = ? AND department = ?",
      [subject_name, department]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Subject already exists in your department" });
    }

    await pool.query(
      "INSERT INTO subjects (subject_name, department, credits) VALUES (?, ?, ?)",
      [subject_name, department, credits]
    );

    res.json({ message: `Subject added to ${department} department` });
  } catch (error) {
    console.error("Add Subject Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   ADD MARKS (ADMIN ONLY)
========================== */
app.post("/add-marks", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, subject_id, marks_scored, semester } = req.body;

  if (!student_id || !subject_id || marks_scored === undefined || !semester) {
    return res.status(400).json({ message: "All fields required" });
  }

  const department = req.user.department;
  const { grade, gradePoints } = calculateGrade(Number(marks_scored));

  try {
    // Get subject credits
    const [subjectRows] = await pool.query(
      "SELECT credits FROM subjects WHERE id = ?",
      [subject_id]
    );
    if (subjectRows.length === 0) {
      return res.status(404).json({ message: "Subject not found" });
    }
    const credits = subjectRows[0].credits;

    // Prevent duplicate entry
    const [dup] = await pool.query(
      "SELECT id FROM marks WHERE student_id = ? AND subject_id = ? AND semester = ?",
      [student_id, subject_id, semester]
    );
    if (dup.length > 0) {
      return res.status(400).json({ message: "Marks already entered for this subject in this semester" });
    }

    await pool.query(
      `INSERT INTO marks (student_id, subject_id, marks_scored, grade, grade_points, semester, department)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [student_id, subject_id, marks_scored, grade, gradePoints, semester, department]
    );

    // Return updated SGPA for that semester
    const [semMarks] = await pool.query(
      `SELECT m.grade_points, s.credits
       FROM marks m JOIN subjects s ON m.subject_id = s.id
       WHERE m.student_id = ? AND m.semester = ?`,
      [student_id, semester]
    );
    const totalCredits = semMarks.reduce((sum, r) => sum + r.credits, 0);
    const weightedSum  = semMarks.reduce((sum, r) => sum + (r.grade_points * r.credits), 0);
    const sgpa = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : "0.00";

    res.json({
      message: `Marks added — Grade: ${grade}, Points: ${gradePoints}`,
      grade, gradePoints, sgpa, credits,
    });
  } catch (error) {
    console.error("Add Marks Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


/* ==========================
   GET ALL MARKS (ADMIN)
========================== */
app.get("/all-marks", verifyToken, verifyAdmin, async (req, res) => {
  try {
    let rows;
    const query = `
      SELECT m.*, s.subject_name, s.credits, u.name as student_name
      FROM marks m
      JOIN subjects s ON m.subject_id = s.id
      JOIN users u ON m.student_id = u.id
      ORDER BY m.semester, u.name
    `;
    if (req.user.role === "superadmin") {
      [rows] = await pool.query(query);
    } else {
      [rows] = await pool.query(
        query.replace("ORDER BY", "WHERE m.department = ? ORDER BY"),
        [req.user.department]
      );
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


/* ==========================
   GET SINGLE STUDENT
========================== */
app.get("/student/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, rollno, email, department FROM users WHERE id = ? AND role = 'student'",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Student not found" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   STUDENT MARKS
========================== */
app.get("/student-marks/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, s.subject_name, s.credits
       FROM marks m
       JOIN subjects s ON m.subject_id = s.id
       WHERE m.student_id = ?
       ORDER BY m.semester`,
      [req.params.id]
    );

    // Group by semester
    const semesterMap = {};
    for (const row of rows) {
      if (!semesterMap[row.semester]) {
        semesterMap[row.semester] = { subjects: [], totalCredits: 0, weightedSum: 0 };
      }
      semesterMap[row.semester].subjects.push(row);
      semesterMap[row.semester].totalCredits += Number(row.credits);
      semesterMap[row.semester].weightedSum  += Number(row.grade_points) * Number(row.credits);
    }

    // Build per-semester SGPA
    const semesters = Object.keys(semesterMap).map((sem) => {
      const { subjects, totalCredits, weightedSum } = semesterMap[sem];
      const sgpa = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : "0.00";
      return { semester: sem, sgpa, subjects };
    });

    // Overall CGPA
    const allCredits  = rows.reduce((sum, r) => sum + Number(r.credits), 0);
    const allWeighted = rows.reduce((sum, r) => sum + Number(r.grade_points) * Number(r.credits), 0);
    const cgpa = allCredits > 0 ? (allWeighted / allCredits).toFixed(2) : "0.00";

    res.json({ semesters, cgpa });
  } catch (error) {
    console.error("Student Marks Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   STUDENT ATTENDANCE
========================== */
app.get("/student-attendance/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, s.subject_name 
       FROM attendance a 
       JOIN subjects s ON a.subject_id = s.id 
       WHERE a.student_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   START SERVER
========================== */
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});