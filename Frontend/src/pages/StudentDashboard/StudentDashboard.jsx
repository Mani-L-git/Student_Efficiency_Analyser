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
  ResponsiveContainer
} from "recharts";

function StudentDashboard() {
  const navigate = useNavigate();

  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);

  const studentId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!studentId || !token) {
      navigate("/");
    } else {
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchMarks(),
        fetchStudent(),
        fetchAttendance()
      ]);
      setLoading(false);
    } catch (error) {
      console.log("Error loading data:", error);
      setLoading(false);
    }
  };

  const fetchMarks = async () => {
    const res = await fetch(
      `http://localhost:5000/student-marks/${studentId}`
    );
    const data = await res.json();
    setMarks(Array.isArray(data) ? data : []);
  };

  const fetchStudent = async () => {
    const res = await fetch(
      `http://localhost:5000/student/${studentId}`
    );
    const data = await res.json();
    setStudentName(data?.name || "");
  };

  const fetchAttendance = async () => {
    const res = await fetch(
      `http://localhost:5000/student-attendance/${studentId}`
    );
    const data = await res.json();
    setAttendance(Array.isArray(data) ? data : []);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // FILTER MARKS
  const filteredMarks =
    selectedSemester === "All"
      ? marks
      : marks.filter(
          (m) => String(m.semester) === selectedSemester
        );

  // CALCULATE CGPA
  const overallCGPA =
    filteredMarks.length > 0
      ? (
          filteredMarks.reduce(
            (sum, m) => sum + Number(m.sgpa || 0),
            0
          ) / filteredMarks.length
        ).toFixed(2)
      : "0.00";

  // CALCULATE ATTENDANCE
  const overallAttendance =
    attendance.length > 0
      ? (
          attendance.reduce(
            (sum, a) =>
              sum + Number(a.attendance_percentage || 0),
            0
          ) / attendance.length
        ).toFixed(2)
      : "0.00";

  if (loading) return <h2 style={{ padding: "20px" }}>Loading...</h2>;

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2>SLEA</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="main-content">
        <h1>Welcome, {studentName || "Student"}</h1>

        {/* SUMMARY */}
        <div className="summary">
          <div className="summary-card">
            <h3>Total Subjects</h3>
            <p>{filteredMarks.length}</p>
          </div>

          <div className="summary-card">
            <h3>Overall SGPA</h3>
            <p>{overallCGPA}</p>
          </div>

          <div className="summary-card">
            <h3>Overall Attendance</h3>
            <p>{overallAttendance}%</p>
          </div>
        </div>

        {/* SEMESTER FILTER */}
        <select
          value={selectedSemester}
          onChange={(e) =>
            setSelectedSemester(e.target.value)
          }
          style={{ marginBottom: "20px", padding: "8px" }}
        >
          <option value="All">All Semesters</option>
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
          <option value="3">Semester 3</option>
          <option value="4">Semester 4</option>
        </select>

        {/* CHART */}
        <h2>Performance Chart</h2>
        <div
          style={{
            width: "100%",
            height: 300,
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            marginBottom: "30px"
          }}
        >
          {filteredMarks.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
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

        {/* SUBJECT CARDS */}
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

        {/* ATTENDANCE */}
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
