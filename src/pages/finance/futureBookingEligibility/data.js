export const getEligibilityRecords = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(response?.result)) return response.result;
  return [];
};

export const findEligibilityById = (records, id) =>
  records.find((item) => String(item?.id ?? item?._id) === String(id));