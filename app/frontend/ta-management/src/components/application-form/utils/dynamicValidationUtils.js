// utils/dynamicValidationUtils.js

/**
 * Validate a dynamic form section based on its questions and current responses
 * @param {Object} section - The form section object with questions
 * @param {Object} responses - Current form responses
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateDynamicForm = (section, responses) => {
  const errors = {};
  let isValid = true;

  if (!section || !section.questions) {
    return { isValid: true, errors: {} };
  }

  section.questions.forEach((question) => {
    const {
      field_name,
      is_required,
      question_type,
      validation_rules = {},
    } = question;
    const value = responses[field_name];

    // Check required fields
    if (is_required) {
      if (isEmpty(value, question_type)) {
        errors[field_name] = `${question.question_text} is required.`;
        isValid = false;
        return;
      }
    }

    // Skip validation if field is empty and not required
    if (isEmpty(value, question_type)) {
      return;
    }

    // Type-specific validation
    const typeValidation = validateByType(
      value,
      question_type,
      validation_rules
    );
    if (!typeValidation.isValid) {
      errors[field_name] = typeValidation.error;
      isValid = false;
    }

    // Custom validation rules
    const customValidation = validateCustomRules(
      value,
      validation_rules,
      question
    );
    if (!customValidation.isValid) {
      errors[field_name] = customValidation.error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

/**
 * Check if a value is empty based on the question type
 * @param {any} value - The value to check
 * @param {string} questionType - The type of question
 * @returns {boolean} - Whether the value is considered empty
 */
const isEmpty = (value, questionType) => {
  if (value === null || value === undefined) return true;

  switch (questionType) {
    case "text":
    case "textarea":
    case "email":
    case "select":
    case "radio":
      return value === "" || (typeof value === "string" && value.trim() === "");

    case "number":
      return value === "" || value === null || value === undefined;

    case "checkbox":
      return !Array.isArray(value) || value.length === 0;

    case "ranking":
      if (!value || typeof value !== "object") return true;
      return (
        Object.keys(value).length === 0 || !Object.values(value).some((v) => v)
      );

    case "file":
      return !value || !value.file;

    default:
      return !value;
  }
};

/**
 * Validate value based on question type
 * @param {any} value - The value to validate
 * @param {string} questionType - The type of question
 * @param {Object} validationRules - Validation rules for the question
 * @returns {Object} - { isValid: boolean, error: string }
 */
const validateByType = (value, questionType, validationRules) => {
  switch (questionType) {
    case "email":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { isValid: false, error: "Please enter a valid email address." };
      }
      break;

    case "number":
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return { isValid: false, error: "Please enter a valid number." };
      }

      if (validationRules.min !== undefined && numValue < validationRules.min) {
        return {
          isValid: false,
          error: `Value must be at least ${validationRules.min}.`,
        };
      }

      if (validationRules.max !== undefined && numValue > validationRules.max) {
        return {
          isValid: false,
          error: `Value must be no more than ${validationRules.max}.`,
        };
      }
      break;

    case "text":
    case "textarea":
      if (
        validationRules.minLength &&
        value.length < validationRules.minLength
      ) {
        return {
          isValid: false,
          error: `Must be at least ${validationRules.minLength} characters.`,
        };
      }

      if (
        validationRules.maxLength &&
        value.length > validationRules.maxLength
      ) {
        return {
          isValid: false,
          error: `Must be no more than ${validationRules.maxLength} characters.`,
        };
      }
      break;

    case "checkbox":
      if (
        validationRules.minSelections &&
        value.length < validationRules.minSelections
      ) {
        return {
          isValid: false,
          error: `Please select at least ${validationRules.minSelections} options.`,
        };
      }

      if (
        validationRules.maxSelections &&
        value.length > validationRules.maxSelections
      ) {
        return {
          isValid: false,
          error: `Please select no more than ${validationRules.maxSelections} options.`,
        };
      }
      break;

    case "ranking":
      if (validationRules.requireAllRanks) {
        const expectedRanks = validationRules.maxRanks || 3;
        const filledRanks = Object.values(value).filter((v) => v).length;
        if (filledRanks < expectedRanks) {
          return {
            isValid: false,
            error: `Please rank all ${expectedRanks} options.`,
          };
        }
      }

      // Check for duplicate rankings
      const rankValues = Object.values(value).filter((v) => v);
      const uniqueValues = new Set(rankValues);
      if (rankValues.length !== uniqueValues.size) {
        return {
          isValid: false,
          error: "Each option can only be ranked once.",
        };
      }
      break;

    case "file":
      if (validationRules.maxSize && value.size > validationRules.maxSize) {
        const maxSizeMB = (validationRules.maxSize / (1024 * 1024)).toFixed(1);
        return {
          isValid: false,
          error: `File size must be less than ${maxSizeMB}MB.`,
        };
      }

      if (
        validationRules.allowedTypes &&
        validationRules.allowedTypes.length > 0
      ) {
        const fileExtension = value.name.split(".").pop().toLowerCase();
        if (!validationRules.allowedTypes.includes(fileExtension)) {
          return {
            isValid: false,
            error: `File type must be one of: ${validationRules.allowedTypes.join(
              ", "
            )}.`,
          };
        }
      }
      break;
  }

  return { isValid: true, error: null };
};

