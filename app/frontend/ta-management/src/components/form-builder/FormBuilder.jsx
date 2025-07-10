import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Plus, GripVertical, Edit, Trash2, Save, Eye } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const QUESTION_TYPES = [
  { value: "radio", label: "Radio Button", icon: "◉" },
  { value: "checkbox", label: "Checkbox", icon: "☑" },
  { value: "text", label: "Text Input", icon: "T" },
  { value: "textarea", label: "Text Area", icon: "📝" },
  { value: "select", label: "Dropdown", icon: "▼" },
  { value: "number", label: "Number", icon: "#" },
  { value: "email", label: "Email", icon: "@" },
  { value: "file", label: "File Upload", icon: "📎" },
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

  // Load existing template if editing
  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/form-templates/${templateId}/`);
      const data = await response.json();
      setTemplate(data);
    } catch (error) {
      console.error("Error fetching template:", error);
    }
  };

  const addSection = () => {
    const newSection = {
      section_id: Date.now(), // Temporary ID
      name: "New Section",
      section_type: "custom",
      order: template.sections.length + 1,
      is_required: true,
      description: "",
      questions: [],
    };
    setTemplate((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
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
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.filter(
        (section) => section.section_id !== sectionId
      ),
    }));
  };

  const openQuestionDialog = (sectionId, question = null) => {
    setEditingQuestion({
      sectionId,
      question: question || {
        question_id: Date.now(),
        question_text: "",
        question_type: "text",
        field_name: "",
        order: 1,
        is_required: false,
        help_text: "",
        options: [],
        validation_rules: {},
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

          if (existingQuestionIndex >= 0) {
            // Update existing question
            const updatedQuestions = [...section.questions];
            updatedQuestions[existingQuestionIndex] = {
              ...question,
              ...questionData,
            };
            return { ...section, questions: updatedQuestions };
          } else {
            // Add new question
            return {
              ...section,
              questions: [
                ...section.questions,
                { ...question, ...questionData },
              ],
            };
          }
        }
        return section;
      }),
    }));

    setIsQuestionDialogOpen(false);
    setEditingQuestion(null);
  };

  const deleteQuestion = (sectionId, questionId) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.section_id === sectionId
          ? {
              ...section,
              questions: section.questions.filter(
                (q) => q.question_id !== questionId
              ),
            }
          : section
      ),
    }));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === "section") {
      const newSections = Array.from(template.sections);
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);

      // Update order numbers
      const updatedSections = newSections.map((section, index) => ({
        ...section,
        order: index + 1,
      }));

      setTemplate((prev) => ({ ...prev, sections: updatedSections }));
    } else if (type === "question") {
      const sectionId = parseInt(source.droppableId);
      const section = template.sections.find((s) => s.section_id === sectionId);
      const newQuestions = Array.from(section.questions);
      const [reorderedQuestion] = newQuestions.splice(source.index, 1);
      newQuestions.splice(destination.index, 0, reorderedQuestion);

      // Update order numbers
      const updatedQuestions = newQuestions.map((question, index) => ({
        ...question,
        order: index + 1,
      }));

      updateSection(sectionId, { questions: updatedQuestions });
    }
  };

  const saveTemplate = async () => {
    try {
      const url = templateId
        ? `/api/form-templates/${templateId}/`
        : "/api/form-templates/";
      const method = templateId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        const savedTemplate = await response.json();
        onSave?.(savedTemplate);
      }
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Template Header */}
      <Card>
        <CardHeader>
          <CardTitle>Form Template Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={template.name}
              onChange={(e) =>
                setTemplate((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter template name"
            />
          </div>
          <div>
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={template.description}
              onChange={(e) =>
                setTemplate((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe this form template"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections" type="section">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {template.sections.map((section, sectionIndex) => (
                <Draggable
                  key={section.section_id}
                  draggableId={`section-${section.section_id}`}
                  index={sectionIndex}
                >
                  {(provided) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="border-2 border-dashed border-gray-300"
                    >
                      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <div {...provided.dragHandleProps} className="mr-2">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <Input
                            value={section.name}
                            onChange={(e) =>
                              updateSection(section.section_id, {
                                name: e.target.value,
                              })
                            }
                            className="font-semibold"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`required-${section.section_id}`}>
                            Required
                          </Label>
                          <Switch
                            id={`required-${section.section_id}`}
                            checked={section.is_required}
                            onCheckedChange={(checked) =>
                              updateSection(section.section_id, {
                                is_required: checked,
                              })
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSection(section.section_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={section.description || ""}
                          onChange={(e) =>
                            updateSection(section.section_id, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Section description"
                          className="mb-4"
                        />

                        {/* Questions */}
                        <Droppable
                          droppableId={`${section.section_id}`}
                          type="question"
                        >
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-2"
                            >
                              {section.questions.map(
                                (question, questionIndex) => (
                                  <Draggable
                                    key={question.question_id}
                                    draggableId={`question-${question.question_id}`}
                                    index={questionIndex}
                                  >
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="flex items-center space-x-2 p-3 bg-gray-50 rounded border"
                                      >
                                        <div {...provided.dragHandleProps}>
                                          <GripVertical className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="font-medium">
                                            {question.question_text}
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            {
                                              QUESTION_TYPES.find(
                                                (t) =>
                                                  t.value ===
                                                  question.question_type
                                              )?.label
                                            }
                                            {question.is_required && (
                                              <span className="text-red-500 ml-1">
                                                *
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            openQuestionDialog(
                                              section.section_id,
                                              question
                                            )
                                          }
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
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </Draggable>
                                )
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        <Button
                          variant="dashed"
                          className="w-full mt-4"
                          onClick={() => openQuestionDialog(section.section_id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Question
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Section Button */}
      <Button variant="outline" className="w-full" onClick={addSection}>
        <Plus className="h-4 w-4 mr-2" />
        Add Section
      </Button>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => onPreview?.(template)}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button onClick={saveTemplate}>
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
      </div>

      {/* Question Dialog */}
      <QuestionDialog
        isOpen={isQuestionDialogOpen}
        onClose={() => setIsQuestionDialogOpen(false)}
        question={editingQuestion?.question}
        onSave={saveQuestion}
      />
    </div>
  );
};

const QuestionDialog = ({ isOpen, onClose, question, onSave }) => {
  const [formData, setFormData] = useState({
    question_text: "",
    question_type: "text",
    field_name: "",
    is_required: false,
    help_text: "",
    options: [],
    validation_rules: {},
  });

  useEffect(() => {
    if (question) {
      setFormData({ ...question });
    }
  }, [question]);

  const handleSave = () => {
    onSave(formData);
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...(prev.options || []), { value: "", label: "" }],
    }));
  };

  const updateOption = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      ),
    }));
  };

  const removeOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const needsOptions = ["radio", "checkbox", "select", "ranking"].includes(
    formData.question_type
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Question</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="question-text">Question Text</Label>
            <Textarea
              id="question-text"
              value={formData.question_text}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  question_text: e.target.value,
                }))
              }
              placeholder="Enter your question"
            />
          </div>

          <div>
            <Label htmlFor="question-type">Question Type</Label>
            <Select
              value={formData.question_type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, question_type: value }))
              }
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
            <Label htmlFor="field-name">Field Name (for data storage)</Label>
            <Input
              id="field-name"
              value={formData.field_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, field_name: e.target.value }))
              }
              placeholder="e.g., citizenship_status"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-required"
              checked={formData.is_required}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_required: checked }))
              }
            />
            <Label htmlFor="is-required">Required Field</Label>
          </div>

          <div>
            <Label htmlFor="help-text">Help Text</Label>
            <Textarea
              id="help-text"
              value={formData.help_text}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, help_text: e.target.value }))
              }
              placeholder="Optional help text for users"
            />
          </div>

          {needsOptions && (
            <div>
              <Label>Options</Label>
              <div className="space-y-2">
                {(formData.options || []).map((option, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      placeholder="Value"
                      value={option.value}
                      onChange={(e) =>
                        updateOption(index, "value", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Label"
                      value={option.label}
                      onChange={(e) =>
                        updateOption(index, "label", e.target.value)
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Question</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormBuilder;
