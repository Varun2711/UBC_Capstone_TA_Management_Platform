import { useState, useEffect } from "react";
import {
  Camera,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import WeeklyAvailabilityCalendar from "@/components/WeeklyAvailabilityCalendar";
import {
  updateProfile,
  updateSkills,
  updateExperience,
  updateAvailability,
  updateCoursePreferences
} from "@/logic/student-profile";

// Add this helper function at the top of StudentProfileForm.jsx
// Replace the extractSemesterFromDate function in StudentProfileForm.jsx:
const extractSemesterFromDate = (dateString) => {
  if (!dateString) return '';
  
  // If it's already in "Fall 2022" format, return as-is
  if (dateString.match(/^(Fall|Winter|Summer)\s+\d{4}$/)) {
    console.log("Already in semester format:", dateString);
    return dateString;
  }
  
  // Handle the "2022-09-02 to " format from ApplicationForm
  if (dateString.includes(' to ')) {
    const datePart = dateString.split(' to ')[0];
    if (datePart) {
      dateString = datePart;
    }
  }
  
  try {
    console.log("dateString is:", dateString);
    
    // Only try to parse if it looks like a date
    if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      const date = new Date(dateString);
      console.log("dateString to date becomes:", date);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log("Invalid date, returning original string");
        return dateString;
      }
      
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-indexed: Jan=0, Sep=8, Dec=11
      
      console.log("Extracted semester info:", { year, month });

      let term = 'Winter';
      if (month >= 4 && month <= 7) term = 'Summer';  // May-Aug
      else if (month >= 8) term = 'Fall';             // Sep-Dec
      // Jan-Apr stays as Winter

      const result = `${term} ${year}`;
      console.log("Final result:", result);
      return result;
    }
    
    // If it doesn't look like a date, return as-is
    console.log("Not a date format, returning original:", dateString);
    return dateString;
    
  } catch (e) {
    console.error("Date parsing error:", e);
    return dateString;
  }
};

