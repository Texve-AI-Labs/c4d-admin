export const PERIOD_OPTIONS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
];

export const PAYOUT_FREQUENCY_OPTIONS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
];

export const SERVICE_TYPE_OPTIONS_BY_CODE = {
  ONLINE_HOURS_BONUS: [{ value: "ANY", label: "All" }],
  ONLINE_HOURS_RULES: [{ value: "ANY", label: "All" }],
  SERVICE_TRIP_BONUS: [
    { value: "RIDES", label: "Rides" },
    { value: "AUTO", label: "Auto" },
    { value: "BIKE", label: "Bike" },
    { value: "RENTAL_OUTSTATION", label: "Round Trip" },
    { value: "RENTAL_HOURLY_PACKAGE", label: "Hourly Package" },
    { value: "RENTAL_DROP_TAXI", label: "Drop Taxi" },
  ],
  SERVICE_TRIP_RULES: [
    { value: "RIDES", label: "Rides" },
    { value: "AUTO", label: "Auto" },
    { value: "BIKE", label: "Bike" },
    { value: "RENTAL_OUTSTATION", label: "Round Trip" },
    { value: "RENTAL_HOURLY_PACKAGE", label: "Hourly Package" },
    { value: "RENTAL_DROP_TAXI", label: "Drop Taxi" },
  ],
};

export const PARTNER_TYPE_OPTIONS = [
  { value: "CAB", label: "Cab" },
  { value: "AUTO", label: "Auto" },
  { value: "BIKE", label: "Bike" },
  { value: "PARCEL", label: "Parcel" },
];

export const PARCEL_VEHICLE_TYPE_OPTIONS = [
  { value: "BIKE", label: "Bike" },
  { value: "AUTO", label: "Auto" },
];
