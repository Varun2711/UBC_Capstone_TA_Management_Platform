import { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MockDashboard from "./pages/MockDashboard";
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

function App() {

  return (
    // React Router setup
    // Initial test to check router functionlity below
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/TAdashboard" element={<TASchedulerDashboard />} />
      <Route path="/MockDashboard" element={<MockDashboard />} />
      <Route path="/create-account/step1" element={<CreateAccount1 />} />
      <Route path="/create-account/step2" element={<CreateAccount2 />} />
      <Route path="/create-account/step3" element={<CreateAccount3 />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/user-profile-scheduler" element={<UserProfile />} />
      <Route path="/instructor-dashboard" element={<InstructorDashboard/>} />
      <Route path="/application" element={<Application />} />
      <Route path="/ta-coordinator-allocation" element={<TaCoordinatorAllocationPage />} />
      <Route path="/course-management" element={<CourseManagement />} />
      {/* Add more routes if needed */}
    </Routes>
    // <TASchedulerDashboard />
  );
}
export default App;
