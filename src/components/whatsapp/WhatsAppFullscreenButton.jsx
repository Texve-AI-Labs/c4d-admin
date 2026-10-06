import React from "react";
import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline";

export default function WhatsAppFullscreenButton({ containerRef, expanded = false, onExpandedChange }) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      const active = document.fullscreenElement === containerRef.current;
      setIsFullscreen(active);
      onExpandedChange?.(active);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [containerRef, onExpandedChange]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
      } else if (expanded) {
        onExpandedChange?.(false);
      } else if (document.fullscreenEnabled && containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      } else {
        onExpandedChange?.(true);
      }
    } catch {
      onExpandedChange?.(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      className="rounded-lg border border-blue-gray-200 bg-white p-2 text-blue-gray-600 shadow-sm transition hover:bg-blue-gray-50 hover:text-[#008069]"
      aria-label={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
      title={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
    >
      {isFullscreen || expanded ? <ArrowsPointingInIcon className="h-5 w-5" /> : <ArrowsPointingOutIcon className="h-5 w-5" />}
    </button>
  );
}