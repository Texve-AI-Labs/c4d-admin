import * as Yup from "yup";

export const SERVICE_TYPES = ["ALL", "DRIVER", "RENTAL", "RIDES", "AUTO", "PARCEL"];
export const RATE_TYPES = ["PER_KM", "FLAT_TRIP"];
export const PRIORITY_OPTIONS = [
  { label: "High", value: 30 },
  { label: "Medium", value: 60 },
  { label: "Low", value: 90 },
];

const getRuleId = (item = {}) => item?.ruleId || item?.id || item?._id;

export const getRateType = (item = {}) => {
  const explicit = String(item?.rateType || "").trim().toUpperCase();
  if (RATE_TYPES.includes(explicit)) return explicit;
  if (item?.amount !== undefined && item?.amount !== null && item?.amount !== "") return "FLAT_TRIP";
  return "PER_KM";
};

export const resolvePriorityValue = (priority) => {
  const value = Number(priority);
  if (PRIORITY_OPTIONS.some((item) => item.value === value)) return String(value);
  return "60";
};

export const toForm = (item = {}) => ({
  ruleId: getRuleId(item),
  serviceType: item?.serviceType || "ALL",
  zone: item?.zone || "",
  startDate: item?.startDate ? String(item.startDate).slice(0, 10) : "",
  endDate: item?.endDate ? String(item.endDate).slice(0, 10) : "",
  rateType: getRateType(item),
  perKmRate: item?.perKmRate ?? "",
  amount: item?.amount ?? "",
  minKm: item?.minKm ?? "",
  maxKm: item?.maxKm ?? "",
  priority: resolvePriorityValue(item?.priority),
  isActive: item?.isActive === undefined ? true : Boolean(item?.isActive),
});

export const buildPayload = (form) => {
  const rateType = String(form.rateType || "").toUpperCase() || (form.amount !== "" && form.amount !== null && form.amount !== undefined ? "FLAT_TRIP" : "PER_KM");
  const payload = {
    serviceType: String(form.serviceType || "").toUpperCase(),
    zone: String(form.zone || "").trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    rateType,
    priority: form.priority === "" || form.priority === null || form.priority === undefined ? undefined : Number(form.priority),
    isActive: Boolean(form.isActive),
  };

  if (rateType === "FLAT_TRIP") {
    // payload.perKmRate = form.perKmRate === "" || form.perKmRate === null || form.perKmRate === undefined ? 0 : Number(form.perKmRate);
    payload.amount = form.amount === "" || form.amount === null || form.amount === undefined ? undefined : Number(form.amount);
  } else {
    payload.perKmRate = form.perKmRate === "" || form.perKmRate === null || form.perKmRate === undefined ? undefined : Number(form.perKmRate);
    payload.minKm = form.minKm === "" || form.minKm === null || form.minKm === undefined ? undefined : Number(form.minKm);
    payload.maxKm = form.maxKm === "" || form.maxKm === null || form.maxKm === undefined ? undefined : Number(form.maxKm);
  }

  if (form.ruleId !== undefined && form.ruleId !== null && form.ruleId !== "") {
    payload.ruleId = Number(form.ruleId);
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
      delete payload[key];
    }
  });

  return payload;
};

export const validationSchema = Yup.object({
  serviceType: Yup.string().oneOf(SERVICE_TYPES).required("Service Type is required"),
  zone: Yup.string().trim().required("Zone is required"),
  startDate: Yup.string().required("Start Date is required"),
  endDate: Yup.string()
    .required("End Date is required")
    .test("end-after-start", "End Date must be on or after Start Date", function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return true;
      return new Date(value) >= new Date(startDate);
    }),
  rateType: Yup.string().oneOf(RATE_TYPES).required("Rate Type is required"),
  perKmRate: Yup.number()
    .transform((value, originalValue) => (originalValue === "" ? undefined : value))
    .typeError("Per KM Rate must be a number")
    .min(0, "Per KM Rate must be >= 0")
    .when("rateType", {
      is: "PER_KM",
      then: (schema) => schema.required("Per KM Rate is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  amount: Yup.number()
    .transform((value, originalValue) => (originalValue === "" ? undefined : value))
    .typeError("Amount must be a number")
    .min(0, "Amount must be >= 0")
    .when("rateType", {
      is: "FLAT_TRIP",
      then: (schema) => schema.required("Amount is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  minKm: Yup.number()
    .transform((value, originalValue) => (originalValue === "" ? undefined : value))
    .typeError("Min KM must be a number")
    .min(0, "Min KM must be >= 0")
    .when("rateType", {
      is: "PER_KM",
      then: (schema) => schema.notRequired(),
      otherwise: (schema) => schema.notRequired(),
    }),
  maxKm: Yup.number()
    .transform((value, originalValue) => (originalValue === "" ? undefined : value))
    .typeError("Max KM must be a number")
    .min(0, "Max KM must be >= 0")
    .test("max-gte-min", "Max KM must be greater than or equal to Min KM", function (value) {
      const { minKm } = this.parent;
      if (value === "" || value === null || value === undefined) return true;
      if (minKm === "" || minKm === null || minKm === undefined) return true;
      return Number(value) >= Number(minKm);
    })
    .when("rateType", {
      is: "PER_KM",
      then: (schema) => schema.notRequired(),
      otherwise: (schema) => schema.notRequired(),
    }),
  priority: Yup.number()
    .transform((value, originalValue) => (originalValue === "" ? undefined : value))
    .oneOf(PRIORITY_OPTIONS.map((item) => item.value), "Invalid priority")
    .notRequired(),
  isActive: Yup.boolean().notRequired(),
});

export const getPriorityLabel = (priority) =>
  PRIORITY_OPTIONS.find((item) => item.value === Number(priority))?.label || "Custom";
