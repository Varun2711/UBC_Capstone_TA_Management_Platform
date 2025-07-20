import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Info,
  FileText,
  CheckCircle,
  User,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import logic layer functions
import { fetchTemplateById, handleApiError } from "@/logic/job-management";

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
          {field_name && <span className="ml-1">({field_name})</span>}
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
              {normalizedOptions.length > 0 ? (
                normalizedOptions.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 opacity-60"
                  >
                    <div className="w-4 h-4 border border-gray-400 rounded-full"></div>
                    <span className="text-sm">
                      {option.label || option.value}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No options configured yet
                </div>
              )}
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
              {normalizedOptions.length > 0 ? (
                normalizedOptions.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 opacity-60"
                  >
                    <div className="w-4 h-4 border border-gray-400 rounded"></div>
                    <span className="text-sm">
                      {option.label || option.value}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No options configured yet
                </div>
              )}
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
            {normalizedOptions.length > 0 ? (
              <div className="text-xs text-gray-500 mt-1">
                Options:{" "}
                {normalizedOptions
                  .map((opt) => opt.label || opt.value)
                  .join(", ")}
              </div>
            ) : (
              <div className="text-xs text-red-500 mt-1">
                No options configured yet
              </div>
            )}
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
            {validation_rules && (
              <div className="text-xs text-gray-500 mt-1">
                {validation_rules.maxLength &&
                  `Max length: ${validation_rules.maxLength} characters`}
                {validation_rules.pattern &&
                  ` • Pattern: ${validation_rules.pattern}`}
              </div>
            )}
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
            {validation_rules?.maxLength && (
              <div className="text-xs text-gray-500 mt-1">
                Max length: {validation_rules.maxLength} characters
              </div>
            )}
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
            {validation_rules && (
              <div className="text-xs text-gray-500 mt-1">
                {validation_rules.allowedTypes &&
                  `Allowed types: ${validation_rules.allowedTypes.join(", ")}`}
                {validation_rules.maxSize &&
                  ` • Max size: ${validation_rules.maxSize}MB`}
              </div>
            )}
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
              {normalizedOptions.length > 0 ? (
                Array.from(
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
                )
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No options configured for ranking yet
                </div>
              )}
            </div>
            {normalizedOptions.length > 0 && (
              <div className="text-xs text-gray-500 mt-2">
                Options to rank:{" "}
                {normalizedOptions
                  .map((opt) => opt.label || opt.value)
                  .join(", ")}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div
            key={question_id}
            className="mb-6 p-4 border rounded-lg bg-red-50"
          >
            {previewBadge}
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-red-500">
                Unknown question type: {question_type}
              </p>
            </div>
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
                    Add questions to this section in the form builder
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
export default function FormTemplatePreview({
  template: propTemplate,
  templateId,
}) {
  const [template, setTemplate] = useState(propTemplate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If templateId is provided but no template prop, fetch the template
  useEffect(() => {
    if (templateId && !propTemplate) {
      fetchTemplate();
    } else if (propTemplate) {
      setTemplate(propTemplate);
    }
  }, [templateId, propTemplate]);

  const fetchTemplate = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTemplateById(templateId);
      setTemplate(data);
    } catch (error) {
      console.error("Error fetching template for preview:", error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const refreshTemplate = () => {
    if (templateId) {
      fetchTemplate();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading template preview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          {templateId && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshTemplate}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-8 p-4 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-muted-foreground">No template data available</p>
      </div>
    );
  }

  // Calculate template statistics
  const totalCustomSections = template.sections?.length || 0;
  const totalCustomQuestions =
    template.sections?.reduce(
      (total, section) => total + (section.questions?.length || 0),
      0
    ) || 0;
  const estimatedTime = Math.max(5, 3 + totalCustomQuestions * 0.5);

  return (
    <div className="space-y-6">
      {/* Template Info Header */}
      {/* <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <FileText className="h-5 w-5" />
            {template.name}
          </CardTitle>
          {template.description && (
            <p className="text-blue-700">{template.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-800 text-lg">
                {totalCustomSections}
              </div>
              <div className="text-blue-600">Custom Sections</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-800 text-lg">
                {totalCustomQuestions}
              </div>
              <div className="text-blue-600">Custom Questions</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-800 text-lg">3</div>
              <div className="text-blue-600">Default Sections</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-800 text-lg">
                ~{Math.round(estimatedTime)}min
              </div>
              <div className="text-blue-600">Est. Completion</div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Preview Notice */}
      <Alert className="border-gray-200 bg-gray-50">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Template Preview:</strong> This shows how your template
          sections will be integrated into the complete application form.
          Sections for Documents, Profile, and Review are automatically included
          in every application.
        </AlertDescription>
      </Alert>

      {/* Complete form structure overview */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800">
            Complete Application Form Structure
          </CardTitle>
          <p className="text-sm text-gray-600">
            This is the order students will see when filling out the application
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {template.sections
              ?.sort((a, b) => a.order - b.order)
              .map((section, index) => (
                <div
                  key={section.section_id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {section.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Your custom section ({section.questions?.length || 0}{" "}
                      question{section.questions?.length === 1 ? "" : "s"})
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-blue-300 text-blue-600"
                  >
                    Custom
                  </Badge>
                </div>
              ))}

            {/* Default sections */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                {totalCustomSections + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  Supporting Documents
                </div>
                <div className="text-sm text-gray-600">
                  Default Section - File upload for transcripts, certificates,
                  etc.
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
                {totalCustomSections + 2}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  Profile Confirmation
                </div>
                <div className="text-sm text-gray-600">
                  Default Section - Confirm student profile details
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
                {totalCustomSections + 3}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">Review & Submit</div>
                <div className="text-sm text-gray-600">
                  Default Section - Final review and submission
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
      {template && template.sections && template.sections.length > 0 ? (
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Your Custom Sections Preview
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              These are the sections and questions you've configured in this
              template. This preview shows how they'll appear to students:
            </p>
          </div>
          <CustomSectionPreview template={template} />
        </div>
      ) : (
        <div className="border-l-4 border-amber-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Custom Sections Yet
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            This template doesn't have any custom sections. Add sections and
            questions to customize the application form for students.
          </p>
        </div>
      )}

      {/* Static section indicators */}
      <div className="space-y-4">
        <div className="border-l-4 border-gray-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Default Sections (Always Included)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            These sections are automatically included in every application form:
          </p>
        </div>

        <StaticSectionIndicator
          icon={FileText}
          title="Supporting Documents"
          description="Students can upload supporting documents like transcripts, certificates, portfolios, and other relevant files."
          position="after your custom sections"
        />

        <StaticSectionIndicator
          icon={User}
          title="Confirm Your Profile"
          description="Students can review and confirm their student profile details (name, program, contact info) before submitting."
          position="near the end"
        />

        <StaticSectionIndicator
          icon={CheckCircle}
          title="Review & Submit"
          description="Students will review all their responses, uploaded documents, and confirm their application before final submission."
          position="at the very end"
        />
      </div>

      {/* Template Status and Actions */}
      {template.is_active !== undefined && (
        <Card
          className={
            template.is_active
              ? "bg-green-50 border-green-200"
              : "bg-yellow-50 border-yellow-200"
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={template.is_active ? "default" : "secondary"}
                    className={
                      template.is_active ? "bg-green-600" : "bg-yellow-600"
                    }
                  >
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {template.is_active
                      ? "This template is available for use in job postings"
                      : "This template is not currently available for job postings"}
                  </span>
                </div>
                {template.created_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Created on{" "}
                    {new Date(template.created_at).toLocaleDateString()}
                    {template.created_by && ` by ${template.created_by.name}`}
                  </p>
                )}
              </div>
              {templateId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshTemplate}
                  title="Refresh preview"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
