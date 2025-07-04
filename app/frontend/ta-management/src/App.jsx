import { Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TASchedulerDashboard from "./pages/Scheduler_Dashboard";
import Application from "./pages/Application";
import StudentDashboard from "./pages/Student_Dashboard";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import CourseManagement from "./pages/Scheduler/course-management";
import { LandingPage } from "./pages/LandingPage";
import CreateAccount1 from "./pages/CreateAccount1";
import CreateAccount2 from "./pages/CreateAccount2";
import CreateAccount3 from "./pages/CreateAccount3";
import ForgotPassword from "./pages/ForgotPassword";
import UserProfile from "./pages/profile-page-scheduler";
import TaCoordinatorAllocationPage from "./pages/TaCoordinatorAllocationPage";
import InstructorDashboard from "./pages/InstructorDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { USER_TYPES } from "./data/user-types";
import UnauthorizedPage from "./pages/UnauthorizedPage";

function App() {

  return (
    // React Router setup
    <Routes>
      {/* Accessible to: everyone --------------- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Accessible to: non-logged-in user ----- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/create-account/step1" element={<CreateAccount1 />} />
      <Route path="/create-account/step2" element={<CreateAccount2 />} />
      <Route path="/create-account/step3" element={<CreateAccount3 />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Accessible to: student ---------------- */}
      <Route 
        path="/student-dashboard" 
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.student]}>
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/profile" 
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.student]}>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/application" 
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.student]}>
            <Application />
          </ProtectedRoute>
        } 
      />

      {/* Accessible to: instructor -------------- */}
      <Route 
        path="/instructor-dashboard" 
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.instructor]}>
            <InstructorDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Accessible to: scheduler --------------- */}
      <Route 
        path="/scheduler-dashboard" 
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.scheduler]}>
            <TASchedulerDashboard />
          </ProtectedRoute> 
        } 
      />
      
      <Route 
        path="/user-profile-scheduler" 
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.scheduler]}>
            <UserProfile />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/ta-coordinator-allocation" 
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.scheduler]}>
            <TaCoordinatorAllocationPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/course-management" 
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.scheduler]}>
            <CourseManagement />
          </ProtectedRoute>
        } 
      />

      {/* Accessible to: admin ------------------- */}
      <Route 
        path="/admin-dashboard" 
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.admin]}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
  
      {/* Add more routes if needed */}
    </Routes>
  );
}
export default App;
