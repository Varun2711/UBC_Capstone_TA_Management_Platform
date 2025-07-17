import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import logic layer functions
import {
  createJobPosting,
  updateJobPosting,
  validateJobPostingData,
  handleApiError,
  fetchSchedulerProfile,
} from "@/logic/job-management";

const JobPostingForm = ({
  jobPosting,
  departments,
  terms,
  templates,
  onSave,
  onCancel,
}) => {
  // Initialize job form data fields
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
    created_by_id: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [schedulerProfile, setSchedulerProfile] = useState(null);

  useEffect(() => {
    console.log("Templates in JobPostingForm:", templates);
    console.log("Departments in JobPostingForm:", departments);
    console.log("JobPosting in JobPostingForm:", jobPosting);

    // Fetch scheduler profile for created_by_id
    fetchSchedulerProfileData();

    // If jobPosting prop is provided, populate formData with its values
    if (jobPosting) {
      populateFormData(jobPosting);
    }
  }, [jobPosting, departments, terms]);

  const fetchSchedulerProfileData = async () => {
    try {
      const profile = await fetchSchedulerProfile();
      setSchedulerProfile(profile);
    } catch (error) {
      console.error("Error fetching scheduler profile:", error);
      // Continue without profile - can still create job postings
    }
  };

  const populateFormData = (posting) => {
    // Handle department ID mapping
    let departmentId = posting.department_id;
    if (!departmentId && posting.department && posting.department.name) {
      const matchingDept = departments.find(
        (dept) => dept.name === posting.department.name
      );
      departmentId = matchingDept ? matchingDept.id : "";
    }

    // Handle term ID mapping
    let termId = posting.term_id;
    if (!termId && posting.term && posting.term.code) {
      const matchingTerm = terms.find(
        (term) => term.code === posting.term.code
      );
      termId = matchingTerm ? matchingTerm.id : "";
    }

    console.log("Mapped Department ID:", departmentId);
    console.log("Mapped Term ID:", termId);

    setFormData({
      title: posting.title || "",
      description: posting.description || "",
      requirements: posting.requirements || "",
      department_id: departmentId ? departmentId.toString() : "",
      term_id: termId ? termId.toString() : "",
      form_template_id: posting.form_template_id || "",
      post_date: posting.post_date || new Date().toISOString().split("T")[0],
      deadline_date: posting.deadline_date || "",
      status: posting.status || "draft",
      created_by_id: posting.created_by_id || "",
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data using logic layer
    const validation = validateJobPostingData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Prepare data for API call
      const submitData = {
        ...formData,
        form_template_id: formData.form_template_id || null,
        // Add scheduler profile ID if available
        created_by_id: formData.created_by_id || schedulerProfile?.id || null,
      };

      console.log("Submitting job posting data:", submitData);

      let response;
      if (jobPosting) {
        // Update existing job posting
        response = await updateJobPosting(jobPosting.posting_id, submitData);
      } else {
        // Create new job posting
        response = await createJobPosting(submitData);
      }

      console.log("Job posting submitted successfully:", response);
      onSave(response);
    } catch (error) {
      console.error("Error submitting job posting:", error);
      const errorMessage = handleApiError(error);
      setErrors({ submit: errorMessage });
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
              <Label htmlFor="title">
                Job Title <span className="text-red-500">*</span>
              </Label>
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
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
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
              <Label htmlFor="requirements">Requirements (Optional)</Label>
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
              {/* Department Select */}
              <div>
                <Label htmlFor="department_id">
                  Department <span className="text-red-500">*</span>
                </Label>
                <select
                  id="department_id"
                  name="department_id"
                  className={`w-full border p-2 rounded ${
                    errors.department_id ? "border-red-500" : "border-gray-300"
                  }`}
                  value={formData.department_id}
                  onChange={(e) =>
                    handleInputChange("department_id", e.target.value)
                  }
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.department_id}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="term_id">
                  Term <span className="text-red-500">*</span>
                </Label>
                <select
                  id="term_id"
                  name="term_id"
                  className={`w-full border p-2 rounded ${
                    errors.term_id ? "border-red-500" : "border-gray-300"
                  }`}
                  value={formData.term_id}
                  onChange={(e) => handleInputChange("term_id", e.target.value)}
                >
                  <option value="">Select term</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id.toString()}>
                      {term.code} - {term.description}
                    </option>
                  ))}
                </select>
                {errors.term_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.term_id}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="form_template_id">
                Application Form Template
              </Label>
              <select
                id="form_template_id"
                name="form_template_id"
                className="w-full border p-2 rounded border-gray-300"
                value={formData.form_template_id || ""}
                onChange={(e) =>
                  handleInputChange("form_template_id", e.target.value)
                }
              >
                <option value="">Select Application Form</option>
                {templates
                  .filter((template) => template.is_active)
                  .map((template) => (
                    <option
                      key={template.template_id}
                      value={template.template_id.toString()}
                    >
                      {template.name}
                    </option>
                  ))}
              </select>
              <p className="text-sm text-muted-foreground mt-1">
                Choose an application form template now or update at a later
                time. You can create a new application form template in the Job
                Posting Manager.
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
                <Label htmlFor="deadline_date">
                  Application Deadline <span className="text-red-500">*</span>
                </Label>
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
              <p className="text-sm text-muted-foreground mt-1">
                Draft: Not visible to students | Open: Students can apply |
                Closed: No new applications
              </p>
              <select
                id="status"
                name="status"
                className="w-full border p-2 rounded border-gray-300"
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
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
