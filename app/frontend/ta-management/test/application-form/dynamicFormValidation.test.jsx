// src/utils/dynamicFormValidation.test.js
import { describe, it, expect } from "vitest";
import {
  validateDefaultResponses,
  validateDynamicResponses,
  validateAllResponses,
  validateDynamicStep,
} from "@/components/application-form/utils/dynamicFormValidation";

describe("validateDefaultResponses()", () => {
  it("flags all missing default fields", () => {
    const { isValid, errors } = validateDefaultResponses({});
    expect(isValid).toBe(false);
    // should have exactly these keys
    expect(Object.keys(errors).sort()).toEqual(
      [
        "citizenshipStatus",
        "disciplineRanking",
        "fullTimeEnrollment",
        "hasOtherPositions",
        "positionType",
        "residingInKelowna",
        "winterTerm",
        "workload",
      ].sort()
    );
  });

  it('catches special-case residency = "no"', () => {
    const { errors } = validateDefaultResponses({
      citizenshipStatus: "citizen",
      residingInKelowna: "no",
      fullTimeEnrollment: "yes",
      hasOtherPositions: "no",
      positionType: "TA",
      winterTerm: "2025W",
      workload: "50%",
      disciplineRanking: { rank1: "A", rank2: "B", rank3: "C" },
    });
    expect(errors.residingInKelowna).toBe(
      "You are not eligible to work as a TA if you are not residing in Kelowna."
    );
  });

  it("validates otherPositionHours when hasOtherPositions = yes", () => {
    // missing hours
    let result = validateDefaultResponses({
      citizenshipStatus: "citizen",
      residingInKelowna: "yes",
      fullTimeEnrollment: "yes",
      hasOtherPositions: "yes",
      positionType: "TA",
      winterTerm: "2025W",
      workload: "50%",
      disciplineRanking: { rank1: "A", rank2: "B", rank3: "C" },
    });
    expect(result.errors.otherPositionHours).toBe(
      "Please specify hours for other positions."
    );

    // too many hours
    result = validateDefaultResponses({
      citizenshipStatus: "citizen",
      residingInKelowna: "yes",
      fullTimeEnrollment: "yes",
      hasOtherPositions: "yes",
      otherPositionHours: 100,
      positionType: "TA",
      winterTerm: "2025W",
      workload: "50%",
      disciplineRanking: { rank1: "A", rank2: "B", rank3: "C" },
    });
    expect(result.errors.otherPositionHours).toBe(
      "Please enter valid a number of hours between 1 and 60."
    );
  });

  it("rejects duplicate discipline ranks", () => {
    const { errors } = validateDefaultResponses({
      citizenshipStatus: "citizen",
      residingInKelowna: "yes",
      fullTimeEnrollment: "yes",
      hasOtherPositions: "no",
      positionType: "TA",
      winterTerm: "2025W",
      workload: "50%",
      disciplineRanking: { rank1: "A", rank2: "A", rank3: "B" },
    });
    expect(errors.disciplineRanking).toBe(
      "Each rank must be a different discipline."
    );
  });

  it("passes when all defaults are valid", () => {
    const { isValid, errors } = validateDefaultResponses({
      citizenshipStatus: "citizen",
      residingInKelowna: "yes",
      fullTimeEnrollment: "yes",
      hasOtherPositions: "no",
      positionType: "TA",
      winterTerm: "2025W",
      workload: "50%",
      disciplineRanking: { rank1: "A", rank2: "B", rank3: "C" },
    });
    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });
});

describe("validateDynamicResponses()", () => {
  it("returns valid when no sections are provided", () => {
    expect(validateDynamicResponses({}, null)).toEqual({
      isValid: true,
      errors: {},
    });
  });

  it("flags missing required text and checkbox values", () => {
    const sections = [
      {
        questions: [
          {
            field_name: "foo",
            is_required: true,
            question_text: "Foo?",
            question_type: "text",
          },
          {
            field_name: "bar",
            is_required: true,
            question_text: "Bar?",
            question_type: "checkbox",
          },
        ],
      },
    ];
    const { isValid, errors } = validateDynamicResponses(
      { foo: "", bar: [] },
      sections
    );
    expect(isValid).toBe(false);
    expect(errors.foo).toBe('Please provide a response for "Foo?".');
    expect(errors.bar).toBe('Please provide a response for "Bar?".');
  });

  it("accepts valid checkbox and file responses", () => {
    const sections = [
      {
        questions: [
          {
            field_name: "files",
            is_required: true,
            question_text: "Attach file",
            question_type: "file",
          },
        ],
      },
    ];
    const { isValid } = validateDynamicResponses(
      { files: { file: {} } },
      sections
    );
    expect(isValid).toBe(true);
  });
});

describe("validateAllResponses()", () => {
  it("skips default validation when no mapped fields", () => {
    const result = validateAllResponses(
      {}, // default
      { foo: "x" }, // dynamic
      [
        {
          questions: [
            {
              field_name: "foo",
              is_required: true,
              question_text: "Foo?",
              question_type: "text",
            },
          ],
        },
      ],
      { foo: false }
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("merges default and dynamic errors", () => {
    const result = validateAllResponses(
      {}, // default empty
      {}, // dynamic empty
      [
        {
          questions: [
            {
              field_name: "bar",
              is_required: true,
              question_text: "Bar?",
              question_type: "text",
            },
          ],
        },
      ],
      { citizenshipStatus: true }
    );
    // citizenshipStatus missing + bar missing
    expect(result.isValid).toBe(false);
    expect(result.errors.citizenshipStatus).toBe(
      "Please select your citizenship status."
    );
    expect(result.errors.bar).toBe('Please provide a response for "Bar?".');
  });
});

describe("validateDynamicStep()", () => {
  const sections = [
    {
      questions: [
        {
          field_name: "citizenshipStatus",
          is_required: true,
          question_text: "Citizenship?",
          question_type: "text",
        },
        {
          field_name: "customQ",
          is_required: true,
          question_text: "Custom?",
          question_type: "text",
        },
      ],
    },
  ];

  it("validates a default field in the current step", () => {
    const { isValid, errors } = validateDynamicStep(
      1,
      sections,
      { citizenshipStatus: "" }, // defaultResponses
      { customQ: "ok" }, // dynamicResponses
      { citizenshipStatus: true, customQ: false }
    );
    expect(isValid).toBe(false);
    expect(errors.citizenshipStatus).toBe(
      "Please select your citizenship status."
    );
  });

  it("validates a dynamic field in the current step", () => {
    const { isValid, errors } = validateDynamicStep(
      1,
      sections,
      { citizenshipStatus: "citizen" },
      { customQ: "" },
      { citizenshipStatus: true, customQ: false }
    );
    expect(isValid).toBe(false);
    expect(errors.customQ).toBe("Please provide a response.");
  });

  it("passes when step is valid", () => {
    const { isValid, errors } = validateDynamicStep(
      1,
      sections,
      { citizenshipStatus: "citizen" },
      { customQ: "yes" },
      { citizenshipStatus: true, customQ: false }
    );
    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });
});
