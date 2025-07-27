// labelMappings.test.js
import { describe, it, expect } from "vitest";
import {
  getDisplayLabel,
  getPositionTypeLabel,
  getWorkloadLabel,
  getCitizenshipLabel,
  getYesNoLabel,
  positionTypeLabels,
  workloadLabels,
  citizenshipLabels,
  yesNoLabels,
} from "@/components/application-form/labelMappings";

describe("getDisplayLabel", () => {
  it("returns the mapped label when found and original value when not found", () => {
    const customMap = { foo: "Foo Label" };
    expect(getDisplayLabel("foo", customMap)).toBe("Foo Label");
    expect(getDisplayLabel("bar", customMap)).toBe("bar");
  });
});

describe("getPositionTypeLabel", () => {
  it("returns the correct label for known position types and fallback for unknown", () => {
    expect(getPositionTypeLabel("UTA")).toBe(positionTypeLabels.UTA);
    expect(getPositionTypeLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});

describe("getWorkloadLabel", () => {
  it("returns the correct label for known workloads and fallback for unknown", () => {
    expect(getWorkloadLabel("6")).toBe(workloadLabels[6]);
    expect(getWorkloadLabel("999")).toBe("999");
  });
});

describe("getCitizenshipLabel", () => {
  it("returns the correct label for known citizenship statuses and fallback for unknown", () => {
    expect(getCitizenshipLabel("pr")).toBe(citizenshipLabels.pr);
    expect(getCitizenshipLabel("alien")).toBe("alien");
  });
});

describe("getYesNoLabel", () => {
  it("returns the correct label for yes/no values and fallback for unknown", () => {
    expect(getYesNoLabel("yes")).toBe(yesNoLabels.yes);
    expect(getYesNoLabel("maybe")).toBe("maybe");
  });
});
