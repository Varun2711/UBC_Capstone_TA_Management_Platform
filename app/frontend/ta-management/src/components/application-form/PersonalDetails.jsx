import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paperclip, Trash2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import DocumentField from "./DocumentField";
import ErrorMessage from "@/components/ErrorMessage";
import StudentProfileForm from "@/components/student-profile-form/StudentProfileForm";

export default function PersonalDetails({ student, setStudent }) {
  return (
    <div className="col-span-full">
      <StudentProfileForm
        profile={student}
        setProfile={setStudent}
        mode="application"
      />
    </div>
  );
}