export default function StudentProfileForm({
  // Data props
  profile,
  setProfile,
  // Context props
  mode = "profile", //default is profile // "profile" or "application",
  // Display control props
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ ...profile });

  // State for skills editing
  const [skillsEdit, setSkillsEdit] = useState(false);
  const [editedSkills, setEditedSkills] = useState({
    technicalSkills: [...profile.technicalSkills],
    softSkills: [...profile.softSkills],
  });

  // State for academic information editing
  const [isEditingAcademic, setIsEditingAcademic] = useState(false);
  const [editedAcademicInfo, setEditedAcademicInfo] = useState({
    major: profile.major,
    minor: profile.minor,
    year: profile.year,
    gpa: profile.gpa,
    academicInfo: { ...profile.academicInfo },
  });

  // Update the state initialization for experience
  const [isEditingExperience, setIsEditingExperience] = useState(false);
  const [editedExperience, setEditedExperience] = useState(
    profile.experience?.map(exp => ({
      ...exp,
      semester: extractSemesterFromDate(exp.semester) || exp.semester || ''
    })) || []
  );


  // State for availability editing
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [availabilityData, setAvailabilityData] = useState([]); // Initialize as needed

  // State for course preference editing
  const [isEditingCourses, setIsEditingCourses] = useState(false);
  const [coursePreference, setCoursePreference] = useState(
    Array.isArray(profile.coursePreference) ? [...profile.coursePreference] : []
  );

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Updated handleSave function that actually saves to backend
  const handleSave = async (profileData) => {
    const {
      name,
      studentId,
      UBCEmployeeId,
      password,
      email,
      major,
      year,
      academicInfo,
      experience,
      phone,
      gpa,
      minor,
    } = profileData;

    // Validation - skip password validation in application mode
    const requiredFields = [
      !(name || "").trim(),
      !(studentId || "").trim(),
      !(email || "").trim(),
      !(major || "").trim(),
      !(year || "").trim(),
      !((academicInfo?.expectedGraduation || "").trim()),
      !((academicInfo?.degreeStart || "").trim()),
      !((academicInfo?.yearStanding || "").trim())
    ];

    // Only validate password in profile mode
    if (mode === "profile") {
      requiredFields.push(!(password || "").trim());
    }

    if (requiredFields.some(field => field)) {
      alert("Please fill out all required fields.");
      return false;
    }

    try {
      // Parse name into first and last name
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Format data for backend
      const backendData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        student_number: studentId,
        phone: phone || '',

        // Student model fields
        program: major,
        study_level: year,
        year_standing: academicInfo?.yearStanding ? parseInt(academicInfo.yearStanding) : null,
        expected_graduation: academicInfo?.expectedGraduation || '',

        // StudentProfile nested fields
        student_profile: {
          gpa: gpa ? parseFloat(gpa) : null,
          minor: minor || '',
          year_degree_start: academicInfo?.degreeStart ? parseInt(academicInfo.degreeStart) : null,
          ubc_employee_id: UBCEmployeeId || ''
        }
      };

      console.log("Saving profile data:", backendData);
      await updateProfile(backendData);

      console.log("Profile saved successfully");
      return true;
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
      return false;
    }
  };

  const handleCancel = (profileData) => {
    setEditedProfile({ ...profile }); // Reset to original data
    setIsEditing(false);
  };

  // Academic Information Save Handler
  const handleSaveAcademicInfo = async () => {
    const updatedProfile = {
      ...profile,
      major: editedAcademicInfo.major,
      minor: editedAcademicInfo.minor,
      year: editedAcademicInfo.year,
      gpa: editedAcademicInfo.gpa,
      academicInfo: { ...editedAcademicInfo.academicInfo },
    };

    try {
      // Format data for backend
      const backendData = {
        program: editedAcademicInfo.major,
        study_level: editedAcademicInfo.year,
        year_standing: editedAcademicInfo.academicInfo?.yearStanding ? parseInt(editedAcademicInfo.academicInfo.yearStanding) : null,
        expected_graduation: editedAcademicInfo.academicInfo?.expectedGraduation || '',

        student_profile: {
          gpa: editedAcademicInfo.gpa ? parseFloat(editedAcademicInfo.gpa) : null,
          minor: editedAcademicInfo.minor || '',
          year_degree_start: editedAcademicInfo.academicInfo?.degreeStart ? parseInt(editedAcademicInfo.academicInfo.degreeStart) : null,
        }
      };

      console.log("Saving academic info:", backendData);
      await updateProfile(backendData);

      setProfile(updatedProfile);
      setIsEditingAcademic(false);
      console.log("Academic info saved successfully");
    } catch (error) {
      console.error("Failed to save academic info:", error);
      alert("Failed to save academic information. Please try again.");
    }
  };

  // Experience Save Handler
  const handleSaveExperience = async () => {
    // Validate experience data
    const hasEmptyFields = editedExperience.some(exp =>
      !exp.course.trim() || !exp.semester.trim() || !exp.professor.trim()
    );

    if (hasEmptyFields) {
      alert("Please fill in all required fields for each experience.");
      return;
    }

    try {
      // Format experiences for API
      const formattedExperiences = editedExperience.map(exp => {
        // Extract year and term from semester (e.g., "Winter 2024")
        const semesterParts = exp.semester.trim().split(' ');
        const year = semesterParts.length > 1 ? semesterParts[1] : new Date().getFullYear().toString();
        const term = semesterParts[0] || 'Winter';

        // Create a reasonable date based on term and year
        let startDate = `${year}-`;
        if (term.toLowerCase().includes('winter')) startDate += '01-02';
        else if (term.toLowerCase().includes('summer')) startDate += '05-02';
        else if (term.toLowerCase().includes('fall')) startDate += '09-02';
        else startDate += '01-01';

        return {
          experience_type: 'teaching',
          position_title: `TA for ${exp.course}`,
          organization: exp.professor,
          start_date: startDate,
          description: exp.description || `TA position for ${exp.course} with ${exp.professor}`,
          is_current: false
        };
      });

      console.log("Saving experiences:", formattedExperiences);
      await updateExperience(formattedExperiences);

      setProfile(prev => ({
        ...prev,
        experience: editedExperience
      }));
      setIsEditingExperience(false);
      console.log("Experience saved successfully");
    } catch (error) {
      console.error("Failed to save experience:", error);
      alert("Failed to save experience. Please try again.");
    }
  };

  // Skills Save Handler
  const handleSaveSkills = async () => {
    const hasEmptyTechnical = editedSkills.technicalSkills.some(
      (skill) => skill.trim() === ""
    );
    const hasEmptySoft = editedSkills.softSkills.some(
      (skill) => skill.trim() === ""
    );

    if (hasEmptyTechnical || hasEmptySoft) {
      alert("Each skill must contain text.");
      return;
    }

    try {
      const skillsArray = [];

      // Add technical skills
      editedSkills.technicalSkills
        .filter(skill => skill.trim() !== "")
        .forEach(skill => {
          skillsArray.push({
            skill_name: skill.trim(),
            skill_type: 'technical'
          });
        });

      // Add soft skills
      editedSkills.softSkills
        .filter(skill => skill.trim() !== "")
        .forEach(skill => {
          skillsArray.push({
            skill_name: skill.trim(),
            skill_type: 'soft'
          });
        });

      console.log("Saving skills:", skillsArray);
      await updateSkills(skillsArray);

      setProfile((prev) => ({
        ...prev,
        technicalSkills: editedSkills.technicalSkills,
        softSkills: editedSkills.softSkills,
      }));
      setSkillsEdit(false);
      console.log("Skills saved successfully");
    } catch (error) {
      console.error("Failed to save skills:", error);
      alert("Failed to save skills. Please try again.");
    }
  };

  // Course Preferences Save Handler
  const handleSaveCoursePreferences = async () => {
    // Filter out empty courses before validation
    const validCourses = coursePreference.filter(course => course.trim() !== "");

    if (validCourses.length === 0) {
      alert("Please add at least one course preference.");
      return;
    }

    try {
      console.log("Saving course preferences:", validCourses);
      await updateCoursePreferences(validCourses);

      // Update the profile state with the valid courses
      setProfile((prev) => ({
        ...prev,
        coursePreference: [...validCourses],
      }));

      // Update the local state to match
      setCoursePreference([...validCourses]);
      setIsEditingCourses(false);
      console.log("Course preferences saved successfully");
    } catch (error) {
      console.error("Failed to save course preferences:", error);
      alert("Failed to save course preferences. Please try again.");
    }
  };

  // Availability Save Handler
  const handleSaveAvailability = async () => {
    try {
      console.log("Saving availability:", availabilityData);
      await updateAvailability(availabilityData);

      setProfile(prev => ({
        ...prev,
        availability: [...availabilityData]
      }));
      setIsEditingAvailability(false);
      console.log("Availability saved successfully");
    } catch (error) {
      console.error("Failed to save availability:", error);
      alert("Failed to save availability. Please try again.");
    }
  };

  useEffect(() => {
    setAvailabilityData(profile.availability || []);
  }, [profile.availability]);

  // Add this useEffect to handle profile changes
  useEffect(() => {
    if (profile?.experience) {
      const transformedExperience = profile.experience.map(exp => ({
        ...exp,
        semester: extractSemesterFromDate(exp.semester) || exp.semester || ''
      }));
      setEditedExperience(transformedExperience);
    }
  }, [profile?.experience]);

  // Also update course preferences when profile changes
  useEffect(() => {
    if (Array.isArray(profile.coursePreference)) {
      setCoursePreference([...profile.coursePreference]);
    }
  }, [profile.coursePreference]);

  return (
    <div>
      {/* Main Content */}
      <main className="flex-1 space-y-6 p-6">
        {/* Profile Header */}
        <div className="flex items-center justify-between">
          {mode === "application" && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Confirm Your Student Profile
              </h2>
              <h2 className="text-base font-medium text-gray-900 mb-4">
                Please review and update your information if necessary.
              </h2>
            </div>
          )}
          {mode !== "application" && (
            <div>
              <h2 className="text-2xl font-bold">My Profile</h2>
              <p className="text-muted-foreground">
                Manage your personal information and TA application details
              </p>
            </div>
          )}
        </div>

        {/* Profile Picture and Personal Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Personal Information</CardTitle>
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    const isValid = await handleSave(editedProfile);
                    if (!isValid) return;

                    setProfile(editedProfile);
                    setIsEditing(false);
                  }}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  onClick={() => handleCancel(profile)}
                  variant="outline"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  setEditedProfile({ ...profile });
                  setIsEditing(true);
                }}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Personal Information
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-6">
              {mode === "profile" && (
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage
                      src={profile.avatar || "/placeholder.svg"}
                      alt={profile.name}
                    />
                    <AvatarFallback className="text-2xl">SJ</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name<span className="text-red-500">*</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editedProfile.name}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          name: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm">{profile.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">
                    Student ID<span className="text-red-500">*</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="studentId"
                      value={editedProfile.studentId}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          studentId: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm">{profile.studentId}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="UBCEmployeeId">
                    UBC Employee ID (Optional)
                  </Label>
                  {isEditing ? (
                    <Input
                      id="UBCEmployeeId"
                      value={editedProfile.UBCEmployeeId}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          UBCEmployeeId: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm">{profile.UBCEmployeeId}</p>
                  )}
                </div>
                {mode === "profile" && (
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password<span className="text-red-500">*</span>
                    </Label>
                    {isEditing ? (
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={editedProfile.password}
                          onChange={(e) =>
                            setEditedProfile({
                              ...editedProfile,
                              password: e.target.value,
                            })
                          }
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm">••••••••</p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email<span className="text-red-500">*</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          email: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm">{profile.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editedProfile.phone}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          phone: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm">{profile.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Academic Information</CardTitle>
            {isEditingAcademic ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveAcademicInfo}
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditedAcademicInfo({
                      major: profile.major,
                      minor: profile.minor,
                      year: profile.year,
                      gpa: profile.gpa,
                      academicInfo: { ...profile.academicInfo },
                    });
                    setIsEditingAcademic(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setIsEditingAcademic(true)}>
                <Edit className="h-4 w-4" />
                Edit Academic Information
              </Button>
            )}
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>
                  Major<span className="text-red-500">*</span>
                </Label>
                {isEditingAcademic ? (
                  <Input
                    value={editedAcademicInfo.major}
                    onChange={(e) =>
                      setEditedAcademicInfo({
                        ...editedAcademicInfo,
                        major: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{profile.major}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  Academic Level<span className="text-red-500">*</span>
                </Label>
                {isEditingAcademic ? (
                  <Select
                    value={editedAcademicInfo.year}
                    onValueChange={(value) =>
                      setEditedAcademicInfo({
                        ...editedAcademicInfo,
                        year: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Academic Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{profile.year}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>GPA (Optional)</Label>
                {isEditingAcademic ? (
                  <Input
                    value={editedAcademicInfo.gpa}
                    onChange={(e) =>
                      setEditedAcademicInfo({
                        ...editedAcademicInfo,
                        gpa: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{profile.gpa}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  Expected Graduation<span className="text-red-500">*</span>
                </Label>
                {isEditingAcademic ? (
                  <Input
                    value={editedAcademicInfo.academicInfo.expectedGraduation}
                    onChange={(e) =>
                      setEditedAcademicInfo({
                        ...editedAcademicInfo,
                        academicInfo: {
                          ...editedAcademicInfo.academicInfo,
                          expectedGraduation: e.target.value,
                        },
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">
                    {profile.academicInfo.expectedGraduation}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  Degree Start<span className="text-red-500">*</span>
                </Label>
                {isEditingAcademic ? (
                  <Input
                    value={editedAcademicInfo.academicInfo.degreeStart}
                    onChange={(e) =>
                      setEditedAcademicInfo({
                        ...editedAcademicInfo,
                        academicInfo: {
                          ...editedAcademicInfo.academicInfo,
                          degreeStart: e.target.value,
                        },
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{profile.academicInfo.degreeStart}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  Year Standing<span className="text-red-500">*</span>
                </Label>
                {isEditingAcademic ? (
                  <Input
                    value={editedAcademicInfo.academicInfo.yearStanding}
                    onChange={(e) =>
                      setEditedAcademicInfo({
                        ...editedAcademicInfo,
                        academicInfo: {
                          ...editedAcademicInfo.academicInfo,
                          yearStanding: e.target.value,
                        },
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{profile.academicInfo.yearStanding}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Minor (Optional)</Label>
                {isEditingAcademic ? (
                  <Input
                    value={editedAcademicInfo.minor}
                    onChange={(e) =>
                      setEditedAcademicInfo({
                        ...editedAcademicInfo,
                        minor: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm">{profile.minor}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Past TA Experiences */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Past TA Experience</CardTitle>
            </div>
            {isEditingExperience ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveExperience}
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditedExperience(
                      profile.experience.map((exp) => ({ ...exp }))
                    );
                    setIsEditingExperience(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setEditedExperience(
                    profile.experience.map((exp) => ({ ...exp }))
                  );
                  setIsEditingExperience(true);
                }}
              >
                <Edit className="h-4 w-4" />
                Edit Experience
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {editedExperience.map((exp, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <h4 className="font-medium">Experience #{index + 1}</h4>
                  {isEditingExperience && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updated = editedExperience.filter(
                          (_, i) => i !== index
                        );
                        setEditedExperience(updated);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Course</Label>
                    {isEditingExperience ? (
                      <Input
                        value={exp.course}
                        onChange={(e) => {
                          const newExp = [...editedExperience];
                          newExp[index].course = e.target.value;
                          setEditedExperience(newExp);
                        }}
                      />
                    ) : (
                      <p className="text-sm">{exp.course}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label>Semester</Label>
                    {isEditingExperience ? (
                      <Input
                        value={exp.semester}
                        onChange={(e) => {
                          const newExp = [...editedExperience];
                          newExp[index].semester = e.target.value;
                          setEditedExperience(newExp);
                        }}
                      />
                    ) : (
                      <p className="text-sm">{exp.semester}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label>Professor</Label>
                    {isEditingExperience ? (
                      <Input
                        value={exp.professor}
                        onChange={(e) => {
                          const newExp = [...editedExperience];
                          newExp[index].professor = e.target.value;
                          setEditedExperience(newExp);
                        }}
                      />
                    ) : (
                      <p className="text-sm">{exp.professor}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Description</Label>
                  {isEditingExperience ? (
                    <Textarea
                      value={exp.description}
                      onChange={(e) => {
                        const newExp = [...editedExperience];
                        newExp[index].description = e.target.value;
                        setEditedExperience(newExp);
                      }}
                    />
                  ) : (
                    <p className="text-sm mt-2">{exp.description}</p>
                  )}
                </div>
              </div>
            ))}

            {isEditingExperience && (
              <Button
                variant="outline"
                onClick={() =>
                  setEditedExperience([
                    ...editedExperience,
                    {
                      title: "",
                      course: "",
                      semester: "",
                      professor: "",
                      description: "",
                    },
                  ])
                }
              >
                + Add Experience
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Skills*/}
            <div className="flex-1 flex flex-col">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Skills & Qualifications</CardTitle>
                  {skillsEdit ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveSkills}
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditedSkills({
                            technicalSkills: [...profile.technicalSkills],
                            softSkills: [...profile.softSkills],
                          });
                          setSkillsEdit(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditedSkills({
                          technicalSkills: [...profile.technicalSkills],
                          softSkills: [...profile.softSkills],
                        });
                        setSkillsEdit(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      Edit Skills
                    </Button>
                  )}
                </CardHeader>

                {/* TECHNICAL SKILLS */}
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Technical Skills
                      </Label>
                      <div className="flex flex-col gap-2 mt-2">
                        {skillsEdit ? (
                          editedSkills.technicalSkills.map((skill, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <Input
                                value={skill}
                                className="w-40"
                                onChange={(e) => {
                                  const newSkills = [
                                    ...editedSkills.technicalSkills,
                                  ];
                                  newSkills[index] = e.target.value;
                                  setEditedSkills({
                                    ...editedSkills,
                                    technicalSkills: newSkills,
                                  });
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const updated =
                                    editedSkills.technicalSkills.filter(
                                      (_, i) => i !== index
                                    );
                                  setEditedSkills({
                                    ...editedSkills,
                                    technicalSkills: updated,
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {profile.technicalSkills.map((skill, index) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Add Button */}
                        {skillsEdit && (
                          <Button
                            onClick={() =>
                              setEditedSkills({
                                ...editedSkills,
                                technicalSkills: [
                                  ...editedSkills.technicalSkills,
                                  "",
                                ],
                              })
                            }
                            variant="outline"
                          >
                            + Add Technical Skill
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <Separator />

                {/* SOFT SKILLS */}
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Soft Skills</Label>
                      <div className="flex flex-col gap-2 mt-2">
                        {skillsEdit ? (
                          editedSkills.softSkills.map((skill, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <Input
                                value={skill}
                                className="w-40"
                                onChange={(e) => {
                                  const newSkills = [
                                    ...editedSkills.softSkills,
                                  ];
                                  newSkills[index] = e.target.value;
                                  setEditedSkills({
                                    ...editedSkills,
                                    softSkills: newSkills,
                                  });
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const updated =
                                    editedSkills.softSkills.filter(
                                      (_, i) => i !== index
                                    );
                                  setEditedSkills({
                                    ...editedSkills,
                                    softSkills: updated,
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {profile.softSkills.map((skill, index) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Add Button */}
                        {skillsEdit && (
                          <Button
                            onClick={() =>
                              setEditedSkills({
                                ...editedSkills,
                                softSkills: [...editedSkills.softSkills, ""],
                              })
                            }
                            variant="outline"
                          >
                            + Add Soft Skill
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex flex-col">
                {/* Course Preferences */}
                <Card className="h-full flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Course Preferences</CardTitle>
                    <div className="flex gap-2 mt-2">
                      {isEditingCourses ? (
                        <>
                          <Button
                            onClick={handleSaveCoursePreferences}
                            className="gap-2"
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </Button>
                          <Button
                            onClick={() => {
                              setIsEditingCourses(false);
                              setCoursePreference([
                                ...profile.coursePreference,
                              ]);
                            }}
                            variant="outline"
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => {
                            setCoursePreference([...profile.coursePreference]);
                            setIsEditingCourses(true);
                          }}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Preferences
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    {isEditingCourses ? (
                      <div className="space-y-4">
                        {coursePreference.map((course, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={course}
                              onChange={(e) => {
                                const updated = [...coursePreference];
                                updated[index] = e.target.value;
                                setCoursePreference(updated);
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const updated = coursePreference.filter(
                                  (_, i) => i !== index
                                );
                                setCoursePreference(updated);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() =>
                            setCoursePreference([...coursePreference, ""])
                          }
                          variant="outline"
                        >
                          + Add Course
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {coursePreference.map((course, index) => (
                          <Badge key={index} variant="secondary">
                            {course}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <div>
          {/* Availability Calendar */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Availability</CardTitle>
              <div className="flex gap-2 mt-2">
                {isEditingAvailability ? (
                  <>
                    <Button
                      onClick={handleSaveAvailability}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditingAvailability(false);
                        setAvailabilityData(profile.availability || []);
                      }}
                      variant="outline"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditingAvailability(true)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Availability
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p>
                Please indicate your general weekly availability below. Blue
                boxes represent times that you are available for TA work, and
                white boxes represent times that you are not.
                <br />
                <br />
              </p>
              <WeeklyAvailabilityCalendar
                editable={isEditingAvailability}
                availability={availabilityData}
                setAvailability={setAvailabilityData}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}