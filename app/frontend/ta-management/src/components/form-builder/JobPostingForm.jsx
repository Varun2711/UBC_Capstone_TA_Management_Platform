import React, { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const JobPostingForm = ({
  jobPosting,
  departments = {},
  terms = {},
  templates,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    department_id: "",
    term_id: "",
    form_template_id: "",
    post_date: new Date().toISOString().split("T")[0],
    deadline_date: "",
    status: "draft",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log(templates, "Templates in JobPostingForm");

    if (jobPosting) {
      setFormData({
        title: jobPosting.title || "",
        description: jobPosting.description || "",
        requirements: jobPosting.requirements || "",
        department_id: jobPosting.department?.id || "",
        term_id: jobPosting.term?.id || "",
        form_template_id: jobPosting.form_template?.template_id || "",
        post_date:
          jobPosting.post_date || new Date().toISOString().split("T")[0],
        deadline_date: jobPosting.deadline_date || "",
        status: jobPosting.status || "draft",
      });
    }
  }, [jobPosting]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.department_id) {
      newErrors.department_id = "Department is required";
    }

    if (!formData.term_id) {
      newErrors.term_id = "Term is required";
    }

    if (!formData.deadline_date) {
      newErrors.deadline_date = "Deadline date is required";
    }

    // Validate deadline is in the future
    if (
      formData.deadline_date &&
      new Date(formData.deadline_date) <= new Date()
    ) {
      newErrors.deadline_date = "Deadline must be in the future";
    }

    // Validate deadline is after post date
    if (
      formData.deadline_date &&
      formData.post_date &&
      new Date(formData.deadline_date) <= new Date(formData.post_date)
    ) {
      newErrors.deadline_date = "Deadline must be after post date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API
      const submitData = {
        ...formData,
        form_template_id: formData.form_template_id || null,
      };

      // Remove empty template ID to avoid validation errors
      if (!submitData.form_template_id) {
        delete submitData.form_template_id;
      }

      const url = jobPosting
        ? `http://localhost:8080/api/ajp/jobpostings/${jobPosting.posting_id}/`
        : "http://localhost:8080/api/ajp/jobpostings/";

      const method = jobPosting ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(
          `Failed to ${jobPosting ? "update" : "create"} job posting`
        );
      }

      const savedJobPosting = await response.json();
      onSave(savedJobPosting);
    } catch (error) {
      console.error("Error saving job posting:", error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., COSC 111 Teaching Assistant"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe the position, responsibilities, and expectations..."
                rows={4}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) =>
                  handleInputChange("requirements", e.target.value)
                }
                placeholder="List any specific requirements, qualifications, or preferences..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Assignment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department *</Label>
                {/* <Select
                  value={formData.department_id}
                  onValueChange={(value) =>
                    handleInputChange("department_id", value)
                  }
                >
                  <SelectTrigger
                    className={errors.department_id ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}
                {errors.department_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.department_id}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="term">Term *</Label>
                {/* <Select
                  value={formData.term_id}
                  onValueChange={(value) => handleInputChange("term_id", value)}
                >
                  <SelectTrigger
                    className={errors.term_id ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id.toString()}>
                        {term.code} - {term.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}
                {errors.term_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.term_id}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="form_template">Application Form Template</Label>
              {/* <Select
                value={formData.form_template_id}
                onValueChange={(value) =>
                  handleInputChange("form_template_id", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Use default form or select custom template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Default Application Form</SelectItem>
                  {templates
                    .filter((template) => template.is_active)
                    .map((template) => (
                      <SelectItem
                        key={template.template_id}
                        value={template.template_id.toString()}
                      >
                        {template.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select> */}
              <p className="text-sm text-muted-foreground mt-1">
                Choose a custom form template or leave blank to use the standard
                application form
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="post_date">Post Date</Label>
                <Input
                  id="post_date"
                  type="date"
                  value={formData.post_date}
                  onChange={(e) =>
                    handleInputChange("post_date", e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor="deadline_date">Application Deadline *</Label>
                <Input
                  id="deadline_date"
                  type="date"
                  value={formData.deadline_date}
                  onChange={(e) =>
                    handleInputChange("deadline_date", e.target.value)
                  }
                  className={errors.deadline_date ? "border-red-500" : ""}
                />
                {errors.deadline_date && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.deadline_date}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Draft: Not visible to students | Open: Students can apply |
                Closed: No new applications
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{errors.submit}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : jobPosting
              ? "Update Job Posting"
              : "Create Job Posting"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JobPostingForm;
