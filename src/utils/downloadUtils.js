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
