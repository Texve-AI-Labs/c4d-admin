export const mapServiceDetails = (serviceType, parcelVehicleType = null) => {
  switch (serviceType) {
    case "ANY":
      return { serviceType: "ANY", bookingType: null, packageType: null };
    case "RENTAL_HOURLY_PACKAGE":
      return { serviceType: "RENTAL", bookingType: null, packageType: "Local" };
    case "RENTAL":
      return { serviceType: "RENTAL", bookingType: "ROUND_TRIP", packageType: "Outstation" };
    case "RENTAL_DROP_TAXI":
      return { serviceType: "RENTAL", bookingType: "DROP_ONLY", packageType: "Outstation" };
    case "RIDES":
      return { serviceType: "RIDES", bookingType: null, packageType: null };
    case "AUTO":
      return { serviceType: "AUTO", bookingType: null, packageType: null };
    case "BIKE":
      return { serviceType: "BIKE", bookingType: null, packageType: null };
    case "PARCEL": 
      return { serviceType: "PARCEL", bookingType: null, packageType: null, parcelVehicleType: parcelVehicleType ? String(parcelVehicleType).toUpperCase() : null };
    default:
      return { serviceType: "RIDES", bookingType: null, packageType: null };
  }
};

export const parseInputValue = (event) => {
  const { value, type, checked } = event.target;
  if (type === "checkbox") return checked;
  if (type === "number") return value === "" ? "" : Number(value);
  return value;
};
