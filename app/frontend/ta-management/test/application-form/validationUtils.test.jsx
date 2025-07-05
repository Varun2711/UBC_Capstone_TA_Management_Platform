import { describe, it, expect } from "vitest";
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateCurrentStep,
} from "@/utils/validationUtils";

describe("validationUtils", () => {
  describe("validateStep1", () => {
    it("returns valid when all required fields are filled", () => {
      const validResponses = {
        citizenshipStatus: "Canadian Citizen",
        residingInKelowna: "yes",
        fullTimeEnrollment: "yes",
        hasOtherPositions: "no",
      };

      const result = validateStep1(validResponses);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("returns errors for missing required fields", () => {
      const invalidResponses = {
        citizenshipStatus: "",
        residingInKelowna: "",
        fullTimeEnrollment: "yes",
        hasOtherPositions: "no",
      };

      const result = validateStep1(invalidResponses);
      expect(result.isValid).toBe(false);
      expect(result.errors.citizenshipStatus).toBe(
        "Please select your citizenship status."
      );
      expect(result.errors.residingInKelowna).toBe(
        "Please indicate if you're residing in Kelowna."
      );
    });

    it("returns error when not residing in Kelowna", () => {
      const responsesNotInKelowna = {
        citizenshipStatus: "Canadian Citizen",
        residingInKelowna: "no",
        fullTimeEnrollment: "yes",
        hasOtherPositions: "no",
      };

      const result = validateStep1(responsesNotInKelowna);
      expect(result.isValid).toBe(false);
      expect(result.errors.residingInKelowna).toBe(
        " You are not eligible to work as a TA if you are not residing in Kelowna."
      );
    });

    it("requires otherPositionHours when hasOtherPositions is yes", () => {
      const responsesWithOtherPositions = {
        citizenshipStatus: "Canadian Citizen",
        residingInKelowna: "yes",
        fullTimeEnrollment: "yes",
        hasOtherPositions: "yes",
        otherPositionHours: "",
      };

      const result = validateStep1(responsesWithOtherPositions);
      expect(result.isValid).toBe(false);
      expect(result.errors.otherPositionHours).toBe(
        "Please specify hours for other positions."
      );
    });

    it("validates otherPositionHours range when hasOtherPositions is yes", () => {
      const responsesWithTooManyHours = {
        citizenshipStatus: "Canadian Citizen",
        residingInKelowna: "yes",
        fullTimeEnrollment: "yes",
        hasOtherPositions: "yes",
        otherPositionHours: 70,
      };

      const result = validateStep1(responsesWithTooManyHours);
      expect(result.isValid).toBe(false);
      expect(result.errors.otherPositionHours).toBe(
        "Please enter valid a number of hours between 1 and 60."
      );
    });

    it("accepts valid otherPositionHours when hasOtherPositions is yes", () => {
      const responsesWithValidHours = {
        citizenshipStatus: "Canadian Citizen",
        residingInKelowna: "yes",
        fullTimeEnrollment: "yes",
        hasOtherPositions: "yes",
        otherPositionHours: 20,
      };

      const result = validateStep1(responsesWithValidHours);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("does not require otherPositionHours when hasOtherPositions is no", () => {
      const responsesWithoutOtherPositions = {
        citizenshipStatus: "Canadian Citizen",
        residingInKelowna: "yes",
        fullTimeEnrollment: "yes",
        hasOtherPositions: "no",
        otherPositionHours: "",
      };

      const result = validateStep1(responsesWithoutOtherPositions);
      expect(result.isValid).toBe(true);
    });

    it("validates all required fields are present", () => {
      const incompleteResponses = {
        citizenshipStatus: "",
        residingInKelowna: "",
        fullTimeEnrollment: "",
        hasOtherPositions: "",
      };

      const result = validateStep1(incompleteResponses);
      expect(result.isValid).toBe(false);
      expect(result.errors.citizenshipStatus).toBeDefined();
      expect(result.errors.residingInKelowna).toBeDefined();
      expect(result.errors.fullTimeEnrollment).toBeDefined();
      expect(result.errors.hasOtherPositions).toBeDefined();
    });
  });

  describe("validateStep2", () => {
    it("returns valid when all fields are properly filled", () => {
      const validResponses = {
        positionType: "Undergraduate Teaching Assistant",
        winterTerm: "W2025 both terms",
        workload: "6 hours",
        disciplineRanking: {
          rank1: "COSC",
          rank2: "MATH",
          rank3: "PHYS",
        },
      };

      const result = validateStep2(validResponses);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("returns errors for missing required fields", () => {
      const invalidResponses = {
        positionType: "",
        winterTerm: "",
        workload: "",
        disciplineRanking: {
          rank1: "COSC",
          rank2: "MATH",
          rank3: "PHYS",
        },
      };

      const result = validateStep2(invalidResponses);
      expect(result.isValid).toBe(false);
      expect(result.errors.positionType).toBe(
        "Please select the position you're applying for."
      );
      expect(result.errors.winterTerm).toBe(
        "Please select which term(s) you're applying for."
      );
      expect(result.errors.workload).toBe(
        "Please select your preferred workload."
      );
    });

    it("validates discipline ranking correctly", () => {
      const responsesWithInvalidRanking = {
        positionType: "Undergraduate Teaching Assistant",
        winterTerm: "W2025 both terms",
        workload: "6 hours",
        disciplineRanking: {
          rank1: "COSC",
          rank2: "",
          rank3: "PHYS",
        },
      };

      const result = validateStep2(responsesWithInvalidRanking);
      expect(result.isValid).toBe(false);
      expect(result.errors.disciplineRanking).toBe(
        "Please choose a discipline for all three ranks."
      );
    });

    it("catches duplicate disciplines in ranking", () => {
      const responsesWithDuplicates = {
        positionType: "Undergraduate Teaching Assistant",
        winterTerm: "W2025 both terms",
        workload: "6 hours",
        disciplineRanking: {
          rank1: "COSC",
          rank2: "COSC",
          rank3: "PHYS",
        },
      };

      const result = validateStep2(responsesWithDuplicates);
      expect(result.isValid).toBe(false);
      expect(result.errors.disciplineRanking).toBe(
        "Each rank must be a different discipline."
      );
    });

    it("validates when disciplineRanking is missing", () => {
      const responsesWithoutRanking = {
        positionType: "Undergraduate Teaching Assistant",
        winterTerm: "W2025 both terms",
        workload: "6 hours",
        disciplineRanking: null,
      };

      const result = validateStep2(responsesWithoutRanking);
      expect(result.isValid).toBe(false);
      expect(result.errors.disciplineRanking).toBe(
        "Please choose a discipline for all three ranks."
      );
    });

    it("validates when disciplineRanking is undefined", () => {
      const responsesWithUndefinedRanking = {
        positionType: "Undergraduate Teaching Assistant",
        winterTerm: "W2025 both terms",
        workload: "6 hours",
      };

      const result = validateStep2(responsesWithUndefinedRanking);
      expect(result.isValid).toBe(false);
      expect(result.errors.disciplineRanking).toBe(
        "Please choose a discipline for all three ranks."
      );
    });
  });

  describe("validateCurrentStep", () => {
    it("routes to correct validation function based on step", () => {
      const student = { firstName: "John" };
      const responses = {
        citizenshipStatus: "Canadian Citizen",
        residingInKelowna: "yes",
        fullTimeEnrollment: "yes",
        hasOtherPositions: "no",
      };

      // Test step 1
      const step1Result = validateCurrentStep(1, student, responses);
      expect(step1Result).toBeDefined();
      expect(step1Result.isValid).toBe(true);

      // Test step 2 - should fail validation due to missing fields
      const step2Result = validateCurrentStep(2, student, responses);
      expect(step2Result).toBeDefined();
      expect(step2Result.isValid).toBe(false);

      // Test invalid step
      const invalidStepResult = validateCurrentStep(99, student, responses);
      expect(invalidStepResult.isValid).toBe(true);
      expect(invalidStepResult.errors).toEqual({});
    });

    it("handles step 1 validation correctly", () => {
      const student = {};
      const incompleteResponses = {
        citizenshipStatus: "",
        residingInKelowna: "",
        fullTimeEnrollment: "",
        hasOtherPositions: "",
      };

      const result = validateCurrentStep(1, student, incompleteResponses);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(4);
    });

    it("handles step 2 validation correctly", () => {
      const student = {};
      const incompleteResponses = {
        positionType: "",
        winterTerm: "",
        workload: "",
        disciplineRanking: { rank1: "", rank2: "", rank3: "" },
      };

      const result = validateCurrentStep(2, student, incompleteResponses);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(4);
    });
  });
});