/**
 * Validate custom rules
 * @param {any} value - The value to validate
 * @param {Object} validationRules - Custom validation rules
 * @param {Object} question - The question object
 * @returns {Object} - { isValid: boolean, error: string }
 */
const validateCustomRules = (value, validationRules, question) => {
  // Custom regex validation
  if (validationRules.pattern) {
    const regex = new RegExp(validationRules.pattern);
    if (!regex.test(value)) {
      return {
        isValid: false,
        error: validationRules.patternMessage || "Please enter a valid format.",
      };
    }
  }

  // Custom function validation (if you want to support it)
  if (
    validationRules.customValidator &&
    typeof validationRules.customValidator === "function"
  ) {
    try {
      const result = validationRules.customValidator(value, question);
      if (result !== true) {
        return { isValid: false, error: result || "Invalid value." };
      }
    } catch (error) {
      console.error("Custom validator error:", error);
      return { isValid: false, error: "Validation error occurred." };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Validate entire form template (all sections)
 * @param {Object} template - The form template
 * @param {Object} responses - All form responses
 * @returns {Object} - { isValid: boolean, errors: Object, sectionErrors: Object }
 */
export const validateEntireForm = (template, responses) => {
  let isValid = true;
  const errors = {};
  const sectionErrors = {};

  if (!template || !template.sections) {
    return { isValid: true, errors: {}, sectionErrors: {} };
  }

  template.sections.forEach((section) => {
    const sectionValidation = validateDynamicForm(section, responses);

    if (!sectionValidation.isValid) {
      isValid = false;
      sectionErrors[section.section_id] = sectionValidation.errors;
      Object.assign(errors, sectionValidation.errors);
    }
  });

  return { isValid, errors, sectionErrors };
};

/**
 * Get validation rules for a specific question type
 * @param {string} questionType - The question type
 * @returns {Object} - Default validation rules for the type
 */
export const getDefaultValidationRules = (questionType) => {
  const defaults = {
    text: {
      maxLength: 500,
      minLength: 0,
    },
    textarea: {
      maxLength: 2000,
      minLength: 0,
    },
    email: {
      pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+",
      patternMessage: "Please enter a valid email address",
    },
    number: {
      min: 0,
      max: 999999,
    },
    checkbox: {
      minSelections: 0,
      maxSelections: 10,
    },
    ranking: {
      maxRanks: 3,
      requireAllRanks: true,
    },
    file: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ["pdf", "doc", "docx", "txt"],
    },
  };

  return defaults[questionType] || {};
};

/**
 * Merge custom validation rules with defaults
 * @param {string} questionType - The question type
 * @param {Object} customRules - Custom validation rules
 * @returns {Object} - Merged validation rules
 */
export const mergeValidationRules = (questionType, customRules = {}) => {
  const defaults = getDefaultValidationRules(questionType);
  return { ...defaults, ...customRules };
};
