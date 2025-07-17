import React, { useState, useEffect } from "react";
import { Plus, Edit, Copy, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import components
import FormBuilder from "@/components/job-posting-management/FormBuilder";
import JobPostingForm from "@/components/job-posting-management/JobPostingForm";
import FormTemplatePreview from "@/components/job-posting-management/FormTemplatePreview";

// Import the logic layer
import {
  fetchAllInitialData,
  deleteJobPosting,
  assignTemplateToJobPosting,
  duplicateTemplate,
  deleteTemplate,
  fetchJobPostings,
  fetchTemplates,
  handleApiError,
} from "@/logic/job-management";

const JobManagementPage = () => {
  // Shared state
  const [jobPostings, setJobPostings] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Job posting state
  const [selectedJobPosting, setSelectedJobPosting] = useState(null);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [jobSearchTerm, setJobSearchTerm] = useState("");
  const [jobFilterStatus, setJobFilterStatus] = useState("all");

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [templateSearchTerm, setTemplateSearchTerm] = useState("");
  const [templateFilterActive, setTemplateFilterActive] = useState("all");

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch initial data using the logic layer
  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllInitialData();
      setJobPostings(data.jobPostings);
      setTemplates(data.templates);
      setDepartments(data.departments);
      setTerms(data.terms);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // Refresh job postings
  const refreshJobPostings = async () => {
    try {
      const data = await fetchJobPostings();
      setJobPostings(data);
    } catch (error) {
      console.error("Error refreshing job postings:", error);
      setError(handleApiError(error));
    }
  };

  // Refresh templates
  const refreshTemplates = async () => {
    try {
      const data = await fetchTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error refreshing templates:", error);
      setError(handleApiError(error));
    }
  };

  // Job Posting Handlers
  const handleCreateJobPosting = () => {
    setSelectedJobPosting(null);
    setIsJobDialogOpen(true);
  };

  const handleEditJobPosting = (jobPosting) => {
    setSelectedJobPosting(jobPosting);
    setIsJobDialogOpen(true);
  };

  const handleDeleteJobPosting = async (postingId) => {
    if (!confirm("Are you sure you want to delete this job posting?")) {
      return;
    }

    try {
      await deleteJobPosting(postingId);
      await refreshJobPostings();
    } catch (error) {
      console.error("Error deleting job posting:", error);
      setError(handleApiError(error));
    }
  };

  const handleAssignTemplate = async (postingId, templateId) => {
    try {
      await assignTemplateToJobPosting(postingId, templateId);
      await refreshJobPostings();
    } catch (error) {
      console.error("Error assigning template:", error);
      setError(handleApiError(error));
    }
  };

  // Template Handlers
  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsBuilderOpen(true);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setIsBuilderOpen(true);
  };

  const handleDuplicateTemplate = async (template) => {
    try {
      await duplicateTemplate(template.template_id);
      await refreshTemplates();
    } catch (error) {
      console.error("Error duplicating template:", error);
      setError(handleApiError(error));
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      await deleteTemplate(templateId);
      await refreshTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      setError(handleApiError(error));
    }
  };

  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  // Filter functions
  const filteredJobPostings = jobPostings.filter((posting) => {
    const matchesSearch =
      posting.title.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
      posting.department?.name
        .toLowerCase()
        .includes(jobSearchTerm.toLowerCase());
    const matchesFilter =
      jobFilterStatus === "all" || posting.status === jobFilterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
      template.description
        ?.toLowerCase()
        .includes(templateSearchTerm.toLowerCase());
    const matchesFilter =
      templateFilterActive === "all" ||
      (templateFilterActive === "active" && template.is_active) ||
      (templateFilterActive === "inactive" && !template.is_active);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">Error: {error}</div>
          <Button onClick={fetchInitialData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Job Posting Management</h2>
          <p className="text-muted-foreground">
            Manage job postings and application form templates
          </p>
        </div>
      </div>

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

      {/* Main Content with Tabs */}
      <div className="space-y-6">
        <Tabs defaultValue="postings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="postings">Job Postings</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="postings" className="space-y-4">
            {/* Job Postings Filters */}
            <div className="flex gap-4 items-center">
              <Input
                placeholder="Search job postings..."
                value={jobSearchTerm}
                onChange={(e) => setJobSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Select
                value={jobFilterStatus}
                onValueChange={setJobFilterStatus}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreateJobPosting}>
                <Plus className="h-4 w-4 mr-2" />
                Create Job Posting
              </Button>
            </div>

            {/* Job Postings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobPostings.map((posting) => (
                <Card
                  key={posting.posting_id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{posting.title}</CardTitle>
                      <Badge
                        variant={
                          posting.status === "open" ? "default" : "secondary"
                        }
                      >
                        {posting.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {posting.department?.name} • {posting.term?.code}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        <div>
                          Deadline:{" "}
                          {new Date(posting.deadline_date).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditJobPosting(posting)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDeleteJobPosting(posting.posting_id)
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Form Template:
                          </Label>
                          <Select
                            value={
                              posting.form_template_id?.toString() || "default"
                            }
                            onValueChange={(value) =>
                              handleAssignTemplate(
                                posting.posting_id,
                                value === "default" ? null : parseInt(value)
                              )
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">
                                Select Form
                              </SelectItem>
                              {templates
                                .filter((t) => t.is_active)
                                .map((template) => (
                                  <SelectItem
                                    key={template.template_id}
                                    value={template.template_id.toString()}
                                  >
                                    {template.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty state for job postings */}
            {filteredJobPostings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No job postings found
                </p>
                <Button onClick={handleCreateJobPosting}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Job Posting
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            {/* Template Filters */}
            <div className="flex gap-4 items-center">
              <Input
                placeholder="Search templates..."
                value={templateSearchTerm}
                onChange={(e) => setTemplateSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Select
                value={templateFilterActive}
                onValueChange={setTemplateFilterActive}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreateTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.template_id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge
                        variant={template.is_active ? "default" : "secondary"}
                      >
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground">
                        Created{" "}
                        {new Date(template.created_at).toLocaleDateString()}
                        {template.created_by &&
                          ` by ${template.created_by.name}`}
                      </div>

                      <div className="flex gap-2">
                        <div className="relative group">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewTemplate(template)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            Preview Template
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>

                        {template.is_editable && (
                          <div className="relative group">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                              Edit Template
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}

                        <div className="relative group">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicateTemplate(template)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            Copy Template
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>

                        {template.is_editable && (
                          <div className="relative group">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeleteTemplate(template.template_id)
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                              Delete Template
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty state for templates */}
            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No templates found</p>
                <Button onClick={handleCreateTemplate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Job Posting Dialog */}
      <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedJobPosting
                ? "Edit Job Posting"
                : "Create New Job Posting"}
            </DialogTitle>
          </DialogHeader>
          <JobPostingForm
            jobPosting={selectedJobPosting}
            departments={departments}
            terms={terms}
            templates={templates}
            onSave={async (savedJobPosting) => {
              setIsJobDialogOpen(false);
              await refreshJobPostings();
              setSelectedJobPosting(null);
            }}
            onCancel={() => {
              setIsJobDialogOpen(false);
              setSelectedJobPosting(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Form Builder Dialog */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
          </DialogHeader>
          <FormBuilder
            templateId={selectedTemplate?.template_id}
            onSave={async (savedTemplate) => {
              setIsBuilderOpen(false);
              await refreshTemplates();
              setSelectedTemplate(null);
            }}
            onPreview={(template) => {
              setSelectedTemplate(template);
              setIsBuilderOpen(false);
              setIsPreviewOpen(true);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <FormTemplatePreview template={selectedTemplate} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobManagementPage;
