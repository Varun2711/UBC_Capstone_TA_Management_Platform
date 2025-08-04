import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Bell,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar,
  Building,
  AlertCircle,
  User,
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  Briefcase,
} from "lucide-react";

import {
  fetchApplicationDetail,
  getApplicationWithFormData,
  formatResponseForDisplay,
  getStatusDisplayInfo,
} from "@/logic/student-view-applications";

import { fetchAppBarProfile } from "@/logic/student-applications";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/student-dashboard-sidebar";
import { Button } from "@/components/ui/button";

// Status badge component
const StatusBadge = ({ status }) => {
  const statusInfo = getStatusDisplayInfo(status);

  const getStatusIcon = (color) => {
    switch (color) {
      case "green":
        return CheckCircle;
      case "red":
        return XCircle;
      case "yellow":
        return Clock;
      case "blue":
        return CheckCircle;
      default:
        return AlertCircle;
    }
  };

  const IconComponent = getStatusIcon(statusInfo.color);

  const colorClasses = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    green: "bg-green-100 text-green-800 border-green-200",
    red: "bg-red-100 text-red-800 border-red-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${
          colorClasses[statusInfo.color]
        }`}
      >
        <IconComponent className="h-4 w-4" />
        {statusInfo.label}
      </span>
      <span className="text-sm text-gray-600">{statusInfo.description}</span>
    </div>
  );
};

// Application header component
const ApplicationHeader = ({ application }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {application.posting?.title || "Untitled Position"}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              {application.posting?.department?.name || "Unknown Department"}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {application.termSelection?.description || "No term selected"}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 mb-2">Application ID</div>
          <div className="font-mono text-lg font-semibold">
            #{application.application_id}
          </div>
        </div>
      </div>

      <StatusBadge status={application.status} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div>
          <div className="text-sm text-gray-600">Submitted</div>
          <div className="font-medium">
            {formatDate(application.applied_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Section component for displaying form sections
const FormSection = ({ section }) => {
  if (!section.questions || section.questions.length === 0) {
    return null;
  }

  // Check if any questions in this section have responses
  const hasResponses = section.questions.some((q) => q.hasResponse);

  if (!hasResponses) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {section.name}
      </h3>
      {section.description && (
        <p className="text-gray-600 mb-4">{section.description}</p>
      )}

      <div className="space-y-4">
        {section.questions
          .filter((question) => question.hasResponse)
          .map((question) => (
            <div
              key={question.question_id}
              className="border-b border-gray-100 pb-4 last:border-b-0"
            >
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {question.question_text}
                </label>

                {question.help_text && (
                  <p className="text-xs text-gray-500">{question.help_text}</p>
                )}

                <div className="text-gray-900">
                  {formatResponseForDisplay(question.response, question)}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

// Static responses component (responses stored directly in Application model)

// Job posting details component
const JobPostingDetails = ({ posting }) => {
  if (!posting) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Position Details
      </h3>

      {posting.description && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-700 mb-2">
            Description
          </h4>
          <p className="text-gray-600 whitespace-pre-wrap">
            {posting.description}
          </p>
        </div>
      )}

      {posting.requirements && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-2">
            Requirements
          </h4>
          <p className="text-gray-600 whitespace-pre-wrap">
            {posting.requirements}
          </p>
        </div>
      )}
    </div>
  );
};

// Sidebar component placeholder

// Main component
export default function ApplicationDetail() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  // State management
  const [student, setStudent] = useState({ name: "", email: "", avatar: "" });
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // Fetch student profile and application details
        const [studentProfile, rawApplication] = await Promise.all([
          fetchAppBarProfile(),
          fetchApplicationDetail(applicationId),
        ]);

        // Process application with form data
        const processedApplication = await getApplicationWithFormData(
          rawApplication
        );

        setStudent(studentProfile || { name: "", email: "", avatar: "" });
        setApplicationData(processedApplication);
      } catch (error) {
        console.error("Error fetching application detail:", error);
        setError("Failed to load application details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      initializeData();
    }
  }, [applicationId]);

  const handleBack = () => {
    navigate("/my-applications");
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar
            name={student.name}
            email={student.email}
            avatar={student.avatar}
          />
          <div className="flex-1">
            <header className="flex h-16 items-center justify-between border-b bg-background px-6">
              <SidebarTrigger />
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </header>
            <main className="flex-1 space-y-6 p-6">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your applications...</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar
            name={student.name}
            email={student.email}
            avatar={student.avatar}
          />
          <div className="flex-1">
            <header className="flex h-16 items-center justify-between border-b bg-background px-6">
              <SidebarTrigger />
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </header>
            <main className="flex-1 space-y-6 p-6">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-4" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          name={student.name}
          email={student.email}
          avatar={student.avatar}
        />
        <div className="flex-1">
          <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 space-y-6 p-6">
            {/* Back button */}
            <button
              onClick={handleBack}
              className="inline-flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </button>

            {/* Application header */}
            <ApplicationHeader application={applicationData.application} />
            {/* Job posting details */}
            <JobPostingDetails posting={applicationData.application.posting} />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Application Responses
            </h2>

            {/* Dynamic form sections */}
            {applicationData.sections &&
              applicationData.sections.map((section) => (
                <FormSection key={section.section_id} section={section} />
              ))}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
