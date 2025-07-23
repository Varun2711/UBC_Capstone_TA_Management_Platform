import React, { useState, useEffect } from "react";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Save,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QuestionDialog from "@/components/job-posting-management/QuestionDialog";

// Import logic layer functions
import {
  fetchTemplateById,
  createTemplate,
  updateTemplate,
  validateTemplateData,
  handleApiError,
} from "@/logic/job-management";

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

const FormBuilder = ({ templateId, onSave, onPreview }) => {
  const [template, setTemplate] = useState({
    name: "",
    description: "",
    sections: [],
  });
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load existing template if editing
  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTemplateById(templateId);
      setTemplate(data);
    } catch (error) {
      console.error("Error fetching template:", error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    const newSection = {
      section_id: Date.now(), // Temporary ID for new sections
      name: "New Section",
      section_type: "custom",
      order: template.sections.length + 1,
      is_required: true,
      description: "",
      questions: [],
      is_editable: true,
    };

    setTemplate((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));

    console.log("New section added:", newSection);
  };

  const updateSection = (sectionId, updates) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.section_id === sectionId ? { ...section, ...updates } : section
      ),
    }));
  };

  const deleteSection = (sectionId) => {
    if (!confirm("Are you sure you want to delete this section?")) {
      return;
    }

    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.filter(
        (section) => section.section_id !== sectionId
      ),
    }));
  };

  const moveSectionUp = (sectionIndex) => {
    if (sectionIndex === 0) return;
    const newSections = [...template.sections];
    [newSections[sectionIndex - 1], newSections[sectionIndex]] = [
      newSections[sectionIndex],
      newSections[sectionIndex - 1],
    ];

    // Update order numbers
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order: index + 1,
    }));

    setTemplate((prev) => ({ ...prev, sections: updatedSections }));
  };

  const moveSectionDown = (sectionIndex) => {
    if (sectionIndex === template.sections.length - 1) return;
    const newSections = [...template.sections];
    [newSections[sectionIndex], newSections[sectionIndex + 1]] = [
      newSections[sectionIndex + 1],
      newSections[sectionIndex],
    ];

    // Update order numbers
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order: index + 1,
    }));

    setTemplate((prev) => ({ ...prev, sections: updatedSections }));
  };

  const moveQuestionUp = (sectionId, questionIndex) => {
    if (questionIndex === 0) return;
    const section = template.sections.find((s) => s.section_id === sectionId);
    const newQuestions = [...section.questions];
    [newQuestions[questionIndex - 1], newQuestions[questionIndex]] = [
      newQuestions[questionIndex],
      newQuestions[questionIndex - 1],
    ];

    // Update order numbers
    // Re-index all questions to ensure consistent ordering
    const updatedQuestions = newQuestions.map((question, index) => ({
      ...question,
      order: index + 1,
    }));

    updateSection(sectionId, { questions: updatedQuestions });
  };

  const moveQuestionDown = (sectionId, questionIndex) => {
    const section = template.sections.find((s) => s.section_id === sectionId);
    if (questionIndex === section.questions.length - 1) return;

    const newQuestions = [...section.questions];
    // Swap questions
    [newQuestions[questionIndex], newQuestions[questionIndex + 1]] = [
      newQuestions[questionIndex + 1],
      newQuestions[questionIndex],
    ];

    // Re-index all questions to ensure consistent ordering
    const updatedQuestions = newQuestions.map((question, index) => ({
      ...question,
      order: index + 1,
    }));

    updateSection(sectionId, { questions: updatedQuestions });
  };

  const openQuestionDialog = (sectionId, question = null) => {
    const section = template.sections.find((s) => s.section_id === sectionId);
    const nextOrder = section.questions.length + 1;

    setEditingQuestion({
      sectionId,
      question: question || {
        question_id: Date.now(),
        question_text: "",
        question_type: "text",
        field_name: "",
        order: nextOrder,
        is_required: false,
        help_text: "",
        options: [],
        validation_rules: {},
        is_editable: true,
      },
    });
    setIsQuestionDialogOpen(true);
  };

  const saveQuestion = (questionData) => {
    const { sectionId, question } = editingQuestion;

    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.section_id === sectionId) {
          const existingQuestionIndex = section.questions.findIndex(
            (q) => q.question_id === question.question_id
          );

          let updatedQuestions;

          if (existingQuestionIndex >= 0) {
            // Update existing question - keep its current order
            updatedQuestions = section.questions.map((q, index) =>
              index === existingQuestionIndex
                ? { ...question, ...questionData }
                : q
            );
          } else {
            // Add new question to the end
            const newQuestion = { ...question, ...questionData };
            updatedQuestions = [...section.questions, newQuestion];
          }

          // Re-index all questions to ensure consistent ordering
          const reorderedQuestions = updatedQuestions.map((q, index) => ({
            ...q,
            order: index + 1,
          }));

          return { ...section, questions: reorderedQuestions };
        }
        return section;
      }),
    }));

    setIsQuestionDialogOpen(false);
    setEditingQuestion(null);
  };

  const deleteQuestion = (sectionId, questionId) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }

    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.section_id === sectionId
          ? {
              ...section,
              questions: section.questions
                .filter((q) => q.question_id !== questionId)
                .map((question, index) => ({
                  ...question,
                  order: index + 1, // Re-index after deletion
                })),
            }
          : section
      ),
    }));
  };

  const saveTemplate = async () => {
    // Validate template data
    const validation = validateTemplateData(template);
    if (!validation.isValid) {
      setError(
        `Validation errors: ${Object.values(validation.errors).join(", ")}`
      );
      return;
    }

    setSaving(true);
    setError(null);

    //console.log("Saving template:", template);

    try {
      let response;
      if (templateId) {
        response = await updateTemplate(templateId, template);
      } else {
        response = await createTemplate(template);
      }

      // console.log("Template saved successfully:", response);
      if (response) {
        onSave?.(response);
      }
    } catch (error) {
      console.error("Error saving template:", error);
      setError(handleApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // Validate template before preview
    const validation = validateTemplateData(template);
    if (!validation.isValid) {
      setError(
        `Please fix these issues before preview: ${Object.values(
          validation.errors
        ).join(", ")}`
      );
      return;
    }

    onPreview?.(template);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading template...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError(null)}
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Template Header */}
      <Card>
        <CardHeader>
          <CardTitle>
            {templateId ? "Edit" : "Create"} Application Form Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="template-name">
              Template Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="template-name"
              value={template.name}
              onChange={(e) =>
                setTemplate((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter template name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={template.description || ""}
              onChange={(e) =>
                setTemplate((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe this form template"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-4">
        {template.sections.map((section, sectionIndex) => (
          <Card
            key={section.section_id}
            className="border-2 border-dashed border-gray-300"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                {/* Section Name */}
                <div className="flex-1">
                  <Label htmlFor={`section-name-${section.section_id}`}>
                    Section Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`section-name-${section.section_id}`}
                    value={section.name}
                    onChange={(e) =>
                      updateSection(section.section_id, {
                        name: e.target.value,
                      })
                    }
                    className="font-semibold mt-1"
                    placeholder="Enter section name"
                  />
                </div>

                {/* Section Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground text-center">
                      Reorder
                    </Label>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveSectionUp(sectionIndex)}
                        disabled={sectionIndex === 0}
                        title="Move section up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveSectionDown(sectionIndex)}
                        disabled={sectionIndex === template.sections.length - 1}
                        title="Move section down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {section.is_editable !== false && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground text-center">
                        Delete
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSection(section.section_id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Description */}
              <div className="mt-3">
                <Label htmlFor={`section-description-${section.section_id}`}>
                  Section Description (Optional)
                </Label>
                <Textarea
                  id={`section-description-${section.section_id}`}
                  value={section.description || ""}
                  onChange={(e) =>
                    updateSection(section.section_id, {
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what this section covers"
                  rows={2}
                  className="mt-1"
                />
              </div>
            </CardHeader>

            <CardContent>
              {/* Questions */}
              <div className="space-y-2">
                {section.questions.length > 0 ? (
                  section.questions.map((question, questionIndex) => (
                    <div
                      key={question.question_id}
                      className="flex items-center space-x-2 p-3 bg-gray-50 rounded border"
                    >
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            moveQuestionUp(section.section_id, questionIndex)
                          }
                          disabled={questionIndex === 0}
                          title="Move question up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            moveQuestionDown(section.section_id, questionIndex)
                          }
                          disabled={
                            questionIndex === section.questions.length - 1
                          }
                          title="Move question down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {question.question_text || "Untitled Question"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {
                            QUESTION_TYPES.find(
                              (t) => t.value === question.question_type
                            )?.label
                          }
                          {question.is_required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                          {question.field_name && (
                            <span className="text-blue-600 ml-2">
                              ({question.field_name})
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openQuestionDialog(section.section_id, question)
                        }
                        title="Edit question"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          deleteQuestion(
                            section.section_id,
                            question.question_id
                          )
                        }
                        className="text-red-600 hover:text-red-700"
                        title="Delete question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground bg-gray-50 rounded border-2 border-dashed">
                    <p>No questions in this section yet</p>
                    <p className="text-sm">
                      Click "Add Question" below to get started
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => openQuestionDialog(section.section_id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Section Button */}
      <Button variant="outline" className="w-full" onClick={addSection}>
        <Plus className="h-4 w-4 mr-2" />
        Add Section
      </Button>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={handlePreview}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button onClick={saveTemplate} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Template"}
        </Button>
      </div>

      {/* Question Dialog */}
      <QuestionDialog
        isOpen={isQuestionDialogOpen}
        onClose={() => {
          setIsQuestionDialogOpen(false);
          setEditingQuestion(null);
        }}
        question={editingQuestion?.question}
        onSave={saveQuestion}
      />
    </div>
  );
};

export default FormBuilder;
