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

/* Mock Data.
 * Returned from the service that will manage Faculty data
 */
const facultyOptions = [
  "Faculty of Science",
  "Faculty of Arts",
  "School of Engineering",
  "Other",
];

export default function PersonalDetails({ student, setStudent, errors = {} }) {
  return (
    <div className="col-span-full">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Confirm Your Personal Details
      </h2>
      <h2 className="text-base font-medium text-gray-900 mb-4">
        Update your personal details if necessary.
      </h2>

      {/* First Name*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            value={student.firstName}
            onChange={(e) =>
              setStudent({ ...student, firstName: e.target.value })
            }
          />
        </div>
        <ErrorMessage error={errors.firstName} />
        {/* Last Name */}
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            value={student.lastName}
            onChange={(e) =>
              setStudent({ ...student, lastName: e.target.value })
            }
          />
        </div>
        <ErrorMessage error={errors.lastName} />
        {/*Email */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={student.email}
            onChange={(e) => setStudent({ ...student, email: e.target.value })}
          />
          <ErrorMessage error={errors.email} />
        </div>

        {/*Phone */}
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="text"
            value={student.phone}
            onChange={(e) => setStudent({ ...student, phone: e.target.value })}
          />
        </div>
        {/* Student Id */}
        <div>
          <Label htmlFor="studentId">Student ID</Label>
          <Input
            id="studentId"
            name="studentId"
            type="text"
            value={student.studentId}
            disabled
            //onChange={(e) => setStudent({ ...student, gpa: e.target.value })}
          />
        </div>
        {/* Program*/}
        <div>
          <Label htmlFor="major">Program</Label>
          <Input
            id="major"
            name="major"
            type="text"
            value={student.major}
            onChange={(e) => setStudent({ ...student, major: e.target.value })}
          />
          <ErrorMessage error={errors.major} />
        </div>

        {/* GPA */}
        <div>
          <Label htmlFor="gpa">GPA</Label>
          <Input
            id="gpa"
            name="gpa"
            type="text"
            value={student.gpa}
            onChange={(e) => setStudent({ ...student, gpa: e.target.value })}
          />
        </div>
        {/*Study Level, Degree in Progress*/}
        <div>
          <Label className="block mb-2">Degree currently in progress</Label>
          <Select
            value={student.studyLevel}
            onValueChange={(val) => setStudent({ ...student, studyLevel: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select degree level" />
            </SelectTrigger>
            <SelectContent>
              {["BSc or BA", "MSc", "PhD", "Other"].map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorMessage error={errors.studyLevel} />
        </div>
        {/* Degree Year Start */}
        <div>
          <Label htmlFor="degreeStart">Year of Degree Start</Label>
          <Input
            id="degreeStart"
            name="degreeStart"
            type="text"
            value={student.degreeStart}
            onChange={(e) => setStudent({ ...student, gpa: e.target.value })}
          />
          <ErrorMessage error={errors.degreeStart} />
        </div>

        {/* Faculty */}
        <div>
          <Label htmlFor="faculty">Home Faculty</Label>
          <Select
            value={student.faculty}
            onValueChange={(val) => setStudent({ ...student, faculty: val })}
          >
            <SelectTrigger id="faculty" name="faculty">
              <SelectValue placeholder="Select faculty" />
            </SelectTrigger>
            <SelectContent>
              {facultyOptions.map((faculty) => (
                <SelectItem key={faculty} value={faculty}>
                  {faculty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorMessage error={errors.faculty} />
        </div>
        {/* Spot for Availability Calendar */}
        <div>
          <Label htmlFor="availability"> Weekly Availability</Label>
          {/* Module created by Aadil to be inserted here. */}
        </div>
        {/* Supporting Documents*/}
        <div className="col-span-2">
          <p className="text-lg">Supporting Documents</p>
          {/* <DocumentField
            label="Resume"
            file={student.resume}
            setFile={(file) => setStudent({ ...student, resume: file })}
          />
          <ErrorMessage error={errors.resume} /> */}

          <DocumentField
            label="Transcript"
            file={student.transcript}
            setFile={(file) => setStudent({ ...student, transcript: file })}
          />
          <ErrorMessage error={errors.transcript} />
        </div>
      </div>
    </div>
  );
}
