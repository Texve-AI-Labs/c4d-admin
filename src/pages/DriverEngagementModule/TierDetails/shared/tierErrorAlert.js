import Swal from "sweetalert2";

const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";
const TOKEN_REPLACEMENTS = {
  TIER_RULES: "Tier Rules",
  ONLINE_HOURS_RULES: "Online Hours Rules",
  SERVICE_TRIP_RULES: "Service Trip Rules",
  SILVER: "Silver",
  GOLD: "Gold",
  ELITE: "Elite",
  acceptancePct: "Acceptance pct",
  RENTAL_DROP_ONLY: "Drop Taxi",
  RENTAL_DROP_TAXI: "Drop Taxi",
  RENTAL_OUTSTATION: "Round Trip",
  RENTAL_HOURLY_PACKAGE: "Hourly Package",
  RIDES: "Local",
  AUTO: "Auto",
  tripCount:"Trip Count",
  rating:"Rating"
};

const toReadableTierError = (rawMessage = "") => {
  let message = String(rawMessage || "").trim();
  if (!message) return FALLBACK_ERROR_MESSAGE;

  Object.entries(TOKEN_REPLACEMENTS).forEach(([token, replacement]) => {
    message = message.replace(new RegExp(token, "g"), replacement);
  });

  return message.charAt(0).toUpperCase() + message.slice(1);
};

export const extractApiErrorMessage = (error, fallbackMessage = FALLBACK_ERROR_MESSAGE) => {
  const message =
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    fallbackMessage;

  return toReadableTierError(message || fallbackMessage);
};

export const showTierErrorAlert = (message) =>
  Swal.fire({
    icon: "error",
    title: "Error",
    text: toReadableTierError(message || FALLBACK_ERROR_MESSAGE),
    confirmButtonText: "Back",
    confirmButtonColor: "#2563eb",
    didOpen: () => {
      const confirmButton = Swal.getConfirmButton();
      if (confirmButton) {
        confirmButton.style.color = "#ffffff";
      }
    },
  });
