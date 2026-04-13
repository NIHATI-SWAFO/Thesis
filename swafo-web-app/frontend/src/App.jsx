import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './features/auth/SignIn';
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './features/dashboard/StudentDashboard';
import StudentProfile from './features/profile/StudentProfile';
import StudentViolations from './features/violations/StudentViolations';
import StudentHandbook from './features/handbook/StudentHandbook';
import StudentSettings from './features/settings/StudentSettings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Route */}
        <Route path="/login" element={<SignIn />} />

        {/* Student Protected Routes */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          {/* Temporary fallbacks for the other nav links */}
          <Route path="profile" element={<StudentProfile />} />
          <Route path="violations" element={<StudentViolations />} />
          <Route path="handbook" element={<StudentHandbook />} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
