import React, { useState } from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Typography } from "@material-tailwind/react";
import LocationPhoto from "../components/LocationPhoto";

export default function ClaimProofDialog({ open, onClose, cycleNumber, claimImages }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const normalizedImages = Array.isArray(claimImages) ? claimImages : [];
  const firstImage = normalizedImages?.[0];
  const firstCapturedAt = firstImage?.capturedAt || "";

  const handleViewImage = (item) => {
    const src = typeof item === "string" ? item : item?.url || "";
    if (!src) return;
    setSelectedImage(typeof item === "string" ? { url: src } : item);
  };

  const formatCapturedAt = (value) => {
    if (!value) return "-";
    const text = String(value);
    const dateTime = new Date(text);
    if (!Number.isNaN(dateTime.getTime())) {
      const date = dateTime.toLocaleDateString("en-GB", { timeZone: "UTC" });
      const time = dateTime.toLocaleTimeString("en-GB", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${date} ${time}`;
    }
    return text;
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
      </DialogHeader>
      <DialogBody className="max-h-[72vh] overflow-y-auto pt-0">
        {normalizedImages.length ? (
          <div className="w-full overflow-x-auto">
            <div className="flex min-w-max gap-4 pb-2">
              {normalizedImages.map((item, index) => {
                const src = typeof item === "string" ? item : item?.url || "";
                const meta = typeof item === "string" ? {} : item || {};
                return (
                  <div key={`${src}-${index}`} className="w-[320px] flex-none rounded-xl border border-blue-gray-100 bg-white p-3">
                    <LocationPhoto
                      imageUrl={src}
                      location={{
                        address: meta?.address,
                        latitude: meta?.latitude,
                        longitude: meta?.longitude,
                        capturedAt: meta?.capturedAt || firstCapturedAt,
                      }}
                    />
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Typography variant="small" className="text-[11px] font-medium text-blue-gray-600">
                        Captured: {formatCapturedAt(meta?.capturedAt || firstCapturedAt)}
                      </Typography>
                      <Button
                        size="sm"
                        className='rounded-full px-3 py-1 text-[11px] font-semibold text-white bg-primary'
                        onClick={() => handleViewImage(item)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <Typography className="text-sm text-blue-gray-600">No claim images submitted.</Typography>
        )}
      </DialogBody>
      <DialogFooter className="justify-end">
        <Button size="sm" variant="outlined" onClick={onClose} className="rounded-full border-slate-300 px-4 py-2 text-xs font-semibold text-white bg-red-500">
          Close
        </Button>
      </DialogFooter>
      <Dialog
        open={Boolean(selectedImage)}
        handler={() => setSelectedImage(null)}
        size="lg"
        className="w-[94vw] max-w-3xl"
      >
        <DialogHeader className="flex items-center justify-between">
          <Typography variant="h6" className="text-black">
            Claim Image
          </Typography>
        </DialogHeader>
        <DialogBody className="max-h-[75vh] overflow-y-auto">
          {selectedImage ? (
            <LocationPhoto
              imageUrl={selectedImage.url}
              fullSize
              location={{
                address: selectedImage.address,
                latitude: selectedImage.latitude,
                longitude: selectedImage.longitude,
                capturedAt: selectedImage.capturedAt,
              }}
            />
          ) : null}
        </DialogBody>
        <DialogFooter className="justify-end">
          <Button
            size="sm"
            className="bg-red-500 text-white"
            onClick={() => setSelectedImage(null)}
          >
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </Dialog>
  );
}
