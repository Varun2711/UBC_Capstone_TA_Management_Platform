// src/utils/dynamicFormValidation.js

/**
 * Validates default response fields with existing complex validation logic
 * @param {Object} responses - The default responses object
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateDefaultResponses = (responses) => {
  const errors = {};

  if (!responses.citizenshipStatus) {
    errors.citizenshipStatus = "Please select your citizenship status.";
  }

  if (!responses.residingInKelowna) {
    errors.residingInKelowna = "Please indicate if you're residing in Kelowna.";
  }

  if (responses.residingInKelowna === "no") {
    errors.residingInKelowna =
      "You are not eligible to work as a TA if you are not residing in Kelowna.";
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

/**
 * Helper function to check if a value is considered valid based on question type
 * @param {any} value - The value to check
 * @param {string} questionType - The type of question
 * @returns {boolean} - Whether the value is valid
 */
const hasValidResponse = (value, questionType) => {
  switch (questionType) {
    case "checkbox":
      return Array.isArray(value) && value.length > 0;
    case "ranking":
      return (
        value && typeof value === "object" && Object.keys(value).length > 0
      );
    case "file":
      return value && (value.file || value.name);
    case "number":
      return (
        value !== null && value !== undefined && value !== "" && !isNaN(value)
      );
    default:
      return value !== null && value !== undefined && value !== "";
  }
};

/**
 * Validates dynamic response fields - checks required fields only
 * @param {Object} dynamicResponses - The dynamic responses object
 * @param {Array} dynamicSections - The template sections to validate against
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateDynamicResponses = (dynamicResponses, dynamicSections) => {
  const errors = {};

  if (!dynamicSections || !Array.isArray(dynamicSections)) {
    return { isValid: true, errors: {} };
  }

  dynamicSections.forEach((section) => {
    if (section.questions && Array.isArray(section.questions)) {
      section.questions.forEach((question) => {
        const { field_name, is_required, question_text, question_type } =
          question;

        if (is_required && field_name) {
          const value = dynamicResponses[field_name];

          if (!hasValidResponse(value, question_type)) {
            errors[
              field_name
            ] = `Please provide a response for "${question_text}".`;
          }
        }
      });
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Combined validation function for both default and dynamic responses
 * @param {Object} defaultResponses - Default form responses
 * @param {Object} dynamicResponses - Dynamic form responses
 * @param {Array} dynamicSections - Template sections for dynamic validation
 * @param {Object} fieldMapping - Mapping of which fields belong where
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateAllResponses = (
  defaultResponses,
  dynamicResponses,
  dynamicSections,
  fieldMapping
) => {
  let allErrors = {};
  let isValid = true;

  // Validate default responses (only for fields that actually exist in defaultResponses)
  const fieldsInDefault = Object.keys(fieldMapping).filter(
    (field) => fieldMapping[field] === true
  );

  if (fieldsInDefault.length > 0) {
    const defaultValidation = validateDefaultResponses(defaultResponses);

    if (!defaultValidation.isValid) {
      allErrors = { ...allErrors, ...defaultValidation.errors };
      isValid = false;
    }
  }

  // Validate dynamic responses
  const dynamicValidation = validateDynamicResponses(
    dynamicResponses,
    dynamicSections
  );

  if (!dynamicValidation.isValid) {
    allErrors = { ...allErrors, ...dynamicValidation.errors };
    isValid = false;
  }

  return {
    isValid,
    errors: allErrors,
  };
};

/**
 * Validates a specific field using complex business rules for default fields
 * @param {string} fieldName - The field to validate
 * @param {Object} defaultResponses - Default responses object
 * @returns {string|null} - Error message or null if valid
 */
const validateDefaultField = (fieldName, defaultResponses) => {
  const responses = defaultResponses;

  switch (fieldName) {
    case "citizenshipStatus":
      if (!responses.citizenshipStatus) {
        return "Please select your citizenship status.";
      }
      break;

    case "residingInKelowna":
      if (!responses.residingInKelowna) {
        return "Please indicate if you're residing in Kelowna.";
      }
      if (responses.residingInKelowna === "no") {
        return "You are not eligible to work as a TA if you are not residing in Kelowna.";
      }
      break;

    case "fullTimeEnrollment":
      if (!responses.fullTimeEnrollment) {
        return "Please confirm your enrollment status.";
      }
      break;

    case "hasOtherPositions":
      if (!responses.hasOtherPositions) {
        return "Please indicate if you have other positions.";
      }
      break;

    case "otherPositionHours":
      if (
        responses.hasOtherPositions === "yes" &&
        !responses.otherPositionHours
      ) {
        return "Please specify hours for other positions.";
      }
      if (
        responses.hasOtherPositions === "yes" &&
        responses.otherPositionHours > 60
      ) {
        return "Please enter valid a number of hours between 1 and 60.";
      }
      break;

    case "positionType":
      if (!responses.positionType) {
        return "Please select the position you're applying for.";
      }
      break;

    case "winterTerm":
      if (!responses.winterTerm) {
        return "Please select which term(s) you're applying for.";
      }
      break;

    case "workload":
      if (!responses.workload) {
        return "Please select your preferred workload.";
      }
      break;

    case "disciplineRanking":
      const { rank1, rank2, rank3 } = responses.disciplineRanking || {};
      if (!rank1 || !rank2 || !rank3) {
        return "Please choose a discipline for all three ranks.";
      } else {
        const set = new Set([rank1, rank2, rank3]);
        if (set.size !== 3) {
          return "Each rank must be a different discipline.";
        }
      }
      break;

    default:
      // For any other default fields, fall back to simple validation
      if (!responses[fieldName]) {
        return `Please provide a response for ${fieldName}.`;
      }
  }

  return null; // No error
};

/**
 * Validates a specific dynamic step/section
 * @param {number} stepNumber - The current step (1-based)
 * @param {Array} dynamicSections - All dynamic sections
 * @param {Object} defaultResponses - Default responses
 * @param {Object} dynamicResponses - Dynamic responses
 * @param {Object} fieldMapping - Field mapping object
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateDynamicStep = (
  stepNumber,
  dynamicSections,
  defaultResponses,
  dynamicResponses,
  fieldMapping
) => {
  const currentSection = dynamicSections[stepNumber - 1];

  if (!currentSection) {
    return { isValid: true, errors: {} };
  }

  const errors = {};

  if (currentSection.questions && Array.isArray(currentSection.questions)) {
    currentSection.questions.forEach((question) => {
      const { field_name, is_required, question_text, question_type } =
        question;

      if (is_required && field_name) {
        const shouldUseDefault = fieldMapping[field_name] === true;

        if (shouldUseDefault) {
          // Use complex business rules for default fields
          const error = validateDefaultField(field_name, defaultResponses);
          if (error) {
            errors[field_name] = error;
          }

          // SPECIAL CASE: Also validate conditional fields
          // If hasOtherPositions is in this section, also validate otherPositionHours
          if (
            field_name === "hasOtherPositions" &&
            defaultResponses.hasOtherPositions === "yes"
          ) {
            // Check if otherPositionHours is also in the current section
            const hasOtherHoursField = currentSection.questions.some(
              (q) => q.field_name === "otherPositionHours"
            );
            if (hasOtherHoursField) {
              const hoursError = validateDefaultField(
                "otherPositionHours",
                defaultResponses
              );
              if (hoursError) {
                errors["otherPositionHours"] = hoursError;
              }
            }
          }
        } else {
          // Use simple validation for dynamic fields
          const value = dynamicResponses[field_name];
          if (!hasValidResponse(value, question_type)) {
            errors[field_name] = `Please provide a response.`;
          }
        }
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
