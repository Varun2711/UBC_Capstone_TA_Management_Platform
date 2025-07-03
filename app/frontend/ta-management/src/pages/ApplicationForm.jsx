import { useEffect, useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/student-dashboard-sidebar";
import Eligibility from "@/components/application-form/Eligibility";
import PersonalDetails from "../components/application-form/PersonalDetails2";
import Selections from "../components/application-form/Selections";
import ReviewSection from "@/components/application-form/ReviewSection";
import SupportingDocuments from "@/components/application-form/SupportingDocuments";
import ProgressBar from "@/components/ProgressBar";
import { validateCurrentStep } from "@/utils/validationUtils";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

//base url for api calls
const instance = axios.create({
  baseURL: "http://localhost:8080/api",
});

// Mock data
const studentProfile = {
  id: 2, //the student pk is needed for the application db table
  name: "Sarah Johnson",
  email: "sarah.johnson@university.edu",
  studentId: "20240012",
  UBCEmployeeId: "82342316",
  password: "password123",
  major: "Computer Science",
  minor: "Data Science",
  year: "Graduate Student",
  gpa: "3.85",
  phone: "+1 (555) 123-4567",
  avatar: "/placeholder.svg?height=120&width=120",
  coursePreference: [
    "COSC 111",
    "MATH 101",
    "COSC 121",
    "DATA 101",
    "STAT 121",
    "PHYS 111",
  ],
  academicInfo: {
    yearStanding: "4th Year",
    degreeStart: "September 2022",
    expectedGraduation: "May 2026",
  },
  experience: [
    {
      course: "CS 111 - Introduction to Programming",
      semester: "Fall 2023",
      professor: "Dr. Smith",
      description:
        "Assisted with lab sessions, graded assignments, and held office hours for 30+ students.",
    },
    {
      course: "MATH 101 - Introduction to Calculus",
      semester: "Summer 2023",
      professor: "Dr. Brown",
      description:
        "Assisted with lecture sessions, and graded midterms and exams.",
    },
  ],
  technicalSkills: [
    "Python",
    "Java",
    "JavaScript",
    "React",
    "Node.js",
    "SQL",
    "Git",
    "Linux",
    "Machine Learning",
    "Data Structures",
  ],
  softSkills: [
    "Communication",
    "Teamwork",
    "Problem Solving",
    "Time Management",
    "Adaptability",
    "Critical Thinking",
  ],
};

const cleanApiDataFormat = (apiData) => {
  return {
    id: apiData.id,
    name: `${apiData.first_name} ${apiData.last_name}`,
    email: apiData.email,
    studentId: apiData.student_info?.student_number || "N/A",
    UBCEmployeeId: apiData.student_profile?.ubc_employee_id || "N/A",
    major: apiData.student_info?.program || "N/A",
    minor: apiData.student_profile?.minor || "N/A",
    year: apiData.student_info?.year_standing || "N/A",
    gpa: apiData.student_profile?.gpa || "N/A",
    phone: apiData.student_info?.phone || "N/A",
    avatar: "/placeholder.svg?height=120&width=120",
    coursePreference:
      apiData.course_preferences?.map((pref) => pref.course_code) || [],
    academicInfo: {
      yearStanding: apiData.student_info?.year_standing || "N/A",
      degreeStart: apiData.student_profile?.year_degree_start || "N/A",
      expectedGraduation: "May 2026", // This might need to be calculated
    },
    experience:
      apiData.experiences?.map((exp) => ({
        course: exp.organization,
        semester: `${exp.start_date} to ${exp.end_date}`,
        professor: "Dr. Unknown", // This data might not be in the API
        description: exp.description,
      })) || [],
    technicalSkills:
      apiData.skills
        ?.filter((skill) => skill.skill_type === "technical")
        .map((skill) => skill.name) || [],
    softSkills:
      apiData.skills
        ?.filter((skill) => skill.skill_type === "soft")
        .map((skill) => skill.name) || [],
  };
};

const transformStudentToApiFormat = (studentData) => {
  // Parse name back to first_name and last_name
  const nameParts = studentData.name ? studentData.name.split(" ") : ["", ""];
  const first_name = nameParts[0] || "";
  const last_name = nameParts.slice(1).join(" ") || "";

  return {
    id: studentData.id,
    first_name: first_name,
    last_name: last_name,
    email: studentData.email,
    student_info: {
      student_number:
        studentData.studentId !== "N/A" ? studentData.studentId : null,
      program: studentData.major !== "N/A" ? studentData.major : null,
      year_standing: studentData.year !== "N/A" ? studentData.year : null,
      study_level: "Undergraduate", // You might need to determine this
      phone: studentData.phone !== "N/A" ? studentData.phone : null,
    },
    student_profile: {
      gpa: studentData.gpa !== "N/A" ? studentData.gpa : null,
      year_degree_start:
        studentData.academicInfo?.degreeStart !== "N/A"
          ? studentData.academicInfo.degreeStart
          : null,
      minor: studentData.minor !== "N/A" ? studentData.minor : null,
      ubc_employee_id:
        studentData.UBCEmployeeId !== "N/A" ? studentData.UBCEmployeeId : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    experiences:
      studentData.experience?.map((exp, index) => ({
        id: `exp${index + 1}`,
        experience_type: "TA",
        position_title: "Teaching Assistant",
        organization: exp.course,
        start_date: exp.semester?.split(" to ")[0] || null,
        end_date: exp.semester?.split(" to ")[1] || null,
        is_current: false,
        description: exp.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) || [],
    skills: [
      // Technical skills
      ...(studentData.technicalSkills?.map((skill, index) => ({
        id: `tech_skill${index + 1}`,
        skill_type: "technical",
        name: skill,
        created_at: new Date().toISOString(),
      })) || []),
      // Soft skills
      ...(studentData.softSkills?.map((skill, index) => ({
        id: `soft_skill${index + 1}`,
        skill_type: "soft",
        name: skill,
        created_at: new Date().toISOString(),
      })) || []),
    ],
    course_preferences:
      studentData.coursePreference?.map((course, index) => ({
        id: `pref${index + 1}`,
        course_code: course,
        preference_rank: index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) || [],
    availability: {
      id: "avail1",
      availability_grid: {
        monday: ["9:00-10:00", "14:00-15:00"],
        tuesday: ["10:00-12:00"],
        wednesday: ["9:00-10:00", "14:00-15:00"],
        thursday: ["10:00-12:00"],
        friday: ["9:00-11:00"],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
};

//Application responses
const applicationResponses = {
  citizenshipStatus: "",
  residingInKelowna: "",
  fullTimeEnrollment: "",
  hasOtherPositions: "",
  otherPositionHours: "",
  positionType: "",
  winterTerm: "",
  workload: "",
  disciplineRanking: {
    rank1: "",
    rank2: "",
    rank3: "",
  },
};

//set up step title for the prgress bar
const stepTitles = {
  1: "Eligibility",
  2: "Selections",
  3: "Personal Details",
  4: "Supporting Documents",
  5: "Review",
};

{
  /*  This uses a multi-step form. Each step/page is located under components/application-form  */
}
export default function ApplicationForm() {
  const { postingId } = useParams();
  const [student, setStudent] = useState(null);
  const [responses, setResponses] = useState(applicationResponses);
  const [step, setStep] = useState(1); //this state will control the navigation through the form
  const [validationErrors, setValidationErrors] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [confirmation, setConfirmation] = useState(false);
  const [supportingDocs, setSupportingDocs] = useState([]); // Array of documents
  const navigate = useNavigate();

  //const studentNumber = 20241002; //hardcoded from the backend

  //http://localhost:8080/api/profile/find-user/?student_number=20241002
  //get Student profile on mount

  useEffect(() => {
    const fetchStudentProfile = async (studentId) => {
      const accessToken = localStorage.getItem("accessToken");

      //if we can't find the accces token, then for the demo, use the mock student profile data
      if (!accessToken) {
        console.log("No access token found in localStorage, using mock data");
        setStudent(studentProfile);
        return;
      }

      try {
        const response = await instance.get(`/profile/me/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log(response.data);

        //transform data to ensure it matches the studentprofile object
        const cleanedData = cleanApiDataFormat(response.data);
        console.log(cleanedData);
        setStudent(cleanedData);
      } catch (error) {
        console.error(
          "API call failed, falling back to mock data",
          error.message
        );
        // const cleanedMockData = cleanApiDataFormat(studentProfile); //use the mockdata, so atleast we have something for the demo
        setStudent(studentProfile);
        //throw error;
      }
    };

    fetchStudentProfile();
  }, []);

  /* handlers for navigation  and submission */
  //handles moving forward to the next page
  const handleNext = (e) => {
    e.preventDefault();
    const { isValid, errors } = validateCurrentStep(step, student, responses);

    if (isValid) {
      setValidationErrors({}); //clear all current errors
      setStep((prev) => prev + 1); //move to the next page in the form
    } else {
      setValidationErrors(errors);
      // console.log("Please fix validation errors.", errors);
    }
  };

  //handles moving back to the previous page
  const handleBack = (e) => {
    e.preventDefault(); //extra precaution here to prevent weird form submissions from happening
    setValidationErrors({}); //clear all current errors
    setStep((prev) => prev - 1);
  };

  // handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); //extra precaution here to prevent weird form submissions from happening
    let allValid = true;
    let allErrors = {};

    if (!confirmation) {
      allValid = false;
      //user must check the confirmation box before submissionb
      allErrors.confirmation =
        "You must check the confirmation box before submitting.";
    }

    for (let stepNum = 1; stepNum <= 4; stepNum++) {
      const { isValid, errors } = validateCurrentStep(
        stepNum,
        student,
        responses
      );
      if (!isValid) {
        allValid = false;
        allErrors = { ...allErrors, ...errors };
      }
    }

    if (allValid) {
      console.log("Submitting full application:", { student, responses });
      // Will need to call API here in order to save the application
      const applicationData = {
        student_id: student.id,
        posting_id: postingId,
        termSelection_id: 1,
        positionType: responses.positionType,
        workload: responses.workload,
        disciplineRankings: responses.disciplineRanking,
        citizenshipStatus: responses.citizenshipStatus,
        residingInKelowna: responses.residingInKelowna,
        fullTimeEnrollment: responses.fullTimeEnrollment,
        hasOtherPositions: responses.hasOtherPositions,
        otherPositionHours: responses.otherPositionHours || null,
        status: "submitted",
      };

      console.log(applicationData);

      const accessToken = localStorage.getItem("accessToken"); //get the access token for the student profile update

      const profileData = transformStudentToApiFormat(student); //format the data to fit the student profile

      console.log(profileData);

      const documentData = {
        supportingDocuments: supportingDocs.map((doc) => ({
          name: doc.name,
          size: doc.size,
          type: doc.type,
        })),
      };

      try {
        const response = await instance.post(
          "/ajp/applications/",
          applicationData
        );

        //if there is a token, try to submit an
        // if (accessToken) {
        //   console.log("I'm inside access token.");
        //   const profileResponse = await instance.post("/profile/me/update/", {
        //     headers: {
        //       Authorization: `Bearer ${accessToken}`,
        //     },
        //   });
        // }
        console.log("Application submitted successfully:", response.data);
        //handle success
        setSubmissionStatus("success");
      } catch (error) {
        console.log(
          "Error submitting application",
          error.response?.data || error.message
        );
        setSubmissionStatus("error");
      }
    } else {
      setValidationErrors(allErrors);
      console.log("Form has validation errors:", allErrors);
    }
  };
  //Return this modal message if student successfully submited the application
  if (submissionStatus === "success") {
    return (
      <div className="fixed inset-0 bg-green-50 bg-opacity-95 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-md mx-4">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            Application Submitted Successfully! 🎉
          </h2>
          <p className="text-gray-600 mb-4">
            Your TA application has been submitted.
          </p>

          <Button
            className="mt-4"
            onClick={() => {
              navigate("/student-dashboard");
              //console.log("Manual redirect to dashboard");
            }}
          >
            Go Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  //Return this modal message when application fails to submit
  if (submissionStatus === "error") {
    return (
      <div className="fixed inset-0 bg-red-50 bg-opacity-95 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-md mx-4">
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Submission Failed
          </h2>
          <p className="text-gray-600 mb-4">
            There was an error submitting your application. Please try again.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setSubmissionStatus(null)}>
              Try Again
            </Button>
            <Button
              onClick={() => {
                navigate("/student-dashboard");
                console.log("Return to dashboard");
              }}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    //including the Sidebar as this is apart of the Student View
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 space-y-6 p-6">
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                TA Application
              </h1>
              <ProgressBar
                step={step}
                totalSteps={5}
                stepLabel={stepTitles[step]}
              />
            </div>

            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              onSubmit={handleSubmit}
            >
              {step === 1 && (
                <Eligibility
                  responses={responses}
                  setResponses={setResponses}
                  errors={validationErrors}
                />
              )}
              {step === 2 && (
                <Selections
                  selections={responses}
                  setSelections={setResponses}
                  errors={validationErrors}
                />
              )}
              {step === 3 && (
                <PersonalDetails student={student} setStudent={setStudent} />
              )}{" "}
              {step === 4 && (
                <SupportingDocuments
                  documents={supportingDocs}
                  setDocuments={setSupportingDocs}
                />
              )}{" "}
              {step === 5 && (
                <ReviewSection
                  student={student}
                  selections={responses}
                  confirmation={confirmation}
                  setConfirmation={setConfirmation}
                  documents={supportingDocs}
                  errors={validationErrors}
                />
              )}
              <div className="md:col-span-2 flex justify-center gap-4">
                {step > 1 && (
                  <Button
                    className="bg-white text-gray-900 border border-gray-700 shadow"
                    onClick={handleBack}
                    type="button"
                  >
                    <ChevronLeft />
                    Back
                  </Button>
                )}
                {step < 5 ? (
                  <Button
                    className="bg-blue-600"
                    onClick={handleNext}
                    type="button"
                  >
                    Next
                    <ChevronRight />
                  </Button>
                ) : (
                  <Button className="bg-blue-600" type="submit">
                    Submit Application
                  </Button>
                )}
              </div>
            </form>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
