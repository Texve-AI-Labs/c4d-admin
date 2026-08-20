import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@material-tailwind/react";
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
 
const GEO_INTELLIGENCE_URL = import.meta.env.VITE_GEO_INTELLIGENCE_PROD;
const OPERATIONAL_URL = "https://operational-dashboard-96d1b.web.app";
 
 
const FULLSCREEN_REQUEST = "geo-intelligence:fullscreen-request";
const FULLSCREEN_EXIT = "geo-intelligence:fullscreen-exit";
 
const GeoIntelligence = () => {
  const frameShellRef = useRef(null);
  const isEmbeddedRef = useRef(false);
 
  const tabs = useMemo(
    () => [
      { key: "geo", label: "Geo Intelligence", url: GEO_INTELLIGENCE_URL },
      { key: "ops", label: "Operational", url: OPERATIONAL_URL },
    ],
    []
  );
 
  const [activeTab, setActiveTab] = useState("geo");
  const [zoom, setZoom] = useState(1);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
 
  const minZoom = 0.8;
  const maxZoom = 1.4;
  const zoomStep = 0.1;
  const activeSource = tabs.find((tab) => tab.key === activeTab)?.url || GEO_INTELLIGENCE_URL;
 
  useEffect(() => {
    try {
      isEmbeddedRef.current = window.self !== window.top;
    } catch {
      isEmbeddedRef.current = true;
    }
  }, []);
 
  useEffect(() => {
    const onFullscreenChange = () => {
      const shell = frameShellRef.current;
      setIsNativeFullscreen(Boolean(shell && document.fullscreenElement === shell));
    };
 
    document.addEventListener("fullscreenchange", onFullscreenChange);
 
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);
 
  useEffect(() => {
    const onMessage = (event) => {
      if (!event.data || typeof event.data !== "object") return;

      const message = event.data;
      if (message.type === FULLSCREEN_EXIT) {
        setIsExpanded(false);
      }
    };
 
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
 
  const handleZoomIn = () => setZoom((current) => Math.min(maxZoom, Number((current + zoomStep).toFixed(2))));
  const handleZoomOut = () => setZoom((current) => Math.max(minZoom, Number((current - zoomStep).toFixed(2))));
  const resetZoom = () => setZoom(1);
 
  const requestParentFullscreen = () => {
    if (!window.parent || window.parent === window) return;
 
    window.parent.postMessage(
      {
        type: FULLSCREEN_REQUEST,
        source: "geo-intelligence",
        tab: activeTab,
      },
      "*"
    );
  };
 
  const handleFullscreen = async () => {
    const shell = frameShellRef.current;
    if (!shell) return;
 
    const canUseNativeFullscreen =
      !isEmbeddedRef.current && typeof document !== "undefined" && document.fullscreenEnabled;
 
    if (canUseNativeFullscreen) {
      try {
        if (document.fullscreenElement === shell) {
          await document.exitFullscreen();
          return;
        }
 
        await shell.requestFullscreen();
        return;
      } catch (error) {
        console.error("Failed to enter native fullscreen mode:", error);
      }
    }
 
    setIsExpanded((current) => !current);
    requestParentFullscreen();
  };
 
  const handleExitFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
    }
 
    setIsExpanded(false);
    window.parent?.postMessage(
      {
        type: FULLSCREEN_EXIT,
        source: "geo-intelligence",
      },
      "*"
    );
  };
  const isFullscreenView = isNativeFullscreen || isExpanded;
 
  return (
<div className="flex h-full w-full">
<div
        ref={frameShellRef}
        className={[
          "min-h-0 flex-1 overflow-hidden bg-white",
          isFullscreenView ? "fixed inset-0 z-[9999] h-screen w-screen bg-white" : "",
        ].join(" ")}
>
<div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-2 py-2 lg:flex-row lg:items-center lg:justify-between">
<div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
<Button
                  key={tab.key}
                  size="sm"
                  variant={isActive ? "filled" : "outlined"}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "border-teal-600 bg-teal-600 text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                  onClick={() => {
                    setActiveTab(tab.key);
                    resetZoom();
                  }}
>
                  {tab.label}
</Button>
              );
            })}
</div>
 
          <div className="flex items-center justify-end gap-3">
<Button
              size="sm"
              variant="filled"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
              onClick={handleZoomIn}
              disabled={zoom >= maxZoom}
>
<PlusIcon className="h-5 w-5" />
</Button>
 
            <Button
              size="sm"
              variant="filled"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
              onClick={handleZoomOut}
              disabled={zoom <= minZoom}
>
<MinusIcon className="h-5 w-5" />
</Button>
 
            <Button
              size="sm"
              variant="text"
              className="min-w-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
              onClick={resetZoom}
>
              {Math.round(zoom * 100)}%
</Button>
 
            <Button
              size="sm"
              variant="filled"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
              onClick={isFullscreenView ? handleExitFullscreen : handleFullscreen}
              title={isFullscreenView ? "Exit Fullscreen" : "Fullscreen"}
>
              {isFullscreenView ? (
<ArrowsPointingInIcon className="h-5 w-5" />
              ) : (
<ArrowsPointingOutIcon className="h-5 w-5" />
              )}
</Button>
</div>
</div>
 
        <div className="h-[calc(100vh-12.5rem)] w-full overflow-auto bg-slate-50 lg:h-[calc(100vh-11rem)]">
          <iframe
            title={activeTab === "ops" ? "Operational" : "Geo Intelligence"}
            src={activeSource}
            className="h-full w-full origin-top-left border-0"
            style={{
              transform: `scale(${zoom})`,
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
            }}
            referrerPolicy="no-referrer-when-downgrade"
            allow="clipboard-read; clipboard-write; geolocation; fullscreen"
            allowFullScreen
          />
</div>
 
        {isFullscreenView && (
<div className="absolute right-4 top-4 z-[10000]">
<Button
              size="sm"
              variant="filled"
              className="rounded-full bg-slate-900 px-4 py-2 text-white shadow-lg hover:bg-slate-800"
              onClick={handleExitFullscreen}
>
              Exit fullscreen
</Button>
</div>
        )}
</div>
</div>
  );
};
 
export default GeoIntelligence;
