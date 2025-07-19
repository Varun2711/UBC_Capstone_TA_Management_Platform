import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Filter,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Bell,
  Star,
  StarOff,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/scheduler-sidebar";
import { Button } from "@/components/ui/button";
import SearchFilters from "@/components/application-management/SearchFilters";

// Import logic layer functions
import {
  fetchApplicationManagementData,
  enrichApplicationsWithShortlistStatus,
  addToShortlist,
  removeFromShortlist,
  getStatusConfig,
  getPositionTypeConfig,
  formatDate,
  handleApiError,
} from "@/logic/application-management";

export default function ManageApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    positionType: "",
    discipline: "",
    workload: "",
    term_code: "",
    fullTimeEnrollment: "",
    hasOtherPositions: "",
  });

  useEffect(() => {
    loadApplications();
  }, [filters, searchQuery]);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build filter params
      const queryParams = {
        status: "submitted", // Only show submitted applications for management
        ...filters,
        search: searchQuery,
      };

      // Remove empty filters
      Object.keys(queryParams).forEach((key) => {
        if (!queryParams[key]) delete queryParams[key];
      });

      console.log("Loading applications with params:", queryParams);

      // Use logic layer to fetch applications
      const data = await fetchApplicationManagementData(queryParams);

      // Enrich applications with shortlist status
      const applicationsWithShortlistStatus =
        await enrichApplicationsWithShortlistStatus(data.applications);

      //  console.log(
      //    "Applications with shortlist status:",
      //   applicationsWithShortlistStatus
      // );
      setApplications(applicationsWithShortlistStatus);
    } catch (error) {
      console.error("Error loading applications:", error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      positionType: "",
      discipline: "",
      workload: "",
      term_code: "",
      fullTimeEnrollment: "",
      hasOtherPositions: "",
    });
    setSearchQuery("");
  };

  const handleViewApplication = (application) => {
    // Navigate to the single application page with the application ID
    const url = `/manage-applications/view/${application.application_id}`;
    window.open(url, "_blank");
  };

  const getStatusBadge = (status) => {
    const config = getStatusConfig(status);
    const Icon = {
      submitted: Clock,
      accepted: CheckCircle,
      rejected: XCircle,
    }[status];

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
      >
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {config.label}
      </span>
    );
  };

  const getPositionTypeBadge = (positionType) => {
    const config = getPositionTypeConfig(positionType);

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const handleQuickShortlist = async (application, event) => {
    event.stopPropagation(); // Prevent navigation when clicking shortlist button

    try {
      await addToShortlist(application.application_id);
      console.log("Application shortlisted successfully");

      // Update local state
      const updatedApplications = applications.map((app) =>
        app.application_id === application.application_id
          ? { ...app, isShortlisted: true }
          : app
      );
      setApplications(updatedApplications);
    } catch (error) {
      console.error("Error shortlisting application:", error);
      setError(handleApiError(error));
    }
  };

  const handleRemoveShortlist = async (application, event) => {
    event.stopPropagation();

    try {
      await removeFromShortlist(application.application_id);
      console.log("Application removed from shortlist successfully");

      // Update local state
      const updatedApplications = applications.map((app) =>
        app.application_id === application.application_id
          ? { ...app, isShortlisted: false }
          : app
      );
      setApplications(updatedApplications);
    } catch (error) {
      console.error("Error removing from shortlist:", error);
      setError(handleApiError(error));
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar activePage="Application Management" />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Applications
                </h1>
                <p className="text-sm text-gray-600">
                  View and manage student applications for TA positions
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Refresh Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadApplications}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setError(null)}
                    className="mt-2"
                  >
                    Dismiss
                  </Button>
                </div>
              )}

              {/* Use the updated SearchFilters component */}
              <SearchFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filters={filters}
                handleFilterChange={handleFilterChange}
                clearFilters={clearFilters}
                showAllStatusOptions={false} // Only show relevant statuses for management
              />

              {/* Applications Table */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Applications ({applications.length})
                    </h3>
                    {applications.length > 0 && (
                      <div className="text-sm text-gray-500">
                        {applications.filter((app) => app.isShortlisted).length}{" "}
                        shortlisted
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">
                        Loading applications...
                      </span>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Position
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Applied
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {applications.map((application) => (
                          <tr
                            key={application.application_id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {application.student.name}
                                  </div>
                                  {application.isShortlisted && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <Star className="w-3 h-3 mr-1" />
                                      Shortlisted
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {application.student.student_number}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs">
                                <div className="font-medium truncate">
                                  {application.posting.title}
                                </div>
                                <div className="text-gray-500">
                                  {application.posting.department.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getPositionTypeBadge(application.positionType)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(application.applied_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleViewApplication(application)
                                  }
                                  className="inline-flex items-center text-blue-600 hover:text-blue-900 p-1 rounded"
                                  title="View Application"
                                >
                                  <Eye className="h-5 w-5" />
                                </button>
                                {application.isShortlisted ? (
                                  <button
                                    onClick={(e) =>
                                      handleRemoveShortlist(application, e)
                                    }
                                    data-testid="remove-shortlist-btn"
                                    className="inline-flex items-center text-red-600 hover:text-red-900 p-1 rounded"
                                    title="Remove from Shortlist"
                                  >
                                    <StarOff className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) =>
                                      handleQuickShortlist(application, e)
                                    }
                                    data-testid="quick-shortlist-btn"
                                    className="inline-flex items-center text-green-600 hover:text-green-900 p-1 rounded"
                                    title="Quick Shortlist"
                                  >
                                    <Star className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {!loading && applications.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">
                        No applications found matching your criteria.
                      </p>
                      <p className="text-sm text-gray-400">
                        Try adjusting your filters or search terms.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
