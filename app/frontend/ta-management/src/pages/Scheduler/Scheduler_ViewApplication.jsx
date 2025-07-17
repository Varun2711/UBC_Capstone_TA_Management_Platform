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

export default function ViewStudentApplication() {
  const { applicationid } = useParams();
  const [application, setApplication] = useState(null);
  const [shortlisted, setShortlisted] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
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
      const applicationData = await fetchApplicationById(applicationid);
      setApplication(applicationData);

      // Check shortlist status
      const isShortlisted = await checkApplicationShortlisted(applicationid);
      setShortlisted(isShortlisted);

      // Note: Student profile fetching is commented out in original code
      // This would require additional API endpoint implementation
      // const profileData = await fetchStudentProfile(applicationData.student.id);
      // setStudentProfile(profileData);
    } catch (error) {
      console.error("Error loading application:", error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
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
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}
      >
        {Icon && <Icon className="w-4 h-4 mr-1" />}
        {config.label}
      </span>
    );
  };

  const getPositionType = (positionType) => {
    const config = getPositionTypeConfig(positionType);
    return config.label;
  };

  const getPositionTypeBadge = (positionType) => {
    const config = getPositionTypeConfig(positionType);
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleShortList = async () => {
    setShortlistLoading(true);
    setError(null);

    try {
      await addToShortlist(applicationid);
      console.log("Application shortlisted successfully");
      setShortlisted(true);
    } catch (error) {
      console.error("Error shortlisting application:", error);
      setError(handleApiError(error));
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleRemoveShortlist = async () => {
    setShortlistLoading(true);
    setError(null);

    try {
      await removeFromShortlist(applicationid);
      console.log("Application removed from shortlist successfully");
      setShortlisted(false);
    } catch (error) {
      console.error("Error removing from shortlist:", error);
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
          {/* Page Header */}
          <header className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/manage-applications")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Applications
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Application Details
                  </h1>
                  <p className="text-sm text-gray-600">
                    Application #{application.application_id} • Applied{" "}
                    {formatDateTime(application.applied_at)}
                  </p>
                </div>
              </div>

              {/* Shortlist button */}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadStudentApplication}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>

                {shortlisted ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <Star className="w-4 h-4 mr-1" />
                      Shortlisted
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveShortlist}
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
                  <Button onClick={handleShortList} disabled={shortlistLoading}>
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
          </header>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-6">
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

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Student Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900">Name</h4>
                      <p className="text-gray-600">
                        {application.student.name}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Student Number
                      </h4>
                      <p className="text-gray-600">
                        {application.student.student_number}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Application Status
                      </h4>
                      <div className="mt-1">
                        {getStatusBadge(application.status)}
                      </div>
                    </div>
                    {studentProfile && (
                      <>
                        <div>
                          <h4 className="font-medium text-gray-900">Email</h4>
                          <p className="text-gray-600">
                            {studentProfile.email}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Phone</h4>
                          <p className="text-gray-600">
                            {studentProfile.phone || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            UBC Employee ID
                          </h4>
                          <p className="text-gray-600">
                            {studentProfile.UBCEmployeeId || "Not applicable"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Job Posting Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Position Applied For
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 text-lg">
                        {application.posting.title}
                      </h4>
                      <p className="text-gray-600">
                        {application.posting.department.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {application.posting.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Application Selections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Application Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Selected Position Type
                      </h4>
                      <div>
                        {getPositionTypeBadge(application.positionType)}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Selected Term
                      </h4>
                      <p className="text-gray-600">
                        {application.termSelection?.description ||
                          "Not specified"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Preferred Workload
                      </h4>
                      <p className="text-gray-600">
                        {application.workload} hours
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Discipline Rankings
                    </h4>
                    {application.disciplineRankings ? (
                      <div className="flex flex-wrap gap-4">
                        {application.disciplineRankings.rank1 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              1st Choice:
                            </span>
                            <Badge variant="outline">
                              {application.disciplineRankings.rank1}
                            </Badge>
                          </div>
                        )}
                        {application.disciplineRankings.rank2 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              2nd Choice:
                            </span>
                            <Badge variant="outline">
                              {application.disciplineRankings.rank2}
                            </Badge>
                          </div>
                        )}
                        {application.disciplineRankings.rank3 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              3rd Choice:
                            </span>
                            <Badge variant="outline">
                              {application.disciplineRankings.rank3}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600">Not specified</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Eligibility Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Eligibility Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Canadian Residency Status
                      </h4>
                      <p className="text-gray-600">
                        {application.citizenshipStatus === "citizen" &&
                          "Canadian Citizen"}
                        {application.citizenshipStatus === "pr" &&
                          "Permanent Resident"}
                        {application.citizenshipStatus === "international" &&
                          "International Student"}
                        {!application.citizenshipStatus && "Not specified"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Residing in Kelowna for{" "}
                        {application.termSelection?.description ||
                          "applied term"}
                      </h4>
                      <p className="text-gray-600">
                        {application.residingInKelowna === "yes" ? "Yes" : "No"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Enrollment Status for{" "}
                        {application.termSelection?.description ||
                          "applied term"}
                      </h4>
                      <p className="text-gray-600">
                        {application.fullTimeEnrollment === "yes"
                          ? "Full-Time Enrollment"
                          : "Not Full-time enrollment"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Has Other Positions for{" "}
                        {application.termSelection?.description ||
                          "applied term"}
                      </h4>
                      <p className="text-gray-600">
                        {application.hasOtherPositions === "yes"
                          ? `Yes - ${
                              application.otherPositionHours || 0
                            } hours/week`
                          : "No"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Academic Information (if profile available) */}
              {studentProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Academic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900">Major</h4>
                        <p className="text-gray-600">{studentProfile.major}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Minor</h4>
                        <p className="text-gray-600">
                          {studentProfile.minor || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Academic Level
                        </h4>
                        <p className="text-gray-600">{studentProfile.year}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">GPA</h4>
                        <p className="text-gray-600">
                          {studentProfile.gpa || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Expected Graduation
                        </h4>
                        <p className="text-gray-600">
                          {studentProfile.academicInfo?.expectedGraduation}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Year Standing
                        </h4>
                        <p className="text-gray-600">
                          {studentProfile.academicInfo?.yearStanding}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Skills and Experience (if profile available) */}
              {studentProfile && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Skills */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Skills & Qualifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Technical Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {studentProfile.technicalSkills?.map(
                            (skill, index) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Soft Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {studentProfile.softSkills?.map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Course Preferences
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {studentProfile.coursePreference?.map(
                            (course, index) => (
                              <Badge key={index} variant="outline">
                                {course}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Experience */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Past TA Experience</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {studentProfile.experience?.length > 0 ? (
                        <div className="space-y-4">
                          {studentProfile.experience.map((exp, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{exp.course}</h4>
                                <span className="text-sm text-gray-500">
                                  {exp.semester}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                Professor: {exp.professor}
                              </p>
                              <p className="text-sm text-gray-700">
                                {exp.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600">
                          No previous TA experience listed
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Application Responses (if any) */}
              {application.responses && application.responses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Additional Responses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {application.responses.map((response, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-blue-200 pl-4"
                        >
                          <h4 className="font-medium text-gray-900 mb-2">
                            {response.question.question_text}
                          </h4>
                          <div className="text-gray-600">
                            {typeof response.response_data === "object"
                              ? JSON.stringify(response.response_data, null, 2)
                              : response.response_data}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Application Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Application Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Application Submitted</p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(application.applied_at)}
                        </p>
                      </div>
                    </div>
                    {application.updated_at !== application.applied_at && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div>
                          <p className="font-medium">Last Updated</p>
                          <p className="text-sm text-gray-500">
                            {formatDateTime(application.updated_at)}
                          </p>
                        </div>
                      </div>
                    )}
                    {shortlisted && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Added to Shortlist</p>
                          <p className="text-sm text-gray-500">
                            Current status
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
