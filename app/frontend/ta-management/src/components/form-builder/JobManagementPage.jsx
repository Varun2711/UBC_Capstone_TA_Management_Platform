import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  Eye,
  Settings,
  Briefcase,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import FormBuilder from "@/components/form-builder/FormBuilder";
import DynamicFormRenderer from "@/components/form-builder/DynamicFormRenderer";
import JobPostingForm from "@/components/form-builder/JobPostingForm";
import axios from "axios";

// API instance
const instance = axios.create({
  baseURL: "http://localhost:8080/api",
});

//mock departments and terms while awaiting the course API
const mockDepartments = [{ id: 1, name: "CMPS" }];
const mockTerms = [
  { id: 1, code: "W2025T1", description: "Winter 2025 Term 1" },
  { id: 2, code: "W2025T2", description: "Winter 2025 Term 2" },
  { id: 3, code: "W2025BOTH", description: "Winter 2025 Both Terms" },
];

const JobManagementPage = () => {
  // Toggle state
  const [currentView, setCurrentView] = useState("jobs"); // "jobs" or "templates"

  // Shared state
  const [jobPostings, setJobPostings] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);

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

  //on mount, fetch initial data including job postings, templates, departments, and terms
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchJobPostings(),
        fetchTemplates(),
        fetchDepartments(),
        fetchTerms(),
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobPostings = async () => {
    try {
      const response = await instance.get("/ajp/jobpostings/");
      setJobPostings(response.data);
    } catch (error) {
      console.error("Error fetching job postings:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await instance.get("/ajp/form-templates/");
      setTemplates(response.data);
      console.log("Templates fetched:", response.data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await instance.get("/courses/departments/");
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments from api:", error);
      // Fallback to mock data
      setDepartments(mockDepartments);
    }
  };

  //waiting on course api
  const fetchTerms = async () => {
    try {
      const data = await instance.get("/course/terms/");
      setTerms(data);
    } catch (error) {
      console.error("Error fetching terms:", error);
      // Fallback to mock data
      setTerms(mockTerms);
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
      console.log("Deleting job posting with ID:", postingId);
      const response = await instance.delete(`/ajp/jobpostings/${postingId}/`);
      console.log("Job posting deleted successfully:", response.data);
      // Refresh job postings after deletion
      fetchJobPostings();
    } catch (error) {
      console.error("Error deleting job posting:", error);
    }
  };

  const handleAssignTemplate = async (postingId, templateId) => {
    try {
      await instance.patch(`/ajp/jobpostings/${postingId}/`, templateId);
      fetchJobPostings();
    } catch (error) {
      console.error("Error assigning template:", error);
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
      await apiCall(`/ajp/form-templates/${template.template_id}/duplicate/`, {
        method: "POST",
      });
      fetchTemplates();
    } catch (error) {
      console.error("Error duplicating template:", error);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }
    try {
      await apiCall(`/ajp/form-templates/${templateId}/`, { method: "DELETE" });
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Job Management</h2>
          <p className="text-muted-foreground">
            Manage job postings and form templates
          </p>
        </div>
      </div>

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
                        <div>
                          Template:{" "}
                          {posting.form_template?.name || "Default Form"}
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
                              posting.form_template?.template_id?.toString() ||
                              "default"
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
                                Default Form
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
            {/*if no job postings found, show message and button to create first*/}

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
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{template.sections?.length || 0} sections</span>
                        {/* <span>
                          Used in{" "}
                          {
                            jobPostings.filter(
                              (p) =>
                                p.form_template?.template_id ===
                                template.template_id
                            ).length
                          }{" "}
                          jobs
                        </span> */}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Created{" "}
                        {new Date(template.created_at).toLocaleDateString()}
                        {template.created_by &&
                          ` by ${template.created_by.name}`}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

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
            //when job posting is saved, fetch job postings again and close dialog
            onSave={(savedJobPosting) => {
              setIsJobDialogOpen(false);
              fetchJobPostings();
              setSelectedJobPosting(null);
            }}
            //when job posting is cancelled, close dialog and reset selected job posting
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
            onSave={(savedTemplate) => {
              setIsBuilderOpen(false);
              fetchTemplates();
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
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This is how the form will appear to students applying for
                  positions.
                </p>
              </div>
              <DynamicFormRenderer
                template={selectedTemplate}
                responses={{}}
                setResponses={() => {}}
                errors={{}}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobManagementPage;
