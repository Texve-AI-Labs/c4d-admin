export const normalizeQuoteRef = (value) => {
  const parsed = String(value ?? '').trim();
  if (!parsed) return '';
  const lowered = parsed.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined') return '';
  return parsed;
};
