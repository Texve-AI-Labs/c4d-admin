import * as Yup from "yup";

export const SERVICE_TYPE_OPTIONS = [
  // { value: "DRIVER", label: "Driver" },
  { value: "RIDES", label: "Rides" },
  { value: "RENTAL", label: "Rental" },
  { value: "AUTO", label: "Auto" },
  { value: "BIKE", label: "Bike" },
  // { value: "PARCEL", label: "Parcel" },
];

export const BONUS_TYPE_OPTIONS = [
  { value: "FLAT", label: "Flat" },
  { value: "RATE", label: "Rate" },
];

const numberSchema = (message) =>
  Yup.number()
    .transform((value, originalValue) => (originalValue === "" || originalValue === null || originalValue === undefined ? undefined : value))
    .typeError(message);

export const initialValues = {
  id: "",
  zone: "",
  serviceType: "",
  firstSearchRadiusKm: "",
  maxSearchRadiusKm: "",
  radiusIncrementKm: "",
  bonusThresholdKm: "",
  bonusType: "",
  bonusAmount: "",
  bonusRate: "",
  notes: "",
  isActive: true,
};

const toNumberValue = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  return String(value);
};

const toNullableNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const toForm = (item = {}) => ({
  id: item?.id || item?.configId || item?._id || "",
  zone: item?.zone || item?.zoneName || item?.zoneId || "",
  serviceType: item?.serviceType || "",
  firstSearchRadiusKm: toNumberValue(item?.firstSearchRadiusKm),
  maxSearchRadiusKm: toNumberValue(item?.maxSearchRadiusKm),
  radiusIncrementKm: toNumberValue(item?.radiusIncrementKm),
  bonusThresholdKm: toNumberValue(item?.bonusThresholdKm),
  bonusType: String(item?.bonusType || "").toUpperCase(),
  bonusAmount: toNumberValue(item?.bonusAmount),
  bonusRate: toNumberValue(item?.bonusRate),
  notes: item?.metadata?.notes || item?.notes || "",
  isActive: item?.isActive ?? true,
});

export const buildPayload = (form = {}) => ({
  zone: String(form.zone || "").trim(),
  serviceType: String(form.serviceType || "").trim(),
  firstSearchRadiusKm: Number(form.firstSearchRadiusKm),
  maxSearchRadiusKm: Number(form.maxSearchRadiusKm),
  radiusIncrementKm: Number(form.radiusIncrementKm),
  bonusThresholdKm: Number(form.bonusThresholdKm),
  bonusType: String(form.bonusType || "").toUpperCase(),
  bonusAmount: String(form.bonusType || "").toUpperCase() === "FLAT" ? toNullableNumber(form.bonusAmount) : 0,
  bonusRate: String(form.bonusType || "").toUpperCase() === "RATE" ? toNullableNumber(form.bonusRate) : 0,
  metadata: {
    notes: String(form.notes || "").trim(),
  },
  isActive: Boolean(form.isActive),
});

export const validationSchema = Yup.object({
  zone: Yup.string().required("Zone is required"),
  serviceType: Yup.string().required("Service Type is required"),
  firstSearchRadiusKm: numberSchema("First Search Radius must be a number").required("First Search Radius is required"),
  maxSearchRadiusKm: numberSchema("Max Search Radius must be a number").required("Max Search Radius is required"),
  radiusIncrementKm: numberSchema("Radius Increment must be a number").required("Radius Increment is required"),
  bonusThresholdKm: numberSchema("Bonus Threshold must be a number").required("Bonus Threshold is required"),
  bonusType: Yup.string().oneOf(["FLAT", "RATE"]).required("Bonus Type is required"),
  bonusAmount: numberSchema("Bonus Amount must be a number")
    .when("bonusType", {
      is: "FLAT",
      then: (schema) => schema.required("Bonus Amount is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  bonusRate: numberSchema("Bonus Rate must be a number")
    .when("bonusType", {
      is: "RATE",
      then: (schema) => schema.required("Bonus Rate is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  isActive: Yup.boolean().required("Status is required"),
});

export const getBonusDisplay = (row = {}) => row?.bonusType === "FLAT" ? row?.bonusAmount : row?.bonusRate;