import React from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography } from "@material-tailwind/react";
import DocumentPreview from "../components/DocumentPreview";

export default function ClaimProofDialog({ open, onClose, cycleNumber, claimImages }) {
  const firstImage = claimImages?.[0];

  const handleDownload = () => {
    if (!firstImage) return;
    const link = document.createElement("a");
    link.href = firstImage;
    link.download = `cycle-${cycleNumber || "proof"}-${Date.now()}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Dialog open={open} handler={onClose} size="lg" className="w-[94vw] max-w-4xl" dismiss={{ outsidePress: false, escapeKey: false }}>
      <DialogHeader className="flex items-center justify-between gap-3 py-3">
        <div>
          <Typography variant="h6" className="text-black">
            Claim Proof
          </Typography>
          <Typography variant="small" className="text-blue-gray-600">
            Cycle {cycleNumber || "-"}
          </Typography>
        </div>
        {firstImage ? (
          <Button
            size="sm"
            variant="outlined"
            className="rounded-full border-slate-300 bg-red-600 text-white px-4 py-2 text-xs font-semibold hover:bg-red-700"
            onClick={handleDownload}
          >
            Download
          </Button>
        ) : null}
      </DialogHeader>
      <DialogBody className="pt-0">
        {claimImages.length ? (
          <div className="w-full space-y-4">
            {claimImages.map((src, index) => (
              <DocumentPreview key={`${src}-${index}`} src={src} />
            ))}
          </div>
        ) : (
          <Typography className="text-sm text-blue-gray-600">No claim images submitted.</Typography>
        )}
      </DialogBody>
      <DialogFooter className="justify-end">
        <Button size="sm" variant="outlined" onClick={onClose} className="rounded-full border-slate-300 px-4 py-2 text-xs font-semibold text-blue-gray-700">
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
