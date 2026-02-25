import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [collapsed, setCollapsed] = useState(false);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  // Subject form
  const [newSubject, setNewSubject] = useState("");
  const [newCredits, setNewCredits] = useState("");

  // Student form
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentRollno, setNewStudentRollno] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");

  // Marks form
  const [rollnoInput,      setRollnoInput]      = useState("");
const [foundStudent,     setFoundStudent]     = useState(null);  // { id, name, rollno }
const [rollnoError,      setRollnoError]      = useState("");
const [rollnoLoading,    setRollnoLoading]    = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [marksScored, setMarksScored] = useState("");
  const [semester, setSemester] = useState("");
  const [marksResult, setMarksResult] = useState(null);

  const SEMESTERS = ["Sem 1","Sem 2","Sem 3","Sem 4","Sem 5","Sem 6","Sem 7","Sem 8"];

  const GRADE_COLOR = {
    O:"#16a34a","A+":"#2563eb",A:"#0891b2",
    "B+":"#7c3aed",B:"#d97706",C:"#ea580c",F:"#dc2626"
  };

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    fetchAll();
  }, []);

  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchStudents(), fetchSubjects(), fetchMarks()]);
    } finally { setLoading(false); }
  };


//roll number lookup
  const handleRollnoLookup = async (rollno) => {
  setRollnoInput(rollno);
  setFoundStudent(null);
  setRollnoError("");

  if (rollno.trim().length < 2) return;

  setRollnoLoading(true);
  try {
    const res  = await fetch("http://localhost:5000/students", { headers: authHeader });
    const data = await res.json();
    const match = data.find(
      (s) => s.rollno.toLowerCase() === rollno.trim().toLowerCase()
    );
    if (match) {
      setFoundStudent(match);
      setRollnoError("");
    } else {
      setFoundStudent(null);
      setRollnoError("No student found with this roll number");
    }
  } catch {
    setRollnoError("Error looking up student");
  } finally {
    setRollnoLoading(false);
  }
};


  const fetchStudents = async () => {
    try {
      const res = await fetch("http://localhost:5000/students", { headers: authHeader });
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch("http://localhost:5000/subjects", { headers: authHeader });
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const fetchMarks = async () => {
    try {
      const res = await fetch("http://localhost:5000/all-marks", { headers: authHeader });
      const data = await res.json();
      setMarks(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentRollno || !newStudentEmail || !newStudentPassword) {
      alert("Please fill all fields"); return;
    }
    try {
      const res = await fetch("http://localhost:5000/add-student", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ name: newStudentName, rollno: newStudentRollno, email: newStudentEmail, password: newStudentPassword }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setNewStudentName(""); setNewStudentRollno(""); setNewStudentEmail(""); setNewStudentPassword("");
      fetchStudents();
      alert("Student Added Successfully");
    } catch { alert("Error adding student"); }
  };

  const handleAddSubject = async () => {
    if (!newSubject || !newCredits) { alert("Enter subject name and credits"); return; }
    try {
      const res = await fetch("http://localhost:5000/add-subject", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ subject_name: newSubject, credits: Number(newCredits) }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setNewSubject(""); setNewCredits("");
      fetchSubjects();
      alert("Subject Added Successfully");
    } catch { alert("Error adding subject"); }
  };


  //handleAddMarks
  const handleAddMarks = async () => {
  if (!foundStudent || !selectedSubject || !marksScored || !semester) {
    alert("Please fill all fields and verify roll number"); return;
  }
  const m = Number(marksScored);
  if (m < 0 || m > 100) { alert("Marks must be between 0 and 100"); return; }

  try {
    const res = await fetch("http://localhost:5000/add-marks", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({
        student_id: foundStudent.id,   // ← use foundStudent.id
        subject_id: selectedSubject,
        marks_scored: m,
        semester,
      }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.message); return; }

    setMarksResult({ ...data, semester });
    // Reset form
    setRollnoInput(""); setFoundStudent(null); setRollnoError("");
    setMarksScored(""); setSemester(""); setSelectedSubject("");
    fetchMarks();
  } catch { alert("Error adding marks"); }
};


  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  if (loading) return <h2 style={{ padding: "20px" }}>Loading...</h2>;

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <h2>{collapsed ? "SA" : "SLEA Admin"}</h2>
        <div className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "➡️" : "⬅️"}
        </div>
        <button onClick={() => setActiveTab("dashboard")}>{collapsed ? "📊" : "Dashboard"}</button>
        <button onClick={() => setActiveTab("students")}>{collapsed ? "👨‍🎓" : "Students"}</button>
        <button onClick={() => setActiveTab("subjects")}>{collapsed ? "📘" : "Subjects"}</button>
        <button onClick={() => setActiveTab("marks")}>{collapsed ? "📝" : "Marks"}</button>
        <button onClick={handleLogout}>{collapsed ? "🚪" : "Logout"}</button>
      </div>

      {/* MAIN CONTENT */}
      <div className={`main-content ${collapsed ? "collapsed" : ""}`}>

        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div className="tab-section">
            <h1>Admin Overview</h1>
            <div className="stats">
              <div className="stat-card"><h3>Total Students</h3><p>{students.length}</p></div>
              <div className="stat-card"><h3>Total Subjects</h3><p>{subjects.length}</p></div>
              <div className="stat-card"><h3>Total Marks Entries</h3><p>{marks.length}</p></div>
            </div>
          </div>
        )}

        {/* ── STUDENTS ── */}
        {activeTab === "students" && (
          <div className="tab-section">
            <h1>Add Student</h1>
            <div className="form-card">
              <input placeholder="Student Name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
              <input placeholder="Email" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} />
              <input placeholder="Roll Number" value={newStudentRollno} onChange={(e) => setNewStudentRollno(e.target.value)} />
              <input type="password" placeholder="Password" value={newStudentPassword} onChange={(e) => setNewStudentPassword(e.target.value)} />
              <button onClick={handleAddStudent}>Add Student</button>
            </div>
            <h2>All Students</h2>
            <ul className="list">
              {students.map((s) => (
                <li key={s.id}>{s.name} — {s.rollno} — {s.email}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── SUBJECTS ── */}
        {activeTab === "subjects" && (
          <div className="tab-section">
            <h1>Add Subject</h1>
            <div style={{ background:"#dbeafe", border:"1px solid #93c5fd", borderRadius:"8px", padding:"10px 16px", marginBottom:"16px", fontSize:"14px", color:"#1d4ed8" }}>
              📌 Subjects you add will only be visible to your department students.
            </div>
            <div className="form-card">
              <input placeholder="Subject Name" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
              <input
                type="number" placeholder="Credits (e.g. 3)" min="1" max="5"
                value={newCredits} onChange={(e) => setNewCredits(e.target.value)}
              />
              <button onClick={handleAddSubject}>Add Subject</button>
            </div>
            <h2>Your Department Subjects</h2>
            <ul className="list">
              {subjects.length === 0 ? (
                <li style={{ color:"#94a3b8" }}>No subjects added yet.</li>
              ) : subjects.map((sub) => (
                <li key={sub.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span>{sub.subject_name}</span>
                  <span style={{ display:"flex", gap:"8px" }}>
                    <span style={{ background:"#f1f5f9", color:"#475569", padding:"2px 10px", borderRadius:"20px", fontSize:"13px" }}>
                      {sub.credits} credits
                    </span>
                    <span style={{ background:"#2563eb", color:"#fff", padding:"2px 10px", borderRadius:"20px", fontSize:"12px" }}>
                      {sub.department}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── MARKS ── */}
        {activeTab === "marks" && (
          <div className="tab-section">
            <h1>Add Marks</h1>

            {/* Grade reference */}
            <div style={{ background:"#fff", borderRadius:"10px", padding:"16px", marginBottom:"20px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              <p style={{ fontWeight:600, marginBottom:"10px", color:"#475569" }}>📊 Grade Reference</p>
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                {[
                  { range:"91–100", grade:"O",  pts:10 },
                  { range:"81–90",  grade:"A+", pts:9  },
                  { range:"71–80",  grade:"A",  pts:8  },
                  { range:"61–70",  grade:"B+", pts:7  },
                  { range:"56–60",  grade:"B",  pts:6  },
                  { range:"51–55",  grade:"C",  pts:5  },
                  { range:"≤50",    grade:"F",  pts:0  },
                ].map(({ range, grade, pts }) => (
                  <div key={grade} style={{ background: GRADE_COLOR[grade] + "18", border:`1px solid ${GRADE_COLOR[grade]}`, borderRadius:"8px", padding:"6px 12px", textAlign:"center", minWidth:"80px" }}>
                    <div style={{ fontWeight:700, color: GRADE_COLOR[grade] }}>{grade}</div>
                    <div style={{ fontSize:"11px", color:"#64748b" }}>{range}</div>
                    <div style={{ fontSize:"11px", color:"#64748b" }}>{pts} pts</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-card">

  {/* Roll Number Input */}
  <div>
    <label style={{ fontSize:"13px", color:"#475569", fontWeight:600, display:"block", marginBottom:"6px" }}>
      Student Roll Number
    </label>
    <div style={{ position:"relative" }}>
      <input
        placeholder="Enter roll number (e.g. 21IT001)"
        value={rollnoInput}
        onChange={(e) => handleRollnoLookup(e.target.value)}
        style={{ width:"100%", padding:"12px", fontSize:"15px", borderRadius:"8px",
          border: foundStudent ? "2px solid #16a34a" : rollnoError ? "2px solid #dc2626" : "1px solid #cbd5e1",
          outline:"none", boxSizing:"border-box"
        }}
      />
      {rollnoLoading && (
        <span style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"13px", color:"#94a3b8" }}>
          Searching...
        </span>
      )}
    </div>

    {/* Student found — green card */}
    {foundStudent && (
      <div style={{ marginTop:"8px", background:"#f0fdf4", border:"1px solid #86efac",
        borderRadius:"8px", padding:"10px 14px", display:"flex", alignItems:"center", gap:"12px" }}>
        <span style={{ fontSize:"20px" }}>✅</span>
        <div>
          <p style={{ fontWeight:700, color:"#16a34a", fontSize:"15px" }}>{foundStudent.name}</p>
          <p style={{ color:"#64748b", fontSize:"13px" }}>Roll No: {foundStudent.rollno}</p>
        </div>
      </div>
    )}

    {/* Not found — red error */}
    {rollnoError && (
      <div style={{ marginTop:"8px", background:"#fef2f2", border:"1px solid #fca5a5",
        borderRadius:"8px", padding:"10px 14px", display:"flex", alignItems:"center", gap:"10px" }}>
        <span style={{ fontSize:"18px" }}>❌</span>
        <p style={{ color:"#dc2626", fontSize:"13px", fontWeight:500 }}>{rollnoError}</p>
      </div>
    )}
  </div>

  {/* Subject dropdown */}
  <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
    <option value="">Select Subject</option>
    {subjects.map((sub) => (
      <option key={sub.id} value={sub.id}>{sub.subject_name} ({sub.credits} credits)</option>
    ))}
  </select>

  {/* Semester dropdown */}
  <select value={semester} onChange={(e) => setSemester(e.target.value)}>
    <option value="">Select Semester</option>
    {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
  </select>

  {/* Marks input */}
  <input
    type="number" placeholder="Marks Scored (0–100)" min="0" max="100"
    value={marksScored} onChange={(e) => setMarksScored(e.target.value)}
  />

  <button
    onClick={handleAddMarks}
    disabled={!foundStudent}
    style={{ opacity: foundStudent ? 1 : 0.5, cursor: foundStudent ? "pointer" : "not-allowed" }}
  >
    Add Marks
  </button>

</div>

            {/* Result card */}
            {marksResult && (
              <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:"12px", padding:"20px", marginBottom:"20px" }}>
                <p style={{ fontWeight:700, fontSize:"16px", color:"#16a34a", marginBottom:"12px" }}>✅ Marks Added Successfully!</p>
                <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
                  {[
                    { label:"Grade",         val: marksResult.grade,       color: GRADE_COLOR[marksResult.grade] },
                    { label:"Grade Points",  val: marksResult.gradePoints, color:"#2563eb" },
                    { label:"Credits",       val: marksResult.credits,     color:"#7c3aed" },
                    { label:"Semester SGPA", val: marksResult.sgpa,        color:"#d97706" },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ background:"#fff", borderRadius:"8px", padding:"12px 20px", textAlign:"center", border:`2px solid ${color}` }}>
                      <div style={{ fontSize:"22px", fontWeight:700, color }}>{val}</div>
                      <div style={{ fontSize:"12px", color:"#64748b" }}>{label}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize:"13px", color:"#64748b", marginTop:"10px" }}>
                  * SGPA updates as more subjects are added for {marksResult.semester}
                </p>
                <button onClick={() => setMarksResult(null)} style={{ marginTop:"10px", padding:"6px 16px", background:"#ef4444", color:"#fff", border:"none", borderRadius:"6px", cursor:"pointer" }}>
                  Dismiss
                </button>
              </div>
            )}

            {/* Marks table */}
            <h2>All Marks Entries</h2>
            {marks.length === 0 ? (
              <p style={{ color:"#94a3b8" }}>No marks added yet.</p>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", background:"#fff", borderRadius:"10px", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <thead>
                    <tr style={{ background:"#1e293b", color:"#fff" }}>
                      {["Student","Subject","Semester","Marks","Grade","Grade Pts","Credits"].map((h) => (
                        <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:"13px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((m) => (
                      <tr key={m.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                        <td style={{ padding:"11px 14px" }}>{m.student_name}</td>
                        <td style={{ padding:"11px 14px" }}>{m.subject_name}</td>
                        <td style={{ padding:"11px 14px" }}>{m.semester}</td>
                        <td style={{ padding:"11px 14px" }}>{m.marks_scored}</td>
                        <td style={{ padding:"11px 14px" }}>
                          <span style={{ background: (GRADE_COLOR[m.grade]||"#64748b")+"20", color: GRADE_COLOR[m.grade]||"#64748b", padding:"2px 10px", borderRadius:"20px", fontWeight:700 }}>
                            {m.grade}
                          </span>
                        </td>
                        <td style={{ padding:"11px 14px" }}>{m.grade_points}</td>
                        <td style={{ padding:"11px 14px" }}>{m.credits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminDashboard;