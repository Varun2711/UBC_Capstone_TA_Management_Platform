// validationUtils.js - This handles the validation logic for each page in the application form
export const validateStep1 = (responses) => {
  const errors = {};

  if (!responses.citizenshipStatus) {
    errors.citizenshipStatus = "Please select your citizenship status.";
  }

  if (!responses.residingInKelowna) {
    errors.residingInKelowna = "Please indicate if you're residing in Kelowna.";
  }

  if (responses.residingInKelowna === "no") {
    errors.residingInKelowna =
      " You are not eligible to work as a TA if you are not residing in Kelowna.";
  }

  if (!responses.fullTimeEnrollment) {
    errors.fullTimeEnrollment = "Please confirm your enrollment status.";
  }

  if (!responses.hasOtherPositions) {
    errors.hasOtherPositions = "Please indicate if you have other positions.";
  }

  if (responses.hasOtherPositions === "yes" && !responses.otherPositionHours) {
    errors.otherPositionHours = "Please specify hours for other positions.";
  }

  if (
    responses.hasOtherPositions === "yes" &&
    responses.otherPositionHours > 60
  ) {
    errors.otherPositionHours =
      "Please enter valid a number of hours between 1 and 60.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateStep2 = (responses) => {
  const errors = {};

  if (!responses.positionType) {
    errors.positionType = "Please select the position you're applying for.";
  }

  if (!responses.winterTerm) {
    errors.winterTerm = "Please select which term(s) you're applying for.";
  }

  if (!responses.workload) {
    errors.workload = "Please select your preferred workload.";
  }

  // Validate discipline ranking
  const { rank1, rank2, rank3 } = responses.disciplineRanking || {};
  if (!rank1 || !rank2 || !rank3) {
    errors.disciplineRanking =
      "Please choose a discipline for all three ranks.";
  } else {
    const set = new Set([rank1, rank2, rank3]);
    if (set.size !== 3) {
      errors.disciplineRanking = "Each rank must be a different discipline.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateStep3 = (student) => {
  const errors = {};

  // if (!student.firstName || student.firstName.trim().length < 2) {
  //   errors.firstName = "First name must be at least 2 characters.";
  // }

  // if (!student.lastName || student.lastName.trim().length < 2) {
  //   errors.lastName = "Last name must be at least 2 characters.";
  // }

  // if (!student.email) {
  //   errors.email = "Email is required";
  // } else {
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   if (!emailRegex.test(student.email)) {
  //     errors.email = "Please enter a valid email address.";
  //   }
  // }

  // if (!student.phone) {
  //   errors.phone = "Phone number is required";
  // }

  // if (!student.gpa) {
  //   errors.gpa = "GPA is required";
  // } else {
  //   const gpa = parseFloat(student.gpa);
  //   if (isNaN(gpa) || gpa < 0 || gpa > 4.0) {
  //     errors.gpa = "GPA must be between 0.0 and 4.0";
  //   }
  // }

  // if (!student.resume) {
  //   errors.resume = "Resume is required";
  // }

  // if (!student.transcript) {
  //  errors.transcript = "Transcript is required";
  // }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Main validation function
export const validateCurrentStep = (step, student, responses) => {
  switch (step) {
    case 1:
      return validateStep1(responses);
    case 2:
      return validateStep2(responses);
    case 3:
      return validateStep3(student);
    default:
      return { isValid: true, errors: {} };
  }
};
