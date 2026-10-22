export const getMasterPriceErrorMessage = (errorOrResponse) => {
  const value = errorOrResponse?.response?.data || errorOrResponse;
  const errors = value?.errors;

  if (Array.isArray(errors)) {
    return errors.map((error) => error?.message || error).join('\n');
  }

  if (errors && typeof errors === 'object') {
    return Object.entries(errors)
      .map(([field, message]) => `${field}: ${Array.isArray(message) ? message.join(', ') : message}`)
      .join('\n');
  }

  return value?.message
    || value?.error
    || (typeof value?.data === 'string' ? value.data : '')
    || errorOrResponse?.message
    || 'Unable to save master price.';
};
