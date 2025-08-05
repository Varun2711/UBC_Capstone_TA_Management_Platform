import AddDocuments from "./AddDocuments";

export default function SupportingDocuments({ documents, setDocuments }) {
  return (
    <div className="space-y-8 col-span-full">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Add Supporting Documents
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload relevant documents such as transcripts, certificates, or other
        supporting materials.
      </p>

      <div className="col-span-2">
        <AddDocuments
          documents={documents}
          setDocuments={setDocuments}
          maxFiles={3} //Allow up to 3 documents
          acceptedTypes=".pdf, .doc, .docx, .jpg, .jpeg, .png"
          maxFileSize={10 * 1024 * 1024} // 10MB
        />
      </div>
    </div>
  );
}
