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
        residingInKelowna: "Yes",
        fullTimeEnrollment: "Yes",
        hasOtherPositions: "No",
      };

      const result = validateStep1(validResponses);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("returns errors for missing required fields", () => {
      const invalidResponses = {
        citizenshipStatus: "",
        residingInKelowna: "",
        fullTimeEnrollment: "Yes",
        hasOtherPositions: "No",
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

    it("requires otherPositionHours when hasOtherPositions is Yes", () => {
      const responsesWithOtherPositions = {
        citizenshipStatus: "Canadian Citizen",
        residingInKelowna: "Yes",
        fullTimeEnrollment: "Yes",
        hasOtherPositions: "Yes",
        otherPositionHours: "",
      };

      const result = validateStep1(responsesWithOtherPositions);
      expect(result.isValid).toBe(false);
      expect(result.errors.otherPositionHours).toBe(
        "Please specify hours for other positions."
      );
    });

    it("does not require otherPositionHours when hasOtherPositions is No", () => {
      const responsesWithoutOtherPositions = {
        citizenshipStatus: "Canadian Citizen",
        residingInKelowna: "Yes",
        fullTimeEnrollment: "Yes",
        hasOtherPositions: "No",
        otherPositionHours: "",
      };

      const result = validateStep1(responsesWithoutOtherPositions);
      expect(result.isValid).toBe(true);
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
        workload: "6 hours",
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
  });

  describe("validateStep3", () => {
    it("returns valid when all student data is correct", () => {
      const validStudent = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1 (555) 123-4567",
        gpa: "3.5",
        resume: new File(["content"], "resume.pdf", {
          type: "application/pdf",
        }),
        transcript: new File(["content"], "transcript.pdf", {
          type: "application/pdf",
        }),
      };

      const result = validateStep3(validStudent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("validates email format", () => {
      const studentWithInvalidEmail = {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
        phone: "+1 (555) 123-4567",
        gpa: "3.5",
        resume: new File(["content"], "resume.pdf", {
          type: "application/pdf",
        }),
      };

      const result = validateStep3(studentWithInvalidEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe("Please enter a valid email address.");
    });

    it("validates GPA range", () => {
      const studentWithInvalidGPA = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1 (555) 123-4567",
        gpa: "5.0",
        resume: new File(["content"], "resume.pdf", {
          type: "application/pdf",
        }),
      };

      const result = validateStep3(studentWithInvalidGPA);
      expect(result.isValid).toBe(false);
      expect(result.errors.gpa).toBe("GPA must be between 0.0 and 4.0");
    });

    it("requires resume file", () => {
      const studentWithoutResume = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1 (555) 123-4567",
        gpa: "3.5",
        resume: null,
      };

      const result = validateStep3(studentWithoutResume);
      expect(result.isValid).toBe(false);
      expect(result.errors.resume).toBe("Resume is required");
    });
  });

  describe("validateCurrentStep", () => {
    it("routes to correct validation function based on step", () => {
      const student = { firstName: "John" };
      const responses = { citizenshipStatus: "Canadian Citizen" };

      // Test step 1
      const step1Result = validateCurrentStep(1, student, responses);
      expect(step1Result).toBeDefined();

      // Test step 2
      const step2Result = validateCurrentStep(2, student, responses);
      expect(step2Result).toBeDefined();

      // Test step 3
      const step3Result = validateCurrentStep(3, student, responses);
      expect(step3Result).toBeDefined();

      // Test invalid step
      const invalidStepResult = validateCurrentStep(99, student, responses);
      expect(invalidStepResult.isValid).toBe(true);
      expect(invalidStepResult.errors).toEqual({});
    });
  });
});
