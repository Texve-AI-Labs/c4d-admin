import React, { useEffect, useState } from "react";

export default function LocationPhoto({ imageUrl, location = {}, fullSize = false }) {
  const [address, setAddress] = useState(location.address || "Address unavailable");
  const { lat, long, latitude, longitude,  } = location;
  const resolvedLat = lat ?? latitude;
  const resolvedLong = long ?? longitude;

  useEffect(() => {
    let active = true;

    if (location.address || resolvedLat === undefined || resolvedLong === undefined) {
      setAddress(location.address || "Address unavailable");
      return () => {
        active = false;
      };
    }

    if (window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: Number(resolvedLat), lng: Number(resolvedLong) } },
        (results, status) => {
          if (!active) return;
          setAddress(status === "OK" && results?.[0]?.formatted_address
            ? results[0].formatted_address
            : "Address unavailable");
        }
      );
    }

    return () => {
      active = false;
    };
  }, [location.address, resolvedLat, resolvedLong]);

  return (
    <div className="overflow-hidden rounded-lg bg-black">
      <img
        src={imageUrl}
        alt="Claim proof"
        className={fullSize
          ? "block max-h-[65vh] h-auto w-full object-contain"
          : "block aspect-[4/3] h-auto w-full object-contain"}
      />
      <div className="break-words whitespace-normal bg-black/90 px-3 py-2 font-mono text-[10px] leading-4 text-[#00ff88] sm:text-xs">
        <div className="break-words whitespace-normal">Address: {address}</div>
        <div className="break-words whitespace-normal">Lat: {resolvedLat ?? "-"}</div>
        <div className="break-words whitespace-normal">Long: {resolvedLong ?? "-"}</div>
      </div>
    </div>
  );
}
