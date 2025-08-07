import { Route, Routes } from "react-router-dom";
import { USER_TYPES } from "./data/user-types";

import ProtectedRoute from "./components/ProtectedRoute";
import UnauthorizedPage from "./pages/UnauthorizedPage";

import LoginPage from "./pages/LoginPage";
import TASchedulerDashboard from "./pages/Scheduler_Dashboard";
import ApplicationForm from "./pages/Student/ApplicationForm";
import StudentDashboard from "./pages/Student_Dashboard";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import CourseManagement from "./pages/Scheduler/course-management";
import InstructorRequirements from "./pages/Scheduler/instructor-requirements";
import UserManagement from "./pages/Admin/UserManagement";
import SystemSettings from "./pages/Admin/SystemSetting";
import { LandingPage } from "./pages/LandingPage";
import CreateAccount1 from "./pages/CreateAccount1";
import CreateAccount2 from "./pages/CreateAccount2";
import CreateAccount3 from "./pages/CreateAccount3";
import ResetPasswordController, {
  RESET_PASSWORD_STEPS,
} from "./pages/ResetPassword/ResetPasswordController";
import UserProfile from "./pages/profile-page-scheduler";
import TaCoordinatorAllocationPage from "./pages/Scheduler/TaCoordinatorAllocationPage";
import ViewJobPostings from "./pages/Student/Student_ViewJobPostings";
import InstructorDashboard from "./pages/InstructorDashboard";
import ManageApplications from "./pages/Scheduler/Scheduler_ManageApplications";
import ViewStudentApplication from "./pages/Scheduler/Scheduler_ViewApplication";
import InstructorProfile from "./pages/Instructor/instructor-profile";
import JobPostingManagerPage from "./pages/Scheduler/Scheduler-job-posting-management";
import MyCourses from "./pages/Instructor_MyCourses";
import StudentOffers from "./pages/StudentOffersPage";
import CourseDetails from "./pages/Instructor/CourseDetails";
import InstructorTARequirements from "./pages/Instructor/instructor-ta-requirements";
import SchedulerAssignmentPage from "./pages/Scheduler/Scheduler_AssignmentPage";
import AdminCourseManagement from "./pages/Admin/CourseManagement";
import ViewStudentSchedule from "./pages/Student/Student_Schedule";
import MyApplications from "./pages/Student/MyApplications";
import ApplicationDetail from "./pages/Student/ApplicationDetail";

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
      <Route path="/reset-password" element={<ResetPasswordController />} />

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
        path="/apply/jobposting/:postingId"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.student]}>
            <ApplicationForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/apply"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.student]}>
            <ViewJobPostings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student-offers"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.student]}>
            <StudentOffers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/schedule"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.student]}>
            <ViewStudentSchedule />
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

      <Route
        path="/instructor-profile"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.instructor]}>
            <InstructorProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-courses"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.instructor]}>
            <MyCourses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ta-requirements"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.instructor]}>
            <InstructorTARequirements />
          </ProtectedRoute>
        }
      />

      <Route
        path="/course-details/:courseId/:term"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.instructor]}>
            <CourseDetails />
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

      <Route
        path="/instructor-management"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.scheduler]}>
            <InstructorRequirements />
          </ProtectedRoute>
        }
      />

      <Route
        path="/assignment-management"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.scheduler]}>
            <SchedulerAssignmentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manage-applications"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.scheduler]}>
            <ManageApplications />
          </ProtectedRoute>
        }
      />

      <Route
        path="manage-applications/view/:applicationid"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.scheduler]}>
            <ViewStudentApplication />
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
      <Route
        path="/user-management"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.admin]}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-course-management"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.admin]}>
            <AdminCourseManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/system-settings"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.admin]}>
            <SystemSettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manage-templates"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.scheduler]}>
            <JobPostingManagerPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-applications"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.student]}>
            <MyApplications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-applications/detail/:applicationId"
        element={
          <ProtectedRoute authorizedRoles={[USER_TYPES.student]}>
            <ApplicationDetail />
          </ProtectedRoute>
        }
      />

      {/* Add more routes if needed */}
    </Routes>
  );
}
export default App;
