import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";

import StudentProfile from "./pages/StudentProfile";
import StudentTests from "./components/StudentTests";
import ProtectedTest from "./components/ProtectedTest";
import TeacherAttendance from "./components/TeacherAttendance";
import StudentAttendance from "./components/StudentAttendance";
import TeacherProfile from "./pages/TeacherProfile";
import ProfilePage from "./pages/ProfilePage";

import Layout from "./components/Layout";
import api from "./services/api";

const SESSION_KEY = "user";

function App() {
  // Restore session after a page refresh so users are not silently logged out.
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  });
  const [restoring, setRestoring] = useState(() => Boolean(localStorage.getItem(SESSION_KEY)));

  useEffect(() => {
    let cancelled = false;
    if (currentUser) {
      // Verify the server-side session is still alive.
      api
        .get("/api/auth/me")
        .then((res) => {
          if (cancelled) return;
          if (!res.data || !res.data.role) throw new Error("dead session");
          setCurrentUser(res.data);
          localStorage.setItem(SESSION_KEY, JSON.stringify(res.data));
          setRestoring(false);
        })
        .catch(() => {
          if (cancelled) return;
          handleLogout();
          setRestoring(false);
        });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginSuccess = (data) => {
    setCurrentUser(data);
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  };

  const handleLogout = () => {
    api.post("/api/auth/logout").catch(() => {
      /* session may already be gone; clear locally regardless */
    });
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <Router>
      <Layout user={currentUser} onLogout={handleLogout}>
        {!currentUser ? (
          restoring ? null : (
            <LoginPage onLoginSuccess={handleLoginSuccess} />
          )
        ) : (
          <Routes>

            {/* ================= ADMIN ================= */}
            {currentUser.role === "Admin" && (
              <>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/profile" element={<ProfilePage user={currentUser} />} />
              </>
            )}

            {/* ================= TEACHER ================= */}
            {currentUser.role === "Teacher" && (
              <>
                <Route path="/" element={<TeacherDashboard />} />

                <Route
                  path="/teacher/attendance"
                  element={<TeacherAttendance />}
                />

                <Route
                  path="/profile"
                  element={<TeacherProfile user={currentUser} />}
                />
              </>
            )}

            {/* ================= STUDENT ================= */}
            {currentUser.role === "Student" && (
              <>
                <Route
                  path="/"
                  element={<StudentDashboard user={currentUser} />}
                />
                <Route
                  path="/profile"
                  element={<StudentProfile user={currentUser} />}
                />
                {/* Student Assessments & Coding Workspace */}
                <Route
                  path="/student/tests"
                  element={<StudentTests />}
                />
                {/* Secure proctored test environment */}
                <Route
                  path="/student/tests/:assessmentId/take"
                  element={<ProtectedTest />}
                />
                <Route
                  path="/student/attendance"
                  element={<StudentAttendance />}
                />
              </>
            )}

            {/* ================= INVALID ROUTE ================= */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        )}
      </Layout>
    </Router>
  );
}

export default App;
