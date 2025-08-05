import { useState, useEffect } from "react";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchApplicationDocuments,
  downloadDocument,
} from "@/logic/student-view-applications";

const DocumentsSection = ({ applicationId }) => {
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!applicationId) return;

      try {
        setLoadingDocuments(true);
        const docs = await fetchApplicationDocuments(applicationId);
        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching documents:", error);
        // Don't show error to user for documents, just log it
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchDocuments();
  }, [applicationId]);

  const handleDownload = async (document) => {
    try {
      setDownloadingIds((prev) => new Set([...prev, document.document_id]));
      await downloadDocument(document.document_id, document.file_name);
    } catch (error) {
      console.error("Download failed:", error);
      // You could add a toast notification here if you have one
      alert("Failed to download document. Please try again.");
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(document.document_id);
        return newSet;
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUploadDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  if (loadingDocuments) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Supporting Documents
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading documents...</span>
        </div>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Supporting Documents
        </h3>
        <p className="text-gray-600">
          No documents were submitted with this application.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Supporting Documents
      </h3>

      <div className="space-y-3">
        {documents.map((document) => {
          const isDownloading = downloadingIds.has(document.document_id);

          return (
            <div
              key={document.document_id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    {document.file_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatFileSize(document.file_size)} • Uploaded{" "}
                    {formatUploadDate(document.uploaded_at)}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleDownload(document)}
                disabled={isDownloading}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentsSection;
