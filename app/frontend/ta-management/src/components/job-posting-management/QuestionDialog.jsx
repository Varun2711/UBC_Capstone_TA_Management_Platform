import React, { useState, useEffect } from "react";
import { Plus, Trash2, Lock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const QUESTION_TYPES = [
  { value: "radio", label: "Radio Button", icon: "◉" },
  { value: "checkbox", label: "Checkbox", icon: "☑" },
  { value: "text", label: "Text Input", icon: "T" },
  { value: "textarea", label: "Text Area", icon: "📝" },
  { value: "select", label: "Dropdown", icon: "▼" },
  { value: "number", label: "Number", icon: "#" },
  { value: "email", label: "Email", icon: "@" },
  { value: "ranking", label: "Ranking", icon: "🔢" },
];

const QuestionDialog = ({ isOpen, onClose, question, onSave }) => {
  const [formData, setFormData] = useState({
    question_text: "",
    question_type: "text",
    field_name: "",
    is_required: false,
    help_text: "",
    options: [],
    validation_rules: {},
    is_editable: true, // Add default for new questions
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (question) {
      setFormData({ ...question });
    } else {
      // Reset to defaults for new questions
      setFormData({
        question_text: "",
        question_type: "text",
        field_name: "",
        is_required: false,
        help_text: "",
        options: [],
        validation_rules: {},
        is_editable: true,
      });
    }
    // Clear errors when question changes
    setErrors({});
  }, [question]);

  // Check if this is an existing question that's not editable
  const isExistingNonEditable = question && formData.is_editable === false;

  // Validation function
  const validateQuestion = () => {
    const newErrors = {};

    // Question text is required
    if (!formData.question_text.trim()) {
      newErrors.question_text = "Question text is required";
    }

    // Field name is required and should be valid
    if (!formData.field_name.trim()) {
      newErrors.field_name = "Field name is required";
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.field_name)) {
      newErrors.field_name =
        "Field name must start with a letter and contain only letters, numbers, and underscores";
    }

    // Questions that need options
    const needsOptions = ["radio", "checkbox", "select", "ranking"].includes(
      formData.question_type
    );

    if (needsOptions) {
      if (!formData.options || formData.options.length === 0) {
        newErrors.options = `${formData.question_type} questions must have at least one option`;
      } else {
        // Validate each option
        const invalidOptions = formData.options.some(
          (option, index) => !option.value.trim() || !option.label.trim()
        );

        if (invalidOptions) {
          newErrors.options = "All options must have both value and label";
        }

        // Check for duplicate values
        const values = formData.options.map((opt) => opt.value);
        const uniqueValues = new Set(values);
        if (values.length !== uniqueValues.size) {
          newErrors.options = "Option values must be unique";
        }

        // Specific validation for ranking questions
        if (
          formData.question_type === "ranking" &&
          formData.options.length < 2
        ) {
          newErrors.options = "Ranking questions must have at least 2 options";
        }
      }
    }

    // Email type should have email validation
    if (
      formData.question_type === "email" &&
      formData.field_name &&
      !formData.field_name.toLowerCase().includes("email")
    ) {
      newErrors.field_name =
        "Email questions should have 'email' in the field name for clarity";
    }

    // Number type should have reasonable validation rules
    if (formData.question_type === "number") {
      const rules = formData.validation_rules || {};
      if (
        rules.min !== undefined &&
        rules.max !== undefined &&
        rules.min >= rules.max
      ) {
        newErrors.validation_rules =
          "Minimum value must be less than maximum value";
      }
    }

    return newErrors;
  };

  const handleSave = () => {
    const validationErrors = validateQuestion();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Clear errors if validation passes
    setErrors({});
    onSave(formData);
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...(prev.options || []), { value: "", label: "" }],
    }));
    // Clear options error when adding new option
    if (errors.options) {
      setErrors((prev) => ({ ...prev, options: undefined }));
    }
  };

  const updateOption = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      ),
    }));
    // Clear options error when updating
    if (errors.options) {
      setErrors((prev) => ({ ...prev, options: undefined }));
    }
  };

  const removeOption = (index) => {
    const option = formData.options[index];

    // Don't allow removing existing options from protected templates
    if (isExistingNonEditable && option.value !== "") {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  // Clear specific errors when user starts typing
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const needsOptions = ["radio", "checkbox", "select", "ranking"].includes(
    formData.question_type
  );

  // Check if this is a term selection question
  const isTermSelection = formData.field_name === "termSelection";

  // Error message component
  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return <p className="text-sm text-red-500 mt-1">{error}</p>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Configure Question
            {isExistingNonEditable && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                Protected Template
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {isExistingNonEditable && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This question is from a protected template. You can modify labels,
              add new options, and edit help text, but existing options and core
              settings are locked to maintain data consistency.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="question-text">Question Text *</Label>
            <Textarea
              id="question-text"
              value={formData.question_text}
              onChange={(e) =>
                handleInputChange("question_text", e.target.value)
              }
              placeholder="Enter your question"
              className={errors.question_text ? "border-red-500" : ""}
              disabled={isExistingNonEditable}
            />
            <ErrorMessage error={errors.question_text} />
          </div>

          <div>
            <Label htmlFor="question-type">Question Type *</Label>
            <Select
              value={formData.question_type}
              onValueChange={(value) => {
                if (isExistingNonEditable) return; // Prevent changes for protected questions

                setFormData((prev) => ({ ...prev, question_type: value }));
                // Clear options when changing to a type that doesn't need them
                if (
                  !["radio", "checkbox", "select", "ranking"].includes(value)
                ) {
                  setFormData((prev) => ({ ...prev, options: [] }));
                }
                // Clear related errors
                setErrors((prev) => ({ ...prev, options: undefined }));
              }}
              disabled={isExistingNonEditable}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select question type" />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="mr-2">{type.icon}</span>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="field-name">Field Name (for data storage) *</Label>
            <Input
              id="field-name"
              value={formData.field_name}
              onChange={(e) => handleInputChange("field_name", e.target.value)}
              placeholder="e.g., q1"
              className={errors.field_name ? "border-red-500" : ""}
              disabled={isExistingNonEditable}
            />
            <ErrorMessage error={errors.field_name} />
            <p className="text-xs text-muted-foreground mt-1">
              Must start with a letter and contain only letters, numbers, and
              underscores
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-required"
              checked={formData.is_required}
              onCheckedChange={(checked) =>
                !isExistingNonEditable &&
                setFormData((prev) => ({ ...prev, is_required: checked }))
              }
              disabled={isExistingNonEditable}
            />
            <Label htmlFor="is-required">Required Field</Label>
          </div>

          <div>
            <Label htmlFor="help-text">Help Text</Label>
            <Textarea
              id="help-text"
              value={formData.help_text}
              onChange={(e) => handleInputChange("help_text", e.target.value)}
              placeholder="Optional help text for users"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Help text can always be edited to improve user guidance
            </p>
          </div>

          {needsOptions && (
            <div>
              <Label>Options *</Label>
              {/* Show special message for termSelection questions */}
              {isTermSelection && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        Term Selection
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Term options shown to the applicant will depend on the
                        term selected for the Job Posting. For e.g. If the
                        Winter 2025 is selected for Job Posting, then only
                        Winter 2025 term options will be shown to the applicant.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!isTermSelection && (
                <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground mb-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Understanding Options:</p>
                      <p className="mt-1">
                        <strong>Value:</strong> Stored in database (e.g.,
                        "citizen", "pr", "international") - must be consistent
                        for data analysis
                      </p>
                      <p>
                        <strong>Label:</strong> What users see on the form
                        (e.g., "Canadian Citizen", "Permanent Resident") - can
                        be updated for clarity
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!isTermSelection && (
                <div className="space-y-2">
                  {(formData.options || []).map((option, index) => {
                    const isExistingOption =
                      isExistingNonEditable && option.value !== "";
                    const isNewOption = !isExistingOption;

                    return (
                      <div key={index} className="flex space-x-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">
                            Value{" "}
                            {isExistingOption && (
                              <Lock className="h-3 w-3 inline ml-1" />
                            )}
                          </Label>
                          <Input
                            placeholder="e.g., citizen"
                            value={option.value}
                            disabled={isExistingOption}
                            onChange={(e) =>
                              updateOption(index, "value", e.target.value)
                            }
                            className={`${
                              errors.options ? "border-red-500" : ""
                            } ${
                              isExistingOption
                                ? "bg-muted text-muted-foreground"
                                : ""
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">
                            Label
                          </Label>
                          <Input
                            placeholder="e.g., Canadian Citizen"
                            value={option.label}
                            onChange={(e) =>
                              updateOption(index, "label", e.target.value)
                            }
                            className={errors.options ? "border-red-500" : ""}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeOption(index)}
                            type="button"
                            disabled={isExistingOption}
                            className={isExistingOption ? "opacity-50" : ""}
                            title={
                              isExistingOption
                                ? "Cannot remove existing options from protected templates"
                                : "Remove this option"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!isTermSelection && (
                <div>
                  <ErrorMessage error={errors.options} />
                  <Button
                    variant="outline"
                    onClick={addOption}
                    type="button"
                    className="mt-2"
                    disabled={false} // Always allow adding new options
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                  {isExistingNonEditable && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Plus className="h-3 w-3" />
                      You can add new options to expand this question, but
                      existing options are protected
                    </p>
                  )}
                  {formData.question_type === "ranking" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ranking questions require at least 2 options
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Additional validation rules for number inputs */}
          {formData.question_type === "number" && (
            <div className="space-y-2">
              <Label>Number Validation</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="min-value">Minimum Value</Label>
                  <Input
                    id="min-value"
                    type="number"
                    placeholder="Min"
                    value={formData.validation_rules?.min || ""}
                    disabled={isExistingNonEditable}
                    onChange={(e) => {
                      const min = e.target.value
                        ? parseFloat(e.target.value)
                        : undefined;
                      setFormData((prev) => ({
                        ...prev,
                        validation_rules: { ...prev.validation_rules, min },
                      }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="max-value">Maximum Value</Label>
                  <Input
                    id="max-value"
                    type="number"
                    placeholder="Max"
                    value={formData.validation_rules?.max || ""}
                    disabled={isExistingNonEditable}
                    onChange={(e) => {
                      const max = e.target.value
                        ? parseFloat(e.target.value)
                        : undefined;
                      setFormData((prev) => ({
                        ...prev,
                        validation_rules: { ...prev.validation_rules, max },
                      }));
                    }}
                  />
                </div>
              </div>
              <ErrorMessage error={errors.validation_rules} />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={handleSave} type="button">
            Save Question
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionDialog;
