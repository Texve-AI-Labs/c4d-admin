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

export const normalizeVehicleImages = (images = []) =>
  (Array.isArray(images) ? images : []).filter((item) => item?.position || item?.url);

export const expandVehicleImages = (images = []) =>
  normalizeVehicleImages(images).flatMap((item) => {
    if (item.position !== "ALL") return [item];

    return ["REAR", "LEFT", "RIGHT"].map((position) => ({
      position,
      url: item.url,
    }));
  });

export const normalizePlanBenefits = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.benefits)) return value.benefits;
  return [];
};