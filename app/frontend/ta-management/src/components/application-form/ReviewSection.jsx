import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Paperclip, Trash2 } from "lucide-react";

export default function ReviewSection({ student, selections }) {
  const {
    firstName,
    lastName,
    email,
    studentId,
    major,
    studyLevel,
    gpa,
    faculty,
    degreeStart,
    phone,
    resume,
    transcript,
  } = student; //destructuring student profile data
  const {
    citizenshipStatus,
    residingInKelowna,
    fullTimeEnrollment,
    hasOtherPositions,
    otherPositionHours,
    positionType,
    winterTerm,
    workload,
    disciplineRanking,
  } = selections; //destructuring selections data

  const displayFile = (file) => file?.name || "Not uploaded";
  const currentApplicationYear = 2025; // Mock current application year
  const [isConfirmed, setIsConfirmed] = useState(false); //Agreement statement confirmation

  return (
    <Card className="shadow-md p-6 col-span-full">
      <CardContent className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Review Your Application
        </h2>

        {/* Personal Info Review Section */}
        <section>
          <Label className="text-lg font-medium">Personal Information</Label>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>
              Name:
              <span className="font-bold ml-2">
                {firstName} {lastName}
              </span>
            </li>
            <li>
              Email:
              <span className="font-bold ml-2">{email}</span>
            </li>
            <li>
              Phone:
              <span className="font-bold ml-2">{phone}</span>
            </li>
            <li>
              Student ID:
              <span className="font-bold ml-2">{studentId}</span>
            </li>
            <li>
              Degree currently in progress:
              <span className="font-bold ml-2">{studyLevel}</span>
            </li>
            <li>
              Program:
              <span className="font-bold ml-2">{major}</span>
            </li>
            <li>
              GPA:
              <span className="font-bold ml-2">{gpa}</span>
            </li>
            <li>
              Degree Start:
              <span className="font-bold ml-2">{degreeStart}</span>
            </li>
            <li>
              Faculty:
              <span className="font-bold ml-2">{faculty}</span>
            </li>
          </ul>
        </section>

        {/* Application Selections Review Section */}
        <section>
          <Label className="text-lg font-medium">Application Details</Label>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>
              Are you a Canadian citizen or permanent resident?
              <span className="font-bold ml-2">{citizenshipStatus}</span>
              {citizenshipStatus === "International Student" && (
                <span className="text-red-500 ml-2 flex items-left">
                  Note: You must submit a valid study permit when requested.
                </span>
              )}
            </li>
            <li>
              Will you be residing in Kelowna during the terms in which you are
              applying for a TA position?
              <span className="font-bold ml-2">{residingInKelowna}</span>
            </li>
            <li>
              Will you be enrolled as a full-time student in the terms you are
              applying for?
              <span className="font-bold ml-2">{fullTimeEnrollment}</span>
            </li>
            <li>
              Have you applied, or accepted offers, for other student positions?
              <span className="font-bold ml-2">{hasOtherPositions}</span>
              {hasOtherPositions === "Yes" && (
                <li>
                  The number of hours per week for other positions:{" "}
                  <span className="font-bold ml-2">{otherPositionHours}</span>
                </li>
              )}
            </li>
            <li>
              Which position are you applying for?
              <span className="font-bold ml-2">{positionType}</span>
            </li>
            <li>
              For W{currentApplicationYear} applications, which of the following
              terms are you applying to TA for?
              <span className="font-bold ml-2">{winterTerm}</span>
            </li>
            <li>
              Please indicate your preferred maximum average hourly workload:
              <span className="font-bold ml-2">{workload}</span>
            </li>
            <li>
              Rank your top 3 preferred disciplines:
              <ul className="list-inside list-disc ml-6 mt-1 space-y-1">
                <li>
                  1st Discipline:
                  <span className="font-bold ml-2">
                    {disciplineRanking.rank1}
                  </span>
                </li>
                <li>
                  2nd Discipline:
                  <span className="font-bold ml-2">
                    {disciplineRanking.rank2}
                  </span>
                </li>
                <li>
                  3rd Discipline:
                  <span className="font-bold ml-2">
                    {disciplineRanking.rank3}
                  </span>
                </li>
              </ul>
            </li>
          </ul>
        </section>

        {/* Supporting Documents */}
        <section>
          <Label className="text-lg font-medium">Supporting Documents</Label>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Resume: {displayFile(resume)}</li>
            <li>Transcript: {displayFile(transcript)}</li>
          </ul>
        </section>

        {/* Confirmation */}
        <section>
          <div className="flex items-start space-x-2 mt-6">
            <Checkbox
              id="confirm"
              checked={isConfirmed}
              onCheckedChange={setIsConfirmed}
            />
            <Label htmlFor="confirm" className="text-sm leading-tight">
              I confirm that the information I have provided in this application
              is accurate and complete to the best of my knowledge.
            </Label>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
