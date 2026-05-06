export const normalizeOnboardingRows = (response) => {
  const rawList =
    (Array.isArray(response?.data) && response.data) ||
    (Array.isArray(response?.data?.data) && response.data.data) ||
    (Array.isArray(response?.data?.rows) && response.data.rows) ||
    (Array.isArray(response?.rows) && response.rows) ||
    [];

  return rawList.map((item) => {
    const accountDoc = item?.accountDocumentStatus || {};
    const vehicleDoc = item?.vehicleDocumentStatus || {};
    const pendingTypes = Array.isArray(accountDoc?.pendingTypes)
      ? accountDoc.pendingTypes
      : [];

    return {
      id: item?.id,
      name: item?.name || item?.companyName || "-",
      phoneNumber: item?.phoneNumber || item?.mobile || "-",
      email: item?.email || "-",
      createdAt: item?.created_at || item?.createdAt || null,
      stage: item?.stage || "ACCOUNT",
      accountDocStatus: accountDoc?.status || "PENDING",
      accountPendingTypes: pendingTypes,
      vehicleDocStatus: vehicleDoc?.status || "PENDING",
      raw: item,
    };
  });
};

export const canCreateVehicle = (row) => row?.accountDocStatus === "VERIFIED";
