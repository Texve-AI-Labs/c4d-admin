import * as Yup from "yup";

export const POLICY_CATEGORIES = [
  { category: "ECONOMY_GO", carType: "MINI", seats: 4, luggage: 1 },
  { category: "COMFORT", carType: "SEDAN", seats: 4, luggage: 2 },
  { category: "PREMIUM", carType: "SUV", seats: 5, luggage: 3 },
  { category: "PREMIUM_XL", carType: "MUV", seats: 6, luggage: 4 },
];

const defaultConfig = {
  seaterCapacity: {
    carTypes: { MUV: 6, SUV: 5, MINI: 4, SEDAN: 4 },
    categories: Object.fromEntries(POLICY_CATEGORIES.map(({ category, seats }) => [category, seats])),
  },
  luggageCapacity: {
    carTypes: { MUV: 2, SUV: 2, MINI: 1, SEDAN: 1 },
    categories: Object.fromEntries(POLICY_CATEGORIES.map(({ category, luggage }) => [category, luggage])),
  },
};

export const createPolicyValues = (raw = {}) => ({
  serviceType: raw.serviceType || "ALL",
  name: "LUGGAGE_POLICY",
  description: raw.description || "",
  isActive: raw.isActive ?? true,
  config: Object.fromEntries([
    ...Object.entries(raw.config || {}).filter(([key]) => !["seaterCapacity", "luggageCapacity"].includes(key)),
    ...["seaterCapacity", "luggageCapacity"].map((key) => {
      const capacity = raw.config?.[key];
      return [key, {
        carTypes: { ...(capacity?.carTypes ?? defaultConfig[key].carTypes) },
        categories: raw.config
          ? Object.fromEntries([
              ...Object.entries(capacity?.categories || {}),
              ...POLICY_CATEGORIES.map(({ category }) => [category, capacity?.categories?.[category] ?? ""]),
            ])
          : { ...defaultConfig[key].categories },
      }];
    }),
  ]),
});

// Only category inputs are editable; preserve carTypes and unrelated config fields.
export const buildPolicyConfig = (config) => ({
  ...config,
  ...Object.fromEntries(["seaterCapacity", "luggageCapacity"].map((key) => [key, {
    carTypes: { ...config[key].carTypes },
    categories: {
      ...config[key].categories,
      ...Object.fromEntries(POLICY_CATEGORIES.map(({ category }) => [category, Number(config[key].categories[category])])),
    },
  }])),
});

const capacitySchema = (minimum) => Yup.object({
  categories: Yup.object(Object.fromEntries(POLICY_CATEGORIES.map(({ category }) => [category,
    Yup.number().typeError("Enter a number").integer("Enter a whole number")
      .min(minimum, `Must be at least ${minimum}`).required("Capacity is required"),
  ]))),
});

export const LUGGAGE_POLICY_SCHEMA = Yup.object({
  description: Yup.string().required("Description is required"),
  isActive: Yup.mixed().oneOf([true, false, "true", "false"]).required("Status is required"),
  config: Yup.object({
    seaterCapacity: capacitySchema(1),
    luggageCapacity: capacitySchema(0),
  }),
});
