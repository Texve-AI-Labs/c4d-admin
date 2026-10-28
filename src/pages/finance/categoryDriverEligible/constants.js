export const CATALOG_SERVICE_TYPE_OPTIONS = [
  { value: "RIDES", label: "Rides" },
  { value: "RENTAL", label: "Rental" },
  { value: "AUTO", label: "Auto" },
  { value: "BIKE", label: "Bike" },
];

export const TARGET_SERVICE_TYPE_OPTIONS = [
  { value: "AUTO", label: "Auto" },
  { value: "RIDES", label: "Rides" },
  { value: "RENTAL", label: "Rental" },
  { value: "BIKE", label: "Bike" },
];

export const TARGET_SERVICE_TYPE_OPTIONS_BY_CATALOG_SERVICE_TYPE = {
  RIDES: [
    { value: "RIDES", label: "Rides" },
    { value: "AUTO", label: "Auto" },
    { value: "BIKE", label: "Bike" },
  ],
  RENTAL: [
    { value: "RENTAL", label: "Rental" },
  ],
  AUTO: [
    { value: "AUTO", label: "Auto" },
    { value: "RIDES", label: "Rides" },
    { value: "BIKE", label: "Bike" },
  ],
  BIKE: [
    { value: "BIKE", label: "Bike" },
    { value: "RIDES", label: "Rides" },
    { value: "AUTO", label: "Auto" },
  ],
};

export const CATEGORY_OPTIONS = [
  { value: "ECONOMY_GO", label: "Economy Go" },
  { value: "COMFORT", label: "Comfort" },
  { value: "PREMIUM", label: "Premium" },
  { value: "PREMIUM_XL", label: "Premium XL" },
  { value: "AUTO_SAVER", label: "Auto Saver" },
  { value: "AUTO_PLUS", label: "Auto Plus" },
  { value: "BIKE", label: "Bike" },
];

export const CATEGORY_OPTIONS_BY_SERVICE_TYPE = {
  RIDES: [
    { value: "ECONOMY_GO", label: "Economy Go" },
    { value: "COMFORT", label: "Comfort" },
    { value: "PREMIUM", label: "Premium" },
    { value: "PREMIUM_XL", label: "Premium XL" },
  ],
  RENTAL: [
    { value: "ECONOMY_GO", label: "Economy Go" },
    { value: "COMFORT", label: "Comfort" },
    { value: "PREMIUM", label: "Premium" },
    { value: "PREMIUM_XL", label: "Premium XL" },
  ],
  AUTO: [
    { value: "AUTO_SAVER", label: "Auto Saver" },
    { value: "AUTO_PLUS", label: "Auto Plus" },
  ],
  BIKE: [
    { value: "BIKE", label: "Bike" },
    { value: "SCOOTY", label: "Scooty" },
  ],
};

export const DRIVER_RULE_CAR_TYPE_OPTIONS = [
  { value: "MINI", label: "Mini" },
  { value: "SEDAN", label: "Sedan" },
  { value: "SUV", label: "Suv" },
  { value: "MUV", label: "Muv" },
  { value: "AUTO", label: "Auto" },
  { value: "BIKE", label: "Bike" },
  { value: "SCOOTY", label: "Scooty" },
];

export const DRIVER_RULE_CAR_TYPE_OPTIONS_BY_SERVICE_TYPE = {
  RIDES: [
    { value: "MINI", label: "Mini" },
    { value: "SEDAN", label: "Sedan" },
    { value: "SUV", label: "SUV" },
    { value: "MUV", label: "MUV" },
  ],
  RENTAL: [
    { value: "MINI", label: "Mini" },
    { value: "SEDAN", label: "Sedan" },
    { value: "SUV", label: "SUV" },
    { value: "MUV", label: "MUV" },
  ],
  AUTO: [
    { value: "AUTO", label: "Auto" },
  ],
  BIKE: [
    { value: "BIKE", label: "Bike" },
  ],
  SCOOTY: [
    { value: "SCOOTY", label: "Scooty" },
  ]
};

export const DRIVER_RULE_PLAN_OPTIONS = [
  { value: "REGULAR", label: "Regular" },
  { value: "STANDARD", label: "Standard" },
  { value: "PREMIUM", label: "Premium" },
  { value: "FREE PLAN", label: "Free" },
];

export const PACKAGE_TYPE_OPTIONS = [
  { value: "LOCAL", label: "Local" },
  { value: "OUTSTATION", label: "Outstation" },
];

export const BOOKING_TYPE_OPTIONS = [
  { value: "DROP ONLY", label: "Drop Only" },
  { value: "ROUND TRIP", label: "Round Trip" },
];

export const RENTAL_LOCAL_CATEGORY_METADATA = {
  ECONOMY_GO: {
    ac: true,
    bags: 1,
    seats: 4,
    models: ["Alto", "WagonR", "Celerio"],
    bestFor: "Budget friendly rides",
    comfort: "Comfortable",
  },
  COMFORT: {
    ac: true,
    bags: 2,
    seats: 4,
    models: ["Dzire", "Etios", "Aura", "Xcent"],
    bestFor: "Small families and office travel",
    comfort: "Comfortable",
  },
  PREMIUM: {
    ac: true,
    bags: 3,
    seats: 5,
    models: ["Brezza", "Creta", "Venue", "Seltos"],
    bestFor: "Families and long-distance travel",
    comfort: "Premium Comfort",
  },
  PREMIUM_XL: {
    ac: true,
    bags: 4,
    seats: 6,
    models: ["Ertiga", "Innova", "Innova Crysta"],
    bestFor: "Large families and group travel",
    comfort: "Spacious",
  },
};

export const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export const emptyDriverRule = () => ({
  carTypes: [],
  planNames: [],
});

export const emptyCategoryDriverEligible = {
  zone: "",
  catalogServiceType: "",
  targetServiceType: "",
  category: "",
  label:"",
  packageType: "",
  bookingType: "",
  metadata: {},
  displayOrder: "",
  isVisible: true,
  status: "ACTIVE",
  driverRules: [emptyDriverRule()],
};
