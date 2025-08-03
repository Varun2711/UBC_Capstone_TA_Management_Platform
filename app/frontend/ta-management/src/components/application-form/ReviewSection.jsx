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
  selections = {},
  dynamicResponses = {},
  dynamicSections = [],
  fieldMapping = {},
  confirmation,
  setConfirmation,
  documents,
  termDetails,
  errors = {},
}) {
  // Helper function to get the display value for a response
  const getDisplayValue = (question, response) => {
    if (!response && response !== 0) return "NA";

    const { question_type, options = [] } = question;
    let normalizedOptions = [];

    if (
      question.field_name === "termSelection" &&
      termDetails &&
      Array.isArray(termDetails) &&
      termDetails.length > 0
    ) {
      normalizedOptions = termDetails;
    } else {
      // Normalize options to array format

      if (Array.isArray(options)) {
        normalizedOptions = options;
      } else if (typeof options === "object" && options !== null) {
        normalizedOptions = Object.entries(options).map(([key, value]) => ({
          value: key,
          label: value,
        }));
      }
    }

    switch (question_type) {
      case "radio":
      case "select":
        // Find the label for the selected option
        const selectedOption = normalizedOptions.find(
          (opt) => opt.value === response
        );
        return selectedOption ? selectedOption.label : response;

      case "checkbox":
        // Handle array of selected values
        if (Array.isArray(response)) {
          const selectedLabels = response
            .map((value) => {
              const option = normalizedOptions.find(
                (opt) => opt.value === value
              );
              return option ? option.label : value;
            })
            .filter(Boolean);
          return selectedLabels.length > 0
            ? selectedLabels.join(", ")
            : "None selected";
        }
        return response;

      case "ranking":
        // Handle ranking object like { rank1: "option1", rank2: "option2" }
        if (typeof response === "object" && response !== null) {
          const ranks = Object.entries(response)
            .sort(([a], [b]) => {
              const rankA = parseInt(a.replace("rank", ""));
              const rankB = parseInt(b.replace("rank", ""));
              return rankA - rankB;
            })
            .map(([rank, value]) => {
              const rankNum = rank.replace("rank", "");
              const option = normalizedOptions.find(
                (opt) => opt.value === value
              );
              const displayValue = option ? option.label : value;
              return `${rankNum}. ${displayValue}`;
            });
          return ranks.length > 0 ? ranks.join(", ") : "Not ranked";
        }
        return response;

      case "file":
        // Handle file object
        if (typeof response === "object" && response.name) {
          return `${response.name} (${(response.size / 1024 / 1024).toFixed(
            2
          )} MB)`;
        }
        return response;

      case "number":
        return response.toString();

      case "text":
      case "email":
      case "textarea":
      default:
        return response;
    }
  };

  // Helper function to get response value from appropriate source
  const getResponseValue = (fieldName) => {
    const shouldUseDefaultResponses = fieldMapping[fieldName] === true;
    return shouldUseDefaultResponses
      ? selections[fieldName]
      : dynamicResponses[fieldName];
  };

  // Helper function to render a single question and its response
  const renderQuestionResponse = (question) => {
    const { field_name, question_text, is_required } = question;
    const response = getResponseValue(field_name);
    const displayValue = getDisplayValue(question, response);

    return (
      <li key={field_name}>
        <span className="text-gray-700">{question_text}</span>
        {is_required && <span className="text-red-500 ml-1">*</span>}
        <span className="font-bold ml-2">{displayValue}</span>

        {/* Special handling for conditional follow-up questions */}
        {field_name === "citizenshipStatus" && response === "international" && (
          <span className="text-red-500 ml-2 block mt-1">
            Note: You must submit a valid study permit when requested.
          </span>
        )}
      </li>
    );
  };

  // Helper function to render a section and its questions
  const renderSection = (section) => {
    const sectionQuestions = section.questions || [];
    const questionsWithResponses = sectionQuestions.filter((question) => {
      const response = getResponseValue(question.field_name);
      return response !== undefined && response !== "" && response !== null;
    });

    if (questionsWithResponses.length === 0) {
      return null;
    }

    return (
      <section key={section.section_id} className="mb-6">
        <Label className="text-lg font-medium text-gray-900 mb-3 block">
          {section.name}
        </Label>
        <ul className="list-disc list-inside ml-4 space-y-2">
          {questionsWithResponses
            .sort((a, b) => a.order - b.order)
            .map(renderQuestionResponse)}
        </ul>
      </section>
    );
  };

  return (
    <Card className="shadow-md p-6 col-span-full">
      <CardContent className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Review Your Application Responses
        </h2>

        {/* Dynamic Sections Review. Render the dynamic responses to questions */}
        <div className="space-y-6">
          {dynamicSections &&
            dynamicSections.length > 0 &&
            dynamicSections
              .sort((a, b) => a.order - b.order)
              .map(renderSection)}
        </div>

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
