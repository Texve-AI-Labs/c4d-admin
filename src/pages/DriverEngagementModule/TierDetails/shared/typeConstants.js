export const TIER_KEYS = [
    {label: 'Silver' ,value : "SILVER"}, 
    {label: 'Gold' ,value : "GOLD"}, 
    {label: 'Elite' ,value : "ELITE"}
];
export const METRIC_OPTIONS = [
  {label: "Online Hours", value: "onlineHours" },
  {label: "Acceptance Pct", value: "acceptancePct" },
  {label: "Trip Count", value: "tripCount" },
  {label: "Rating", value: "rating" },
];

export const PERIOD_OPTIONS = [
    {label: "Daily", value: "DAILY"}, 
    {label: "Weekly" , value: "WEEKLY"},
];
export const SERVICE_TYPE_OPTIONS = [
    {label: 'All', value:"ANY"},
    {label: 'Hourly Package' , value: "RENTAL_HOURLY_PACKAGE"}, 
    {label: 'Round Trip' , value: "RENTAL"}, 
    {label: 'Drop Taxi' , value: "RENTAL_DROP_TAXI"}, 
    {label: 'Local' , value: "RIDES"}, 
    {label: 'Auto' , value: "AUTO"},
    {label: 'Parcel' , value: "PARCEL"}
];
export const OP_OPTIONS = [
    {label: '>' , value: ">"}, 
    {label: '<' , value: "<"}, 
    {label: '>=' , value: ">="}, 
    {label: '<=' , value: "<="}, 
    {label: '=' , value: "="}
];

export const INCENTIVE_PAYOUT_MODES = [
    {label: 'G-Pay' , value: "GPAY"}, 
    {label: 'Bank Transfer' , value: "BANK_TRANSFER"}, 
    {label: 'Wallet' , value: "WALLET"}
];
export const INCENTIVE_APPLY_MODES = [
    {label: 'High Match Only' , value: "HIGHEST_MATCH_ONLY"}, 
    {label: 'Sum All Matches' , value: "SUM_ALL_MATCHES" }
];

export const DISPATCH_SERVICE_KEYS = [
    {label: 'Local' , value: "RIDES"}, 
    {label: 'Hourly Package' , value: "RENTAL_HOURLY_PACKAGE"}, 
    {label: 'Drop Taxi' , value: "RENTAL_DROP_ONLY"}, 
    {label: 'Round Trip' , value: "RENTAL_OUTSTATION"}
];

export const PARTNER_TYPE_OPTIONS = [
    { label: "Cab", value: "CAB" },
    { label: "Auto", value: "AUTO" },
    { label: "Bike", value: "BIKE" },
    { label: "Parcel", value: "PARCEL" },
];

export const PARCEL_VEHICLE_TYPE_OPTIONS = [
    { label: "Bike", value: "BIKE" },
    { label: "Auto", value: "AUTO" },
];
