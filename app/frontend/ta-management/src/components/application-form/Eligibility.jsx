import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import ErrorMessage from "@/components/ErrorMessage";

/* This component step collects user's Eligbility response
 * as per the UI mock ups on Figma and also per the Qualtrix form
 */

const citizenshipOptions = [
  { value: "citizen", label: "Yes - Canadian Citizen" },
  { value: "pr", label: "Yes - Permanent Resident" },
  { value: "international", label: "No - International Student" },
];

export default function Eligbility({ responses, setResponses, errors = {} }) {
  return (
    <div className="col-span-full">
      {/* Citizenship */}
      <div className="mb-4">
        <Label className="block mb-2 text-lg font-semibold">
          Are you a Canadian citizen or permanent resident?
        </Label>
        <RadioGroup
          value={responses.citizenshipStatus || ""}
          onValueChange={(value) =>
            setResponses({ ...responses, citizenshipStatus: value })
          }
        >
          {citizenshipOptions.map((option) => (
            <Label key={option.value} className="flex items-center gap-2">
              <RadioGroupItem value={option.value} />
              {option.label}
            </Label>
          ))}
        </RadioGroup>
        <ErrorMessage error={errors.citizenshipStatus} />

        {responses.citizenshipStatus === "international" && (
          <p className="text-sm text-muted-foreground mt-2">
            If you are an international student, you must submit a valid study
            permit when requested.
          </p>
        )}
      </div>

      {/* Kelowna Residency */}
      <div className="mb-4">
        <Label className="block mb-2 text-lg font-semibold">
          Will you be residing in Kelowna during the terms in which you are
          applying for a TA position?
        </Label>
        <RadioGroup
          value={responses.residingInKelowna || ""}
          onValueChange={(value) =>
            setResponses({ ...responses, residingInKelowna: value })
          }
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="kelowna-yes">
              {" "}
              <RadioGroupItem
                className="mb-2 mr-2"
                value="yes"
                id="kelowna-yes"
              />
              Yes
            </Label>

            <Label htmlFor="kelowna-no">
              {" "}
              <RadioGroupItem
                className="mb-2 mr-2"
                value="no"
                id="kelowna-no"
              />
              No
            </Label>
          </div>
        </RadioGroup>

        <ErrorMessage error={errors.residingInKelowna} />
      </div>

      {/* Full-time Enrollment */}
      <div className="mb-4">
        <Label className="block text-lg font-semibold">
          Will you be enrolled as a full-time student in the terms you are
          applying for?
        </Label>
        <p className="text-sm text-muted-foreground  mb-4">
          Summer 2025: minimum 9 credits (or grad program)
          <br />
          Winter 2025: minimum 18 credits (or grad program)
        </p>
        <RadioGroup
          value={responses.fullTimeEnrollment || ""}
          onValueChange={(value) =>
            setResponses({ ...responses, fullTimeEnrollment: value })
          }
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="fulltime-yes">
              {" "}
              <RadioGroupItem
                className="mr-2 mb-2"
                value="yes"
                id="fulltime-yes"
              />
              Yes
            </Label>

            <Label htmlFor="fulltime-no">
              {" "}
              <RadioGroupItem
                className="mr-2 mb-2"
                value="no"
                id="fulltime-no"
              />
              No
            </Label>
          </div>
        </RadioGroup>

        <ErrorMessage error={errors.fullTimeEnrollment} />
      </div>

      {/* Other Student Positions */}
      <div className="">
        <Label className="text-lg font-semibold">
          Have you applied, or accepted offers, for other student positions?
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          (e.g., Co-Op, Research Assistant, SL Leader, Workstudy, Tutor, etc.)
        </p>

        <RadioGroup
          value={responses.hasOtherPositions || ""}
          onValueChange={(value) =>
            setResponses({
              ...responses,
              hasOtherPositions: value,
              // Reset hours if they switch from Yes to No
              otherPositionHours:
                value === "no" ? "" : responses.otherPositionHours,
            })
          }
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="other-yes">
              {" "}
              <RadioGroupItem
                className="mr-2 mb-2"
                value="yes"
                id="other-yes"
              />
              Yes
            </Label>

            <Label htmlFor="other-no">
              <RadioGroupItem className="mr-2 mb-2" value="no" id="other-no" />
              No
            </Label>
          </div>
        </RadioGroup>
        <ErrorMessage error={errors.hasOtherPositions} />

        {/* Conditional Hours - Other Student Positions */}
        {responses.hasOtherPositions === "yes" && (
          <div className="mt-4">
            <Label htmlFor="otherPositionHours">
              Please indicate how many hours per week:
            </Label>
            <Input
              id="otherPositionHours"
              type="number"
              min={0}
              placeholder="e.g., 10"
              value={responses.otherPositionHours || ""}
              onChange={(e) =>
                setResponses({
                  ...responses,
                  otherPositionHours: e.target.value,
                })
              }
            />
          </div>
        )}
        <ErrorMessage error={errors.otherPositionHours} />
      </div>
    </div>
  );
}
