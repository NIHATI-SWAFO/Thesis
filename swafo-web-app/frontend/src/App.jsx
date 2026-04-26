import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './features/auth/SignIn';
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './features/dashboard/StudentDashboard';
import StudentProfile from './features/profile/StudentProfile';
import StudentViolations from './features/violations/StudentViolations';
import StudentHandbook from './features/handbook/StudentHandbook';
import StudentSettings from './features/settings/StudentSettings';
import ChatBot from './features/chatbot/ChatBot';
import OfficerLayout from './layouts/OfficerLayout';
import OfficerDashboard from './features/dashboard/OfficerDashboard';
import PatrolMonitoring from './features/patrols/PatrolMonitoring';
import MobilePatrolFlow from './features/patrols/mobile/MobilePatrolFlow';
import RecordViolation from './features/violations/RecordViolation';
import CaseManagement from './features/cases/CaseManagement';
import StudentRecords from './features/students/StudentRecords';
import StudentProfileDetail from './features/students/StudentProfileDetail';
import ReportsAnalytics from './features/analytics/ReportsAnalytics';
import PatrolHistory from './features/patrols/PatrolHistory';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './features/dashboard/AdminDashboard';
import MapTrial from './features/maps/MapTrial';

import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          <Route path="chatbot" element={<ChatBot />} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>

        {/* Officer Protected Routes */}
        <Route path="/officer" element={<OfficerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<OfficerDashboard />} />
          <Route path="patrols" element={<PatrolMonitoring />} />
          <Route path="patrols/select" element={<MobilePatrolFlow initialScreen="selectArea" />} />
          <Route path="patrols/live" element={<MobilePatrolFlow initialScreen="liveMap" />} />
          <Route path="patrols/expanded-map" element={<MobilePatrolFlow initialScreen="fullMap" />} />
          <Route path="patrols/summary" element={<MobilePatrolFlow initialScreen="dynamicSummary" />} />
          <Route path="patrols/history/:id" element={<MobilePatrolFlow initialScreen="archive" />} />
          
          <Route path="reports" element={<ReportsAnalytics />} />
          <Route path="patrol-history" element={<PatrolHistory />} />

          <Route path="violations/new" element={<RecordViolation />} />
          <Route path="cases" element={<CaseManagement />} />
          <Route path="students" element={<StudentRecords />} />
          <Route path="students/:id" element={<StudentProfileDetail />} />
          <Route path="campus-map" element={<MapTrial />} />
          {/* Fallback for unfinished pages */}
          <Route path="*" element={<div className="p-8 text-2xl font-bold font-pjs">Under Construction</div>} />
        </Route>

        {/* Admin Protected Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="cases" element={<CaseManagement role="admin" />} />
          <Route path="students" element={<StudentRecords role="admin" />} />
          <Route path="students/:id" element={<StudentProfileDetail role="admin" />} />
          <Route path="patrols" element={<PatrolHistory role="admin" />} />
          <Route path="analytics" element={<ReportsAnalytics role="admin" />} />
          <Route path="handbook" element={<StudentHandbook role="admin" />} />
          <Route path="campus-map" element={<MapTrial />} />
          <Route path="users" element={<div className="p-12"><h1 className="text-3xl font-black text-[#003624] mb-4">User Management</h1><p className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">Control student and officer access levels.</p><div className="mt-12 p-20 border-2 border-dashed border-emerald-100 rounded-[3rem] text-center text-emerald-200 font-black uppercase tracking-widest">Interface Module Loading...</div></div>} />
          <Route path="*" element={<div className="p-12 text-2xl font-bold font-pjs">Admin Module Under Construction</div>} />
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
