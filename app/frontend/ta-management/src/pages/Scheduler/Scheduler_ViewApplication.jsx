import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  User,
  GraduationCap,
  FileText,
  Award,
  BookOpen,
  Star,
  StarOff,
  RefreshCw,
  Calendar,
  Building,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Briefcase,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/scheduler-sidebar";

// Import logic layer functions
import {
  fetchApplicationById,
  checkApplicationShortlisted,
  addToShortlist,
  removeFromShortlist,
  getStatusConfig,
  getPositionTypeConfig,
  formatDate,
  formatDateTime,
  formatDisciplineRankings,
  handleApiError,
} from "@/logic/application-management";

// Import functions from student-view-applications for consistency
import {
  getApplicationWithFormData,
  formatResponseForDisplay,
  getStatusDisplayInfo,
  fetchApplicationDocuments,
  downloadDocument,
} from "@/logic/student-view-applications";

// Documents section component
const DocumentsSection = ({ applicationId }) => {
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState(null);

  useEffect(() => {
    if (applicationId) {
      loadDocuments();
    }
  }, [applicationId]);

  const loadDocuments = async () => {
    try {
      setDocumentsLoading(true);
      setDocumentsError(null);
      const docs = await fetchApplicationDocuments(applicationId);
      setDocuments(docs || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      setDocumentsError("Failed to load documents");
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      await downloadDocument(documentId, fileName);
    } catch (error) {
      console.error("Error downloading document:", error);
      setDocumentsError("Failed to download document");
    }
  };

  if (documentsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submitted Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Submitted Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documentsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{documentsError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDocuments}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {documents.length === 0 ? (
          <p className="text-gray-600">
            No documents submitted with this application.
          </p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.document_id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{doc.file_name}</p>
                    <p className="text-sm text-gray-600">
                      Uploaded {formatDateTime(doc.uploaded_at)}
                      {doc.file_size &&
                        ` • ${Math.round(doc.file_size / 1024)} KB`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc.document_id, doc.file_name)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Status badge component (updated to match ApplicationDetail.jsx style)
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
    </div>
  );
};

// Application header component (similar to ApplicationDetail.jsx)
const ApplicationHeader = ({
  application,
  shortlisted,
  onShortlistToggle,
  shortlistLoading,
}) => {
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
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {application.student?.name || "Unknown Student"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-2">Application ID</div>
            <div className="font-mono text-lg font-semibold">
              #{application.application_id}
            </div>
          </div>

          {/* Shortlist button */}
          {shortlisted ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <Star className="w-4 h-4 mr-1" />
                Shortlisted
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShortlistToggle(false)}
                disabled={shortlistLoading}
                className="text-red-600 hover:text-red-700"
              >
                {shortlistLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <StarOff className="h-4 w-4 mr-2" />
                )}
                Remove from Shortlist
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => onShortlistToggle(true)}
              disabled={shortlistLoading}
            >
              {shortlistLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Star className="h-4 w-4 mr-2" />
              )}
              Shortlist Application
            </Button>
          )}
        </div>
      </div>

      <StatusBadge status={application.status} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div>
          <div className="text-sm text-gray-600">Submitted</div>
          <div className="font-medium">
            {formatDateTime(application.applied_at)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Student Number</div>
          <div className="font-medium">
            {application.student?.student_number || "N/A"}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Position Type</div>
          <div className="font-medium">
            {getPositionTypeConfig(application.positionType).label}
          </div>
        </div>
      </div>
    </div>
  );
};

// Form section component for displaying dynamic responses (similar to ApplicationDetail.jsx)
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">{section.name}</CardTitle>
        {section.description && (
          <p className="text-gray-600 text-sm">{section.description}</p>
        )}
      </CardHeader>
      <CardContent>
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
                    <p className="text-xs text-gray-500">
                      {question.help_text}
                    </p>
                  )}

                  <div className="text-gray-900">
                    {formatResponseForDisplay(question.response, question)}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Job posting details component (similar to ApplicationDetail.jsx)
const JobPostingDetails = ({ posting }) => {
  if (!posting) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Position Details
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default function ViewStudentApplication() {
  const { applicationid } = useParams();
  const [application, setApplication] = useState(null);
  const [applicationData, setApplicationData] = useState(null);
  const [shortlisted, setShortlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (applicationid) {
      loadStudentApplication();
    }
  }, [applicationid]);

  const loadStudentApplication = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch application details using logic layer
      const rawApplication = await fetchApplicationById(applicationid);
      setApplication(rawApplication);

      // Process application with form data (similar to ApplicationDetail.jsx)
      const processedApplication = await getApplicationWithFormData(
        rawApplication
      );
      setApplicationData(processedApplication);

      // Check shortlist status
      const isShortlisted = await checkApplicationShortlisted(applicationid);
      setShortlisted(isShortlisted);
    } catch (error) {
      console.error("Error loading application:", error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleShortlistToggle = async (shouldShortlist) => {
    setShortlistLoading(true);
    setError(null);

    try {
      if (shouldShortlist) {
        await addToShortlist(applicationid);
        console.log("Application shortlisted successfully");
        setShortlisted(true);
      } else {
        await removeFromShortlist(applicationid);
        console.log("Application removed from shortlist successfully");
        setShortlisted(false);
      }
    } catch (error) {
      console.error("Error updating shortlist:", error);
      setError(handleApiError(error));
    } finally {
      setShortlistLoading(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar activePage="Applications" />
        <SidebarInset>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading application...</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !application) {
    return (
      <SidebarProvider>
        <AppSidebar activePage="Applications" />
        <SidebarInset>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {error || "Failed to load application details"}
              </p>
              <Button onClick={loadStudentApplication} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar activePage="Applications" />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Applications</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-auto p-6">
            {/* Back button */}
            <button
              onClick={() => navigate("/manage-applications")}
              className="inline-flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </button>

            {/* Error Display */}
            {error && (
              <div className="mb-6">
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
              </div>
            )}

            <div className="max-w-6xl mx-auto space-y-6">
              {/* Application header */}
              <ApplicationHeader
                application={application}
                shortlisted={shortlisted}
                onShortlistToggle={handleShortlistToggle}
                shortlistLoading={shortlistLoading}
              />

              {/* Job posting details */}
              <JobPostingDetails posting={application.posting} />

              {/* Documents section */}
              <DocumentsSection applicationId={application.application_id} />

              {/* Additional Application Responses */}
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Application Responses
              </h2>

              {/* Dynamic form sections */}
              {applicationData &&
                applicationData.sections &&
                applicationData.sections.map((section) => (
                  <FormSection key={section.section_id} section={section} />
                ))}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
