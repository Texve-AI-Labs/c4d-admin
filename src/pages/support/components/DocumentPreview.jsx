import React from "react";
import { isPdfFile } from "../supportTicketReviewUtils";

function DocumentPreview({ src }) {
  if (!src) return null;
  const previewClassName = isPdfFile(src)
    ? "w-full h-[65vh] border border-gray-200 bg-white overflow-hidden"
    : "w-full h-[65vh] border border-gray-200 bg-white p-2 overflow-hidden";

  return (
    <div className="w-full">
      <div className={previewClassName}>
        {isPdfFile(src) ? (
          <iframe src={src} className="h-full w-full" title="Proof preview" />
        ) : (
          <img
            src={src}
            alt="Proof preview"
            className="h-full w-full select-none object-contain"
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}

export default DocumentPreview;
