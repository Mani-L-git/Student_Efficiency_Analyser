const express = require("express");
const cors    = require("cors");
const jwt     = require("jsonwebtoken");
require("dotenv").config();

const pool = require("./src/config/config");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.JWT_SECRET || "manikandan_secret_key";

/* ====================================================
   JWT VERIFY MIDDLEWARE
==================================================== */
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

/* ====================================================
   ROLE MIDDLEWARES
==================================================== */
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

/* ====================================================
   LOGIN
==================================================== */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(400).json({ message: "User not found" });
    const user = rows[0];
    if (password !== user.password) return res.status(400).json({ message: "Wrong password" });
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

/* ====================================================
   SUPERADMIN — DEPARTMENTS
==================================================== */
app.get("/superadmin/departments", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM departments ORDER BY name ASC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/superadmin/department", verifyToken, verifySuperAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: "Department name required" });
  const deptName = name.trim().toUpperCase();
  try {
    const [existing] = await pool.query("SELECT id FROM departments WHERE name = ?", [deptName]);
    if (existing.length > 0) return res.status(400).json({ message: "Department already exists" });
    await pool.query("INSERT INTO departments (name) VALUES (?)", [deptName]);
    res.json({ message: `Department '${deptName}' added successfully` });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/superadmin/department/:name", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const name = req.params.name.toUpperCase();
    await pool.query("DELETE FROM departments WHERE name = ?", [name]);
    res.json({ message: `Department '${name}' removed` });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   SUPERADMIN — ADD / GET / DELETE ADMIN
==================================================== */
app.post("/superadmin/add-admin", verifyToken, verifySuperAdmin, async (req, res) => {
  const { name, email, password, department } = req.body;
  if (!name || !email || !password || !department)
    return res.status(400).json({ message: "All fields required" });
  try {
    const [deptRows] = await pool.query("SELECT name FROM departments WHERE name = ?", [department]);
    if (deptRows.length === 0) return res.status(400).json({ message: "Invalid department." });
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ message: "Email already exists" });
    await pool.query(
      "INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, 'admin', ?)",
      [name, email, password, department]
    );
    res.json({ message: `Admin (${department}) added successfully` });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/superadmin/admins", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, department, created_at FROM users WHERE role = 'admin'"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/superadmin/admin/:id", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = ? AND role = 'admin'", [req.params.id]);
    res.json({ message: "Admin removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   SUPERADMIN — DASHBOARD STATS
==================================================== */
app.get("/superadmin/stats", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const [[{ totalStudents }]] = await pool.query(
      "SELECT COUNT(*) as totalStudents FROM users WHERE role = 'student'"
    );
    const [[{ totalAdmins }]] = await pool.query(
      "SELECT COUNT(*) as totalAdmins FROM users WHERE role = 'admin'"
    );
    const [[{ totalMarks }]] = await pool.query("SELECT COUNT(*) as totalMarks FROM marks");
    const [deptStats] = await pool.query(
      "SELECT department, COUNT(*) as count FROM users WHERE role = 'student' AND department IS NOT NULL GROUP BY department"
    );
    res.json({ totalStudents, totalAdmins, totalMarks, deptStats });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ✅ NEW: SUPERADMIN — MARKS BY DEPARTMENT (drill-down)
==================================================== */
app.get("/superadmin/marks-by-dept", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { dept } = req.query; // optional filter ?dept=MECH
    let query, params;
    if (dept) {
      query  = `SELECT m.*, s.subject_name, s.credits, u.name as student_name
                FROM marks m
                JOIN subjects s ON m.subject_id = s.id
                JOIN users u ON m.student_id = u.id
                WHERE m.department = ?
                ORDER BY m.semester, u.name`;
      params = [dept];
    } else {
      query  = `SELECT department, COUNT(*) as count FROM marks GROUP BY department`;
      params = [];
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ✅ NEW: SUPERADMIN — ADMIN COUNT BY DEPARTMENT
==================================================== */
app.get("/superadmin/admin-by-dept", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT department, COUNT(*) as count FROM users WHERE role = 'admin' AND department IS NOT NULL GROUP BY department"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ANNOUNCEMENTS — SUPERADMIN POST + GET + DELETE
==================================================== */
app.get("/announcements", verifyToken, async (req, res) => {
  try {
    let rows;
    if (req.user.role === "superadmin") {
      // superadmin sees everything
      [rows] = await pool.query("SELECT * FROM announcements ORDER BY created_at DESC");
    } else if (req.user.role === "admin") {
      // admin sees: target = 'all' OR target = their dept
      [rows] = await pool.query(
        "SELECT * FROM announcements WHERE target = 'all' OR target = ? ORDER BY created_at DESC",
        [req.user.department]
      );
    } else {
      // student sees: target = 'all' OR target = their dept
      const [userRows] = await pool.query("SELECT department FROM users WHERE id = ?", [req.user.id]);
      const dept = userRows[0]?.department;
      [rows] = await pool.query(
        "SELECT * FROM announcements WHERE target = 'all' OR target = ? ORDER BY created_at DESC",
        [dept]
      );
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/superadmin/announcement", verifyToken, verifySuperAdmin, async (req, res) => {
  const { title, message, target } = req.body;
  if (!title || !message) return res.status(400).json({ message: "Title and message required" });
  try {
    await pool.query(
      "INSERT INTO announcements (title, message, target) VALUES (?, ?, ?)",
      [title, message, target || "all"]
    );
    res.json({ message: "Announcement posted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/superadmin/announcement/:id", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM announcements WHERE id = ?", [req.params.id]);
    res.json({ message: "Announcement deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ✅ NEW: ADMIN POST ANNOUNCEMENT (dept-scoped)
==================================================== */
app.post("/admin/announcement", verifyToken, verifyAdmin, async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ message: "Title and message required" });
  const department = req.user.department;
  if (!department) return res.status(403).json({ message: "Admin has no department assigned" });
  try {
    await pool.query(
      "INSERT INTO announcements (title, message, target) VALUES (?, ?, ?)",
      [title, message, department]  // target = admin's own dept
    );
    res.json({ message: "Announcement posted to " + department + " students" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ✅ NEW: ANNOUNCEMENT REPLIES
==================================================== */
// Post a reply
app.post("/announcement/:id/reply", verifyToken, async (req, res) => {
  const { reply_text, is_voice } = req.body;
  const annId = req.params.id;
  if (!reply_text || !reply_text.trim()) return res.status(400).json({ message: "Reply text required" });
  try {
    await pool.query(
      "INSERT INTO ann_replies (announcement_id, user_id, reply_text, is_voice) VALUES (?, ?, ?, ?)",
      [annId, req.user.id, reply_text.trim(), is_voice ? 1 : 0]
    );
    res.json({ message: "Reply posted" });
  } catch (error) {
    console.error("Reply error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all replies for an announcement (with user names)
app.get("/announcement/:id/replies", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.reply_text, r.is_voice, r.created_at,
              u.name as user_name, u.role as user_role
       FROM ann_replies r
       JOIN users u ON r.user_id = u.id
       WHERE r.announcement_id = ?
       ORDER BY r.created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ADD STUDENT (ADMIN — dept restricted)
==================================================== */
app.post("/add-student", verifyToken, verifyAdmin, async (req, res) => {
  const { name, rollno, email, password } = req.body;
  if (!name || !rollno || !email || !password)
    return res.status(400).json({ message: "All fields required" });
  const adminDepartment = req.user.department;
  if (!adminDepartment)
    return res.status(403).json({ message: "Admin has no department assigned" });
  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ message: "Email already exists" });
    await pool.query(
      "INSERT INTO users (name, rollno, email, password, role, department) VALUES (?, ?, ?, ?, 'student', ?)",
      [name, rollno, email, password, adminDepartment]
    );
    res.json({ message: `Student added to ${adminDepartment} department successfully` });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ✅ NEW: DELETE STUDENT (Admin — dept restricted)
==================================================== */
app.delete("/student/:id", verifyToken, verifyAdmin, async (req, res) => {
  const studentId = req.params.id;
  try {
    // Verify student belongs to admin's department
    if (req.user.role !== "superadmin") {
      const [studentRows] = await pool.query(
        "SELECT department FROM users WHERE id = ? AND role = 'student'",
        [studentId]
      );
      if (studentRows.length === 0) return res.status(404).json({ message: "Student not found" });
      if (studentRows[0].department !== req.user.department)
        return res.status(403).json({ message: "Cannot delete student from another department" });
    }
    // Delete related data first (if no ON DELETE CASCADE on FK)
    await pool.query("DELETE FROM marks       WHERE student_id = ?", [studentId]);
    await pool.query("DELETE FROM attendance  WHERE student_id = ?", [studentId]);
    await pool.query("DELETE FROM ann_replies WHERE user_id    = ?", [studentId]);
    // Delete student
    await pool.query("DELETE FROM users WHERE id = ? AND role = 'student'", [studentId]);
    res.json({ message: "Student and all related data deleted" });
  } catch (error) {
    console.error("Delete Student Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   GET STUDENTS (ADMIN — dept restricted)
==================================================== */
app.get("/students", verifyToken, verifyAdmin, async (req, res) => {
  try {
    let rows;
    if (req.user.role === "superadmin") {
      [rows] = await pool.query(
        "SELECT id, name, rollno, email, department FROM users WHERE role = 'student'"
      );
    } else {
      [rows] = await pool.query(
        "SELECT id, name, rollno, email, department FROM users WHERE role = 'student' AND department = ?",
        [req.user.department]
      );
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   GRADE CALCULATOR HELPER
==================================================== */
function calculateGrade(marks) {
  if (marks >= 91) return { grade: "O",  gradePoints: 10 };
  if (marks >= 81) return { grade: "A+", gradePoints: 9  };
  if (marks >= 71) return { grade: "A",  gradePoints: 8  };
  if (marks >= 61) return { grade: "B+", gradePoints: 7  };
  if (marks >= 56) return { grade: "B",  gradePoints: 6  };
  if (marks >= 51) return { grade: "C",  gradePoints: 5  };
  return               { grade: "F",  gradePoints: 0  };
}

/* ====================================================
   GET SUBJECTS (dept filtered)
==================================================== */
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
      const [userRows] = await pool.query("SELECT department FROM users WHERE id = ?", [req.user.id]);
      const dept = userRows[0]?.department;
      [rows] = await pool.query(
        "SELECT * FROM subjects WHERE department = ? ORDER BY subject_name",
        [dept]
      );
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ADD SUBJECT (admin only)
==================================================== */
app.post("/add-subject", verifyToken, verifyAdmin, async (req, res) => {
  const { subject_name, credits } = req.body;
  if (!subject_name || !credits) return res.status(400).json({ message: "Subject name and credits required" });
  const department = req.user.department;
  if (!department) return res.status(403).json({ message: "Admin has no department assigned" });
  try {
    const [existing] = await pool.query(
      "SELECT id FROM subjects WHERE subject_name = ? AND department = ?",
      [subject_name, department]
    );
    if (existing.length > 0) return res.status(400).json({ message: "Subject already exists in your department" });
    await pool.query(
      "INSERT INTO subjects (subject_name, department, credits) VALUES (?, ?, ?)",
      [subject_name, department, credits]
    );
    res.json({ message: `Subject added to ${department} department` });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ✅ NEW: DELETE SUBJECT (admin only — dept restricted)
==================================================== */
app.delete("/subject/:id", verifyToken, verifyAdmin, async (req, res) => {
  const subjectId = req.params.id;
  try {
    // Verify subject belongs to admin's dept
    if (req.user.role !== "superadmin") {
      const [subRows] = await pool.query("SELECT department FROM subjects WHERE id = ?", [subjectId]);
      if (subRows.length === 0) return res.status(404).json({ message: "Subject not found" });
      if (subRows[0].department !== req.user.department)
        return res.status(403).json({ message: "Cannot delete subject from another department" });
    }
    // Delete marks linked to this subject first
    await pool.query("DELETE FROM marks      WHERE subject_id = ?", [subjectId]);
    await pool.query("DELETE FROM attendance WHERE subject_id = ?", [subjectId]);
    await pool.query("DELETE FROM subjects   WHERE id = ?",         [subjectId]);
    res.json({ message: "Subject and linked marks deleted" });
  } catch (error) {
    console.error("Delete Subject Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ADD MARKS (ADMIN ONLY)
==================================================== */
app.post("/add-marks", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, subject_id, marks_scored, semester } = req.body;
  if (!student_id || !subject_id || marks_scored === undefined || !semester)
    return res.status(400).json({ message: "All fields required" });
  const department = req.user.department;
  const { grade, gradePoints } = calculateGrade(Number(marks_scored));
  try {
    const [subjectRows] = await pool.query("SELECT credits FROM subjects WHERE id = ?", [subject_id]);
    if (subjectRows.length === 0) return res.status(404).json({ message: "Subject not found" });
    const credits = subjectRows[0].credits;

    const [dup] = await pool.query(
      "SELECT id FROM marks WHERE student_id = ? AND subject_id = ? AND semester = ?",
      [student_id, subject_id, semester]
    );
    if (dup.length > 0) return res.status(400).json({ message: "Marks already entered for this subject in this semester" });

    await pool.query(
      `INSERT INTO marks (student_id, subject_id, marks_scored, grade, grade_points, semester, department)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [student_id, subject_id, marks_scored, grade, gradePoints, semester, department]
    );

    const [semMarks] = await pool.query(
      `SELECT m.grade_points, s.credits FROM marks m JOIN subjects s ON m.subject_id = s.id
       WHERE m.student_id = ? AND m.semester = ?`,
      [student_id, semester]
    );
    const totalCredits = semMarks.reduce((sum, r) => sum + r.credits, 0);
    const weightedSum  = semMarks.reduce((sum, r) => sum + (r.grade_points * r.credits), 0);
    const sgpa = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : "0.00";

    res.json({ message: `Marks added — Grade: ${grade}`, grade, gradePoints, sgpa, credits });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ✅ NEW: DELETE MARK ENTRY (admin only)
==================================================== */
app.delete("/mark/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    // If not superadmin, verify the mark belongs to admin's dept
    if (req.user.role !== "superadmin") {
      const [markRows] = await pool.query("SELECT department FROM marks WHERE id = ?", [req.params.id]);
      if (markRows.length === 0) return res.status(404).json({ message: "Mark not found" });
      if (markRows[0].department !== req.user.department)
        return res.status(403).json({ message: "Cannot delete mark from another department" });
    }
    await pool.query("DELETE FROM marks WHERE id = ?", [req.params.id]);
    res.json({ message: "Mark entry deleted" });
  } catch (error) {
    console.error("Delete Mark Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   GET ALL MARKS (ADMIN)
==================================================== */
app.get("/all-marks", verifyToken, verifyAdmin, async (req, res) => {
  try {
    let rows;
    const baseQuery = `
      SELECT m.*, s.subject_name, s.credits, u.name as student_name
      FROM marks m
      JOIN subjects s ON m.subject_id = s.id
      JOIN users u ON m.student_id = u.id
      ORDER BY m.semester, u.name
    `;
    if (req.user.role === "superadmin") {
      [rows] = await pool.query(baseQuery);
    } else {
      [rows] = await pool.query(
        baseQuery.replace("ORDER BY", "WHERE m.department = ? ORDER BY"),
        [req.user.department]
      );
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   GET SINGLE STUDENT
==================================================== */
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

/* ====================================================
   STUDENT MARKS
==================================================== */
app.get("/student-marks/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, s.subject_name, s.credits FROM marks m
       JOIN subjects s ON m.subject_id = s.id
       WHERE m.student_id = ? ORDER BY m.semester`,
      [req.params.id]
    );
    const semesterMap = {};
    for (const row of rows) {
      if (!semesterMap[row.semester]) {
        semesterMap[row.semester] = { subjects: [], totalCredits: 0, weightedSum: 0 };
      }
      semesterMap[row.semester].subjects.push(row);
      semesterMap[row.semester].totalCredits += Number(row.credits);
      semesterMap[row.semester].weightedSum  += Number(row.grade_points) * Number(row.credits);
    }
    const semesters = Object.keys(semesterMap).map((sem) => {
      const { subjects, totalCredits, weightedSum } = semesterMap[sem];
      const sgpa = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : "0.00";
      return { semester: sem, sgpa, subjects };
    });
    const allCredits  = rows.reduce((sum, r) => sum + Number(r.credits), 0);
    const allWeighted = rows.reduce((sum, r) => sum + Number(r.grade_points) * Number(r.credits), 0);
    const cgpa = allCredits > 0 ? (allWeighted / allCredits).toFixed(2) : "0.00";
    res.json({ semesters, cgpa });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ✅ UPDATED: STUDENT ATTENDANCE
   Now returns present_days, total_days, attendance_percentage
==================================================== */
app.get("/student-attendance/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, s.subject_name
       FROM attendance a
       JOIN subjects s ON a.subject_id = s.id
       WHERE a.student_id = ?
       ORDER BY a.semester, s.subject_name`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ✅ NEW: ADD / UPDATE ATTENDANCE (Admin)
   Calculates percentage from present_days / total_days
==================================================== */
app.post("/add-attendance", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, subject_id, semester, present_days, total_days } = req.body;
  if (!student_id || !subject_id || !semester || present_days === undefined || !total_days)
    return res.status(400).json({ message: "All fields required" });

  const p = Number(present_days), t = Number(total_days);
  if (p < 0 || t <= 0)  return res.status(400).json({ message: "Invalid days values" });
  if (p > t)            return res.status(400).json({ message: "Present days cannot exceed total days" });

  const attendance_percentage = parseFloat(((p / t) * 100).toFixed(2));

  try {
    // UPSERT: update if record already exists for same student+subject+semester
    await pool.query(
      `INSERT INTO attendance
         (student_id, subject_id, semester, present_days, total_days, attendance_percentage)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         present_days = VALUES(present_days),
         total_days   = VALUES(total_days),
         attendance_percentage = VALUES(attendance_percentage)`,
      [student_id, subject_id, semester, p, t, attendance_percentage]
    );
    res.json({ message: "Attendance saved", attendance_percentage });
  } catch (error) {
    console.error("Add Attendance Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ✅ NEW: GET ATTENDANCE LIST (for Admin dashboard table)
==================================================== */
app.get("/attendance-list", verifyToken, verifyAdmin, async (req, res) => {
  try {
    let rows;
    const baseQuery = `
      SELECT a.*, s.subject_name, u.name as student_name, u.rollno
      FROM attendance a
      JOIN subjects s ON a.subject_id = s.id
      JOIN users u ON a.student_id = u.id
      ORDER BY a.semester, u.name
    `;
    if (req.user.role === "superadmin") {
      [rows] = await pool.query(baseQuery);
    } else {
      [rows] = await pool.query(
        baseQuery.replace("ORDER BY", "WHERE u.department = ? ORDER BY"),
        [req.user.department]
      );
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


/* ====================================================
   EFFICIENCY SCORE — ADD TO server.js
   Paste these routes BEFORE app.listen(5000, ...)
==================================================== */

/* ── Activity type points map ── */
const ACTIVITY_POINTS = {
  Club: 10, Workshop: 15, NSS: 20, NCC: 25,
  Sports: 15, Leadership: 20, Volunteering: 15,
};
const MAX_ACTIVITY_POINTS = 100;
const MAX_ACHIEVEMENT_POINTS = 100;

/* ====================================================
   SET STUDENT SKILL LEVEL (Admin)
==================================================== */
app.post("/admin/student-skill", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, skill_level } = req.body;
  const validLevels = { Beginner: 25, Intermediate: 50, Advanced: 75, Expert: 100 };
  if (!student_id || !skill_level || !validLevels[skill_level])
    return res.status(400).json({ message: "student_id and valid skill_level required (Beginner/Intermediate/Advanced/Expert)" });
  const skill_score = validLevels[skill_level];
  try {
    await pool.query(
      `INSERT INTO student_skills (student_id, skill_level, skill_score)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE skill_level = VALUES(skill_level), skill_score = VALUES(skill_score)`,
      [student_id, skill_level, skill_score]
    );
    res.json({ message: "Skill level saved", skill_score });
  } catch (error) {
    console.error("Skill error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ADD STUDENT ACTIVITY (Admin)
==================================================== */
app.post("/admin/student-activity", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, activity_type, description } = req.body;
  if (!student_id || !activity_type || !ACTIVITY_POINTS[activity_type])
    return res.status(400).json({ message: "student_id and valid activity_type required" });
  const points = ACTIVITY_POINTS[activity_type];
  try {
    await pool.query(
      `INSERT INTO student_activities (student_id, activity_type, points, description, added_by)
       VALUES (?, ?, ?, ?, ?)`,
      [student_id, activity_type, points, description || "", req.user.id]
    );
    res.json({ message: `Activity '${activity_type}' added (${points} pts)`, points });
  } catch (error) {
    console.error("Activity error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   DELETE STUDENT ACTIVITY (Admin)
==================================================== */
app.delete("/admin/student-activity/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM student_activities WHERE id = ?", [req.params.id]);
    res.json({ message: "Activity deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ADD STUDENT ACHIEVEMENT (Admin)
==================================================== */
app.post("/admin/student-achievement", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, achievement_name, points } = req.body;
  if (!student_id || !achievement_name || points === undefined)
    return res.status(400).json({ message: "All fields required" });
  try {
    await pool.query(
      `INSERT INTO student_achievements (student_id, achievement_name, points)
       VALUES (?, ?, ?)`,
      [student_id, achievement_name, Number(points)]
    );
    res.json({ message: "Achievement added" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   DELETE STUDENT ACHIEVEMENT (Admin)
==================================================== */
app.delete("/admin/student-achievement/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM student_achievements WHERE id = ?", [req.params.id]);
    res.json({ message: "Achievement deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   GET STUDENT SKILLS / ACTIVITIES / ACHIEVEMENTS (Admin)
==================================================== */
app.get("/admin/student-efficiency-data/:studentId", verifyToken, verifyAdmin, async (req, res) => {
  const { studentId } = req.params;
  try {
    const [skillRows]       = await pool.query("SELECT * FROM student_skills       WHERE student_id = ?", [studentId]);
    const [activityRows]    = await pool.query("SELECT * FROM student_activities   WHERE student_id = ? ORDER BY created_at DESC", [studentId]);
    const [achievementRows] = await pool.query("SELECT * FROM student_achievements WHERE student_id = ? ORDER BY created_at DESC", [studentId]);
    res.json({
      skill:        skillRows[0] || null,
      activities:   activityRows,
      achievements: achievementRows,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   CALCULATE EFFICIENCY SCORE (Admin or Student — own)
==================================================== */
app.get("/efficiency/:studentId", verifyToken, async (req, res) => {
  const { studentId } = req.params;

  // Students can only fetch their own score
  if (req.user.role === "student" && String(req.user.id) !== String(studentId))
    return res.status(403).json({ message: "Access denied" });

  try {
    /* 1. Skill score */
    const [skillRows] = await pool.query(
      "SELECT skill_score FROM student_skills WHERE student_id = ?",
      [studentId]
    );
    const skillScore = skillRows.length > 0 ? Number(skillRows[0].skill_score) : 0;

    /* 2. Achievement score */
    const [achRows] = await pool.query(
      "SELECT SUM(points) as total FROM student_achievements WHERE student_id = ?",
      [studentId]
    );
    const totalAchPoints = Number(achRows[0]?.total || 0);
    const achievementScore = Math.min((totalAchPoints / MAX_ACHIEVEMENT_POINTS) * 100, 100);

    /* 3. Activity score */
    const [actRows] = await pool.query(
      "SELECT SUM(points) as total FROM student_activities WHERE student_id = ?",
      [studentId]
    );
    const totalActPoints = Number(actRows[0]?.total || 0);
    const activityScore = Math.min((totalActPoints / MAX_ACTIVITY_POINTS) * 100, 100);

    /* 4. SGPA score — use latest CGPA × 10 */
    const [marksRows] = await pool.query(
      `SELECT m.grade_points, s.credits FROM marks m
       JOIN subjects s ON m.subject_id = s.id
       WHERE m.student_id = ?`,
      [studentId]
    );
    const allCredits  = marksRows.reduce((sum, r) => sum + Number(r.credits), 0);
    const allWeighted = marksRows.reduce((sum, r) => sum + Number(r.grade_points) * Number(r.credits), 0);
    const cgpa        = allCredits > 0 ? allWeighted / allCredits : 0;
    const sgpaScore   = Math.min(cgpa * 10, 100);

    /* 5. Final weighted score */
    const finalScore = (
      skillScore       * 0.30 +
      achievementScore * 0.20 +
      activityScore    * 0.20 +
      sgpaScore        * 0.30
    );

    /* 6. Band */
    const band =
      finalScore >= 80 ? "Excellent" :
      finalScore >= 60 ? "Good"      :
      finalScore >= 40 ? "Needs Improvement" :
                         "Weak";

    res.json({
      studentId,
      skillScore:       Math.round(skillScore),
      achievementScore: Math.round(achievementScore),
      activityScore:    Math.round(activityScore),
      sgpaScore:        Math.round(sgpaScore),
      finalScore:       Math.round(finalScore * 10) / 10,
      band,
      cgpa:             cgpa.toFixed(2),
      totalAchPoints,
      totalActPoints,
    });
  } catch (error) {
    console.error("Efficiency error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
/* ====================================================
   START SERVER
==================================================== */
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});