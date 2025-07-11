import React, { useState, useEffect } from "react";
import { Plus, Edit, Copy, Trash2, Eye, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8080/api",
});

const FormTemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [loading, setLoading] = useState(true);

  //on mount, get the job postings and the templates
  useEffect(() => {
    fetchTemplates();
    fetchJobPostings();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await instance.get("/ajp/form-templates/");
      console.log(response.data);
      //const data = await response.json();
      setTemplates(response.data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobPostings = async () => {
    try {
      const response = await instance.get("/ajp/jobpostings/");
      console.log(response.data);
      setJobPostings(response.data);
    } catch (error) {
      console.error("Error fetching job postings:", error);
    }
  };

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
      const response = await instance.post(
        `/ajp/form-templates/${template.template_id}/duplicate/`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error duplicating template:", error);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await instance.delete(
        `/ajp/form-templates/${templateId}/`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleAssignTemplate = async (postingId, templateId) => {
    try {
      const response = await instance.patch(`/ajp/jobpostings/${postingId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form_template_id: templateId || null,
        }),
      });
      if (response.ok) {
        fetchJobPostings();
      }
    } catch (error) {
      console.error("Error assigning template:", error);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterActive === "all" ||
      (filterActive === "active" && template.is_active) ||
      (filterActive === "inactive" && !template.is_active);
    return matchesSearch && matchesFilter;
  });

  // const getTemplateUsageCount = (templateId) => {
  //   return jobPostings.filter(
  //     (posting) => posting.form_template?.template_id === templateId
  //   ).length;
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            Application Form Template Manager
          </h2>
          <p className="text-muted-foreground">
            Create and manage custom application forms for students to use when
            applying for job postings.
          </p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="assignments">Job Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
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
                    <div className="flex items-center space-x-1">
                      <Badge
                        variant={template.is_active ? "default" : "secondary"}
                      >
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
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
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Created{" "}
                      {new Date(template.created_at).toLocaleDateString()}
                      {template.created_by && ` by ${template.created_by.name}`}
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

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Posting Template Assignments</CardTitle>
              <p className="text-sm text-muted-foreground">
                Assign form templates to job postings. Jobs without assigned
                templates will use the default form.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobPostings.map((posting) => (
                  <div
                    key={posting.posting_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{posting.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {posting.department?.name} • {posting.term?.code} •
                        <Badge variant="outline" className="ml-2">
                          {posting.status}
                        </Badge>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
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
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default Form</SelectItem>
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
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                setResponses={() => {}} // Read-only preview
                errors={{}}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormTemplateManager;
