import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ================= STATES =================
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState([]);

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [sgpa, setSgpa] = useState("");
  const [semester, setSemester] = useState("");
  const [department, setDepartment] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= LOAD DATA =================
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([fetchStudents(), fetchSubjects(), fetchMarks()]);
    } catch (error) {
      console.log("Loading error:", error);
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
      setStudents(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.log("Students fetch error:", err);
      setStudents([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch("http://localhost:5000/subjects");
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.log("Subjects fetch error:", err);
      setSubjects([]);
    }
  };

  const fetchMarks = async () => {
    try {
      const res = await fetch("http://localhost:5000/all-marks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("Marks API:", data);
      setMarks(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.log("Marks fetch error:", err);
      setMarks([]);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // ================= ADD / UPDATE MARKS =================
  const handleSubmit = async () => {
    if (
      !selectedStudent ||
      !selectedSubject ||
      !grade ||
      !sgpa ||
      !semester ||
      !department
    ) {
      alert("Please fill all fields");
      return;
    }

    const url = editingId
      ? `http://localhost:5000/update-marks/${editingId}`
      : "http://localhost:5000/add-marks";

    const method = editingId ? "PUT" : "POST";

    try {
      await fetch(url, {
        method: method,
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

      resetForm();
      fetchMarks();
    } catch (error) {
      console.log("Submit error:", error);
    }
  };

  const handleEdit = (mark) => {
    setEditingId(mark.id);
    setSelectedStudent(mark.student_id);
    setSelectedSubject(mark.subject_id);
    setGrade(mark.grade);
    setSgpa(mark.sgpa);
    setSemester(mark.semester);
    setDepartment(mark.department);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/delete-marks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMarks();
    } catch (error) {
      console.log("Delete error:", error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedStudent("");
    setSelectedSubject("");
    setGrade("");
    setSgpa("");
    setSemester("");
    setDepartment("");
  };

  if (loading) {
    return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
  }

  return (
    <div style={styles.container}>
      <h1>Admin Dashboard</h1>

      {/* ADD / EDIT FORM */}
      <div style={styles.card}>
        <h2>{editingId ? "Edit Marks" : "Add Marks"}</h2>

        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
        >
          <option value="">Select Student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">Select Subject</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.subject_name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />

        <input
          type="number"
          step="0.01"
          placeholder="SGPA"
          value={sgpa}
          onChange={(e) => setSgpa(e.target.value)}
        />

        <input
          type="number"
          placeholder="Semester"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        />

        <input
          type="text"
          placeholder="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />

        <button onClick={handleSubmit}>
          {editingId ? "Update Marks" : "Add Marks"}
        </button>
      </div>

      {/* MARKS TABLE */}
      <div style={styles.card}>
        <h2>All Marks</h2>

        {marks.length === 0 ? (
          <p>No marks available</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Subject</th>
                <th>Grade</th>
                <th>SGPA</th>
                <th>Semester</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m) => (
                <tr key={m.id}>
                  <td>{m.student_name || m.student_id}</td>
                  <td>{m.subject_name || m.subject_id}</td>
                  <td>{m.grade}</td>
                  <td>{m.sgpa}</td>
                  <td>{m.semester}</td>
                  <td>{m.department}</td>
                  <td>
                    <button onClick={() => handleEdit(m)}>Edit</button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      style={{ background: "red", color: "white" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <br />
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    fontFamily: "Arial",
    background: "#f4f6f9",
    minHeight: "100vh",
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "30px",
    boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
};

export default AdminDashboard;
