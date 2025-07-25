import { useEffect, useState } from "react";
import {
  Bell,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar,
  Building,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/student-dashboard-sidebar";
import { useNavigate } from "react-router-dom";
import { fetchAppBarProfile } from "@/logic/student-applications";
import { fetchStudentApplications } from "@/logic/student-view-applications";

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return {
          icon: CheckCircle,
          className: "bg-blue-100 text-blue-800 border border-blue-200",
          label: "Submitted",
        };
      case "under_review":
        return {
          icon: Clock,
          className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
          label: "Under Review",
        };
      case "accepted":
        return {
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 border border-green-200",
          label: "Accepted",
        };
      case "rejected":
      case "no longer in consideration":
        return {
          icon: XCircle,
          className: "bg-red-100 text-red-800 border border-red-200",
          label: "Not Selected",
        };
      case "withdrawn":
        return {
          icon: AlertCircle,
          className: "bg-gray-100 text-gray-800 border border-gray-200",
          label: "Withdrawn",
        };

      default:
        return {
          icon: AlertCircle,
          className: "bg-gray-100 text-gray-600 border border-gray-200",
          label: status || "Unknown",
        };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      <IconComponent className="h-3 w-3" />
      {config.label}
    </span>
  );
};

// Application card component
const ApplicationCard = ({ application, onClick }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6"
      onClick={() => onClick(application)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {application.posting?.title || "Untitled Position"}
          </h3>
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
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={application.status} />
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Application ID:</span>
          <div className="font-mono text-gray-900">
            #{application.application_id}
          </div>
        </div>
        <div>
          <span className="text-gray-600">Applied:</span>
          <div className="text-gray-900">
            {formatDate(application.applied_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty state component
const EmptyState = ({ onCreateNew }) => (
  <div className="text-center py-12">
    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      No applications yet
    </h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">
      You haven't submitted any TA applications yet. Browse available positions
      and start your first application.
    </p>
    <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
      <Plus className="h-4 w-4 mr-2" />
      Browse Open Positions
    </Button>
  </div>
);

export default function MyApplications() {
  const navigate = useNavigate();

  // State management
  const [student, setStudent] = useState({ name: "", email: "", avatar: "" });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const [applicationsData, studentProfile] = await Promise.all([
          fetchStudentApplications(),
          fetchAppBarProfile(),
        ]);

        setApplications(applicationsData || []);
        setStudent(studentProfile || { name: "", email: "", avatar: "" });
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load your applications. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleApplicationClick = (application) => {
    // Navigate to application details page
    navigate(`/my-applications/detail/${application.application_id}`);
  };

  const handleCreateNew = () => {
    // Navigate to browse positions page
    navigate("/apply");
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
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  My Applications
                </h1>
                <p className="text-gray-600 mt-1">
                  View and track your TA position applications
                </p>
              </div>
              <Button
                onClick={handleCreateNew}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Application
              </Button>
            </div>

            {/* Applications List */}
            {applications.length === 0 ? (
              <EmptyState onCreateNew={handleCreateNew} />
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <ApplicationCard
                    key={application.application_id}
                    application={application}
                    onClick={handleApplicationClick}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
