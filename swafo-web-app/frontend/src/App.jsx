import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './features/auth/SignIn';
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './features/dashboard/StudentDashboard';

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
          <Route path="profile" element={<div className="p-10 font-bold text-gray-500">Profile View Pending</div>} />
          <Route path="violations" element={<div className="p-10 font-bold text-gray-500">Violations View Pending</div>} />
          <Route path="handbook" element={<div className="p-10 font-bold text-gray-500">Handbook View Pending</div>} />
          <Route path="settings" element={<div className="p-10 font-bold text-gray-500">Settings View Pending</div>} />
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
