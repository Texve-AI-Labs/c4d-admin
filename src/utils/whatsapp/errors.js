const extractRawMessage = (error) =>
  String(
    error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.data?.message ||
      error?.response?.data?.errors?.[0]?.message ||
      error?.message ||
      error ||
      ""
  );

export const isWhatsAppMediaTypeError = (error) => {
  const normalized = extractRawMessage(error).toLowerCase();
  return normalized.includes("param file must be a file") || normalized.includes("application/octet-stream");
};

export const friendlyWhatsAppError = (error) => {
  const rawMessage = extractRawMessage(error);
  const normalized = rawMessage.toLowerCase();

  if (isWhatsAppMediaTypeError(rawMessage)) {
    return "Unsupported file format. Please upload a valid WhatsApp file: JPG, PNG, WEBP, PDF, Word, Excel, PowerPoint, TXT, MP4, 3GP, AAC, MP3, AMR, OGG, or OPUS.";
  }

  if (normalized.includes("24") || normalized.includes("session")) {
    return "Session expired. Please send a template message.";
  }

  if (normalized.includes("unauthorized") || normalized.includes("token")) {
    return "Please login again.";
  }

  if (rawMessage.trim()) return rawMessage;
  return "Unable to complete the action. Please try again.";
};

export const unsupportedWhatsAppMediaMessage =
  "This file type cannot be sent on WhatsApp. Please choose JPG, PNG, WEBP, PDF, Word, Excel, PowerPoint, TXT, MP4, 3GP, AAC, MP3, AMR, OGG, or OPUS.";
