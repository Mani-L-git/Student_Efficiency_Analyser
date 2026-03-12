const express = require("express");
const cors    = require("cors");
const jwt     = require("jsonwebtoken");
const helmet  = require("helmet");
const morgan  = require("morgan");
const fs      = require("fs");
const path    = require("path");
require("dotenv").config();

const pool = require("./src/config/config");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
const accessLogStream = fs.createWriteStream(path.join(logDir, "access.log"), { flags: "a" });
app.use(morgan("dev"));
app.use(morgan("combined", { stream: accessLogStream }));

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.use((req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
    }
  }
  next();
});

const SECRET_KEY = process.env.JWT_SECRET || "manikandan_secret_key";

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(403).json({ message: "Token missing or malformed" });
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function verifyAdmin(req, res, next) {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin"))
    return res.status(403).json({ message: "Admin access required" });
  next();
}

function verifySuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== "superadmin")
    return res.status(403).json({ message: "Super Admin access required" });
  next();
}

/* ── verifyFaculty: allows admin, superadmin, AND faculty ── */
function verifyFaculty(req, res, next) {
  if (!req.user || !["admin","superadmin","faculty"].includes(req.user.role))
    return res.status(403).json({ message: "Faculty/Admin access required" });
  next();
}

function validate(fields) {
  return (req, res, next) => {
    const missing = [];
    for (const [key, type] of Object.entries(fields)) {
      const val = req.body[key];
      if (val === undefined || val === null || val === "") { missing.push(key); continue; }
      if (type === "number" && isNaN(Number(val)))
        return res.status(400).json({ message: `'${key}' must be a number` });
    }
    if (missing.length > 0)
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    next();
  };
}

