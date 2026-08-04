import React, { useMemo, useState } from "react";
import { Button } from "@material-tailwind/react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/solid";

const GEO_INTELLIGENCE_URL = "https://geointelligence-cd5f6.web.app";
const OPERATIONAL_URL = "https://operational-dashboard-96d1b.web.app/";

const GeoIntelligence = () => {
  const tabs = useMemo(
    () => [
      { key: "geo", label: "Geo Intelligence", url: GEO_INTELLIGENCE_URL },
      { key: "ops", label: "Operational", url: OPERATIONAL_URL },
    ],
    []
  );
  const [activeTab, setActiveTab] = useState("geo");
  const [zoom, setZoom] = useState(1);
  const minZoom = 0.8;
  const maxZoom = 1.4;
  const zoomStep = 0.1;
  const activeSource = tabs.find((tab) => tab.key === activeTab)?.url || GEO_INTELLIGENCE_URL;

  const handleZoomIn = () => setZoom((current) => Math.min(maxZoom, Number((current + zoomStep).toFixed(2))));
  const handleZoomOut = () => setZoom((current) => Math.max(minZoom, Number((current - zoomStep).toFixed(2))));
  const resetZoom = () => setZoom(1);

  return (
    <div className="flex h-full w-full">
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
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
          </div>
        </div>

        <div className="h-[calc(100%-57px)] w-full overflow-auto bg-slate-50">
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
          allow="clipboard-read; clipboard-write; geolocation"
        />
        </div>
      </div>
    </div>
  );
};

export default GeoIntelligence;