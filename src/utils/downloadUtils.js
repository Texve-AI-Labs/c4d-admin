import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';

export const triggerDownload = (url, filename) => {
  if (!url) {
    throw new Error('Missing download URL');
  }

  const link = document.createElement('a');
  try {
    link.href = url;
    if (filename) {
      link.download = filename;
    }
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
  }
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  try {
    triggerDownload(url, filename);
  } finally {
    window.URL.revokeObjectURL(url);
  }
};

export const formatDocumentName = (documentType = 'Document') =>
  String(documentType || 'Document')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const buildDocumentFilename = ({ documentType, imageIndex }) => {
  const name = formatDocumentName(documentType);
  const suffix = imageIndex ? ` Image ${imageIndex}` : '';
  return `${name}${suffix}`;
};

const getFilenameFromDisposition = (contentDisposition = '') => {
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].replace(/["']/g, ''));

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] || '';
};

export const saveDocumentFile = async ({ documentId, documentType, imageIndex }) => {
  if (!documentId) {
    throw new Error('Missing document ID');
  }

  const filename = buildDocumentFilename({ documentType, imageIndex });
  const response = await ApiRequestUtils.fetchDocumentDownload(`${API_ROUTES.DOCUMENT_DOWNLOAD}/${documentId}/download`, {
    image: imageIndex,
  });
  const responseFilename = getFilenameFromDisposition(response.headers?.['content-disposition'] || '');
  downloadBlob(response.data, responseFilename || filename);
};
