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
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8080/api",
});

export default function ManageApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
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
    //respond to filters and search query
    const loadApplications = async () => {
      try {
        const queryParams = {
          ...filters,
          search: searchQuery,
        };

        // Remove empty filters
        Object.keys(queryParams).forEach((key) => {
          if (!queryParams[key]) delete queryParams[key];
        });

        console.log(queryParams);

        const response = await instance.get("/ajp/applications/", {
          params: {
            status: "submitted", // Only show submitted applications open positions
            ...queryParams, // Pass all the filters and search query
          },
        });

        console.log(response.data);
        //setApplications(response.data);

        // Check if applications have been shortlisted
        const applicationsWithShortlistStatus = await Promise.all(
          response.data.map(async (app) => {
            const isShortlisted = await getShortlistStatus(app.application_id); // Fixed function name
            return { ...app, isShortlisted };
          })
        );

        console.log(
          "Applications with shortlist status:",
          applicationsWithShortlistStatus
        );
        setApplications(applicationsWithShortlistStatus); // Only set once
      } catch (error) {
        console.error("Error loading applications:", error);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [filters, searchQuery]);

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
    // navigate(`/manage-applications/view/${application.application_id}`);
    //  window.open(url, '_blank');
    const url = `/manage-applications/view/${application.application_id}`;
    window.open(url, "_blank");
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: {
        variant: "default",
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800",
      },
      accepted: {
        variant: "default",
        icon: CheckCircle,
        className: "bg-green-100 text-green-800",
      },
      rejected: {
        variant: "destructive",
        icon: XCircle,
        className: "bg-red-100 text-red-800",
      },
      withdrawn: {
        variant: "outline",
        icon: null,
        className: "bg-gray-100 text-gray-600",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
      >
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const getPositionTypeBadge = (positionType) => {
    const typeConfig = {
      UTA: {
        label: "Undergraduate TA",
        className: "bg-blue-100 text-blue-800",
      },
      GTA2: {
        label: "Graduate TA 2",
        className: "bg-purple-100 text-purple-800",
      },
      GTA1: {
        label: "Graduate TA 1 (Ph.D)",
        className: "bg-orange-100 text-orange-800",
      },
    };

    const config = typeConfig[positionType] || {
      label: positionType,
      className: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getShortlistStatus = async (applicationId) => {
    try {
      const response = await instance.get(
        `/ajp/application-shortlists/by-application/${applicationId}/exists/`
      );
      console.log("Shortlist status response:", response.data);
      // If the response has data, it means the application is shortlisted
      return response.data.shortlisted;
    } catch (error) {
      console.error("Error checking shortlist status:", error);
      return false;
    }
  };

  // Add shortlist functionality to the applications table
  const handleQuickShortlist = async (application, event) => {
    event.stopPropagation(); // Prevent navigation when clicking shortlist button

    try {
      const payload = {
        application_id: application.application_id,
        created_by_id: null, // Null for now as user profile endpoint doesn't return scheduler pk
      };

      const response = await instance.post(
        `/ajp/application-shortlists/`,
        payload
      );

      console.log("Application shortlisted successfully:", response.data);

      // Reload applications to reflect changes
      const updatedApplications = applications.map((app) =>
        app.application_id === application.application_id
          ? { ...app, isShortlisted: true }
          : app
      );
      setApplications(updatedApplications);
    } catch (error) {
      console.error("Error shortlisting application:", error);
      // You might want to show a toast notification here
    }
  };

  const handleRemoveShortlist = async (application, event) => {
    event.stopPropagation();

    try {
      const shortlistResponse = await instance.get(
        `/ajp/application-shortlists/by-application/${application.application_id}/`
      );

      if (shortlistResponse.data.length > 0) {
        const shortlistId = shortlistResponse.data[0].id;
        await instance.delete(`/ajp/application-shortlists/${shortlistId}/`);

        // Update local state
        const updatedApplications = applications.map((app) =>
          app.application_id === application.application_id
            ? { ...app, isShortlisted: false }
            : app
        );
        setApplications(updatedApplications);
      }
    } catch (error) {
      console.error("Error removing from shortlist:", error);
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
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              {/* Use the separated SearchFilters component */}
              <SearchFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filters={filters}
                handleFilterChange={handleFilterChange}
                clearFilters={clearFilters}
              />
              {/* Applications Table */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Applications ({applications.length})
                  </h3>
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
                                {/* <div className="text-sm">
                                  {getStatusBadge(application.status)}
                                </div> */}
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleViewApplication(application)
                                  }
                                  className="inline-flex items-center text-blue-600 hover:text-blue-900 p-1 rounded"
                                  title="View Application"
                                >
                                  <Eye className="h-5 w-5 ml-1" />
                                </button>
                                {application.isShortlisted ? (
                                  <button
                                    onClick={(e) =>
                                      handleRemoveShortlist(application, e)
                                    }
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
                      <p className="text-gray-500">
                        No applications found matching your criteria.
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
