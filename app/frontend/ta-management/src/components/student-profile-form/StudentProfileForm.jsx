import { useState } from "react";
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

export default function StudentProfileForm({
  // Data props
  profile,
  setProfile,
  // Context props
  mode = "profile", //default is profile // "profile" or "application",
  // Display control props
}) {
  const [isEditing, setIsEditing] = useState(false);
  // const [profile, setProfile] = useState(studentProfile);

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

  // State for experience editing
  const [isEditingExperience, setIsEditingExperience] = useState(false);
  const [editedExperience, setEditedExperience] = useState([
    ...profile.experience,
  ]);

  // State for availability editing
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [availabilityData, setAvailabilityData] = useState([]); // Initialize as needed

  // State for course preference editing
  const [isEditingCourses, setIsEditingCourses] = useState(false);
  const [coursePreference, setCoursePreference] = useState(
    profile.coursePreference
  );

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = (profileData) => {
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
    } = profileData;

    if (
      !name.trim() ||
      !studentId.trim() ||
      !email.trim() ||
      !major.trim() ||
      !year.trim() ||
      !password.trim() ||
      !academicInfo.expectedGraduation.trim() ||
      !academicInfo.degreeStart.trim() ||
      !academicInfo.yearStanding.trim()
    ) {
      alert("Please fill out all required fields.");
      return false;
    }
    console.log("Profile validated successfully:", profileData);
    return true;
  };

  const handleCancel = (profileData) => {
    setProfile(profileData); // Reset to original data
    setIsEditing(false);
  };

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
                  onClick={() => {
                    const isValid = handleSave(editedProfile); // ✅ validate the latest state
                    if (!isValid) return;

                    setProfile(editedProfile); // ✅ update profile with validated data
                    setIsEditing(false); // ✅ only close edit mode if validation passed
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
                  setEditedProfile({ ...profile }); // deep copy of profile
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
                  onClick={() => {
                    const updatedProfile = {
                      ...profile,
                      major: editedAcademicInfo.major,
                      minor: editedAcademicInfo.minor,
                      year: editedAcademicInfo.year,
                      gpa: editedAcademicInfo.gpa,
                      academicInfo: { ...editedAcademicInfo.academicInfo },
                    };

                    const isValid = handleSave(updatedProfile);
                    if (!isValid) return;

                    setProfile(updatedProfile);
                    setIsEditingAcademic(false);
                  }}
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
                  <Select.Root
                    value={editedAcademicInfo.year}
                    onValueChange={(value) =>
                      setEditedAcademicInfo({
                        ...editedAcademicInfo,
                        year: value,
                      })
                    }
                  >
                    <Select.Trigger className="flex items-center justify-between w-full border rounded px-3 py-2 text-sm">
                      <Select.Value placeholder="Select Academic Level" />
                      <Select.Icon>
                        <ChevronDown className="h-4 w-4" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Content className="border rounded shadow bg-white">
                      <Select.ScrollUpButton className="flex items-center justify-center">
                        <ChevronUp className="h-4 w-4" />
                      </Select.ScrollUpButton>
                      <Select.Viewport className="p-1">
                        {/* Empty selection option */}
                        <Select.Item
                          value=" "
                          className="px-3 py-2 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between text-gray-500"
                        >
                          <Select.ItemText>
                            Select Academic Level
                          </Select.ItemText>
                          <Select.ItemIndicator>
                            <Check className="h-4 w-4" />
                          </Select.ItemIndicator>
                        </Select.Item>

                        {/* Actual academic level options */}
                        <Select.Item
                          value="Undergraduate"
                          className="px-3 py-2 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                        >
                          <Select.ItemText>Undergraduate</Select.ItemText>
                          <Select.ItemIndicator>
                            <Check className="h-4 w-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                        <Select.Item
                          value="Graduate"
                          className="px-3 py-2 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                        >
                          <Select.ItemText>Graduate</Select.ItemText>
                          <Select.ItemIndicator>
                            <Check className="h-4 w-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      </Select.Viewport>
                      <Select.ScrollDownButton className="flex items-center justify-center">
                        <ChevronDown className="h-4 w-4" />
                      </Select.ScrollDownButton>
                    </Select.Content>
                  </Select.Root>
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
                  onClick={() => {
                    setProfile({
                      ...profile,
                      experience: editedExperience,
                    });
                    setIsEditingExperience(false);
                  }}
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
                  ); // deep copy
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
                        onClick={() => {
                          const hasEmptyTechnical =
                            editedSkills.technicalSkills.some(
                              (skill) => skill.trim() === ""
                            );
                          const hasEmptySoft = editedSkills.softSkills.some(
                            (skill) => skill.trim() === ""
                          );

                          if (hasEmptyTechnical || hasEmptySoft) {
                            alert("Each skill must contain text.");
                            return;
                          }
                          setProfile((prev) => ({
                            ...prev,
                            technicalSkills: editedSkills.technicalSkills,
                            softSkills: editedSkills.softSkills,
                          }));
                          setSkillsEdit(false);
                        }}
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
                      //onClick={() => setSkillsEdit(true)}
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
                            onClick={() => {
                              const hasEmptyCoursePreference =
                                coursePreference.some(
                                  (coursePreference) =>
                                    coursePreference.trim() === ""
                                );

                              if (hasEmptyCoursePreference) {
                                alert(
                                  "Each course preference must contain text."
                                );
                                return;
                              }
                              setProfile((prev) => ({
                                ...prev,
                                coursePreference: [...coursePreference],
                              }));
                              setIsEditingCourses(false);
                            }}
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
                              ]); // Reset to original
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
                            setCoursePreference([...profile.coursePreference]); // deep copy
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
                      onClick={() => setIsEditingAvailability(false)}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditingAvailability(false);
                        setAvailabilityData([]); // or reset to original data if available
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
