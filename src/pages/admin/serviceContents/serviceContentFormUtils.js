const SERVICE_TYPES = ["DRIVER", "Individual", "AUTO", "BIKE", "Parcel"];
const USAGE_TYPE = "ONBOARDING";
const CONTENT_MODE = "CURRENT";

const formatLabel = (value) => {
  const str = String(value || "").trim();
  if (!str) return "-";
  if (str.toUpperCase() === "DRIVER") return "Driver";
  if (str.toUpperCase() === "AUTO") return "Auto";
  if (str.toUpperCase() === "BIKE") return "Bike";
  if (str.toUpperCase() === "PARCEL") return "Parcel";
  if (str.toUpperCase() === "INDIVIDUAL") return "Individual";
  if (str.toUpperCase() === "ONBOARDING") return "Onboarding";
  if (str.toUpperCase() === "CURRENT") return "Current";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const defaultContent = { title: "", clariText: "", terms: [""] };
const defaultImages = [{ url: "", alt: "", title: "", sortOrder: 0 }];
const defaultMetadataText = "{}";

const defaultInitialValues = {
  serviceType: "",
  usageType: USAGE_TYPE,
  contentMode: CONTENT_MODE,
  content: defaultContent,
  images: defaultImages,
  metadataText: defaultMetadataText,
  isActive: true,
  sortOrder: 0,
};

const normalizeStringList = (value) =>
  Array.isArray(value) && value.length > 0 ? value : [""];

const normalizeImages = (value) =>
  Array.isArray(value) && value.length > 0
    ? value.map((item) => ({
        url: item?.url || "",
        alt: item?.alt || "",
        title: item?.title || "",
        sortOrder: Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : 0,
      }))
    : defaultImages;

const normalizeMetadataText = (value) => {
  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return defaultMetadataText;
};

const buildInitialValues = (record) => {
  if (!record) return defaultInitialValues;
  return {
    serviceType: record.serviceType || "",
    usageType: record.usageType || USAGE_TYPE,
    contentMode: record.contentMode || CONTENT_MODE,
    content: {
      title: record?.content?.title || "",
      clariText: record?.content?.clariText || "",
      terms: normalizeStringList(record?.content?.terms),
    },
    images: normalizeImages(record?.images),
    metadataText: normalizeMetadataText(record?.metadata),
    isActive: Boolean(record.isActive),
    sortOrder: Number.isFinite(Number(record.sortOrder)) ? Number(record.sortOrder) : 0,
  };
};

const validateMetadataText = (value) => {
  if (value === "" || value === null || value === undefined) return { ok: true, parsed: {} };
  try {
    return { ok: true, parsed: JSON.parse(value) };
  } catch {
    return { ok: false, parsed: null };
  }
};

const isNonEmpty = (value) => String(value || "").trim().length > 0;

export {
  SERVICE_TYPES,
  USAGE_TYPE,
  CONTENT_MODE,
  formatLabel,
  defaultContent,
  defaultImages,
  defaultMetadataText,
  defaultInitialValues,
  buildInitialValues,
  validateMetadataText,
  isNonEmpty,
};