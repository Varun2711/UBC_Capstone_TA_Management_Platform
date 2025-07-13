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
import DynamicFormRenderer from "@/components/DynamicFormRenderer";
import ProgressBar from "@/components/ProgressBar";
import { validateDynamicForm } from "@/components/application-form/utils/dynamicValidationUtils";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const instance = axios.create({
  baseURL: "http://localhost:8080/api",
});

// Fallback to existing static components if no dynamic template
import Eligibility from "@/components/application-form/Eligibility";
import PersonalDetails from "@/components/application-form/PersonalDetails2";
import Selections from "@/components/application-form/Selections";
import ReviewSection from "@/components/application-form/ReviewSection";
import SupportingDocuments from "@/components/application-form/SupportingDocuments";

export default function ApplicationForm() {
  const { postingId } = useParams();
  const [student, setStudent] = useState(null);
  const [jobPosting, setJobPosting] = useState(null);
  const [formTemplate, setFormTemplate] = useState(null);
  const [responses, setResponses] = useState({});
  const [step, setStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [confirmation, setConfirmation] = useState(false);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [useDynamicForm, setUseDynamicForm] = useState(false);
  const navigate = useNavigate();

  // Load student profile, job posting, and form template
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch student profile
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          setStudent(studentProfile);
        } else {
          const studentResponse = await instance.get("/profile/me/", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          setStudent(studentResponse.data);
        }

        // Fetch job posting and its form template
        const postingResponse = await instance.get(
          `/ajp/jobpostings/${postingId}/`
        );
        setJobPosting(postingResponse.data);

        // Check if job posting has a custom form template
        if (postingResponse.data.form_template) {
          const templateResponse = await instance.get(
            `/ajp/jobpostings/${postingId}/form_template/`
          );
          setFormTemplate(templateResponse.data);
          setUseDynamicForm(true);

          // Initialize responses with default values
          const defaultResponses = {};
          templateResponse.data.sections.forEach((section) => {
            section.questions.forEach((question) => {
              if (question.question_type === "checkbox") {
                defaultResponses[question.field_name] = [];
              } else if (question.question_type === "ranking") {
                defaultResponses[question.field_name] = {};
              } else {
                defaultResponses[question.field_name] = "";
              }
            });
          });
          setResponses(defaultResponses);
        } else {
          // Use static form (your existing form structure)
          setUseDynamicForm(false);
          setResponses({
            citizenshipStatus: "",
            residingInKelowna: "",
            fullTimeEnrollment: "",
            hasOtherPositions: "",
            otherPositionHours: "",
            positionType: "",
            winterTerm: "",
            workload: "",
            disciplineRanking: { rank1: "", rank2: "", rank3: "" },
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Fallback to static form and mock data
        setStudent(studentProfile);
        setUseDynamicForm(false);
      }
    };

    fetchData();
  }, [postingId]);

  const getCurrentSectionQuestions = () => {
    if (!useDynamicForm || !formTemplate) return null;

    const currentSection = formTemplate.sections.find(
      (section, index) => index + 1 === step
    );
    return currentSection;
  };

  const getTotalSteps = () => {
    if (useDynamicForm && formTemplate) {
      return formTemplate.sections.length + 1; // +1 for review step
    }
    return 5; // Static form steps
  };

  const getStepTitle = () => {
    if (useDynamicForm && formTemplate) {
      if (step <= formTemplate.sections.length) {
        return formTemplate.sections[step - 1]?.name || `Step ${step}`;
      }
      return "Review";
    }

    // Static form step titles
    const staticTitles = {
      1: "Eligibility",
      2: "Selections",
      3: "Personal Details",
      4: "Supporting Documents",
      5: "Review",
    };
    return staticTitles[step];
  };

  const handleNext = (e) => {
    e.preventDefault();

    let isValid = true;
    let errors = {};

    if (useDynamicForm) {
      const currentSection = getCurrentSectionQuestions();
      if (currentSection) {
        const validation = validateDynamicForm(currentSection, responses);
        isValid = validation.isValid;
        errors = validation.errors;
      }
    } else {
      // Use your existing validation
      const validation = validateCurrentStep(step, student, responses);
      isValid = validation.isValid;
      errors = validation.errors;
    }

    if (isValid) {
      setValidationErrors({});
      setStep((prev) => prev + 1);
    } else {
      setValidationErrors(errors);
    }
  };

  const handleBack = (e) => {
    e.preventDefault();
    setValidationErrors({});
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let allValid = true;
    let allErrors = {};

    // Validate all sections for dynamic forms
    if (useDynamicForm && formTemplate) {
      formTemplate.sections.forEach((section) => {
        const validation = validateDynamicForm(section, responses);
        if (!validation.isValid) {
          allValid = false;
          allErrors = { ...allErrors, ...validation.errors };
        }
      });
    } else {
      // Use existing validation for static forms
      for (let stepNum = 1; stepNum <= 4; stepNum++) {
        const validation = validateCurrentStep(stepNum, student, responses);
        if (!validation.isValid) {
          allValid = false;
          allErrors = { ...allErrors, ...validation.errors };
        }
      }
    }

    if (!confirmation) {
      allValid = false;
      allErrors.confirmation =
        "You must check the confirmation box before submitting.";
    }

    if (allValid) {
      try {
        let applicationData;

        if (useDynamicForm) {
          // For dynamic forms, store responses in ApplicationResponse table
          applicationData = {
            student_id: student.id,
            posting_id: postingId,
            termSelection_id: 1,
            status: "submitted",
          };

          const response = await instance.post(
            "/ajp/applications/",
            applicationData
          );
          const applicationId = response.data.application_id;

          // Save individual question responses
          const responsePromises = Object.entries(responses).map(
            ([fieldName, value]) => {
              // Find the question by field_name
              let questionId = null;
              formTemplate.sections.forEach((section) => {
                const question = section.questions.find(
                  (q) => q.field_name === fieldName
                );
                if (question) questionId = question.question_id;
              });

              if (questionId) {
                return instance.post("/ajp/application-responses/", {
                  application_id: applicationId,
                  question_id: questionId,
                  response_data: value,
                });
              }
            }
          );

          await Promise.all(responsePromises.filter(Boolean));
        } else {
          // Static form submission (your existing logic)
          applicationData = {
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

          await instance.post("/ajp/applications/", applicationData);
        }

        setSubmissionStatus("success");
      } catch (error) {
        console.error("Error submitting application:", error);
        setSubmissionStatus("error");
      }
    } else {
      setValidationErrors(allErrors);
    }
  };

  // Success/Error modals (your existing code)
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
            onClick={() => navigate("/student-dashboard")}
          >
            Go Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

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
            <Button onClick={() => navigate("/student-dashboard")}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalSteps = getTotalSteps();
  const isReviewStep = step === totalSteps;

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
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                TA Application
                {jobPosting && (
                  <span className="text-lg font-normal text-gray-600 ml-2">
                    - {jobPosting.title}
                  </span>
                )}
              </h1>
              <ProgressBar
                step={step}
                totalSteps={totalSteps}
                stepLabel={getStepTitle()}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {useDynamicForm && formTemplate ? (
                // Render dynamic form
                isReviewStep ? (
                  <ReviewSection
                    student={student}
                    selections={responses}
                    confirmation={confirmation}
                    setConfirmation={setConfirmation}
                    documents={supportingDocs}
                    errors={validationErrors}
                    formTemplate={formTemplate}
                    isDynamic={true}
                  />
                ) : (
                  <DynamicFormRenderer
                    template={formTemplate}
                    responses={responses}
                    setResponses={setResponses}
                    errors={validationErrors}
                    currentSection={getCurrentSectionQuestions()?.section_id}
                  />
                )
              ) : (
                // Render static form (your existing components)
                <>
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
                    <PersonalDetails
                      student={student}
                      setStudent={setStudent}
                    />
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
                    />
                  )}
                </>
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
                {step < totalSteps ? (
                  <Button
                    className="bg-blue-600"
                    onClick={handleNext}
                    type="button"
                  >
                    Next
                    <ChevronRight />
                  </Button>
                ) : (
                  <Button className="bg-blue-600" onClick={handleSubmit}>
                    Submit Application
                  </Button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
