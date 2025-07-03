import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import axios from "axios";
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
import { AppSidebar } from "../components/scheduler-sidebar";

const instance = axios.create({
  baseURL: "http://localhost:8080/api",
});

export default function ViewStudentApplication() {
  const { applicationid } = useParams(); // Fixed: destructure the param name
  const [application, setApplication] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadStudentApplication = async () => {
      try {
        setLoading(true);

        // Get the application details
        const applicationResponse = await instance.get(
          `/ajp/applications/by-id/${applicationid}/`
        );

        const applicationData = applicationResponse.data;
        setApplication(applicationData);

        // Get the student profile data
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken && applicationData.student?.id) {
          try {
            const profileResponse = await instance.get(
              `/profile/student/${applicationData.student.id}/`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            setStudentProfile(profileResponse.data);
          } catch (profileError) {
            console.warn("Could not load student profile:", profileError);
            // Continue without profile data
          }
        }
      } catch (error) {
        console.error("Error loading application:", error);
        setError("Failed to load application details");
      } finally {
        setLoading(false);
      }
    };

    if (applicationid) {
      loadStudentApplication();
    }
  }, [applicationid]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: {
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800",
      },
      accepted: {
        icon: CheckCircle,
        className: "bg-green-100 text-green-800",
      },
      rejected: {
        icon: XCircle,
        className: "bg-red-100 text-red-800",
      },
      withdrawn: {
        icon: null,
        className: "bg-gray-100 text-gray-600",
      },
    };

    const config = statusConfig[status] || statusConfig.submitted;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}
      >
        {Icon && <Icon className="w-4 h-4 mr-1" />}
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const getPositionType = (positionType) => {
    const typeConfig = {
      UTA: {
        label: "Undergraduate TA",
      },
      GTA2: {
        label: "Graduate TA 2",
      },
      GTA1: {
        label: "Graduate TA 1 (Ph.D)",
      },
    };

    const config = typeConfig[positionType] || {
      label: positionType,
    };

    return config.label;
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

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar activePage="Dashboard" />
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
        <AppSidebar activePage="Dashboard" />
        <SidebarInset>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {`An error has occured. ${error}. Contact the administrator.`}
              </p>
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
                    {formatDate(application.applied_at)}
                  </p>
                </div>
              </div>
            </div>
          </header>

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
                      <h4 className="font-medium text-gray-900">
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
                      <p className="text-gray-600">
                        {getPositionType(application.positionType)}
                      </p>
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

                    <div className="col-span-full">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Ranked Discplines
                      </h4>
                      {application.disciplineRankings ? (
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              1st Choice:
                            </span>
                            <Badge variant="outline">
                              {application.disciplineRankings.rank1}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              2nd Choice:
                            </span>
                            <Badge variant="outline">
                              {application.disciplineRankings.rank2}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              3rd Choice:
                            </span>
                            <Badge variant="outline">
                              {application.disciplineRankings.rank3}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-600">Not specified</p>
                      )}
                    </div>
                  </div>
                  <br></br>

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
                          : "Not Full-time enrollemnt"}
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
                          ? `Yes - ${application.otherPositionHours} hours/week`
                          : "No"}
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
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
