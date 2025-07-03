import { useRef } from "react";
import { Paperclip, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/* Reusable file upload component that handles document uploads
 * with visual feedback and file removal capabilities.
 * label - The document label, fr e.g. resume, transcript
 * file - passed useState
 * setFile - passed from useState
 * accepted - string that indicates the document types accepted
 * */
export default function DocumentField({
  label = "Document", //document that we need to add
  file, //file
  setFile, // passed from useState
  accepted = ".pdf,.doc,.docx", // accepted file types
}) {
  const inputRef = useRef(null);
  //hook is used to immediately update the value of inputRef, instead of waiting
  //for re-rendering

  /*Helper for handling the removal of the resume/trascript */
  const handleRemove = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      {/* Displaying file's status */}
      <div className="md:col-span-2">
        {file ? ( //if a file is present, then display it along with logic to remove the file.
          <div className="flex items-center gap-2 text-sm mt-2">
            <Label className="font-medium">Attached {label}:</Label>
            <Paperclip className="h-4 w-4 text-gray-600" />
            <span>{file.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${label}`}
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : (
          //if a file is not present, then just return the message that No "label" is returned yet.
          <p className="text-sm text-muted-foreground">
            No {label.toLowerCase()} uploaded yet.
          </p>
        )}
      </div>

      {/* Upload input - used to upload a file*/}
      <div className="md:col-span-2">
        <Label htmlFor={label.toLowerCase()}>
          {file ? `Add a New ${label}` : `Add a ${label}`}
        </Label>
        <Input
          ref={inputRef}
          id={label.toLowerCase()}
          name={label.toLowerCase()}
          type="file"
          accept={accepted}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) setFile(file);
          }}
        />
      </div>
    </>
  );
}
