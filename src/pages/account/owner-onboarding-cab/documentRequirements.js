export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

export const DOCUMENT_REQUIREMENTS = {
  PHOTO: 1,
  VEHICLE_PHOTO: 1,
  INSURANCE: 1,
  PERMIT: 1,
  AADHAAR: 2,
  LICENSE: 2,
  RC_COPY: 2,
};

export const getDocumentRequirement = (documentType) =>
  DOCUMENT_REQUIREMENTS[String(documentType || "").toUpperCase()] || 1;

export const isSingleFileDocument = (documentType) =>
  getDocumentRequirement(documentType) === 1;
