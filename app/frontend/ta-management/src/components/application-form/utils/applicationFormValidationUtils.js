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

// Main validation function
export const validateCurrentStep = (step, student, responses) => {
  console.log("these are responses", responses);
  switch (step) {
    case 1:
      return validateStep1(responses);
    case 2:
      return validateStep2(responses);
    default:
      return { isValid: true, errors: {} };
  }
};
