import React from 'react';
import { triggerDownload } from '@/utils/downloadUtils';

const DownloadLinkButton = ({
  href,
  filename,
  className = '',
  children,
  onMissingHref,
}) => {
  const handleClick = (event) => {
    event.preventDefault();
    if (!href) {
      if (typeof onMissingHref === 'function') {
        onMissingHref();
      }
      return;
    }
    triggerDownload(href, filename);
  };

  return (
    <a
      href={href || '#'}
      download={filename}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
};

export default DownloadLinkButton;
