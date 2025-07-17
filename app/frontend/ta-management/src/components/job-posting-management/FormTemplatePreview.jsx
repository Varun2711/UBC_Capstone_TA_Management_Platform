import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, FileText, CheckCircle, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Static sections indicator
const StaticSectionIndicator = ({
  icon: Icon,
  title,
  description,
  position,
}) => (
  <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-3 text-gray-700">
        <Icon className="h-5 w-5" />
        {title}
        <Badge variant="secondary" className="bg-gray-200 text-gray-700">
          Default Section
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <p className="text-xs text-gray-500">
        This section will appear {position} in the actual application form.
      </p>
    </CardContent>
  </Card>
);

// Preview renderer that shows actual questions (NON-INTERACTIVE)
const CustomSectionPreview = ({ template }) => {
  if (!template || !template.sections) {
    return (
      <div className="text-center py-8 p-4 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-muted-foreground">
          No custom sections configured yet
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Add sections and questions to see them here
        </p>
      </div>
    );
  }

  const renderQuestionPreview = (question) => {
    const {
      question_id,
      question_text,
      question_type,
      field_name,
      is_required,
      help_text,
      options = [],
      validation_rules = {},
    } = question;

    // Transform options to consistent array format
    let normalizedOptions = [];
    if (Array.isArray(options)) {
      normalizedOptions = options;
    } else if (typeof options === "object" && options !== null) {
      normalizedOptions = Object.entries(options).map(([key, value]) => ({
        value: key,
        label: value,
      }));
    }

    const questionLabel = (
      <div className="block mb-2 text-lg font-semibold">
        {question_text}
        {is_required && <span className="text-red-500 ml-1">*</span>}
      </div>
    );

    const helpTextElement = help_text && (
      <p className="text-sm text-muted-foreground mb-2">{help_text}</p>
    );

    const previewBadge = (
      <div className="mb-2">
        <Badge variant="secondary" className="text-xs">
          Preview - {question_type} field
        </Badge>
      </div>
    );

    switch (question_type) {
      case "radio":
        return (
          <div
            key={question_id}
            className="mb-6 p-4 border rounded-lg bg-white"
          >
            {previewBadge}
            {questionLabel}
            {helpTextElement}
            <div className="space-y-2">
              {normalizedOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center gap-2 opacity-60"
                >
                  <div className="w-4 h-4 border border-gray-400 rounded-full"></div>
                  <span className="text-sm">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "checkbox":
        return (
          <div
            key={question_id}
            className="mb-6 p-4 border rounded-lg bg-white"
          >
            {previewBadge}
            {questionLabel}
            {helpTextElement}
            <div className="space-y-2">
              {normalizedOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center gap-2 opacity-60"
                >
                  <div className="w-4 h-4 border border-gray-400 rounded"></div>
                  <span className="text-sm">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "select":
        return (
          <div
            key={question_id}
            className="mb-6 p-4 border rounded-lg bg-white"
          >
            {previewBadge}
            {questionLabel}
            {helpTextElement}
            <div className="w-full p-2 border border-gray-300 rounded bg-gray-50 opacity-60">
              <span className="text-gray-500">Select an option ▼</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Options: {normalizedOptions.map((opt) => opt.label).join(", ")}
            </div>
          </div>
        );

      case "text":
      case "email":
        return (
          <div
            key={question_id}
            className="mb-6 p-4 border rounded-lg bg-white"
          >
            {previewBadge}
            {questionLabel}
            {helpTextElement}
            <div className="w-full p-2 border border-gray-300 rounded bg-gray-50 opacity-60">
              <span className="text-gray-400">
                {validation_rules?.placeholder || `Enter ${question_type}...`}
              </span>
            </div>
          </div>
        );

      case "number":
        return (
          <div
            key={question_id}
            className="mb-6 p-4 border rounded-lg bg-white"
          >
            {previewBadge}
            {questionLabel}
            {helpTextElement}
            <div className="w-full p-2 border border-gray-300 rounded bg-gray-50 opacity-60">
              <span className="text-gray-400">
                {validation_rules?.placeholder || "Enter number..."}
              </span>
            </div>
            {(validation_rules?.min !== undefined ||
              validation_rules?.max !== undefined) && (
              <div className="text-xs text-gray-500 mt-1">
                Range: {validation_rules?.min || "No min"} -{" "}
                {validation_rules?.max || "No max"}
              </div>
            )}
          </div>
        );

      case "textarea":
        return (
          <div
            key={question_id}
            className="mb-6 p-4 border rounded-lg bg-white"
          >
            {previewBadge}
            {questionLabel}
            {helpTextElement}
            <div className="w-full p-2 border border-gray-300 rounded bg-gray-50 opacity-60 min-h-[80px]">
              <span className="text-gray-400">
                {validation_rules?.placeholder || "Enter your response..."}
              </span>
            </div>
          </div>
        );

      case "file":
        return (
          <div
            key={question_id}
            className="mb-6 p-4 border rounded-lg bg-white"
          >
            {previewBadge}
            {questionLabel}
            {helpTextElement}
            <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded bg-gray-50 opacity-60 text-center">
              <span className="text-gray-400">Choose file to upload</span>
            </div>
          </div>
        );

      case "ranking":
        return (
          <div
            key={question_id}
            className="mb-6 p-4 border rounded-lg bg-white"
          >
            {previewBadge}
            {questionLabel}
            {helpTextElement}
            <div className="space-y-3">
              {Array.from(
                { length: Math.min(3, normalizedOptions.length) },
                (_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-20">
                      {index + 1}
                      {["st", "nd", "rd"][index] || "th"} Choice:
                    </span>
                    <div className="flex-1 p-2 border border-gray-300 rounded bg-gray-50 opacity-60">
                      <span className="text-gray-400">Select option ▼</span>
                    </div>
                  </div>
                )
              )}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Options to rank:{" "}
              {normalizedOptions.map((opt) => opt.label).join(", ")}
            </div>
          </div>
        );

      default:
        return (
          <div
            key={question_id}
            className="mb-6 p-4 border rounded-lg bg-red-50"
          >
            {previewBadge}
            <p className="text-red-500">
              Unknown question type: {question_type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {template.sections
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <Card key={section.section_id} className="col-span-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                {section.name}
                {section.is_required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
                <Badge variant="outline" className="ml-2">
                  Custom Section
                </Badge>
              </CardTitle>
              {section.description && (
                <p className="text-muted-foreground">{section.description}</p>
              )}
            </CardHeader>
            <CardContent>
              {section.questions?.length > 0 ? (
                section.questions
                  .sort((a, b) => a.order - b.order)
                  .map(renderQuestionPreview)
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded">
                  <p>No questions in this section yet</p>
                  <p className="text-sm mt-1">
                    Click "Add Question" to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
    </div>
  );
};

// Main preview component for template management
export default function FormTemplatePreview({ template }) {
  return (
    <div className="space-y-6">
      {/* Preview Notice */}
      <Alert className="border-gray-200 bg-gray-50">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Template Preview:</strong> This shows how your template
          sections will be integrated into the complete application form.
          Sections for Profile, Documents, Review are automatically included in
          every application.
        </AlertDescription>
      </Alert>

      {/* Complete form structure overview */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800">
            Complete Application Form Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {template?.sections
              ?.sort((a, b) => a.order - b.order)
              .map((section, index) => (
                <div
                  key={section.section_id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {section.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Your custom section ({section.questions?.length || 0}{" "}
                      questions)
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-gray-300 text-gray-600"
                  >
                    Custom
                  </Badge>
                </div>
              ))}

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                {(template?.sections?.length || 0) + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  Supporting Documents
                </div>
                <div className="text-sm text-gray-600">
                  Default Section - Always included
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-gray-300 text-gray-600"
              >
                Default
              </Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                {(template?.sections?.length || 0) + 2}
              </div>

              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  Profile Confirmation
                </div>
                <div className="text-sm text-gray-600">
                  Default Section - Always included
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-gray-300 text-gray-600"
              >
                Default
              </Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                {(template?.sections?.length || 0) + 3}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">Review & Submit</div>
                <div className="text-sm text-gray-600">
                  Default Section - always included
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-gray-300 text-gray-600"
              >
                Default
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic content from template */}
      {template && template.sections && template.sections.length > 0 && (
        <div className="space-y-4">
          <div className="border-l-4 border-gray-500 pl-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Your Custom Sections
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              These are the sections and questions you've configured in this
              template:
            </p>
          </div>
          <CustomSectionPreview template={template} />
        </div>
      )}

      {template && (!template.sections || template.sections.length === 0) && (
        <div className="border-l-4 border-red-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Custom Sections Yet
          </h3>
          <p className="text-sm text-grey-600 mb-4">
            This template doesn't have any custom sections. Add sections to
            customize the application form.
          </p>
        </div>
      )}

      {/* Static section indicators */}
      <StaticSectionIndicator
        icon={FileText}
        title="Supporting Documents"
        description="Students can upload supporting documents like transcripts, certificates, portfolios."
        position="after your custom sections"
      />

      <StaticSectionIndicator
        icon={User}
        title="Confirm Your Profile"
        description="Students can confirm their student profile details before submitting their application."
        position="after your custom sections"
      />

      <StaticSectionIndicator
        icon={CheckCircle}
        title="Review & Submit"
        description="Students will review all their responses, uploaded documents, and confirm their application before final submission."
        position="at the end"
      />

      {/* Summary */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h4 className="font-semibold text-gray-800">
              Template Form Summary
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-100 rounded-lg">
                <div className="font-semibold text-gray-800 text-lg">3</div>
                <div className="text-gray-600">Default Sections</div>
                <div className="text-xs text-gray-500 mt-1">
                  Always included
                </div>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <div className="font-semibold text-gray-800 text-lg">
                  {template?.sections?.length || 0}
                </div>
                <div className="text-gray-600">Custom Sections</div>
                <div className="text-xs text-gray-500 mt-1">Your template</div>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <div className="font-semibold text-gray-800 text-lg">
                  {template?.sections?.reduce(
                    (total, section) =>
                      total + (section.questions?.length || 0),
                    0
                  ) || 0}
                </div>
                <div className="text-gray-600">Custom Questions</div>
                <div className="text-xs text-gray-500 mt-1">User-defined</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Total estimated completion time:{" "}
              {Math.max(
                5,
                3 +
                  (template?.sections?.reduce(
                    (total, section) =>
                      total + (section.questions?.length || 0),
                    0
                  ) || 0) *
                    0.5
              )}{" "}
              minutes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
