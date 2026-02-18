import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function StudentDashboard() {
  const navigate = useNavigate();

  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [loading, setLoading] = useState(true);

  const studentId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!studentId || !token) {
      navigate("/");
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([fetchMarks(), fetchStudent(), fetchAttendance()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarks = async () => {
    try {
      const res = await fetch(`http://localhost:5000/student-marks/${studentId}`, {
       headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMarks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Marks error:", err);
      setMarks([]);
    }
  };

  const fetchStudent = async () => {
    try {
      const res = await fetch(`http://localhost:5000/student/${studentId}`, {
       headers: { Authorization: `Bearer ${token}` },

      });
      const data = await res.json();
      setStudentName(data?.name || "Student");
    } catch (err) {
      console.error("Student error:", err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`http://localhost:5000/student-attendance/${studentId}`, {
       headers: { Authorization: `Bearer ${token}` },

      });
      const data = await res.json();
      setAttendance(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Attendance error:", err);
      setAttendance([]);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Filter by semester
  const filteredMarks =
    selectedSemester === "All"
      ? marks
      : marks.filter((m) => String(m.semester) === selectedSemester);

  // Calculate CGPA
  const overallCGPA =
    filteredMarks.length > 0
      ? (
          filteredMarks.reduce((sum, m) => sum + Number(m.sgpa || 0), 0) /
          filteredMarks.length
        ).toFixed(2)
      : "0.00";

  // Calculate Attendance
  const overallAttendance =
    attendance.length > 0
      ? (
          attendance.reduce(
            (sum, a) => sum + Number(a.attendance_percentage || 0),
            0
          ) / attendance.length
        ).toFixed(2)
      : "0.00";

  //  FIX: Semester enum 1–8
  const semesters = ["All", "1", "2", "3", "4", "5", "6", "7", "8"];

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>SLEA</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/*  studentName */}
       
        <h1>Welcome, {studentName || "Student"}</h1> 

        {/* Summary Cards */}
        <div className="summary">
          <div className="summary-card">
            <h3>Total Subjects</h3>
            <p>{filteredMarks.length}</p>
          </div>

          <div className="summary-card">
            <h3>Overall CGPA</h3>
            <p>{overallCGPA}</p>
          </div>

          <div className="summary-card">
            <h3>Overall Attendance</h3>
            <p>{overallAttendance}%</p>
          </div>
        </div>

        {/* Semester Filter */}
        <div className="filter-container">
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
            {semesters.map((sem) => (
              <option key={sem} value={sem}>
                {sem === "All" ? "All Semesters" : `Semester ${sem}`}
              </option>
            ))}
          </select>
        </div>

        {/* Performance Chart */}
        <h2>Performance Chart</h2>
        <div className="chart-container">
          {filteredMarks.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredMarks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject_name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="sgpa" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No marks available</p>
          )}
        </div>

        {/* Subjects */}
        <h2>Your Subjects</h2>
        <div className="cards">
          {filteredMarks.length > 0 ? (
            filteredMarks.map((mark, index) => (
              <div key={index} className="card">
                <h3>{mark.subject_name}</h3>
                <p>Grade: {mark.grade}</p>
                <p>SGPA: {mark.sgpa}</p>
                <p>Semester: {mark.semester}</p>
                <p>Department: {mark.department}</p>
              </div>
            ))
          ) : (
            <p>No subjects found</p>
          )}
        </div>

        {/* Attendance */}
        <h2>Attendance</h2>
        <div className="cards">
          {attendance.length > 0 ? (
            attendance.map((att, index) => (
              <div key={index} className="card">
                <h3>{att.subject_name}</h3>
                <p>Attendance: {att.attendance_percentage}%</p>
                <p>Semester: {att.semester}</p>
              </div>
            ))
          ) : (
            <p>No attendance data</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
