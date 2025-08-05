import { useState } from "react";
import {
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Trash2,
  Plus,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Helper function to get file icon based on file type
const getFileIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();

  switch (extension) {
    case "pdf":
      return <FileText className="h-6 w-6 text-red-500" />;
    case "doc":
    case "docx":
      return <FileText className="h-6 w-6 text-blue-500" />;
    case "xls":
    case "xlsx":
      return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return <Image className="h-6 w-6 text-purple-500" />;
    default:
      return <File className="h-6 w-6 text-gray-500" />;
  }
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function AddDocuments({
  documents = [],
  setDocuments,
  maxFiles = 5,
  acceptedTypes = ".pdf, .doc, .docx, .jpg, .jpeg, .png",
  maxFileSize = 10 * 1024 * 1024, // 10MB in bytes
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Validate file before adding
  const validateFile = (file) => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size must be less than ${formatFileSize(maxFileSize)}`;
    }

    // Check file type
    const extension = file.name.split(".").pop().toLowerCase();
    const allowedExtensions = acceptedTypes
      .split(",")
      .map((type) => type.replace(".", "").trim());

    if (!allowedExtensions.includes(extension)) {
      return `File type .${extension} is not allowed. Accepted types: ${acceptedTypes}`;
    }

    // Check if file already exists
    if (
      documents.some((doc) => doc.name === file.name && doc.size === file.size)
    ) {
      return "This file has already been uploaded";
    }

    return null;
  };

  // Add new document(s)
  const addDocuments = (files) => {
    const newDocuments = [];
    const errors = [];

    Array.from(files).forEach((file) => {
      // Check if we've reached max files
      if (documents.length + newDocuments.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        newDocuments.push({
          id: Date.now() + Math.random(), // Simple unique ID
          name: file.name,
          size: file.size,
          type: file.type,
          file: file,
          uploadDate: new Date().toISOString(),
        });
      }
    });

    if (errors.length > 0) {
      setUploadError(errors.join("; "));
    } else {
      setUploadError("");
    }

    if (newDocuments.length > 0) {
      setDocuments([...documents, ...newDocuments]);
      //console.log(...documents);
    }
  };

  // Remove document
  const removeDocument = (documentId) => {
    setDocuments(documents.filter((doc) => doc.id !== documentId));
    setUploadError("");
  };

  // Handle file input change
  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      addDocuments(files);
    }
    // Reset input value to allow uploading the same file again
    event.target.value = "";
  };

  // Handle drag and drop
  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      addDocuments(files);
    }
  };

  // Handle click events to prevent form submission
  const handleUploadAreaClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (documents.length < maxFiles) {
      document.getElementById("file-upload").click();
    }
  };

  const handleAddMoreClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById("file-upload").click();
  };

  return (
    <div className="space-y-6 col-span-full">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          {/* Drag and Drop Upload Area */}
          <div
            data-testid="drop-zone"
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${
                dragOver
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }
              ${
                documents.length >= maxFiles
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadAreaClick}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {documents.length >= maxFiles
                  ? `Maximum ${maxFiles} files reached`
                  : "Drop files here or click to upload"}
              </p>
              <p className="text-sm text-gray-500">
                Supported formats:{" "}
                {acceptedTypes.replace(/\./g, "").toUpperCase()}
              </p>
              <p className="text-xs text-gray-400">
                Max file size: {formatFileSize(maxFileSize)}
              </p>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            id="file-upload"
            type="file"
            multiple
            accept={acceptedTypes}
            onChange={handleFileChange}
            className="hidden"
            disabled={documents.length >= maxFiles}
          />

          {/* Upload Error */}
          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{uploadError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Uploaded Documents ({documents.length})</span>
              <span className="text-sm font-normal text-gray-500">
                {documents.length}/{maxFiles} files
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      {getFileIcon(document.name)}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {document.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(document.size)} • Uploaded{" "}
                        {new Date(document.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(document.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Remove file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add More Files Button */}
            {documents.length < maxFiles && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddMoreClick}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add More Documents ({maxFiles - documents.length} remaining)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Accepted file types: PDF, Word documents, JPG, PNG</p>
        <p>• Maximum file size: {formatFileSize(maxFileSize)} per file</p>
        <p>• You can upload up to {maxFiles} documents total</p>
      </div>
    </div>
  );
}
