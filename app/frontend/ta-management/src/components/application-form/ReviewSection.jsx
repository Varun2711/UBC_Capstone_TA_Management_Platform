import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Paperclip, Trash2 } from "lucide-react";
import {
  getPositionTypeLabel,
  getWorkloadLabel,
  getCitizenshipLabel,
  getYesNoLabel,
} from "@/components/application-form/labelMappings";
import ErrorMessage from "@/components/ErrorMessage";

export default function ReviewSection({
  student,
  selections,
  confirmation,
  setConfirmation,
  documents,
  errors = {},
}) {
  // const {
  //   firstName,
  //   lastName,
  //   email,
  //   studentId,
  //   major,
  //   studyLevel,
  //   gpa,
  //   faculty,
  //   degreeStart,
  //   phone,
  //   resume,
  //   transcript,
  // } = student; //destructuring student profile data

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
  // const [isConfirmed, setIsConfirmed] = useState(false); //Agreement statement confirmation

  return (
    <Card className="shadow-md p-6 col-span-full">
      <CardContent className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Review Your Application Responses
        </h2>

        {/* Personal Info Review Section
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
        </section> */}

        {/* Application Selections Review Section */}
        <section>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>
              Are you a Canadian citizen or permanent resident?
              <span className="font-bold ml-2">
                {getCitizenshipLabel(citizenshipStatus)}
              </span>
              {citizenshipStatus === "international" && (
                <span className="text-red-500 ml-2 flex items-left">
                  Note: You must submit a valid study permit when requested.
                </span>
              )}
            </li>
            <li>
              Will you be residing in Kelowna during the terms in which you are
              applying for a TA position?
              <span className="font-bold ml-2">
                {getYesNoLabel(residingInKelowna)}
              </span>
            </li>
            <li>
              Will you be enrolled as a full-time student in the terms you are
              applying for?
              <span className="font-bold ml-2">
                {getYesNoLabel(fullTimeEnrollment)}
              </span>
            </li>
            <li>
              Have you applied, or accepted offers, for other student positions?
              <span className="font-bold ml-2">
                {getYesNoLabel(hasOtherPositions)}
              </span>
              {hasOtherPositions === "yes" && (
                <div className="ml-4 mt-1">
                  The number of hours per week for other positions:{" "}
                  <span className="font-bold ml-2">{otherPositionHours}</span>
                </div>
              )}
            </li>
            <li>
              Which position are you applying for?
              <span className="font-bold ml-2">
                {getPositionTypeLabel(positionType)}
              </span>
            </li>
            <li>
              For W{currentApplicationYear} applications, which of the following
              terms are you applying to TA for?
              <span className="font-bold ml-2">{winterTerm}</span>
            </li>
            <li>
              Please indicate your preferred maximum average hourly workload:
              <span className="font-bold ml-2">
                {getWorkloadLabel(workload)}
              </span>
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
          {documents && documents.length > 0 ? (
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              {documents.map((doc, index) => (
                <li key={doc.id || index}>
                  <span className="font-medium">{doc.name}</span>
                  <span className="text-gray-500 ml-2">
                    ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 ml-4 mt-2">
              No documents uploaded
            </p>
          )}
        </section>

        {/* Confirmation */}
        <section>
          <div className="flex items-start space-x-2 mt-6">
            <Checkbox
              id="confirm"
              checked={confirmation}
              onCheckedChange={(checked) => setConfirmation(checked)}
            />
            <div className="flex flex-col">
              <Label htmlFor="confirm" className="text-sm leading-tight">
                I confirm that the information I have provided in this
                application is accurate and complete to the best of my
                knowledge.
              </Label>
              {errors.confirmation && (
                <ErrorMessage error={errors.confirmation} />
              )}
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
