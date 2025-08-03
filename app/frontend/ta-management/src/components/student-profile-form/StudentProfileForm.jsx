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

// Add all validation functions from ProfilePage.jsx
const validatePersonalInfoField = (field, value) => {
  let error = null;

  if (field === "name") {
    if (!value || value.trim().length < 2) {
      error = "Name must be at least 2 characters";
    } else if (value.trim().length > 50) {
      error = "Name must be less than 50 characters";
    } else if (!/^[a-zA-Z\s\-']+$/.test(value.trim())) {
      error = "Name can only contain letters, spaces, hyphens, and apostrophes";
    }
  } else if (field === "email") {
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      error = "Please enter a valid email address";
    }
  } else if (field === "studentId") {
    if (!value || value.trim() === "") {
      error = "Student ID is required";
    } else if (!/^\d{8}$/.test(value.trim())) {
      error = "Student ID must be exactly 8 digits";
    }
  } else if (field === "UBCEmployeeId") {
    if (value && value.trim() !== "") {
      if (!/^\d+$/.test(value.trim())) {
        error = "UBC Employee ID must contain only numbers";
      } else if (value.trim().length > 10) {
        error = "UBC Employee ID must be maximum 10 digits";
      }
    }
  } else if (field === "phone") {
    if (value && value.trim() !== "") {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        error = "Phone number must have at least 10 digits";
      } else if (digitsOnly.length > 15) {
        error = "Phone number must be maximum 15 digits";
      }
    }
  }
  return error;
};

const validateAcademicField = (field, value) => {
  let error = null;

  if (field === "major" || field === "minor") {
    if (field === "major" && (!value || value.trim().length < 2)) {
      error = "Major is required (minimum 2 characters)";
    } else if (value && value.trim() !== "") {
      if (value.trim().length > 100) {
        error = `${field === "major" ? "Major" : "Minor"} must be less than 100 characters`;
      } else if (!/^[a-zA-Z\s\-&]+$/.test(value.trim())) {
        error = `${field === "major" ? "Major" : "Minor"} can only contain letters, spaces, hyphens, and ampersands`;
      }
    }
  } else if (field === "year") {
    if (!value || value.trim() === "") {
      error = "Academic level is required";
    }
  } else if (field === "gpa") {
    if (value && value.trim() !== "") {
      const gpaValue = parseFloat(value);
      if (isNaN(gpaValue)) {
        error = "GPA must be a number";
      } else if (gpaValue < 0 || gpaValue > 4.33) {
        error = "GPA must be between 0.00 and 4.33 (UBC scale)";
      } else if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) {
        error = "GPA can have maximum 2 decimal places";
      }
    }
  } else if (field === "expectedGraduation") {
    if (!value || value.trim() === "") {
      error = "Expected graduation date is required";
    } else if (value.trim().length > 20) {
      error = "Expected graduation must be 20 characters or less";
    }
  } else if (field === "degreeStart") {
    if (!value || value.trim() === "") {
      error = "Degree start year is required";
    } else if (!/^\d{4}$/.test(value.trim())) {
      error = "Degree start must be a 4-digit year (e.g., 2021)";
    } else {
      const year = parseInt(value.trim());
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 10) {
        error = `Degree start year must be between 1900 and ${currentYear + 10}`;
      }
    }
  } else if (field === "yearStanding") {
    if (!value || value.trim() === "") {
      error = "Year standing is required";
    } else if (!/^\d+$/.test(value.trim())) {
      error = "Year standing must be a whole number";
    } else {
      const standing = parseInt(value.trim());
      if (standing < 1 || standing > 8) {
        error = "Year standing must be between 1 and 8";
      }
    }
  }

  return error;
};

const majors = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Psychology",
  "Other (please specify)",
];

