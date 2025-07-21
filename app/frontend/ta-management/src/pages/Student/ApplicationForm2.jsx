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
import PersonalDetails from "@/components/application-form/PersonalDetails";
import ReviewSection from "@/components/application-form/ReviewSection";
import SupportingDocuments from "@/components/application-form/SupportingDocuments";
import ProgressBar from "@/components/ProgressBar";
//import { validateCurrentStep } from "@/components/application-form/utils/applicationFormValidationUtils";
import { useParams, useNavigate } from "react-router-dom";
import DynamicFormRenderer from "@/components/application-form/DynamicFormRenderer";
import {
  validateDynamicStep,
  validateAllResponses,
} from "@/components/application-form/utils/dynamicFormValidation";

// Import the logic functions from student-applications.js
import {
  fetchStudentProfile,
  submitApplication,
  fetchJobPostingDetails,
  fetchTemplateDetails,
  handleNextStep,
  handlePreviousStep,
  checkApplicationFields,
  getAllResponses,
  handleFormSubmission,
} from "@/logic/student-applications";

// Initial application defaultResponses
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

export default function ApplicationForm() {
  const { postingId } = useParams();
  const navigate = useNavigate();

  // State management
  const [student, setStudent] = useState(null);
  const [defaultResponses, setdefaultResponses] =
    useState(applicationResponses);
  const [dynamicResponses, setDynamicResponses] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(5); // Default fallback
  const [validationErrors, setValidationErrors] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [confirmation, setConfirmation] = useState(false);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fieldMapping, setFieldMapping] = useState({});

  // Template and form structure
  const [jobPosting, setJobPosting] = useState(null);
  const [templateDetails, setTemplateDetails] = useState(null);
  const [dynamicSections, setDynamicSections] = useState([]);
  const [stepLabels, setStepLabels] = useState({});

  // Fetch data and initialize form on mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // Fetch student profile
        const studentData = await fetchStudentProfile();
        setStudent(studentData);

        // Fetch job posting details
        if (postingId) {
          const jobData = await fetchJobPostingDetails(postingId);
          setJobPosting(jobData);

          console.log("Job posting template id:", jobData.form_template_id);

          // Fetch template details if available
          if (jobData.form_template_id) {
            try {
              const templateData = await fetchTemplateDetails(
                jobData.form_template_id
              );
              setTemplateDetails(templateData);
              //   console.log("Template details:", templateData);

              if (templateData && templateData.sections) {
                // Sort sections by order
                const sortedSections = templateData.sections.sort(
                  (a, b) => a.order - b.order
                );
                setDynamicSections(sortedSections);

                // Check field mapping
                const mapping = checkApplicationFields(sortedSections);
                setFieldMapping(mapping);
                // console.log("Field mapping:", mapping);

                // Calculate total steps: dynamic sections + static sections (Personal Details + Supporting Docs + Review)
                const dynamicStepCount = sortedSections.length;
                const staticStepCount = 3; // Personal Details, Supporting Documents, Review
                const totalStepCount = dynamicStepCount + staticStepCount;
                setTotalSteps(totalStepCount);

                // Create step labels
                const labels = {};
                sortedSections.forEach((section, index) => {
                  labels[index + 1] = section.name;
                });
                labels[dynamicStepCount + 1] = "Personal Details";
                labels[dynamicStepCount + 2] = "Supporting Documents";
                labels[dynamicStepCount + 3] = "Review";
                setStepLabels(labels);
              }
            } catch (templateError) {
              console.warn(
                "Could not fetch template details:",
                templateError.message
              );
              // Fall back to default static form structure
              setStepLabels({
                1: "Eligibility",
                2: "Selections",
                3: "Personal Details",
                4: "Supporting Documents",
                5: "Review",
              });
            }
          } else {
            // No template, use default static form
            setStepLabels({
              1: "Eligibility",
              2: "Selections",
              3: "Personal Details",
              4: "Supporting Documents",
              5: "Review",
            });
          }
        }
      } catch (error) {
        console.error("Error initializing application form:", error);
        // Set default step labels as fallback
        // setStepLabels({
        //   1: "Eligibility",
        //   2: "Selections",
        //   3: "Personal Details",
        //   4: "Supporting Documents",
        //   5: "Review",
        // });
        //show message to contact administrator
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [postingId]);

  // Navigation handlers
  const handleNext = (e) => {
    e.preventDefault();

    // All validation logic is now handled in student-applications.js
    handleNextStep(
      currentStep,
      setCurrentStep,
      null, // Your existing legacy validation function
      {
        student,
        defaultResponses,
        dynamicResponses,
        dynamicSections,
        fieldMapping,
        totalSteps,
        setValidationErrors,
      }
    );
  };

  const handleBack = (e) => {
    e.preventDefault();
    handlePreviousStep(currentStep, setCurrentStep, () =>
      setValidationErrors({})
    );
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // All submission logic is now handled in student-applications.js
    await handleFormSubmission({
      student,
      defaultResponses,
      dynamicResponses,
      dynamicSections,
      fieldMapping,
      postingId,
      confirmation,
      supportingDocs,
      setSubmissionStatus,
      setValidationErrors,
      setCurrentStep,
    });
  };
  // Helper functions to determine current section type
  const isDynamicSection = () => currentStep <= dynamicSections.length;
  const isPersonalDetailsSection = () =>
    currentStep === dynamicSections.length + 1;
  const isSupportingDocsSection = () =>
    currentStep === dynamicSections.length + 2;
  const isReviewSection = () => currentStep === dynamicSections.length + 3;

  const getCurrentDynamicSection = () => {
    if (isDynamicSection()) {
      return dynamicSections[currentStep - 1];
    }
    return null;
  };

  // Loading state
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
                step={currentStep}
                totalSteps={totalSteps}
                stepLabel={stepLabels[currentStep] || `Step ${currentStep}`}
              />
            </div>

            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              onSubmit={handleSubmit}
            >
              {/* Dynamic Sections */}
              {isDynamicSection() && (
                <DynamicFormRenderer
                  template={{
                    ...templateDetails,
                    sections: [getCurrentDynamicSection()].filter(Boolean),
                  }}
                  responses={defaultResponses}
                  setResponses={setdefaultResponses}
                  dynamicResponses={dynamicResponses}
                  setDynamicResponses={setDynamicResponses}
                  errors={validationErrors}
                  currentSection={getCurrentDynamicSection()?.section_id}
                  fieldMapping={fieldMapping}
                />
              )}

              {/* Static Sections */}
              {isPersonalDetailsSection() && (
                <PersonalDetails student={student} setStudent={setStudent} />
              )}

              {isSupportingDocsSection() && (
                <SupportingDocuments
                  documents={supportingDocs}
                  setDocuments={setSupportingDocs}
                />
              )}

              {isReviewSection() && (
                <ReviewSection
                  student={student}
                  selections={defaultResponses}
                  confirmation={confirmation}
                  setConfirmation={setConfirmation}
                  documents={supportingDocs}
                  errors={validationErrors}
                  jobPosting={jobPosting}
                />
              )}

              {/* Navigation Buttons */}
              <div className="md:col-span-2 flex justify-center gap-4">
                {currentStep > 1 && (
                  <Button
                    className="bg-white text-gray-900 border border-gray-700 shadow"
                    onClick={handleBack}
                    type="button"
                  >
                    <ChevronLeft />
                    Back
                  </Button>
                )}
                {currentStep < totalSteps ? (
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
