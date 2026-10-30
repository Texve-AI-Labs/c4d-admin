export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const SINGLE_DOCUMENT_TYPES = new Set(["PHOTO", "INSURANCE", "PERMIT", "VEHICLE_PHOTO"]);

export const getDocumentRequirement = (documentType) =>
  SINGLE_DOCUMENT_TYPES.has(String(documentType || "").toUpperCase()) ? 1 : 2;

export const isSingleFileDocument = (documentType) =>
  getDocumentRequirement(documentType) === 1;
