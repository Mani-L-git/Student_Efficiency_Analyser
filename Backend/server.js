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
  const { subject_name, credits, semester } = req.body;
  if (!subject_name || !credits) return res.status(400).json({ message: "Subject name and credits required" });
  const sem = semester || "Sem 1";
  const department = req.user.department;
  if (!department) return res.status(403).json({ message: "Admin has no department assigned" });
  try {
    const [existing] = await pool.query(
      "SELECT id FROM subjects WHERE subject_name = ? AND department = ?",
      [subject_name, department]
    );
    if (existing.length > 0) return res.status(400).json({ message: "Subject already exists in your department" });
    await pool.query(
      "INSERT INTO subjects (subject_name, department, credits, semester) VALUES (?, ?, ?, ?)",
      [subject_name, department, credits, sem]
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
      `SELECT a.id, a.student_id, a.semester,
              a.present_days, a.total_days, a.attendance_percentage
       FROM attendance a
       WHERE a.student_id = ?
       ORDER BY a.semester`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error("student-attendance error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   ✅ NEW: ADD / UPDATE ATTENDANCE (Admin)
   Calculates percentage from present_days / total_days
==================================================== */
app.post("/add-attendance", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, semester, present_days, total_days } = req.body;
  if (!student_id || !semester || present_days === undefined || !total_days)
    return res.status(400).json({ message: "student_id, semester, present_days, total_days required" });

  const p = Number(present_days), t = Number(total_days);
  if (p < 0 || t <= 0)  return res.status(400).json({ message: "Invalid days values" });
  if (p > t)            return res.status(400).json({ message: "Present days cannot exceed total days" });

  const attendance_percentage = parseFloat(((p / t) * 100).toFixed(2));

  try {
    // UPSERT: update if record already exists for same student+semester
    await pool.query(
      `INSERT INTO attendance
         (student_id, semester, present_days, total_days, attendance_percentage)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         present_days = VALUES(present_days),
         total_days   = VALUES(total_days),
         attendance_percentage = VALUES(attendance_percentage)`,
      [student_id, semester, p, t, attendance_percentage]
    );
    res.json({ message: "Attendance saved", attendance_percentage });
  } catch (error) {
    console.error("Add Attendance Error:", error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
});

/* ====================================================
   ✅ NEW: GET ATTENDANCE LIST (for Admin dashboard table)
==================================================== */
app.get("/attendance-list", verifyToken, verifyAdmin, async (req, res) => {
  try {
    let rows;
    const baseQuery = `
      SELECT a.id, a.student_id, a.semester,
             a.present_days, a.total_days, a.attendance_percentage,
             u.name as student_name, u.rollno, u.department
      FROM attendance a
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
    console.error("attendance-list error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   FIX #1: EFFICIENCY SCORE — Peer-normalized formula
   SkillScore   = (studentSkills / maxSkillsAmongStudents) × 100
   AchievScore  = (studentAch   / maxAchAmongStudents)    × 100
   ActivityScore= (studentAct   / maxActAmongStudents)    × 100
   CGPAScore    = (cgpa / 10) × 100
==================================================== */
const ACTIVITY_POINTS = {
  Club: 10, Workshop: 15, NSS: 20, NCC: 25,
  Sports: 15, Leadership: 20, Volunteering: 15,
};

app.get("/efficiency/:studentId", verifyToken, async (req, res) => {
  const { studentId } = req.params;
  if (req.user.role === "student" && String(req.user.id) !== String(studentId))
    return res.status(403).json({ message: "Access denied" });

  try {
    /* ── Get student's department ── */
    const [stuRows] = await pool.query("SELECT department FROM users WHERE id = ?", [studentId]);
    const myDept    = stuRows[0]?.department || "";

    /* ── All students list for percentile ── */
    const [allStudents] = await pool.query("SELECT id, department FROM users WHERE role='student'");
    const deptStudents  = allStudents.filter(s => s.department === myDept);
    const allIds        = allStudents.map(s => s.id);
    const deptIds       = deptStudents.map(s => s.id);

    /* ── Helper: what % of OTHER students does this student beat ── */
    const percentile = (myVal, allVals) => {
      if (allVals.length <= 1) return 100; // only one student = top of class
      const others = allVals.filter(v => Number(v) !== Number(myVal));
      if (others.length === 0) return 100;
      const below = allVals.filter(v => Number(v) < Number(myVal)).length;
      return Math.round((below / (allVals.length - 1)) * 100);
    };

    /* ── 1. Skills ── */
    const [allSkillRows] = await pool.query("SELECT student_id, skill_score FROM student_skills");
    const skillMap       = Object.fromEntries(allSkillRows.map(r => [String(r.student_id), Number(r.skill_score)]));
    const mySkillRaw     = skillMap[String(studentId)] || 0;
    const maxSkill       = allSkillRows.length > 0 ? Math.max(...allSkillRows.map(r => Number(r.skill_score))) : 100;
    const skillScore     = maxSkill > 0 ? (mySkillRaw / maxSkill) * 100 : 0;
    const skillAllVals   = allIds.map(id => skillMap[String(id)] || 0);
    const skillDeptVals  = deptIds.map(id => skillMap[String(id)] || 0);

    /* ── 2. Achievements ── */
    const [allAchRows] = await pool.query("SELECT student_id, SUM(points) as total FROM student_achievements GROUP BY student_id");
    const achMap       = Object.fromEntries(allAchRows.map(r => [String(r.student_id), Number(r.total || 0)]));
    const myAchRaw     = achMap[String(studentId)] || 0;
    const maxAch       = allAchRows.length > 0 ? Math.max(...allAchRows.map(r => Number(r.total || 0))) : 1;
    const achievementScore = maxAch > 0 ? (myAchRaw / maxAch) * 100 : 0;
    const achAllVals   = allIds.map(id => achMap[String(id)] || 0);
    const achDeptVals  = deptIds.map(id => achMap[String(id)] || 0);

    /* ── 3. Activities ── */
    const [allActRows] = await pool.query("SELECT student_id, SUM(points) as total FROM student_activities GROUP BY student_id");
    const actMap       = Object.fromEntries(allActRows.map(r => [String(r.student_id), Number(r.total || 0)]));
    const myActRaw     = actMap[String(studentId)] || 0;
    const maxAct       = allActRows.length > 0 ? Math.max(...allActRows.map(r => Number(r.total || 0))) : 1;
    const activityScore = maxAct > 0 ? (myActRaw / maxAct) * 100 : 0;
    const actAllVals   = allIds.map(id => actMap[String(id)] || 0);
    const actDeptVals  = deptIds.map(id => actMap[String(id)] || 0);

    /* ── 4. CGPA ── */
    const [marksAll] = await pool.query(
      `SELECT m.student_id, m.grade_points, s.credits FROM marks m JOIN subjects s ON m.subject_id=s.id`
    );
    const cgpaMapRaw = {};
    for (const r of marksAll) {
      const key = String(r.student_id);
      if (!cgpaMapRaw[key]) cgpaMapRaw[key] = { w: 0, c: 0 };
      cgpaMapRaw[key].w += Number(r.grade_points) * Number(r.credits);
      cgpaMapRaw[key].c += Number(r.credits);
    }
    const cgpaMap = cgpaMapRaw; // String-keyed
    const myCgpaData  = cgpaMap[String(studentId)];
    const cgpa        = myCgpaData && myCgpaData.c > 0 ? myCgpaData.w / myCgpaData.c : 0;
    const cgpaScore   = Math.min((cgpa / 10) * 100, 100);
    const cgpaAllVals  = allIds.map(id => { const d=cgpaMap[String(id)]; return d&&d.c>0?d.w/d.c:0; });
    const cgpaDeptVals = deptIds.map(id => { const d=cgpaMap[String(id)]; return d&&d.c>0?d.w/d.c:0; });

    /* ── 5. Final score + overall rank ── */
    const finalScore = (skillScore*0.30)+(achievementScore*0.20)+(activityScore*0.20)+(cgpaScore*0.30);
    const band = finalScore>=80?"Excellent":finalScore>=60?"Good":finalScore>=40?"Needs Improvement":"Weak";

    /* Final scores for all students (for overall + dept rank) */
    const calcFinal = (id) => {
      const sid = String(id);
      const sk = maxSkill>0?((skillMap[sid]||0)/maxSkill)*100:0;
      const ac = maxAch>0?((achMap[sid]||0)/maxAch)*100:0;
      const at = maxAct>0?((actMap[sid]||0)/maxAct)*100:0;
      const cd = cgpaMap[sid]; const cg = cd&&cd.c>0?Math.min((cd.w/cd.c/10)*100,100):0;
      return sk*0.30 + ac*0.20 + at*0.20 + cg*0.30;
    };
    const allFinalScores  = allIds.map(id => calcFinal(id));
    const deptFinalScores = deptIds.map(id => calcFinal(id));

    const overallRank = allFinalScores.filter(s => s > finalScore).length + 1;
    const deptRank    = deptFinalScores.filter(s => s > finalScore).length + 1;

    res.json({
      studentId, department: myDept,
      skillScore:       Math.round(skillScore),
      achievementScore: Math.round(achievementScore),
      activityScore:    Math.round(activityScore),
      cgpaScore:        Math.round(cgpaScore),
      finalScore:       Math.round(finalScore * 10) / 10,
      band, cgpa: cgpa.toFixed(2),

      /* Dept percentiles */
      deptPercentile: {
        skill:       percentile(mySkillRaw,  skillDeptVals),
        achievement: percentile(myAchRaw,    achDeptVals),
        activity:    percentile(myActRaw,    actDeptVals),
        cgpa:        percentile(cgpa,        cgpaDeptVals),
        overall:     percentile(finalScore,  deptFinalScores),
      },
      /* Overall percentiles */
      allPercentile: {
        skill:       percentile(mySkillRaw,  skillAllVals),
        achievement: percentile(myAchRaw,    achAllVals),
        activity:    percentile(myActRaw,    actAllVals),
        cgpa:        percentile(cgpa,        cgpaAllVals),
        overall:     percentile(finalScore,  allFinalScores),
      },
      /* Ranks */
      deptRank, deptTotal: deptIds.length,
      overallRank, overallTotal: allIds.length,
    });
  } catch (error) {
    console.error("Efficiency error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   FIX #1b: ALL students efficiency — for Admin dashboard table (#8)
   & dept average — for SuperAdmin (#9)
==================================================== */
app.get("/admin/all-efficiency", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [allStudents] = await pool.query("SELECT id, name, rollno, department FROM users WHERE role='student'");
    let displayStudents = req.user.role === "superadmin"
      ? allStudents
      : allStudents.filter(s => s.department === req.user.department);

    const [allSkills] = await pool.query("SELECT student_id, skill_score FROM student_skills");
    const [allAch]    = await pool.query("SELECT student_id, SUM(points) as total FROM student_achievements GROUP BY student_id");
    const [allAct]    = await pool.query("SELECT student_id, SUM(points) as total FROM student_activities GROUP BY student_id");
    const maxSkill = allSkills.length > 0 ? Math.max(...allSkills.map(r => Number(r.skill_score))) : 100;
    const maxAch   = allAch.length   > 0 ? Math.max(...allAch.map(r => Number(r.total || 0)))   : 1;
    const maxAct   = allAct.length   > 0 ? Math.max(...allAct.map(r => Number(r.total || 0)))   : 1;
    const skillMap = Object.fromEntries(allSkills.map(r => [String(r.student_id), Number(r.skill_score)]));
    const achMap   = Object.fromEntries(allAch.map(r => [String(r.student_id), Number(r.total || 0)]));
    const actMap   = Object.fromEntries(allAct.map(r => [String(r.student_id), Number(r.total || 0)]));

    const [marksAll] = await pool.query(
      `SELECT m.student_id, m.grade_points, s.credits FROM marks m JOIN subjects s ON m.subject_id=s.id`
    );
    const cgpaMap = {};
    for (const r of marksAll) {
      if (!cgpaMap[r.student_id]) cgpaMap[r.student_id] = { weighted: 0, credits: 0 };
      cgpaMap[r.student_id].weighted += Number(r.grade_points) * Number(r.credits);
      cgpaMap[r.student_id].credits  += Number(r.credits);
    }

    const calcScore = id => {
      const sk = maxSkill>0?((skillMap[String(id)]||0)/maxSkill)*100:0;
      const ac = maxAch>0?((achMap[String(id)]||0)/maxAch)*100:0;
      const at = maxAct>0?((actMap[String(id)]||0)/maxAct)*100:0;
      const cd = cgpaMap[id]; const cg = cd&&cd.credits>0?Math.min((cd.weighted/cd.credits/10)*100,100):0;
      return { sk, ac, at, cg, final: sk*0.30+ac*0.20+at*0.20+cg*0.30 };
    };

    /* Pre-compute all scores for ranking */
    const allScoreMap  = Object.fromEntries(allStudents.map(s => [s.id, calcScore(s.id).final]));

    const results = displayStudents.map(s => {
      const { sk, ac, at, cg, final } = calcScore(s.id);
      const cd   = cgpaMap[s.id];
      const cgpa = cd && cd.credits > 0 ? cd.weighted / cd.credits : 0;
      const band = final>=80?"Excellent":final>=60?"Good":final>=40?"Needs Improvement":"Weak";

      /* Dept students */
      const deptStudentIds = allStudents.filter(x => x.department === s.department).map(x => x.id);

      /* Overall rank & dept rank */
      const overallRank = Object.values(allScoreMap).filter(v => v > final).length + 1;
      const deptRank    = deptStudentIds.filter(id => (allScoreMap[id]||0) > final).length + 1;

      /* Percentile helper */
      const pct = (myVal, ids, map) => {
        const vals = ids.map(id => map[String(id)]||0);
        if (!vals.length) return 0;
        return Math.round((vals.filter(v => v < myVal).length / vals.length) * 100);
      };

      return {
        id: s.id, name: s.name, rollno: s.rollno, department: s.department,
        skillScore: Math.round(sk), achievementScore: Math.round(ac),
        activityScore: Math.round(at), cgpaScore: Math.round(cg),
        finalScore: Math.round(final * 10) / 10,
        cgpa: cgpa.toFixed(2), band,
        overallRank, overallTotal: allStudents.length,
        deptRank,    deptTotal: deptStudentIds.length,
        deptPercentile: {
          skill:   pct(skillMap[String(s.id)]||0, deptStudentIds, skillMap),
          achievement: pct(achMap[String(s.id)]||0, deptStudentIds, achMap),
          activity: pct(actMap[String(s.id)]||0, deptStudentIds, actMap),
          overall:  Math.round((deptStudentIds.filter(id=>(allScoreMap[id]||0)<final).length/deptStudentIds.length)*100),
        },
        allPercentile: {
          skill:   pct(skillMap[String(s.id)]||0, allStudents.map(x=>x.id), skillMap),
          achievement: pct(achMap[String(s.id)]||0, allStudents.map(x=>x.id), achMap),
          activity: pct(actMap[String(s.id)]||0, allStudents.map(x=>x.id), actMap),
          overall:  Math.round((Object.values(allScoreMap).filter(v=>v<final).length/allStudents.length)*100),
        },
      };
    });

    /* Sort by finalScore descending */
    results.sort((a, b) => b.finalScore - a.finalScore);
    res.json(results);
  } catch (err) {
    console.error("All efficiency error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   FIX #4: ROLL NO AUTOCOMPLETE SUGGESTIONS
==================================================== */
app.get("/students/search", verifyToken, verifyAdmin, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);
  try {
    let rows;
    if (req.user.role === "superadmin") {
      [rows] = await pool.query(
        "SELECT id, name, rollno FROM users WHERE role='student' AND rollno LIKE ? LIMIT 8",
        [`${q.trim()}%`]
      );
    } else {
      [rows] = await pool.query(
        "SELECT id, name, rollno FROM users WHERE role='student' AND department=? AND rollno LIKE ? LIMIT 8",
        [req.user.department, `${q.trim()}%`]
      );
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   FIX #5: SUBJECTS BY SEMESTER
==================================================== */
app.get("/subjects-by-sem", verifyToken, async (req, res) => {
  try {
    let rows;
    if (req.user.role === "superadmin") {
      [rows] = await pool.query("SELECT * FROM subjects ORDER BY semester, subject_name");
    } else if (req.user.role === "admin") {
      [rows] = await pool.query("SELECT * FROM subjects WHERE department=? ORDER BY semester, subject_name", [req.user.department]);
    } else {
      const [u] = await pool.query("SELECT department FROM users WHERE id=?", [req.user.id]);
      [rows] = await pool.query("SELECT * FROM subjects WHERE department=? ORDER BY semester, subject_name", [u[0]?.department]);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   FIX #6: CHANGE PASSWORD
==================================================== */
app.put("/change-password", verifyToken, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ message: "Both fields required" });
  if (new_password.length < 4)
    return res.status(400).json({ message: "New password must be at least 4 characters" });
  try {
    const [rows] = await pool.query("SELECT password FROM users WHERE id=?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    if (rows[0].password !== current_password)
      return res.status(400).json({ message: "Current password is incorrect" });
    await pool.query("UPDATE users SET password=? WHERE id=?", [new_password, req.user.id]);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   FIX #9: AVG EFFICIENCY PER DEPARTMENT (SuperAdmin)
==================================================== */
app.get("/superadmin/dept-efficiency", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const [students] = await pool.query("SELECT id, department FROM users WHERE role='student'");
    const [allSkills] = await pool.query("SELECT student_id, skill_score FROM student_skills");
    const [allAch]    = await pool.query("SELECT student_id, SUM(points) as total FROM student_achievements GROUP BY student_id");
    const [allAct]    = await pool.query("SELECT student_id, SUM(points) as total FROM student_activities GROUP BY student_id");
    const [marksAll]  = await pool.query(`SELECT m.student_id, m.grade_points, s.credits FROM marks m JOIN subjects s ON m.subject_id=s.id`);

    const maxSkill = allSkills.length > 0 ? Math.max(...allSkills.map(r => Number(r.skill_score))) : 100;
    const maxAch   = allAch.length > 0 ? Math.max(...allAch.map(r => Number(r.total || 0))) : 1;
    const maxAct   = allAct.length > 0 ? Math.max(...allAct.map(r => Number(r.total || 0))) : 1;
    const skillMap = Object.fromEntries(allSkills.map(r => [r.student_id, Number(r.skill_score)]));
    const achMap   = Object.fromEntries(allAch.map(r => [r.student_id, Number(r.total || 0)]));
    const actMap   = Object.fromEntries(allAct.map(r => [r.student_id, Number(r.total || 0)]));
    const cgpaMap  = {};
    for (const r of marksAll) {
      if (!cgpaMap[r.student_id]) cgpaMap[r.student_id] = { w: 0, c: 0 };
      cgpaMap[r.student_id].w += Number(r.grade_points) * Number(r.credits);
      cgpaMap[r.student_id].c += Number(r.credits);
    }

    const deptMap = {};
    for (const s of students) {
      const dept = s.department;
      if (!deptMap[dept]) deptMap[dept] = { total: 0, count: 0 };
      const skillScore = maxSkill > 0 ? ((skillMap[s.id] || 0) / maxSkill) * 100 : 0;
      const achScore   = maxAch   > 0 ? ((achMap[s.id]   || 0) / maxAch)   * 100 : 0;
      const actScore   = maxAct   > 0 ? ((actMap[s.id]   || 0) / maxAct)   * 100 : 0;
      const cd = cgpaMap[s.id];
      const cgpa = cd && cd.c > 0 ? cd.w / cd.c : 0;
      const cgpaScore = Math.min((cgpa / 10) * 100, 100);
      const score = (skillScore * 0.30) + (achScore * 0.20) + (actScore * 0.20) + (cgpaScore * 0.30);
      deptMap[dept].total += score;
      deptMap[dept].count += 1;
    }

    const result = Object.entries(deptMap).map(([dept, { total, count }]) => ({
      department: dept,
      avgEfficiency: Math.round((total / count) * 10) / 10,
      studentCount: count,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   FIX #10: TOTAL MARKS ENTRIES COUNT
   Count = 1 per student per semester (all subjects entered)
==================================================== */
app.get("/superadmin/marks-entries-count", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    // Count distinct (student_id, semester) pairs = 1 complete entry per student per sem
    const [rows] = await pool.query(
      `SELECT department, COUNT(DISTINCT CONCAT(student_id,'-',semester)) as count
       FROM marks GROUP BY department`
    );
    const [[{total}]] = await pool.query(
      `SELECT COUNT(DISTINCT CONCAT(student_id,'-',semester)) as total FROM marks`
    );
    res.json({ byDept: rows, total });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ====================================================
   FIX: Skills / Activities / Achievements input (Admin)
==================================================== */
app.post("/admin/student-skill", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, skill_level, skill_score } = req.body;
  if (!student_id || !skill_level || skill_score === undefined)
    return res.status(400).json({ message: "student_id, skill_level, skill_score required" });
  const pts = Number(skill_score);
  if (isNaN(pts) || pts < 0) return res.status(400).json({ message: "Invalid points" });
  try {
    await pool.query(
      `INSERT INTO student_skills (student_id, skill_level, skill_score)
       VALUES (?,?,?) ON DUPLICATE KEY UPDATE skill_level=VALUES(skill_level), skill_score=VALUES(skill_score)`,
      [student_id, skill_level, pts]
    );
    res.json({ message: "Skill saved", skill_score: pts });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* Edit activity */
app.put("/admin/student-activity/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { activity_type, description, points } = req.body;
  if (!activity_type || points === undefined) return res.status(400).json({ message: "activity_type and points required" });
  try {
    await pool.query(
      `UPDATE student_activities SET activity_type=?, description=?, points=? WHERE id=?`,
      [activity_type, description || "", Number(points), req.params.id]
    );
    res.json({ message: "Activity updated" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

app.post("/admin/student-activity", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, activity_type, description, points } = req.body;
  if (!student_id || !activity_type) return res.status(400).json({ message: "student_id and activity_type required" });
  const pts = points !== undefined ? Number(points) : (ACTIVITY_POINTS[activity_type] || 10);
  try {
    await pool.query(
      `INSERT INTO student_activities (student_id, activity_type, points, description, added_by)
       VALUES (?,?,?,?,?)`,
      [student_id, activity_type, pts, description || "", req.user.id]
    );
    res.json({ message: `Activity '${activity_type}' added (${pts} pts)`, points: pts });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

app.delete("/admin/student-activity/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM student_activities WHERE id=?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* Edit achievement */
app.put("/admin/student-achievement/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { achievement_name, points } = req.body;
  if (!achievement_name || points === undefined) return res.status(400).json({ message: "achievement_name and points required" });
  try {
    await pool.query(
      `UPDATE student_achievements SET achievement_name=?, points=? WHERE id=?`,
      [achievement_name, Number(points), req.params.id]
    );
    res.json({ message: "Achievement updated" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

app.post("/admin/student-achievement", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, achievement_name, points } = req.body;
  if (!student_id || !achievement_name || points === undefined)
    return res.status(400).json({ message: "All fields required" });
  try {
    await pool.query(
      `INSERT INTO student_achievements (student_id, achievement_name, points) VALUES (?,?,?)`,
      [student_id, achievement_name, Number(points)]
    );
    res.json({ message: "Achievement added" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

app.delete("/admin/student-achievement/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM student_achievements WHERE id=?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

app.get("/admin/student-efficiency-data/:studentId", verifyToken, verifyAdmin, async (req, res) => {
  const { studentId } = req.params;
  try {
    const [skillRows]   = await pool.query("SELECT * FROM student_skills WHERE student_id=?", [studentId]);
    const [actRows]     = await pool.query("SELECT * FROM student_activities WHERE student_id=? ORDER BY created_at DESC", [studentId]);
    const [achRows]     = await pool.query("SELECT * FROM student_achievements WHERE student_id=? ORDER BY created_at DESC", [studentId]);
    res.json({ skill: skillRows[0] || null, activities: actRows, achievements: achRows });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* ====================================================
   FIX: SQL ALTER for subjects.semester column (run once)
   (subjects table needs a semester column for fix #5)
   ALTER TABLE subjects ADD COLUMN IF NOT EXISTS semester VARCHAR(20) DEFAULT 'Sem 1';
==================================================== */

/* ====================================================
   START SERVER
==================================================== */
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});