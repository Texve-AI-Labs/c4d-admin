const pickComponent = (addressComponents = [], typeList = []) => {
  if (!Array.isArray(addressComponents)) return "";
  const match = addressComponents.find((component) =>
    Array.isArray(component?.types) && typeList.some((type) => component.types.includes(type))
  );
  return (match?.long_name || "").trim();
};

const clean = (value = "") => String(value).replace(/\s+/g, " ").trim();

const fallbackFromAddressText = (addressText = "") => {
  const parts = String(addressText)
    .split(",")
    .map((part) => clean(part))
    .filter(Boolean);

  const country = parts[parts.length - 1] || "";
  const state = parts[parts.length - 2] || "";
  const district = parts[parts.length - 3] || "";
  const taluk = parts[parts.length - 4] || "";
  const street = parts.slice(0, Math.max(parts.length - 4, 0)).join(", ");
  const pincode = (String(addressText).match(/\b\d{6}\b/) || [])[0] || "";

  return { street, taluk, district, state, country, pincode };
};

export const parseAddressParts = ({ addressText = "", addressComponents = [] } = {}) => {
  const fallback = fallbackFromAddressText(addressText);

  const streetNumber = pickComponent(addressComponents, ["street_number"]);
  const route = pickComponent(addressComponents, ["route"]);
  const premise = pickComponent(addressComponents, ["premise", "subpremise"]);
  const sublocality = pickComponent(addressComponents, [
    "sublocality_level_1",
    "sublocality",
    "sublocality_level_2",
  ]);
  const locality = pickComponent(addressComponents, ["locality", "administrative_area_level_3"]);
  const district = pickComponent(addressComponents, ["administrative_area_level_2"]);
  const state = pickComponent(addressComponents, ["administrative_area_level_1"]);
  const country = pickComponent(addressComponents, ["country"]);
  const pincode = pickComponent(addressComponents, ["postal_code"]);

  const street = clean([streetNumber, route, premise].filter(Boolean).join(" ")) || fallback.street;

  return {
    street,
    taluk: sublocality || locality || fallback.taluk,
    district: district || locality || fallback.district,
    state: state || fallback.state,
    country: country || fallback.country,
    pincode: pincode || fallback.pincode,
  };
};
