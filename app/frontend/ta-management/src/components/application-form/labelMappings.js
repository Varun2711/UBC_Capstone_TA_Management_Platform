// Using these Helper functions to map keys back to display labels in the Review Section

export const positionTypeLabels = {
  UTA: "Undergraduate Teaching Assistant",
  GTA2: "Graduate Teaching Assistant 2 (Master's Student)",
  GTA1: "Graduate Teaching Assistant 1 (Ph.D student)",
};

export const workloadLabels = {
  6: "6 hours",
  12: "12 hours",
};

export const citizenshipLabels = {
  citizen: "Yes - Canadian Citizen",
  pr: "Yes - Permanent Resident",
  international: "No - International Student",
};

export const yesNoLabels = {
  yes: "Yes",
  no: "No",
};

// Helper function to get display label or return the original value if not found
export const getDisplayLabel = (value, labelMap) => {
  return labelMap[value] || value;
};

// Specific helper functions for each field type
export const getPositionTypeLabel = (value) =>
  getDisplayLabel(value, positionTypeLabels);
export const getWorkloadLabel = (value) =>
  getDisplayLabel(value, workloadLabels);
export const getCitizenshipLabel = (value) =>
  getDisplayLabel(value, citizenshipLabels);
export const getYesNoLabel = (value) => getDisplayLabel(value, yesNoLabels);