const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function errorHandler(err, req, res, _next) {
  const entry = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} — ${err.message}\n${err.stack}\n\n`;
  fs.appendFileSync(path.join(__dirname, "logs", "error.log"), entry);
  console.error("❌ Unhandled error:", err.message);
  res.status(500).json({ message: "Internal server error" });
}

/* ═══════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════ */
app.post("/login", validate({ email:"string", password:"string" }), async (req, res) => {
  const { email, password } = req.body;
  if (!isEmail(email)) return res.status(400).json({ message: "Invalid email format" });
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(400).json({ message: "User not found" });
    const user = rows[0];
    if (password !== user.password) return res.status(400).json({ message: "Wrong password" });
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, department: user.department },
      SECRET_KEY, { expiresIn: "8h" }
    );
    res.json({ token, role: user.role, id: user.id, name: user.name, department: user.department });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ═══════════════════════════════════════════════
   SUPERADMIN — DEPARTMENTS
═══════════════════════════════════════════════ */
app.get("/superadmin/departments", verifyToken, verifySuperAdmin, async (req, res) => {
  try { const [r] = await pool.query("SELECT * FROM departments ORDER BY name ASC"); res.json(r); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/superadmin/department", verifyToken, verifySuperAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: "Department name required" });
  const deptName = name.trim().toUpperCase();
  try {
    const [ex] = await pool.query("SELECT id FROM departments WHERE name = ?", [deptName]);
    if (ex.length > 0) return res.status(400).json({ message: "Department already exists" });
    await pool.query("INSERT INTO departments (name) VALUES (?)", [deptName]);
    res.json({ message: `Department '${deptName}' added successfully` });
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/superadmin/department/:name", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM departments WHERE name = ?", [req.params.name.toUpperCase()]);
    res.json({ message: "Department removed" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

/* ═══════════════════════════════════════════════
   SUPERADMIN — ADMINS
═══════════════════════════════════════════════ */
app.post("/superadmin/add-admin", verifyToken, verifySuperAdmin,
  validate({ name:"string", email:"string", password:"string", department:"string" }),
  async (req, res) => {
  const { name, email, password, department } = req.body;
  if (!isEmail(email)) return res.status(400).json({ message: "Invalid email format" });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
  try {
    const [dr] = await pool.query("SELECT name FROM departments WHERE name = ?", [department]);
    if (!dr.length) return res.status(400).json({ message: "Invalid department." });
    const [ex] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (ex.length) return res.status(400).json({ message: "Email already exists" });
    await pool.query("INSERT INTO users (name,email,password,role,department) VALUES (?,?,?,'admin',?)", [name,email,password,department]);
    res.json({ message: `Admin (${department}) added successfully` });
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.get("/superadmin/admins", verifyToken, verifySuperAdmin, async (req, res) => {
  try { const [r] = await pool.query("SELECT id,name,email,department,created_at FROM users WHERE role='admin'"); res.json(r); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/superadmin/admin/:id", verifyToken, verifySuperAdmin, async (req, res) => {
  try { await pool.query("DELETE FROM users WHERE id=? AND role='admin'", [req.params.id]); res.json({ message: "Admin removed" }); }
  catch { res.status(500).json({ message: "Server error" }); }
});

/* ═══════════════════════════════════════════════
   SUPERADMIN — STATS
═══════════════════════════════════════════════ */
app.get("/superadmin/stats", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const [[{ totalStudents }]] = await pool.query("SELECT COUNT(*) as totalStudents FROM users WHERE role='student'");
    const [[{ totalAdmins }]]   = await pool.query("SELECT COUNT(*) as totalAdmins FROM users WHERE role='admin'");
    const [[{ totalMarks }]]    = await pool.query("SELECT COUNT(*) as totalMarks FROM marks");
    const [deptStats] = await pool.query("SELECT department,COUNT(*) as count FROM users WHERE role='student' AND department IS NOT NULL GROUP BY department");
    res.json({ totalStudents, totalAdmins, totalMarks, deptStats });
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.get("/superadmin/marks-by-dept", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { dept } = req.query;
    if (dept) {
      const [r] = await pool.query("SELECT m.*,s.subject_name,s.credits,u.name as student_name FROM marks m JOIN subjects s ON m.subject_id=s.id JOIN users u ON m.student_id=u.id WHERE m.department=? ORDER BY m.semester,u.name", [dept]);
      res.json(r);
    } else {
      const [r] = await pool.query("SELECT department,COUNT(*) as count FROM marks GROUP BY department");
      res.json(r);
    }
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.get("/superadmin/admin-by-dept", verifyToken, verifySuperAdmin, async (req, res) => {
  try { const [r] = await pool.query("SELECT department,COUNT(*) as count FROM users WHERE role='admin' AND department IS NOT NULL GROUP BY department"); res.json(r); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.get("/superadmin/dept-efficiency", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const [students] = await pool.query("SELECT id,department FROM users WHERE role='student'");
    const [allSkills] = await pool.query("SELECT student_id,skill_score FROM student_skills");
    const [allAch]    = await pool.query("SELECT student_id,SUM(points) as total FROM student_achievements GROUP BY student_id");
    const [allAct]    = await pool.query("SELECT student_id,SUM(points) as total FROM student_activities GROUP BY student_id");
    const [marksAll]  = await pool.query("SELECT m.student_id,m.grade_points,s.credits FROM marks m JOIN subjects s ON m.subject_id=s.id");
    const maxSkill = allSkills.length ? Math.max(...allSkills.map(r => Number(r.skill_score))) : 100;
    const maxAch   = allAch.length   ? Math.max(...allAch.map(r => Number(r.total||0)))       : 1;
    const maxAct   = allAct.length   ? Math.max(...allAct.map(r => Number(r.total||0)))       : 1;
    const skillMap = Object.fromEntries(allSkills.map(r => [r.student_id, Number(r.skill_score)]));
    const achMap   = Object.fromEntries(allAch.map(r => [r.student_id, Number(r.total||0)]));
    const actMap   = Object.fromEntries(allAct.map(r => [r.student_id, Number(r.total||0)]));
    const cgpaMap  = {};
    for (const r of marksAll) {
      if (!cgpaMap[r.student_id]) cgpaMap[r.student_id] = { w:0, c:0 };
      cgpaMap[r.student_id].w += Number(r.grade_points)*Number(r.credits);
      cgpaMap[r.student_id].c += Number(r.credits);
    }
    const deptMap = {};
    for (const s of students) {
      if (!deptMap[s.department]) deptMap[s.department] = { total:0, count:0 };
      const sk = maxSkill>0?((skillMap[s.id]||0)/maxSkill)*100:0;
      const ac = maxAch>0?((achMap[s.id]||0)/maxAch)*100:0;
      const at = maxAct>0?((actMap[s.id]||0)/maxAct)*100:0;
      const cd = cgpaMap[s.id]; const cg = cd&&cd.c>0?Math.min((cd.w/cd.c/10)*100,100):0;
      deptMap[s.department].total += sk*0.30+ac*0.20+at*0.20+cg*0.30;
      deptMap[s.department].count++;
    }
    res.json(Object.entries(deptMap).map(([dept,{total,count}]) => ({ department:dept, avgEfficiency:Math.round((total/count)*10)/10, studentCount:count })));
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});
app.get("/superadmin/marks-entries-count", verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT department,COUNT(DISTINCT CONCAT(student_id,'-',semester)) as count FROM marks GROUP BY department");
    const [[{total}]] = await pool.query("SELECT COUNT(DISTINCT CONCAT(student_id,'-',semester)) as total FROM marks");
    res.json({ byDept: rows, total });
  } catch { res.status(500).json({ message: "Server error" }); }
});

/* ═══════════════════════════════════════════════
   ANNOUNCEMENTS
═══════════════════════════════════════════════ */
app.get("/announcements", verifyToken, async (req, res) => {
  try {
    let rows;
    if (req.user.role === "superadmin") {
      [rows] = await pool.query("SELECT * FROM announcements ORDER BY created_at DESC");
    } else if (req.user.role === "admin" || req.user.role === "faculty") {
      [rows] = await pool.query("SELECT * FROM announcements WHERE target='all' OR target=? ORDER BY created_at DESC", [req.user.department]);
    } else {
      const [u] = await pool.query("SELECT department FROM users WHERE id=?", [req.user.id]);
      [rows] = await pool.query("SELECT * FROM announcements WHERE target='all' OR target=? ORDER BY created_at DESC", [u[0]?.department]);
    }
    res.json(rows);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/superadmin/announcement", verifyToken, verifySuperAdmin, async (req, res) => {
  const { title, message, target } = req.body;
  if (!title || !message) return res.status(400).json({ message: "Title and message required" });
  try { await pool.query("INSERT INTO announcements (title,message,target) VALUES (?,?,?)", [title,message,target||"all"]); res.json({ message: "Announcement posted" }); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/superadmin/announcement/:id", verifyToken, verifySuperAdmin, async (req, res) => {
  try { await pool.query("DELETE FROM announcements WHERE id=?", [req.params.id]); res.json({ message: "Deleted" }); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/admin/announcement", verifyToken, verifyAdmin, async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ message: "Title and message required" });
  if (!req.user.department) return res.status(403).json({ message: "Admin has no department assigned" });
  try { await pool.query("INSERT INTO announcements (title,message,target) VALUES (?,?,?)", [title,message,req.user.department]); res.json({ message: "Posted to "+req.user.department }); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/announcement/:id/reply", verifyToken, async (req, res) => {
  const { reply_text, is_voice } = req.body;
  if (!reply_text?.trim()) return res.status(400).json({ message: "Reply text required" });
  try { await pool.query("INSERT INTO ann_replies (announcement_id,user_id,reply_text,is_voice) VALUES (?,?,?,?)", [req.params.id,req.user.id,reply_text.trim(),is_voice?1:0]); res.json({ message: "Reply posted" }); }
  catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});
app.get("/announcement/:id/replies", verifyToken, async (req, res) => {
  try {
    const [r] = await pool.query("SELECT r.id,r.reply_text,r.is_voice,r.created_at,u.name as user_name,u.role as user_role FROM ann_replies r JOIN users u ON r.user_id=u.id WHERE r.announcement_id=? ORDER BY r.created_at ASC", [req.params.id]);
    res.json(r);
  } catch { res.status(500).json({ message: "Server error" }); }
});

/* ═══════════════════════════════════════════════
   STUDENTS — admin + faculty can read
═══════════════════════════════════════════════ */
app.post("/add-student", verifyToken, verifyAdmin,
  validate({ name:"string", rollno:"string", email:"string", password:"string" }),
  async (req, res) => {
  const { name, rollno, email, password } = req.body;
  if (!isEmail(email)) return res.status(400).json({ message: "Invalid email format" });
  if (password.length < 4) return res.status(400).json({ message: "Password must be at least 4 characters" });
  const dept = req.user.department;
  if (!dept) return res.status(403).json({ message: "Admin has no department assigned" });
  try {
    const [ex]  = await pool.query("SELECT id FROM users WHERE email=?",  [email]);
    if (ex.length)  return res.status(400).json({ message: "Email already exists" });
    const [rEx] = await pool.query("SELECT id FROM users WHERE rollno=?", [rollno]);
    if (rEx.length) return res.status(400).json({ message: "Roll number already exists" });
    await pool.query("INSERT INTO users (name,rollno,email,password,role,department) VALUES (?,?,?,?,'student',?)", [name,rollno,email,password,dept]);
    res.json({ message: `Student added to ${dept} department successfully` });
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.post("/admin/bulk-add-students", verifyToken, verifyAdmin, async (req, res) => {
  const { students } = req.body;
  if (!Array.isArray(students) || !students.length)
    return res.status(400).json({ message: "No students provided" });
  const dept = req.user.department;
  if (!dept) return res.status(403).json({ message: "Admin has no department assigned" });
  const results = [];
  for (const s of students) {
    const { name, rollno, email, password } = s;
    if (!name||!rollno||!email||!password) { results.push({ rollno:rollno||"?", status:"error", message:"Missing fields" }); continue; }
    if (!isEmail(email)) { results.push({ rollno, status:"error", message:"Invalid email" }); continue; }
    try {
      const [eEx] = await pool.query("SELECT id FROM users WHERE email=?",  [email]);
      if (eEx.length) { results.push({ rollno, status:"error", message:"Email already exists" }); continue; }
      const [rEx] = await pool.query("SELECT id FROM users WHERE rollno=?", [rollno]);
      if (rEx.length) { results.push({ rollno, status:"error", message:"Roll no already exists" }); continue; }
      await pool.query("INSERT INTO users (name,rollno,email,password,role,department) VALUES (?,?,?,?,'student',?)", [name.trim(),rollno.trim(),email.trim(),password.trim(),dept]);
      results.push({ rollno, status:"ok", message:"Added" });
    } catch (e) { results.push({ rollno, status:"error", message:e.message }); }
  }
  res.json({ results });
});

app.delete("/student/:id", verifyToken, verifyAdmin, async (req, res) => {
  const studentId = req.params.id;
  try {
    if (req.user.role !== "superadmin") {
      const [r] = await pool.query("SELECT department FROM users WHERE id=? AND role='student'", [studentId]);
      if (!r.length) return res.status(404).json({ message: "Student not found" });
      if (r[0].department !== req.user.department) return res.status(403).json({ message: "Cannot delete student from another department" });
    }
    await pool.query("DELETE FROM marks       WHERE student_id=?", [studentId]);
    await pool.query("DELETE FROM attendance  WHERE student_id=?", [studentId]);
    await pool.query("DELETE FROM ann_replies WHERE user_id=?",    [studentId]);
    await pool.query("DELETE FROM users       WHERE id=? AND role='student'", [studentId]);
    res.json({ message: "Student and all related data deleted" });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

/* GET /students — admin sees own dept, faculty sees own dept, superadmin sees all */
app.get("/students", verifyToken, verifyFaculty, async (req, res) => {
  try {
    let r;
    if (req.user.role === "superadmin") {
      [r] = await pool.query("SELECT id,name,rollno,email,department FROM users WHERE role='student' ORDER BY name");
    } else {
      // admin AND faculty — both have department in JWT
      [r] = await pool.query("SELECT id,name,rollno,email,department FROM users WHERE role='student' AND department=? ORDER BY name", [req.user.department]);
    }
    res.json(r);
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/student/:id", verifyToken, async (req, res) => {
  try {
    const [r] = await pool.query("SELECT id,name,rollno,email,department FROM users WHERE id=? AND role='student'", [req.params.id]);
    if (!r.length) return res.status(404).json({ message: "Student not found" });
    res.json(r[0]);
  } catch { res.status(500).json({ message: "Server error" }); }
});

/* ═══════════════════════════════════════════════
   FACULTY MANAGEMENT (admin only)
═══════════════════════════════════════════════ */
app.get("/admin/faculty", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = req.user.role === "superadmin"
      ? await pool.query("SELECT id,name,email,department,created_at FROM users WHERE role='faculty' ORDER BY name")
      : await pool.query("SELECT id,name,email,department,created_at FROM users WHERE role='faculty' AND department=? ORDER BY name", [req.user.department]);
    res.json(rows);
  } catch (e) {
    console.error("GET /admin/faculty:", e);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/admin/add-faculty", verifyToken, verifyAdmin,
  validate({ name:"string", email:"string", password:"string" }),
  async (req, res) => {
  const { name, email, password } = req.body;
  if (!isEmail(email)) return res.status(400).json({ message: "Invalid email format" });
  if (password.length < 4) return res.status(400).json({ message: "Password must be at least 4 characters" });
  const department = req.user.department;
  if (!department) return res.status(403).json({ message: "Admin has no department assigned" });
  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length > 0) return res.status(400).json({ message: "Email already in use by another account" });
    await pool.query("INSERT INTO users (name,email,password,role,department) VALUES (?,?,?,'faculty',?)", [name,email,password,department]);
    const [newRow] = await pool.query("SELECT id,name,email,department FROM users WHERE email=? AND role='faculty'", [email]);
    res.json({ message: `Faculty added to ${department}`, faculty: newRow[0] });
  } catch (e) {
    console.error("POST /admin/add-faculty:", e);
    res.status(500).json({ message: "Server error", detail: e.message });
  }
});

app.delete("/admin/faculty/:id", verifyToken, verifyAdmin, async (req, res) => {
  const facultyId = req.params.id;
  try {
    if (req.user.role !== "superadmin") {
      const [rows] = await pool.query("SELECT department FROM users WHERE id=? AND role='faculty'", [facultyId]);
      if (!rows.length) return res.status(404).json({ message: "Faculty member not found" });
      if (rows[0].department !== req.user.department) return res.status(403).json({ message: "Cannot delete faculty from another department" });
    }
    await pool.query("DELETE FROM users WHERE id=? AND role='faculty'", [facultyId]);
    res.json({ message: "Faculty member removed" });
  } catch (e) {
    console.error("DELETE /admin/faculty:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ═══════════════════════════════════════════════
   FACULTY NOTES  (faculty-only routes)
═══════════════════════════════════════════════ */
app.post("/faculty/note", verifyToken, async (req, res) => {
  if (req.user.role !== "faculty" && req.user.role !== "admin" && req.user.role !== "superadmin")
    return res.status(403).json({ message: "Faculty access required" });
  const { student_id, note } = req.body;
  if (!student_id || !note?.trim())
    return res.status(400).json({ message: "student_id and note are required" });
  try {
    await pool.query(
      "INSERT INTO faculty_notes (faculty_id, student_id, note) VALUES (?, ?, ?)",
      [req.user.id, student_id, note.trim()]
    );
    res.json({ message: "Note saved" });
  } catch (e) {
    console.error("POST /faculty/note:", e);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/faculty/notes/:student_id", verifyToken, async (req, res) => {
  if (req.user.role !== "faculty" && req.user.role !== "admin" && req.user.role !== "superadmin")
    return res.status(403).json({ message: "Faculty access required" });
  try {
    const [rows] = await pool.query(
      "SELECT n.id, n.note, n.created_at, u.name as faculty_name FROM faculty_notes n JOIN users u ON n.faculty_id=u.id WHERE n.student_id=? AND n.faculty_id=? ORDER BY n.created_at DESC",
      [req.params.student_id, req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /faculty/notes:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ═══════════════════════════════════════════════
   ADMIN RESET STUDENT PASSWORD
═══════════════════════════════════════════════ */
app.put("/admin/reset-student-password", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, new_password } = req.body;
  if (!student_id || !new_password) return res.status(400).json({ message: "student_id and new_password required" });
  if (new_password.length < 4) return res.status(400).json({ message: "Password min 4 chars" });
  try {
    if (req.user.role !== "superadmin") {
      const [r] = await pool.query("SELECT department FROM users WHERE id=? AND role='student'", [student_id]);
      if (!r.length) return res.status(404).json({ message: "Student not found" });
      if (r[0].department !== req.user.department) return res.status(403).json({ message: "Wrong department" });
    }
    await pool.query("UPDATE users SET password=? WHERE id=?", [new_password, student_id]);
    res.json({ message: "Password reset successfully" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

/* ═══════════════════════════════════════════════
   GRADE HELPER
═══════════════════════════════════════════════ */
function calculateGrade(marks) {
  if (marks >= 91) return { grade:"O",  gradePoints:10 };
  if (marks >= 81) return { grade:"A+", gradePoints:9  };
  if (marks >= 71) return { grade:"A",  gradePoints:8  };
  if (marks >= 61) return { grade:"B+", gradePoints:7  };
  if (marks >= 56) return { grade:"B",  gradePoints:6  };
  if (marks >= 51) return { grade:"C",  gradePoints:5  };
  return               { grade:"F",  gradePoints:0  };
}

/* ═══════════════════════════════════════════════
   SUBJECTS
═══════════════════════════════════════════════ */
app.get("/subjects", verifyToken, async (req, res) => {
  try {
    let r;
    if (req.user.role==="superadmin")      [r]=await pool.query("SELECT * FROM subjects ORDER BY department,subject_name");
    else if (req.user.role==="admin")      [r]=await pool.query("SELECT * FROM subjects WHERE department=? ORDER BY subject_name",[req.user.department]);
    else { const [u]=await pool.query("SELECT department FROM users WHERE id=?",[req.user.id]); [r]=await pool.query("SELECT * FROM subjects WHERE department=? ORDER BY subject_name",[u[0]?.department]); }
    res.json(r);
  } catch { res.status(500).json({ message:"Server error" }); }
});
app.post("/add-subject", verifyToken, verifyAdmin, validate({subject_name:"string",credits:"number"}), async (req, res) => {
  const { subject_name, credits, semester } = req.body;
  const cr = Number(credits);
  if (cr<1||cr>5) return res.status(400).json({ message:"Credits must be between 1 and 5" });
  const dept = req.user.department;
  if (!dept) return res.status(403).json({ message:"Admin has no department assigned" });
  try {
    const [ex]=await pool.query("SELECT id FROM subjects WHERE subject_name=? AND department=?",[subject_name,dept]);
    if (ex.length) return res.status(400).json({ message:"Subject already exists in your department" });
    await pool.query("INSERT INTO subjects (subject_name,department,credits,semester) VALUES (?,?,?,?)",[subject_name,dept,cr,semester||"Sem 1"]);
    res.json({ message:`Subject added to ${dept} department` });
  } catch { res.status(500).json({ message:"Server error" }); }
});
app.delete("/subject/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    if (req.user.role!=="superadmin") {
      const [r]=await pool.query("SELECT department FROM subjects WHERE id=?",[req.params.id]);
      if (!r.length) return res.status(404).json({ message:"Subject not found" });
      if (r[0].department!==req.user.department) return res.status(403).json({ message:"Cannot delete subject from another department" });
    }
    await pool.query("DELETE FROM marks      WHERE subject_id=?",[req.params.id]);
    await pool.query("DELETE FROM attendance WHERE subject_id=?",[req.params.id]);
    await pool.query("DELETE FROM subjects   WHERE id=?",        [req.params.id]);
    res.json({ message:"Subject and linked marks deleted" });
  } catch (e) { console.error(e); res.status(500).json({ message:"Server error" }); }
});
app.get("/subjects-by-sem", verifyToken, async (req, res) => {
  try {
    let r;
    if (req.user.role==="superadmin")    [r]=await pool.query("SELECT * FROM subjects ORDER BY semester,subject_name");
    else if (req.user.role==="admin")    [r]=await pool.query("SELECT * FROM subjects WHERE department=? ORDER BY semester,subject_name",[req.user.department]);
    else { const [u]=await pool.query("SELECT department FROM users WHERE id=?",[req.user.id]); [r]=await pool.query("SELECT * FROM subjects WHERE department=? ORDER BY semester,subject_name",[u[0]?.department]); }
    res.json(r);
  } catch { res.status(500).json({ message:"Server error" }); }
});

/* ═══════════════════════════════════════════════
   MARKS — faculty can read (verifyFaculty)
═══════════════════════════════════════════════ */
app.post("/add-marks", verifyToken, verifyAdmin,
  validate({student_id:"number",subject_id:"number",marks_scored:"number",semester:"string"}),
  async (req, res) => {
  const { student_id, subject_id, marks_scored, semester } = req.body;
  const marks = Number(marks_scored);
  if (marks<0||marks>100) return res.status(400).json({ message:"Marks must be between 0 and 100" });
  const { grade, gradePoints } = calculateGrade(marks);
  try {
    const [sr]=await pool.query("SELECT credits FROM subjects WHERE id=?",[subject_id]);
    if (!sr.length) return res.status(404).json({ message:"Subject not found" });
    const [dup]=await pool.query("SELECT id FROM marks WHERE student_id=? AND subject_id=? AND semester=?",[student_id,subject_id,semester]);
    if (dup.length) return res.status(400).json({ message:"Marks already entered for this subject in this semester" });
    await pool.query("INSERT INTO marks (student_id,subject_id,marks_scored,grade,grade_points,semester,department) VALUES (?,?,?,?,?,?,?)",[student_id,subject_id,marks,grade,gradePoints,semester,req.user.department]);
    const [sm]=await pool.query("SELECT m.grade_points,s.credits FROM marks m JOIN subjects s ON m.subject_id=s.id WHERE m.student_id=? AND m.semester=?",[student_id,semester]);
    const tc=sm.reduce((s,r)=>s+r.credits,0), ws=sm.reduce((s,r)=>s+r.grade_points*r.credits,0);
    res.json({ message:`Marks added — Grade: ${grade}`, grade, gradePoints, sgpa:tc>0?(ws/tc).toFixed(2):"0.00", credits:sr[0].credits });
  } catch { res.status(500).json({ message:"Server error" }); }
});

app.post("/admin/bulk-add-marks", verifyToken, verifyAdmin, async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows)||!rows.length) return res.status(400).json({ message:"No rows provided" });
  const dept = req.user.department;
  if (!dept) return res.status(403).json({ message:"Admin has no department assigned" });
  const results = [];
  for (const row of rows) {
    const { roll_no, semester, subject, marks } = row;
    if (!roll_no||!semester||!subject||marks===undefined||marks==="") { results.push({ roll_no, status:"error", message:"Missing fields" }); continue; }
    const m = Number(marks);
    if (isNaN(m)||m<0||m>100) { results.push({ roll_no, status:"error", message:"Marks must be 0–100" }); continue; }
    try {
      const norm = String(roll_no).replace(/\s+/g,"").toUpperCase();
      const [stu]=await pool.query("SELECT id FROM users WHERE UPPER(REPLACE(rollno,' ',''))=? AND department=? AND role='student'",[norm,dept]);
      if (!stu.length) { results.push({ roll_no, status:"error", message:`Roll no not found in ${dept}` }); continue; }
      const studentId = stu[0].id;
      const [subs]=await pool.query("SELECT id,subject_name,credits FROM subjects WHERE department=?",[dept]);
      const sn = subject.trim().toLowerCase().replace(/[^a-z0-9 ]/g,"");
      let matched = subs.find(s=>s.subject_name.toLowerCase()===subject.trim().toLowerCase());
      if (!matched) matched = subs.find(s=>s.subject_name.toLowerCase().replace(/[^a-z0-9 ]/g,"")===sn);
      if (!matched) matched = subs.find(s=>s.subject_name.toLowerCase().includes(sn)||sn.includes(s.subject_name.toLowerCase().replace(/[^a-z0-9 ]/g,"")));
      if (!matched) {
        const iw=sn.split(" ").filter(w=>w.length>2);
        matched=subs.find(s=>{const dw=s.subject_name.toLowerCase().replace(/[^a-z0-9 ]/g,"").split(" ");return iw.some(w=>dw.includes(w));});
      }
      if (!matched) { results.push({ roll_no, status:"error", message:`Subject "${subject}" not found in ${dept}` }); continue; }
      const { grade, gradePoints } = calculateGrade(m);
      const [dup]=await pool.query("SELECT id FROM marks WHERE student_id=? AND subject_id=? AND semester=?",[studentId,matched.id,semester]);
      if (dup.length) {
        await pool.query("UPDATE marks SET marks_scored=?,grade=?,grade_points=? WHERE student_id=? AND subject_id=? AND semester=?",[m,grade,gradePoints,studentId,matched.id,semester]);
        results.push({ roll_no, status:"ok", message:`Updated — ${grade}` });
      } else {
        await pool.query("INSERT INTO marks (student_id,subject_id,marks_scored,grade,grade_points,semester,department) VALUES (?,?,?,?,?,?,?)",[studentId,matched.id,m,grade,gradePoints,semester,dept]);
        results.push({ roll_no, status:"ok", message:`Saved — ${grade}` });
      }
    } catch (e) { results.push({ roll_no, status:"error", message:e.message }); }
  }
  res.json({ results });
});

app.delete("/mark/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    if (req.user.role!=="superadmin") {
      const [r]=await pool.query("SELECT department FROM marks WHERE id=?",[req.params.id]);
      if (!r.length) return res.status(404).json({ message:"Mark not found" });
      if (r[0].department!==req.user.department) return res.status(403).json({ message:"Cannot delete mark from another department" });
    }
    await pool.query("DELETE FROM marks WHERE id=?",[req.params.id]);
    res.json({ message:"Mark entry deleted" });
  } catch (e) { console.error(e); res.status(500).json({ message:"Server error" }); }
});

/* GET /all-marks — admin + faculty can read dept marks */
app.get("/all-marks", verifyToken, verifyFaculty, async (req, res) => {
  try {
    const base = `SELECT m.*,s.subject_name,s.credits,u.name as student_name FROM marks m JOIN subjects s ON m.subject_id=s.id JOIN users u ON m.student_id=u.id ORDER BY m.semester,u.name`;
    let r;
    if (req.user.role === "superadmin") {
      [r] = await pool.query(base);
    } else {
      [r] = await pool.query(base.replace("ORDER BY", "WHERE m.department=? ORDER BY"), [req.user.department]);
    }
    res.json(r);
  } catch { res.status(500).json({ message:"Server error" }); }
});

app.get("/student-marks/:id", verifyToken, async (req, res) => {
  try {
    const [rows]=await pool.query("SELECT m.*,s.subject_name,s.credits FROM marks m JOIN subjects s ON m.subject_id=s.id WHERE m.student_id=? ORDER BY m.semester",[req.params.id]);
    const semMap={};
    for (const r of rows) {
      if (!semMap[r.semester]) semMap[r.semester]={subjects:[],totalCredits:0,weightedSum:0};
      semMap[r.semester].subjects.push(r);
      semMap[r.semester].totalCredits+=Number(r.credits);
      semMap[r.semester].weightedSum+=Number(r.grade_points)*Number(r.credits);
    }
    const semesters=Object.keys(semMap).map(sem=>{const{subjects,totalCredits,weightedSum}=semMap[sem];return{semester:sem,sgpa:totalCredits>0?(weightedSum/totalCredits).toFixed(2):"0.00",subjects};});
    const ac=rows.reduce((s,r)=>s+Number(r.credits),0), aw=rows.reduce((s,r)=>s+Number(r.grade_points)*Number(r.credits),0);
    res.json({ semesters, cgpa:ac>0?(aw/ac).toFixed(2):"0.00" });
  } catch { res.status(500).json({ message:"Server error" }); }
});

/* ═══════════════════════════════════════════════
   ATTENDANCE — faculty can read
═══════════════════════════════════════════════ */
app.get("/student-attendance/:id", verifyToken, async (req, res) => {
  try { const [r]=await pool.query("SELECT a.id,a.student_id,a.semester,a.present_days,a.total_days,a.attendance_percentage FROM attendance a WHERE a.student_id=? ORDER BY a.semester",[req.params.id]); res.json(r); }
  catch (e) { console.error(e); res.status(500).json({ message:"Server error" }); }
});
app.post("/add-attendance", verifyToken, verifyAdmin,
  validate({student_id:"number",semester:"string",present_days:"number",total_days:"number"}),
  async (req, res) => {
  const { student_id, semester, present_days, total_days } = req.body;
  const p=Number(present_days), t=Number(total_days);
  if (p<0||t<=0) return res.status(400).json({ message:"Invalid days values" });
  if (p>t)       return res.status(400).json({ message:"Present days cannot exceed total days" });
  const pct=parseFloat(((p/t)*100).toFixed(2));
  try {
    await pool.query("INSERT INTO attendance (student_id,semester,present_days,total_days,attendance_percentage) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE present_days=VALUES(present_days),total_days=VALUES(total_days),attendance_percentage=VALUES(attendance_percentage)",[student_id,semester,p,t,pct]);
    res.json({ message:"Attendance saved", attendance_percentage:pct });
  } catch (e) { console.error(e); res.status(500).json({ message:"Server error", detail:e.message }); }
});

/* GET /attendance-list — admin + faculty can read */
app.get("/attendance-list", verifyToken, verifyFaculty, async (req, res) => {
  try {
    const base = `SELECT a.id,a.student_id,a.semester,a.present_days,a.total_days,a.attendance_percentage,u.name as student_name,u.rollno,u.department FROM attendance a JOIN users u ON a.student_id=u.id ORDER BY a.semester,u.name`;
    let r;
    if (req.user.role === "superadmin") {
      [r] = await pool.query(base);
    } else {
      [r] = await pool.query(base.replace("ORDER BY", "WHERE u.department=? ORDER BY"), [req.user.department]);
    }
    res.json(r);
  } catch (e) { console.error(e); res.status(500).json({ message:"Server error" }); }
});

/* ═══════════════════════════════════════════════
   EFFICIENCY — faculty can read
═══════════════════════════════════════════════ */
const ACTIVITY_POINTS = { Club:10, Workshop:15, NSS:20, NCC:25, Sports:15, Leadership:20, Volunteering:15 };

app.get("/efficiency/:studentId", verifyToken, async (req, res) => {
  const { studentId } = req.params;
  if (req.user.role==="student" && String(req.user.id)!==String(studentId))
    return res.status(403).json({ message:"Access denied" });
  try {
    const [stuRows]=await pool.query("SELECT department FROM users WHERE id=?",[studentId]);
    const myDept=stuRows[0]?.department||"";
    const [allStudents]=await pool.query("SELECT id,department FROM users WHERE role='student'");
    const deptStudents=allStudents.filter(s=>s.department===myDept);
    const allIds=allStudents.map(s=>s.id), deptIds=deptStudents.map(s=>s.id);
    const percentile=(myVal,allVals)=>{
      if (allVals.length<=1) return 100;
      const others=allVals.filter(v=>Number(v)!==Number(myVal));
      if (!others.length) return 100;
      return Math.round((allVals.filter(v=>Number(v)<Number(myVal)).length/(allVals.length-1))*100);
    };
    const [allSkillRows]=await pool.query("SELECT student_id,skill_score FROM student_skills");
    const skillMap=Object.fromEntries(allSkillRows.map(r=>[String(r.student_id),Number(r.skill_score)]));
    const mySkillRaw=skillMap[String(studentId)]||0;
    const maxSkill=allSkillRows.length?Math.max(...allSkillRows.map(r=>Number(r.skill_score))):100;
    const skillScore=maxSkill>0?(mySkillRaw/maxSkill)*100:0;
    const [allAchRows]=await pool.query("SELECT student_id,SUM(points) as total FROM student_achievements GROUP BY student_id");
    const achMap=Object.fromEntries(allAchRows.map(r=>[String(r.student_id),Number(r.total||0)]));
    const myAchRaw=achMap[String(studentId)]||0;
    const maxAch=allAchRows.length?Math.max(...allAchRows.map(r=>Number(r.total||0))):1;
    const achievementScore=maxAch>0?(myAchRaw/maxAch)*100:0;
    const [allActRows]=await pool.query("SELECT student_id,SUM(points) as total FROM student_activities GROUP BY student_id");
    const actMap=Object.fromEntries(allActRows.map(r=>[String(r.student_id),Number(r.total||0)]));
    const myActRaw=actMap[String(studentId)]||0;
    const maxAct=allActRows.length?Math.max(...allActRows.map(r=>Number(r.total||0))):1;
    const activityScore=maxAct>0?(myActRaw/maxAct)*100:0;
    const [marksAll]=await pool.query("SELECT m.student_id,m.grade_points,s.credits FROM marks m JOIN subjects s ON m.subject_id=s.id");
    const cgpaMap={};
    for (const r of marksAll) { const k=String(r.student_id); if (!cgpaMap[k]) cgpaMap[k]={w:0,c:0}; cgpaMap[k].w+=Number(r.grade_points)*Number(r.credits); cgpaMap[k].c+=Number(r.credits); }
    const myCgpaData=cgpaMap[String(studentId)];
    const cgpa=myCgpaData&&myCgpaData.c>0?myCgpaData.w/myCgpaData.c:0;
    const cgpaScore=Math.min((cgpa/10)*100,100);
    const finalScore=(skillScore*0.30)+(achievementScore*0.20)+(activityScore*0.20)+(cgpaScore*0.30);
    const band=finalScore>=80?"Excellent":finalScore>=60?"Good":finalScore>=40?"Needs Improvement":"Weak";
    const calcFinal=id=>{const s=String(id);const sk=maxSkill>0?((skillMap[s]||0)/maxSkill)*100:0;const ac=maxAch>0?((achMap[s]||0)/maxAch)*100:0;const at=maxAct>0?((actMap[s]||0)/maxAct)*100:0;const cd=cgpaMap[s];const cg=cd&&cd.c>0?Math.min((cd.w/cd.c/10)*100,100):0;return sk*0.30+ac*0.20+at*0.20+cg*0.30;};
    const allFinalScores=allIds.map(id=>calcFinal(id));
    const deptFinalScores=deptIds.map(id=>calcFinal(id));
    res.json({
      studentId, department:myDept,
      skillScore:Math.round(skillScore), achievementScore:Math.round(achievementScore), activityScore:Math.round(activityScore), cgpaScore:Math.round(cgpaScore),
      finalScore:Math.round(finalScore*10)/10, band, cgpa:cgpa.toFixed(2),
      deptPercentile:{ skill:percentile(mySkillRaw,deptIds.map(id=>skillMap[String(id)]||0)), achievement:percentile(myAchRaw,deptIds.map(id=>achMap[String(id)]||0)), activity:percentile(myActRaw,deptIds.map(id=>actMap[String(id)]||0)), cgpa:percentile(cgpa,deptIds.map(id=>{const d=cgpaMap[String(id)];return d&&d.c>0?d.w/d.c:0;})), overall:percentile(finalScore,deptFinalScores) },
      allPercentile:{ skill:percentile(mySkillRaw,allIds.map(id=>skillMap[String(id)]||0)), achievement:percentile(myAchRaw,allIds.map(id=>achMap[String(id)]||0)), activity:percentile(myActRaw,allIds.map(id=>actMap[String(id)]||0)), cgpa:percentile(cgpa,allIds.map(id=>{const d=cgpaMap[String(id)];return d&&d.c>0?d.w/d.c:0;})), overall:percentile(finalScore,allFinalScores) },
      deptRank:deptFinalScores.filter(s=>s>finalScore).length+1, deptTotal:deptIds.length,
      overallRank:allFinalScores.filter(s=>s>finalScore).length+1, overallTotal:allIds.length,
    });
  } catch (e) { console.error(e); res.status(500).json({ message:"Server error" }); }
});

/* GET /admin/all-efficiency — admin + faculty can read */
app.get("/admin/all-efficiency", verifyToken, verifyFaculty, async (req, res) => {
  try {
    const [allStudents]=await pool.query("SELECT id,name,rollno,department FROM users WHERE role='student'");
    const disp=req.user.role==="superadmin"?allStudents:allStudents.filter(s=>s.department===req.user.department);
    const [sk]=await pool.query("SELECT student_id,skill_score FROM student_skills");
    const [ach]=await pool.query("SELECT student_id,SUM(points) as total FROM student_achievements GROUP BY student_id");
    const [act]=await pool.query("SELECT student_id,SUM(points) as total FROM student_activities GROUP BY student_id");
    const maxSk=sk.length?Math.max(...sk.map(r=>Number(r.skill_score))):100;
    const maxAch=ach.length?Math.max(...ach.map(r=>Number(r.total||0))):1;
    const maxAct=act.length?Math.max(...act.map(r=>Number(r.total||0))):1;
    const skillMap=Object.fromEntries(sk.map(r=>[String(r.student_id),Number(r.skill_score)]));
    const achMap=Object.fromEntries(ach.map(r=>[String(r.student_id),Number(r.total||0)]));
    const actMap=Object.fromEntries(act.map(r=>[String(r.student_id),Number(r.total||0)]));
    const [mk]=await pool.query("SELECT m.student_id,m.grade_points,s.credits FROM marks m JOIN subjects s ON m.subject_id=s.id");
    const cmap={};
    for (const r of mk) { const k=String(r.student_id); if (!cmap[k]) cmap[k]={w:0,c:0}; cmap[k].w+=Number(r.grade_points)*Number(r.credits); cmap[k].c+=Number(r.credits); }
    const calcF=id=>{const s=String(id);const sk2=maxSk>0?((skillMap[s]||0)/maxSk)*100:0;const ac=maxAch>0?((achMap[s]||0)/maxAch)*100:0;const at=maxAct>0?((actMap[s]||0)/maxAct)*100:0;const cd=cmap[s];const cg=cd&&cd.c>0?Math.min((cd.w/cd.c/10)*100,100):0;return{sk:sk2,ac,at,cg,final:sk2*0.30+ac*0.20+at*0.20+cg*0.30};};
    const allScoreMap=Object.fromEntries(allStudents.map(s=>[s.id,calcF(s.id).final]));
    const cgpaVM=Object.fromEntries(allStudents.map(x=>{const c=cmap[String(x.id)];return[String(x.id),c&&c.c>0?c.w/c.c:0];}));
    const pctFn=(mv,ids,map)=>{const vals=ids.map(id=>map[String(id)]||0);if (!vals.length) return 0;return Math.round((vals.filter(v=>v<mv).length/vals.length)*100);};
    const results=disp.map(s=>{
      const{sk,ac,at,cg,final}=calcF(s.id);const cd=cmap[String(s.id)];const cgpa=cd&&cd.c>0?cd.w/cd.c:0;
      const deptIds=allStudents.filter(x=>x.department===s.department).map(x=>x.id);
      return{id:s.id,name:s.name,rollno:s.rollno,department:s.department,
        skillScore:Math.round(sk),achievementScore:Math.round(ac),activityScore:Math.round(at),cgpaScore:Math.round(cg),
        finalScore:Math.round(final*10)/10,cgpa:cgpa.toFixed(2),band:final>=80?"Excellent":final>=60?"Good":final>=40?"Needs Improvement":"Weak",
        overallRank:Object.values(allScoreMap).filter(v=>v>final).length+1,overallTotal:allStudents.length,
        deptRank:deptIds.filter(id=>(allScoreMap[id]||0)>final).length+1,deptTotal:deptIds.length,
        deptPercentile:{skill:pctFn(skillMap[String(s.id)]||0,deptIds,skillMap),achievement:pctFn(achMap[String(s.id)]||0,deptIds,achMap),activity:pctFn(actMap[String(s.id)]||0,deptIds,actMap),cgpa:pctFn(cgpa,deptIds,cgpaVM),overall:Math.round((deptIds.filter(id=>(allScoreMap[id]||0)<final).length/deptIds.length)*100)},
        allPercentile:{skill:pctFn(skillMap[String(s.id)]||0,allStudents.map(x=>x.id),skillMap),achievement:pctFn(achMap[String(s.id)]||0,allStudents.map(x=>x.id),achMap),activity:pctFn(actMap[String(s.id)]||0,allStudents.map(x=>x.id),actMap),cgpa:pctFn(cgpa,allStudents.map(x=>x.id),cgpaVM),overall:Math.round((Object.values(allScoreMap).filter(v=>v<final).length/allStudents.length)*100)}};
    });
    results.sort((a,b)=>b.finalScore-a.finalScore);
    res.json(results);
  } catch (e) { console.error(e); res.status(500).json({ message:"Server error" }); }
});

/* ═══════════════════════════════════════════════
   SKILLS / ACTIVITIES / ACHIEVEMENTS
═══════════════════════════════════════════════ */
app.post("/admin/student-skill", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, skill_level, skill_score } = req.body;
  if (!student_id||!skill_level||skill_score===undefined) return res.status(400).json({ message:"student_id, skill_level, skill_score required" });
  const pts=Number(skill_score); if (isNaN(pts)||pts<0) return res.status(400).json({ message:"Invalid points" });
  try { await pool.query("INSERT INTO student_skills (student_id,skill_level,skill_score) VALUES (?,?,?) ON DUPLICATE KEY UPDATE skill_level=VALUES(skill_level),skill_score=VALUES(skill_score)",[student_id,skill_level,pts]); res.json({ message:"Skill saved", skill_score:pts }); }
  catch { res.status(500).json({ message:"Server error" }); }
});
app.put("/admin/student-activity/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { activity_type, description, points } = req.body;
  if (!activity_type||points===undefined) return res.status(400).json({ message:"activity_type and points required" });
  try { await pool.query("UPDATE student_activities SET activity_type=?,description=?,points=? WHERE id=?",[activity_type,description||"",Number(points),req.params.id]); res.json({ message:"Activity updated" }); }
  catch { res.status(500).json({ message:"Server error" }); }
});
app.post("/admin/student-activity", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, activity_type, description, points } = req.body;
  if (!student_id||!activity_type) return res.status(400).json({ message:"student_id and activity_type required" });
  const pts=points!==undefined?Number(points):(ACTIVITY_POINTS[activity_type]||10);
  try { await pool.query("INSERT INTO student_activities (student_id,activity_type,points,description,added_by) VALUES (?,?,?,?,?)",[student_id,activity_type,pts,description||"",req.user.id]); res.json({ message:`Activity '${activity_type}' added (${pts} pts)`, points:pts }); }
  catch { res.status(500).json({ message:"Server error" }); }
});
app.delete("/admin/student-activity/:id", verifyToken, verifyAdmin, async (req, res) => {
  try { await pool.query("DELETE FROM student_activities WHERE id=?",[req.params.id]); res.json({ message:"Deleted" }); }
  catch { res.status(500).json({ message:"Server error" }); }
});
app.put("/admin/student-achievement/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { achievement_name, points } = req.body;
  if (!achievement_name||points===undefined) return res.status(400).json({ message:"achievement_name and points required" });
  try { await pool.query("UPDATE student_achievements SET achievement_name=?,points=? WHERE id=?",[achievement_name,Number(points),req.params.id]); res.json({ message:"Achievement updated" }); }
  catch { res.status(500).json({ message:"Server error" }); }
});
app.post("/admin/student-achievement", verifyToken, verifyAdmin, async (req, res) => {
  const { student_id, achievement_name, points } = req.body;
  if (!student_id||!achievement_name||points===undefined) return res.status(400).json({ message:"All fields required" });
  try { await pool.query("INSERT INTO student_achievements (student_id,achievement_name,points) VALUES (?,?,?)",[student_id,achievement_name,Number(points)]); res.json({ message:"Achievement added" }); }
  catch { res.status(500).json({ message:"Server error" }); }
});
app.delete("/admin/student-achievement/:id", verifyToken, verifyAdmin, async (req, res) => {
  try { await pool.query("DELETE FROM student_achievements WHERE id=?",[req.params.id]); res.json({ message:"Deleted" }); }
  catch { res.status(500).json({ message:"Server error" }); }
});
app.get("/admin/student-efficiency-data/:studentId", verifyToken, verifyAdmin, async (req, res) => {
  const { studentId } = req.params;
  try {
    const [skillRows]=await pool.query("SELECT * FROM student_skills WHERE student_id=?",[studentId]);
    const [actRows]  =await pool.query("SELECT * FROM student_activities WHERE student_id=? ORDER BY created_at DESC",[studentId]);
    const [achRows]  =await pool.query("SELECT * FROM student_achievements WHERE student_id=? ORDER BY created_at DESC",[studentId]);
    res.json({ skill:skillRows[0]||null, activities:actRows, achievements:achRows });
  } catch { res.status(500).json({ message:"Server error" }); }
});

/* ═══════════════════════════════════════════════
   SEARCH / CHANGE PASSWORD
═══════════════════════════════════════════════ */
app.get("/students/search", verifyToken, verifyFaculty, async (req, res) => {
  const { q } = req.query;
  if (!q||q.trim().length<2) return res.json([]);
  try {
    let r;
    if (req.user.role === "superadmin") {
      [r] = await pool.query("SELECT id,name,rollno FROM users WHERE role='student' AND rollno LIKE ? LIMIT 8", [`${q.trim()}%`]);
    } else {
      [r] = await pool.query("SELECT id,name,rollno FROM users WHERE role='student' AND department=? AND rollno LIKE ? LIMIT 8", [req.user.department, `${q.trim()}%`]);
    }
    res.json(r);
  } catch { res.status(500).json({ message:"Server error" }); }
});

app.put("/change-password", verifyToken, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password||!new_password) return res.status(400).json({ message:"Both fields required" });
  if (new_password.length<4) return res.status(400).json({ message:"New password must be at least 4 characters" });
  try {
    const [r]=await pool.query("SELECT password FROM users WHERE id=?",[req.user.id]);
    if (!r.length) return res.status(404).json({ message:"User not found" });
    if (r[0].password!==current_password) return res.status(400).json({ message:"Current password is incorrect" });
    await pool.query("UPDATE users SET password=? WHERE id=?",[new_password,req.user.id]);
    res.json({ message:"Password changed successfully" });
  } catch { res.status(500).json({ message:"Server error" }); }
});

/* ── ERROR HANDLER (must be last) ── */
app.use(errorHandler);

/* ── START ── */
app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));