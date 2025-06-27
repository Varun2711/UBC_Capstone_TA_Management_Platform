import { useState } from "react";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/student-dashboard-sidebar";
import Eligibility from "@/components/application-form/Eligibility";
import PersonalDetails from "../components/application-form/PersonalDetails";
import Selections from "../components/application-form/Selections";
import ReviewSection from "@/components/application-form/ReviewSection";
import ProgressBar from "@/components/ProgressBar";
import { validateCurrentStep } from "@/utils/validationUtils";

// Mock resume data
// To be pulled from the Documents service
const mockResume = new File(["Sample content"], "resume.pdf", {
  type: "application/pdf",
});

//Mock student profile data
//To be pulled from Student API in the user-profile-service
const studentProfile = {
  name: "Sarah Johnson",
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarahj@mail.com",
  studentId: "SJ2024001",
  major: "Computer Science",
  studyLevel: "MSc",
  gpa: "3.85",
  phone: "+1 (555) 123-4567",
  faculty: "Faculty of Science",
  degreeStart: "2024",
  avatar: "/placeholder.svg?height=40&width=40",
  resume: mockResume,
  transcript: null,
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
  4: "Review",
};

{
  /* This uses a multi-step form. Each step/page is located under components/application-form  */
}
export default function Application() {
  const [student, setStudent] = useState(studentProfile);
  const [responses, setResponses] = useState(applicationResponses);
  const [step, setStep] = useState(1); //this state will control the navigation through the form
  const [validationErrors, setValidationErrors] = useState({});

  /* handlers for navigation  and submission */

  //handles moving forward to the next page
  const handleNext = () => {
    const { isValid, errors } = validateCurrentStep(step, student, responses);

    if (isValid) {
      setValidationErrors({}); //clear all current errors
      setStep((prev) => prev + 1); //move to the next page in the form
    } else {
      setValidationErrors(errors);
      // console.log("Please fix validation errors.", errors);
    }
  };

  //handles the moving back to the previous page
  const handleBack = () => {
    setValidationErrors({}); //clear all current errors
    setStep((prev) => prev - 1);
    clearErrors();
  };

  // handles form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    let allValid = true;
    let allErrors = {};

    for (let stepNum = 1; stepNum <= 3; stepNum++) {
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
    } else {
      setValidationErrors(allErrors);
      console.log("Form has validation errors:", allErrors);
    }

    // console.log("Submitting full application:", student);
  };

  //console.log("student.resume:", student.resume);

  return (
    //including the Sidebar as this is apart of the Student Profile component
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
                totalSteps={4}
                stepLabel={stepTitles[step]}
              />
            </div>

            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              onSubmit={handleSubmit}
            >
              {/* Step Content */}
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
                  errors={validationErrors}
                />
              )}{" "}
              {step === 4 && (
                <ReviewSection student={student} selections={responses} />
              )}
              <div className="md:col-span-2 flex justify-center gap-4">
                {step > 1 && (
                  <Button
                    className="bg-white text-gray-900 border border-gray-700 shadow"
                    onClick={handleBack}
                  >
                    <ChevronLeft />
                    Back
                  </Button>
                )}
                {step < 4 ? (
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