const validateExperienceField = (field, value) => {
  let error = null;

  if (field === "course") {
    if (!value || value.trim() === "") {
      error = "Course is required";
    } else if (!/^[A-Z]{2,4}\s*\d{3}[A-Z]?$/i.test(value.trim())) {
      error = "Enter course code like 'COSC 499' or 'MATH 100A'";
    } else if (value.trim().length > 100) {
      error = "Course name must be 100 characters or less";
    }
  } else if (field === "semester") {
    if (!value || value.trim() === "") {
      error = "Semester is required";
    } else {
      const semesterRegex = /^(Fall|Winter|Summer)\s+\d{4}$/i;
      if (!semesterRegex.test(value.trim())) {
        error = "Enter semester as 'Fall 2023', 'Winter 2024', or 'Summer 2023'";
      } else {
        const year = parseInt(value.trim().split(' ')[1]);
        const currentYear = new Date().getFullYear();
        if (year < 1990 || year > currentYear + 2) {
          error = `Year must be between 1990 and ${currentYear + 2}`;
        }
      }
    }
  } else if (field === "professor") {
    if (!value || value.trim() === "") {
      error = "Professor name is required";
    } else if (value.trim().length < 2) {
      error = "Professor name must be at least 2 characters";
    } else if (value.trim().length > 100) {
      error = "Professor name must be 100 characters or less";
    } else if (!/^[a-zA-Z\s\.\-']+$/.test(value.trim())) {
      error = "Professor name can only contain letters, spaces, periods, hyphens, and apostrophes";
    }
  }

  return error;
};

const validateSkillField = (value) => {
  if (!value || value.trim() === "") {
    return "Skill cannot be empty";
  } else if (value.trim().length < 2) {
    return "Skill must be at least 2 characters";
  } else if (value.trim().length > 50) {
    return "Skill must be 50 characters or less";
  } else if (!/^[a-zA-Z\s\+\#\.\-\/\(\)]+$/.test(value.trim())) {
    return "Skills can only contain letters, spaces, and common symbols (+, #, -, /, etc.) - no numbers";
  }
  return null;
};

const validateCoursePreference = (value) => {
  if (!value || value.trim() === "") {
    return "Course preference cannot be empty";
  } else if (value.trim().length > 20) {
    return "Course code must be 20 characters or less";
  } else if (!/^[A-Z]{2,4}\s*\d{3}[A-Z]?$/i.test(value.trim())) {
    return "Enter course code like 'COSC 499' or 'MATH 100A'";
  }
  return null;
};

// ...existing imports and helper functions...


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
  const [errors, setErrors] = useState({}); // Add errors state

  // State for skills editing
  const [skillsEdit, setSkillsEdit] = useState(false);
  const [editedSkills, setEditedSkills] = useState({
    technicalSkills: [...(profile.technicalSkills || [])],
    softSkills: [...(profile.softSkills || [])],
  });

  const handleAcademicInputChange = (field, value) => {
    console.log(`Academic input change: ${field} = "${value}"`);

    if (field.includes('.')) {
      // Handle nested fields like academicInfo.degreeStart
      const [parent, child] = field.split('.');
      console.log(`Nested field detected: parent = ${parent}, child = ${child}`);
      setEditedAcademicInfo((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      // Handle top-level fields
      console.log(`Setting editedAcademicInfo[${field}] to "${value}"`);
      setEditedAcademicInfo((prev) => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear any related errors
    const newErrors = { ...errors };
    delete newErrors[field];
    setErrors(newErrors);
  };

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

  // Add form-level validation functions
  const validatePersonalInfoForm = () => {
    const newErrors = {};

    // Validate name
    const nameError = validatePersonalInfoField("name", editedProfile.name);
    if (nameError) newErrors.name = nameError;

    // Validate email
    const emailError = validatePersonalInfoField("email", editedProfile.email);
    if (emailError) newErrors.email = emailError;

    // Validate student ID
    const studentIdError = validatePersonalInfoField("studentId", editedProfile.studentId);
    if (studentIdError) newErrors.studentId = studentIdError;

    // Validate phone (optional)
    if (editedProfile.phone) {
      const phoneError = validatePersonalInfoField("phone", editedProfile.phone);
      if (phoneError) newErrors.phone = phoneError;
    }

    // Validate UBC Employee ID (optional)
    if (editedProfile.UBCEmployeeId) {
      const employeeIdError = validatePersonalInfoField("UBCEmployeeId", editedProfile.UBCEmployeeId);
      if (employeeIdError) newErrors.UBCEmployeeId = employeeIdError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAcademicForm = () => {
    const newErrors = {};

    // Validate major
    const majorError = validateAcademicField("major", editedAcademicInfo.major);
    if (majorError) newErrors.major = majorError;

    // Validate year
    const yearError = validateAcademicField("year", editedAcademicInfo.year);
    if (yearError) newErrors.year = yearError;

    // Validate GPA (optional)
    if (editedAcademicInfo.gpa) {
      const gpaError = validateAcademicField("gpa", editedAcademicInfo.gpa);
      if (gpaError) newErrors.gpa = gpaError;
    }

    // Validate minor (optional)
    if (editedAcademicInfo.minor) {
      const minorError = validateAcademicField("minor", editedAcademicInfo.minor);
      if (minorError) newErrors.minor = minorError;
    }

    // Validate academic info fields
    const expectedGradError = validateAcademicField("expectedGraduation", editedAcademicInfo.academicInfo.expectedGraduation);
    if (expectedGradError) newErrors.expectedGraduation = expectedGradError;

    const degreeStartError = validateAcademicField("degreeStart", editedAcademicInfo.academicInfo.degreeStart);
    if (degreeStartError) newErrors.degreeStart = degreeStartError;

    const yearStandingError = validateAcademicField("yearStanding", editedAcademicInfo.academicInfo.yearStanding);
    if (yearStandingError) newErrors.yearStanding = yearStandingError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateExperienceForm = (experienceData) => {
    const newErrors = {};
    let hasErrors = false;

    experienceData.forEach((exp, index) => {
      const courseError = validateExperienceField("course", exp.course);
      if (courseError) {
        newErrors[`course_${index}`] = courseError;
        hasErrors = true;
      }

      const semesterError = validateExperienceField("semester", exp.semester);
      if (semesterError) {
        newErrors[`semester_${index}`] = semesterError;
        hasErrors = true;
      }

      const professorError = validateExperienceField("professor", exp.professor);
      if (professorError) {
        newErrors[`professor_${index}`] = professorError;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(prev => ({ ...prev, ...newErrors }));
    }
    return !hasErrors;
  };

  const validateSkillsForm = (skillsData) => {
    const newErrors = {};
    let hasErrors = false;

    skillsData.technicalSkills.forEach((skill, index) => {
      const error = validateSkillField(skill);
      if (error) {
        newErrors[`technical_${index}`] = error;
        hasErrors = true;
      }
    });

    skillsData.softSkills.forEach((skill, index) => {
      const error = validateSkillField(skill);
      if (error) {
        newErrors[`soft_${index}`] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(prev => ({ ...prev, ...newErrors }));
    }
    return !hasErrors;
  };

  const validateCoursePreferencesForm = (courseData) => {
    const newErrors = {};
    let hasErrors = false;

    courseData.forEach((course, index) => {
      const error = validateCoursePreference(course);
      if (error) {
        newErrors[`course_${index}`] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(prev => ({ ...prev, ...newErrors }));
    }
    return !hasErrors;
  };

  // Updated handleSave function that actually saves to backend
  const handleSave = async (profileData) => {
    // Add validation gate
    if (!validatePersonalInfoForm()) {
      alert("Please fix the validation errors before saving.");
      return false;
    }

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
    setErrors({}); // Clear errors on cancel
  };

  // Academic Information Save Handler
  const handleSaveAcademicInfo = async () => {
    // Add validation gate
    if (!validateAcademicForm()) {
      alert("Please fix the validation errors before saving.");
      return;
    }

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
    // Add validation gate
    if (!validateExperienceForm(editedExperience)) {
      alert("Please fix the validation errors before saving.");
      return;
    }

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
    // Add validation gate
    if (!validateSkillsForm(editedSkills)) {
      alert("Please fix the validation errors before saving.");
      return;
    }

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
    // Add validation gate
    if (!validateCoursePreferencesForm(coursePreference)) {
      alert("Please fix the validation errors before saving.");
      return;
    }

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

        {/* Personal Info */}
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
                      onChange={(e) => {
                        const { value } = e.target;
                        setEditedProfile({ ...editedProfile, name: value });

                        // Real-time validation
                        const error = validatePersonalInfoField("name", value);
                        setErrors(prev => ({ ...prev, name: error }));
                      }}
                    />
                  ) : (
                    <p className="text-sm">{profile.name}</p>
                  )}
                  {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentId">
                    Student ID<span className="text-red-500">*</span>
                  </Label>
                  {isEditing ? (
                    <Input
                      id="studentId"
                      value={editedProfile.studentId}
                      onChange={(e) => {
                        // Only allow digits and limit to 8 characters
                        const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                        setEditedProfile({ ...editedProfile, studentId: value });

                        // Real-time validation
                        const error = validatePersonalInfoField("studentId", value);
                        setErrors(prev => ({ ...prev, studentId: error }));
                      }}
                      placeholder="12345678 (8 digits)"
                      maxLength="8"
                    />
                  ) : (
                    <p className="text-sm">{profile.studentId}</p>
                  )}
                  {errors.studentId && <p className="text-red-500 text-xs">{errors.studentId}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="UBCEmployeeId">
                    UBC Employee ID (Optional)
                  </Label>
                  {isEditing ? (
                    <Input
                      id="UBCEmployeeId"
                      value={editedProfile.UBCEmployeeId}
                      onChange={(e) => {
                        // Only allow digits and limit to 10 characters
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setEditedProfile({ ...editedProfile, UBCEmployeeId: value });

                        // Real-time validation
                        const error = validatePersonalInfoField("UBCEmployeeId", value);
                        setErrors(prev => ({ ...prev, UBCEmployeeId: error }));
                      }}
                      placeholder="1234567890 (max 10 digits)"
                      maxLength="10"
                    />
                  ) : (
                    <p className="text-sm">{profile.UBCEmployeeId}</p>
                  )}
                  {errors.UBCEmployeeId && <p className="text-red-500 text-xs">{errors.UBCEmployeeId}</p>}
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
                      onChange={(e) => {
                        const { value } = e.target;
                        setEditedProfile({ ...editedProfile, email: value });

                        // Real-time validation
                        const error = validatePersonalInfoField("email", value);
                        setErrors(prev => ({ ...prev, email: error }));
                      }}
                    />
                  ) : (
                    <p className="text-sm">{profile.email}</p>
                  )}
                  {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editedProfile.phone}
                      onChange={(e) => {
                        // Allow common phone formats
                        const value = e.target.value.replace(/[^\d\s\-\(\)\.\+]/g, '');
                        setEditedProfile({ ...editedProfile, phone: value });

                        // Real-time validation
                        const error = validatePersonalInfoField("phone", value);
                        setErrors(prev => ({ ...prev, phone: error }));
                      }}
                      placeholder="+1-234-567-8900 or (234) 567-8900"
                    />
                  ) : (
                    <p className="text-sm">{profile.phone}</p>
                  )}
                  {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                  {isEditing && (
                    <p className="text-xs text-muted-foreground">
                      Format: +1-234-567-8900, (234) 567-8900, or 234.567.8900
                    </p>
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
                    setErrors({}); // Clear errors on cancel
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
              {/* UPDATED MAJOR FIELD */}
              <div className="space-y-2">
                <Label>
                  Major<span className="text-red-500">*</span>
                </Label>
                {isEditingAcademic ? (
                  <div className="space-y-2">
                    {/* Always show dropdown first, but handle custom values better */}
                    {(editedAcademicInfo.major === "" || editedAcademicInfo.major === "Other (please specify)" || majors.includes(editedAcademicInfo.major || '')) && (
                      <select
                        value={editedAcademicInfo.major === "Other (please specify)" ? "Other (please specify)" : editedAcademicInfo.major || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          console.log("Major dropdown changed to:", value);
                          if (value === "Other (please specify)") {
                            // Set to empty string to trigger input field
                            handleAcademicInputChange("major", "");
                          } else {
                            handleAcademicInputChange("major", value);
                          }
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select Major</option>
                        {majors.map((major) => (
                          <option key={major} value={major}>
                            {major}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Show input field for custom major or when "Other" is selected */}
                    {((editedAcademicInfo.major && !majors.includes(editedAcademicInfo.major) && editedAcademicInfo.major !== "Other (please specify)") || editedAcademicInfo.major === "") && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Please specify your major"
                          value={editedAcademicInfo.major === "Other (please specify)" ? "" : editedAcademicInfo.major || ''}
                          onChange={(e) => {
                            console.log("Major input changed to:", e.target.value);
                            handleAcademicInputChange("major", e.target.value);

                            // Real-time validation
                            const error = validateAcademicField("major", e.target.value);
                            setErrors(prev => ({ ...prev, major: error }));
                          }}
                          autoFocus
                        />
                        {/* Show button to go back to dropdown if they want */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("Switching back to dropdown");
                            handleAcademicInputChange("major", "");
                          }}
                        >
                          Choose from predefined majors
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm">{profile.major}</p>
                )}
                {errors.major && <p className="text-red-500 text-xs">{errors.major}</p>}
              </div>

              {/* Academic Level field stays the same */}
              <div className="space-y-2">
                <Label>
                  Academic Level<span className="text-red-500">*</span>
                </Label>
                {isEditingAcademic ? (
                  <Select
                    value={editedAcademicInfo.year}
                    onValueChange={(value) => {
                      setEditedAcademicInfo({
                        ...editedAcademicInfo,
                        year: value,
                      });

                      // Real-time validation
                      const error = validateAcademicField("year", value);
                      setErrors(prev => ({ ...prev, year: error }));
                    }}
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
                {errors.year && <p className="text-red-500 text-xs">{errors.year}</p>}
              </div>

              {/* GPA field stays the same */}
              <div className="space-y-2">
                <Label>GPA (Optional)</Label>
                {isEditingAcademic ? (
                  <Input
                    value={editedAcademicInfo.gpa}
                    onChange={(e) => {
                      const { value } = e.target;
                      setEditedAcademicInfo({
                        ...editedAcademicInfo,
                        gpa: value,
                      });

                      // Real-time validation
                      const error = validateAcademicField("gpa", value);
                      setErrors(prev => ({ ...prev, gpa: error }));
                    }}
                    placeholder="e.g., 3.85 (0.00-4.33)"
                  />
                ) : (
                  <p className="text-sm">{profile.gpa}</p>
                )}
                {errors.gpa && <p className="text-red-500 text-xs">{errors.gpa}</p>}
              </div>

              {/* Expected Graduation field stays the same */}
              <div className="space-y-2">
                <Label>
                  Expected Graduation<span className="text-red-500">*</span>
                </Label>
                {isEditingAcademic ? (
                  <Input
                    value={editedAcademicInfo.academicInfo.expectedGraduation}
                    onChange={(e) => {
                      const { value } = e.target;
                      setEditedAcademicInfo({
                        ...editedAcademicInfo,
                        academicInfo: {
                          ...editedAcademicInfo.academicInfo,
                          expectedGraduation: value,
                        },
                      });

                      // Real-time validation
                      const error = validateAcademicField("expectedGraduation", value);
                      setErrors(prev => ({ ...prev, expectedGraduation: error }));
                    }}
                    placeholder="e.g., May 2025, 2025-05, Spring 2025"
                  />
                ) : (
                  <p className="text-sm">
                    {profile.academicInfo.expectedGraduation}
                  </p>
                )}
                {errors.expectedGraduation && <p className="text-red-500 text-xs">{errors.expectedGraduation}</p>}
                {isEditingAcademic && (
                  <p className="text-xs text-muted-foreground">
                    Enter any format: "May 2025", "2025-05", "Spring 2025", etc.
                  </p>
                )}
              </div>

              {/* Degree Start and Year Standing fields stay the same */}
              <div className="space-y-2">
                <Label>
                  Degree Start<span className="text-red-500">*</span>
                </Label>
                {isEditingAcademic ? (
                  <Input
                    value={editedAcademicInfo.academicInfo.degreeStart}
                    onChange={(e) => {
                      // Only allow 4 digits for year
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setEditedAcademicInfo({
                        ...editedAcademicInfo,
                        academicInfo: {
                          ...editedAcademicInfo.academicInfo,
                          degreeStart: value,
                        },
                      });

                      // Real-time validation
                      const error = validateAcademicField("degreeStart", value);
                      setErrors(prev => ({ ...prev, degreeStart: error }));
                    }}
                    placeholder="e.g., 2021"
                    maxLength="4"
                  />
                ) : (
                  <p className="text-sm">{profile.academicInfo.degreeStart}</p>
                )}
                {errors.degreeStart && <p className="text-red-500 text-xs">{errors.degreeStart}</p>}
              </div>

              <div className="space-y-2">
                <Label>
                  Year Standing<span className="text-red-500">*</span>
                </Label>
                {isEditingAcademic ? (
                  <Input
                    value={editedAcademicInfo.academicInfo.yearStanding}
                    onChange={(e) => {
                      // Only allow digits, max 1 character for standing
                      const value = e.target.value.replace(/\D/g, '').slice(0, 1);
                      setEditedAcademicInfo({
                        ...editedAcademicInfo,
                        academicInfo: {
                          ...editedAcademicInfo.academicInfo,
                          yearStanding: value,
                        },
                      });

                      // Real-time validation
                      const error = validateAcademicField("yearStanding", value);
                      setErrors(prev => ({ ...prev, yearStanding: error }));
                    }}
                    placeholder="e.g., 3 (1-8)"
                    maxLength="1"
                  />
                ) : (
                  <p className="text-sm">{profile.academicInfo.yearStanding}</p>
                )}
                {errors.yearStanding && <p className="text-red-500 text-xs">{errors.yearStanding}</p>}
              </div>

              {/* UPDATED MINOR FIELD */}
              <div className="space-y-2">
                <Label>Minor (Optional)</Label>
                {isEditingAcademic ? (
                  <div className="space-y-2">
                    {/* Always show dropdown first for minor too */}
                    {(editedAcademicInfo.minor === "" || editedAcademicInfo.minor === "Other (please specify)" || majors.includes(editedAcademicInfo.minor || '') || !editedAcademicInfo.minor) && (
                      <select
                        value={editedAcademicInfo.minor === "Other (please specify)" ? "Other (please specify)" : editedAcademicInfo.minor || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          console.log("Minor dropdown changed to:", value);
                          if (value === "Other (please specify)") {
                            handleAcademicInputChange("minor", "");
                          } else {
                            handleAcademicInputChange("minor", value);
                          }
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">No Minor</option>
                        {majors.map((major) => (
                          <option key={major} value={major}>
                            {major}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Show input field for custom minor */}
                    {((editedAcademicInfo.minor && !majors.includes(editedAcademicInfo.minor) && editedAcademicInfo.minor !== "Other (please specify)") || editedAcademicInfo.minor === "") && editedAcademicInfo.minor !== null && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Please specify your minor"
                          value={editedAcademicInfo.minor === "Other (please specify)" ? "" : editedAcademicInfo.minor || ''}
                          onChange={(e) => {
                            console.log("Minor input changed to:", e.target.value);
                            handleAcademicInputChange("minor", e.target.value);

                            // Real-time validation
                            const error = validateAcademicField("minor", e.target.value);
                            setErrors(prev => ({ ...prev, minor: error }));
                          }}
                          autoFocus
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("Switching minor back to dropdown");
                            handleAcademicInputChange("minor", "");
                          }}
                        >
                          Choose from predefined minors
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm">{profile.minor}</p>
                )}
                {errors.minor && <p className="text-red-500 text-xs">{errors.minor}</p>}
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
                    setErrors({}); // Clear errors on cancel
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
                        // Clear related errors
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[`course_${index}`];
                          delete newErrors[`semester_${index}`];
                          delete newErrors[`professor_${index}`];
                          return newErrors;
                        });
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
                          const { value } = e.target;
                          const newExp = [...editedExperience];
                          newExp[index].course = value;
                          setEditedExperience(newExp);

                          // Real-time validation
                          const error = validateExperienceField("course", value);
                          setErrors(prev => ({ ...prev, [`course_${index}`]: error }));
                        }}
                      />
                    ) : (
                      <p className="text-sm">{exp.course}</p>
                    )}
                    {errors[`course_${index}`] && (
                      <p className="text-red-500 text-xs">{errors[`course_${index}`]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label>Semester</Label>
                    {isEditingExperience ? (
                      <Input
                        value={exp.semester}
                        onChange={(e) => {
                          const { value } = e.target;
                          const newExp = [...editedExperience];
                          newExp[index].semester = value;
                          setEditedExperience(newExp);

                          // Real-time validation
                          const error = validateExperienceField("semester", value);
                          setErrors(prev => ({ ...prev, [`semester_${index}`]: error }));
                        }}
                      />
                    ) : (
                      <p className="text-sm">{exp.semester}</p>
                    )}
                    {isEditingExperience && (
                      <p className="text-xs text-muted-foreground">Accepted formats are Fall 2023, Winter 2024, Summer 2021</p>
                    )}
                    {errors[`semester_${index}`] && (
                      <p className="text-red-500 text-xs">{errors[`semester_${index}`]}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label>Professor</Label>
                    {isEditingExperience ? (
                      <Input
                        value={exp.professor}
                        onChange={(e) => {
                          const { value } = e.target;
                          const newExp = [...editedExperience];
                          newExp[index].professor = value;
                          setEditedExperience(newExp);

                          // Real-time validation
                          const error = validateExperienceField("professor", value);
                          setErrors(prev => ({ ...prev, [`professor_${index}`]: error }));
                        }}
                      />
                    ) : (
                      <p className="text-sm">{exp.professor}</p>
                    )}
                    {errors[`professor_${index}`] && (
                      <p className="text-red-500 text-xs">{errors[`professor_${index}`]}</p>
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
                          setErrors({}); // Clear errors on cancel
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
                              <div className="flex-1">
                                <Input
                                  value={skill}
                                  className="w-40"
                                  onChange={(e) => {
                                    // Filter out numbers and restrict to letters/symbols only
                                    const value = e.target.value.replace(/[0-9]/g, '');
                                    const newSkills = [...editedSkills.technicalSkills];
                                    newSkills[index] = value;
                                    setEditedSkills({
                                      ...editedSkills,
                                      technicalSkills: newSkills,
                                    });

                                    // Real-time validation
                                    const error = validateSkillField(value);
                                    setErrors(prev => ({
                                      ...prev,
                                      [`technical_${index}`]: error
                                    }));
                                  }}
                                  placeholder="e.g., JavaScript, Python, React (no numbers)"
                                />
                                {errors[`technical_${index}`] && (
                                  <p className="text-red-500 text-xs mt-1">{errors[`technical_${index}`]}</p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const updated = editedSkills.technicalSkills.filter((_, i) => i !== index);
                                  setEditedSkills({
                                    ...editedSkills,
                                    technicalSkills: updated,
                                  });
                                  // Clear error
                                  setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors[`technical_${index}`];
                                    return newErrors;
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
                              <div className="flex-1">
                                <Input
                                  value={skill}
                                  className="w-40"
                                  onChange={(e) => {
                                    // Filter out numbers and restrict to letters/symbols only
                                    const value = e.target.value.replace(/[0-9]/g, '');
                                    const newSkills = [...editedSkills.softSkills];
                                    newSkills[index] = value;
                                    setEditedSkills({
                                      ...editedSkills,
                                      softSkills: newSkills,
                                    });

                                    // Real-time validation
                                    const error = validateSkillField(value);
                                    setErrors(prev => ({
                                      ...prev,
                                      [`soft_${index}`]: error
                                    }));
                                  }}
                                  placeholder="e.g., Communication, Leadership (no numbers)"
                                />
                                {errors[`soft_${index}`] && (
                                  <p className="text-red-500 text-xs mt-1">{errors[`soft_${index}`]}</p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const updated = editedSkills.softSkills.filter((_, i) => i !== index);
                                  setEditedSkills({
                                    ...editedSkills,
                                    softSkills: updated,
                                  });
                                  // Clear error
                                  setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors[`soft_${index}`];
                                    return newErrors;
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
                              setErrors({}); // Clear errors on cancel
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
                            <div className="flex-1">
                              <Input
                                value={course}
                                onChange={(e) => {
                                  const { value } = e.target;
                                  const updated = [...coursePreference];
                                  updated[index] = value;
                                  setCoursePreference(updated);

                                  // Real-time validation
                                  const error = validateCoursePreference(value);
                                  setErrors(prev => ({
                                    ...prev,
                                    [`course_${index}`]: error
                                  }));
                                }}
                                placeholder="e.g., COSC 499, MATH 100A"
                              />
                              {errors[`course_${index}`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`course_${index}`]}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const updated = coursePreference.filter(
                                  (_, i) => i !== index
                                );
                                setCoursePreference(updated);
                                // Clear error
                                setErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors[`course_${index}`];
                                  return newErrors;
                                });
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


                    <span style={{ display: "block", marginBottom: "1rem" }}>
                      Please indicate your general weekly availability below.
                    </span>

                    <div style={{
                      backgroundColor: "#f0f7ff",
                      borderRadius: "8px",
                      padding: "1rem",
                      marginBottom: "1rem",
                      border: "1px solid #cfe2ff"
                    }}>
                      <strong style={{ color: "#2563eb" }}>Blue boxes</strong> represent times that you are
                      <strong style={{ color: "#ef4444" }}> NOT available </strong>for work, and
                      <strong style={{ color: "#000" }}> white boxes </strong>represent times that you
                      <strong style={{ color: "#22c55e" }}> ARE available</strong>.
                    </div>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1.5rem",
                      marginBottom: "1.5rem"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{
                          width: "20px",
                          height: "20px",
                          backgroundColor: "#2563eb",
                          border: "1px solid #ccc"
                        }} />
                        <span style={{ color: "#dc2626", fontWeight: "bold" }}>Not Available</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{
                          width: "20px",
                          height: "20px",
                          backgroundColor: "#fff",
                          border: "1px solid #ccc"
                        }} />
                        <span style={{ color: "#22c55e", fontWeight: "bold" }}>Available</span>
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: "#fff5f5",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      padding: "1rem",
                      marginBottom: "1.5rem"
    
                    }}>
                      <strong style={{ color: "#b91c1c" }}>⚠ Tip:</strong>
                      <span style={{ color: "#b91c1c", marginLeft: "0.5rem" }}>
                        Only highlight the times you are <u>NOT available</u>!
                      </span>
                    </div>
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