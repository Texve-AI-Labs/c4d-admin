export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const DEFAULT_REQUIREMENTS = {
  PHOTO: 1,
  VEHICLE_PHOTO: 1,
  INSURANCE: 1,
  PERMIT: 1,
  AADHAAR: 2,
  LICENSE: 2,
  RC_COPY: 2,
};

export const getDocumentRequirement = (documentType, serviceType) => {
  const normalizedType = String(documentType || "").toUpperCase();
  const normalizedService = String(serviceType || "").toUpperCase();
  const serviceRequirements = {
    PARCEL: DEFAULT_REQUIREMENTS,
  };
  return serviceRequirements[normalizedService]?.[normalizedType]
    || DEFAULT_REQUIREMENTS[normalizedType]
    || 1;
};

export const isSingleFileDocument = (documentType, serviceType) =>
  getDocumentRequirement(documentType, serviceType) === 1;
