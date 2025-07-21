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
import PersonalDetails from "@/components/application-form/PersonalDetails";
import Selections from "@/components/application-form/Selections";
import ReviewSection from "@/components/application-form/ReviewSection";
import SupportingDocuments from "@/components/application-form/SupportingDocuments";
import ProgressBar from "@/components/ProgressBar";
import { validateCurrentStep } from "@/components/application-form/utils/applicationFormValidationUtils";
import { useParams, useNavigate } from "react-router-dom";

// Import the logic functions from student-applications.js
import {
  fetchStudentProfile,
  submitApplication,
  fetchJobPostingDetails,
  fetchTemplateDetails,
  handleNextStep,
  handlePreviousStep,
} from "@/logic/student-applications";

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

//set up step title for the progress bar
const stepTitles = {
  1: "Eligibility",
  2: "Selections",
  3: "Personal Details",
  4: "Supporting Documents",
  5: "Review",
};

export default function ApplicationForm() {
  const { postingId } = useParams();
  const navigate = useNavigate();

  // State management
  const [student, setStudent] = useState(null);
  const [responses, setResponses] = useState(applicationResponses);
  const [step, setStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [confirmation, setConfirmation] = useState(false);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobPosting, setJobPosting] = useState(null);
  const [templateDetails, setTemplateDetails] = useState(null);

  //console.log("Posting ID:", postingId);

  // Fetch student profile and job posting on mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // Fetch student profile
        const studentData = await fetchStudentProfile();
        setStudent(studentData);

        // Fetch job posting details if needed
        if (postingId) {
          try {
            const jobData = await fetchJobPostingDetails(postingId);
            setJobPosting(jobData);
          } catch (jobError) {
            console.warn(
              "Could not fetch job posting details:",
              jobError.message
            );
            // Continue without job posting data
          }
        }

        // Fetch template details
        if (jobData.form_template_id) {
          try {
            const templateData = await fetchTemplateDetails(
              jobData.form_template_id
            );
            setTemplateDetails(templateData);
          } catch (templateError) {
            console.warn(
              "Could not fetch template details:",
              templateError.message
            );
          }
        }
      } catch (error) {
        console.error("Error initializing application form:", error);
        // The fetchStudentProfile already handles fallback to mock data
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [postingId]);

  // Navigation handlers using the logic functions
  const handleNext = (e) => {
    e.preventDefault();

    console.log("");

    const success = handleNextStep(step, setStep, validateCurrentStep, {
      student,
      responses,
    });

    if (!success) {
      // Get validation errors and set them
      const { errors } = validateCurrentStep(step, student, responses);
      setValidationErrors(errors);
    } else {
      setValidationErrors({});
    }
  };

  const handleBack = (e) => {
    e.preventDefault();
    handlePreviousStep(step, setStep, () => setValidationErrors({}));
  };

  // Form submission handler using the logic function
  const handleSubmit = async (e) => {
    e.preventDefault();

    let allValid = true;
    let allErrors = {};

    // Validate all steps
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

    if (!allValid) {
      setValidationErrors(allErrors);
      console.log("Form has validation errors:", allErrors);
      return;
    }

    // Clear any existing errors
    setValidationErrors({});

    try {
      // Submit application using the logic function
      await submitApplication({
        student,
        responses,
        postingId,
        confirmation,
        supportingDocs,
        setSubmissionStatus,
        setValidationErrors,
      });

      console.log("Application submitted successfully!");
    } catch (error) {
      console.error("Application submission failed:", error);
      // setSubmissionStatus is handled inside submitApplication
    }
  };

  // Show loading state
  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
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
                  <p className="text-gray-600">Loading application form...</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Success modal
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
            }}
          >
            Go Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Error modal
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
                {jobPosting && (
                  <span className="text-lg font-normal text-gray-600 ml-2">
                    - {jobPosting.title || jobPosting.course_code}
                  </span>
                )}
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
              )}
              {step === 4 && (
                <SupportingDocuments
                  documents={supportingDocs}
                  setDocuments={setSupportingDocs}
                />
              )}
              {step === 5 && (
                <ReviewSection
                  student={student}
                  selections={responses}
                  confirmation={confirmation}
                  setConfirmation={setConfirmation}
                  documents={supportingDocs}
                  errors={validationErrors}
                  jobPosting={jobPosting}
                />
              )}

              {/* Navigation Buttons */}
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
