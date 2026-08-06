export const mapPlacementsToConfig = (placements = []) => ({
  placements: placements.map((placement) => ({
    place: placement.place,
    slot: {
      from: placement.from,
      to: placement.to,
    },
  })),
});

export const appendFormFields = (formData, fields = {}) => {
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  });
};

export const normalizeSubZoneId = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};