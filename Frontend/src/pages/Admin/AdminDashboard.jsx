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

  const [newSubject, setNewSubject] = useState("");

  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentRollno, setNewStudentRollno] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [sgpa, setSgpa] = useState("");
  const [semester, setSemester] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchStudents(), fetchSubjects(), fetchMarks()]);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch("http://localhost:5000/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch("http://localhost:5000/subjects");
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
  };

  const fetchMarks = async () => {
    try {
      const res = await fetch("http://localhost:5000/all-marks");
      const data = await res.json();
      setMarks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching marks:", err);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentRollno || !newStudentEmail || !newStudentPassword) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/add-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newStudentName,
          rollno: newStudentRollno,
          email: newStudentEmail,
          password: newStudentPassword,
        }),
      });

      if (!res.ok) throw new Error();

      setNewStudentName("");
      setNewStudentRollno("");
      setNewStudentEmail("");
      setNewStudentPassword("");

      fetchStudents();
      alert("Student Added Successfully");
    } catch {
      alert("Error adding student");
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject) {
      alert("Enter subject name");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/add-subject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject_name: newSubject }),
      });

      if (!res.ok) throw new Error();

      setNewSubject("");
      fetchSubjects();
      alert("Subject Added Successfully");
    } catch {
      alert("Error adding subject");
    }
  };

  const handleAddMarks = async () => {
    if (!selectedStudent || !selectedSubject || !grade || !sgpa || !semester || !department) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/add-marks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: selectedStudent,
          subject_id: selectedSubject,
          grade,
          sgpa,
          semester,
          department,
        }),
      });

      if (!res.ok) throw new Error();

      setGrade("");
      setSgpa("");
      setSemester("");
      setDepartment("");
      setSelectedStudent("");
      setSelectedSubject("");

      fetchMarks();
      alert("Marks Added Successfully");
    } catch {
      alert("Error adding marks");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) return <h2 style={{ padding: "20px" }}>Loading...</h2>;

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <h2>{collapsed ? "SA" : "SLEA Admin"}</h2>

        <div className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "➡️" : "⬅️"}
        </div>

        <button onClick={() => setActiveTab("dashboard")}>
          {collapsed ? "📊" : "Dashboard"}
        </button>

        <button onClick={() => setActiveTab("students")}>
          {collapsed ? "👨‍🎓" : "Students"}
        </button>

        <button onClick={() => setActiveTab("subjects")}>
          {collapsed ? "📘" : "Subjects"}
        </button>

        <button onClick={() => setActiveTab("marks")}>
          {collapsed ? "📝" : "Marks"}
        </button>

        <button onClick={handleLogout}>
          {collapsed ? "🚪" : "Logout"}
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className={`main-content ${collapsed ? "collapsed" : ""}`}>

        {activeTab === "dashboard" && (
          <div className="tab-section">
            <h1>Admin Overview</h1>
            <div className="stats">
              <div className="stat-card">
                <h3>Total Students</h3>
                <p>{students.length}</p>
              </div>
              <div className="stat-card">
                <h3>Total Subjects</h3>
                <p>{subjects.length}</p>
              </div>
              <div className="stat-card">
                <h3>Total Marks Entries</h3>
                <p>{marks.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <div className="tab-section">
            <h1>Add Student</h1>
            <div className="form-card">
              <input placeholder="Student Name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
              <input placeholder="Email" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} />
              <input placeholder="Roll Number" value={newStudentRollno} onChange={(e) => setNewStudentRollno(e.target.value)} />
              <input
                type="password"
                placeholder="Password"
                value={newStudentPassword}
                onChange={(e) => setNewStudentPassword(e.target.value)}
              />
              <button onClick={handleAddStudent}>Add Student</button>
            </div>

            <h2>All Students</h2>
            <ul className="list">
              {students.map((s) => (
                <li key={s.id}>
                  {s.name} — {s.rollno} — {s.email}
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "subjects" && (
          <div className="tab-section">
            <h1>Add Subject</h1>
            <div className="form-card">
              <input
                placeholder="Subject Name"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
              <button onClick={handleAddSubject}>Add Subject</button>
            </div>

            <h2>All Subjects</h2>
            <ul className="list">
              {subjects.map((sub) => (
                <li key={sub.id}>{sub.subject_name}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "marks" && (
          <div className="tab-section">
            <h1>Add Marks</h1>
            <div className="form-card">
              <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rollno})
                  </option>
                ))}
              </select>

              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="">Select Subject</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.subject_name}
                  </option>
                ))}
              </select>

              <input placeholder="Grade" value={grade} onChange={(e) => setGrade(e.target.value)} />
              <input placeholder="SGPA" value={sgpa} onChange={(e) => setSgpa(e.target.value)} />
              <input placeholder="Semester" value={semester} onChange={(e) => setSemester(e.target.value)} />
              <input placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />

              <button onClick={handleAddMarks}>Add Marks</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminDashboard;
