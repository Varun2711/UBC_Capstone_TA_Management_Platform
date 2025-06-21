import { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MockDashboard from "./pages/MockDashboard";
import TASchedulerDashboard from "./pages/Scheduler_Dashboard";

import StudentDashboard from "./pages/Student_Dashboard";
import { LandingPage } from "./pages/LandingPage";
import CreateAccount1 from "./pages/CreateAccount1";
import CreateAccount2 from "./pages/CreateAccount2";
import CreateAccount3 from "./pages/CreateAccount3";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    // React Router setup
    // Initial test to check router functionlity below
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/TAdashboard" element={< TASchedulerDashboard/>} />
      <Route path="/MockDashboard" element={<MockDashboard />} />
      <Route path="/create-account/step1" element={<CreateAccount1 />} />
      <Route path="/create-account/step2" element={<CreateAccount2 />} />
      <Route path="/create-account/step3" element={<CreateAccount3 />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      {/* Add more routes if needed */}
    </Routes>
    // <TASchedulerDashboard />
  );
}
export default App;
