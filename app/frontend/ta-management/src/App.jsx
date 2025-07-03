import { Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TASchedulerDashboard from "./pages/Scheduler_Dashboard";
import StudentDashboard from "./pages/Student_Dashboard";
import { LandingPage } from "./pages/LandingPage";
import CreateAccount1 from "./pages/CreateAccount1";
import CreateAccount2 from "./pages/CreateAccount2";
import CreateAccount3 from "./pages/CreateAccount3";
import ForgotPassword from "./pages/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    // React Router setup
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/scheduler-dashboard" 
        element={
          <ProtectedRoute authorizedRoles={["scheduler"]}>
            < TASchedulerDashboard/>
          </ProtectedRoute> 
        } 
      />
      <Route path="/create-account/step1" element={<CreateAccount1 />} />
      <Route path="/create-account/step2" element={<CreateAccount2 />} />
      <Route path="/create-account/step3" element={<CreateAccount3 />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route 
        path="/student-dashboard" 
        element={
          <ProtectedRoute authorizedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      {/* Add more routes if needed */}
    </Routes>
  );
}
export default App;
