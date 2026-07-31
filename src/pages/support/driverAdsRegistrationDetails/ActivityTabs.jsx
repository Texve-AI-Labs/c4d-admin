import React from "react";
import { Alert, Button, Spinner } from "@material-tailwind/react";
import { ACTIVITY_TABS } from "./constants";

export default function ActivityTabs({ activeTab, onTabChange, loading, error, rowsRenderer }) {
  return (
    <div className="rounded-xl border border-blue-gray-100 p-4">
      <div className="mb-4 flex flex-wrap gap-2 border-b border-blue-gray-100 pb-3">
        {ACTIVITY_TABS.map(({ key, label }) => (
          <Button
            key={key}
            size="sm"
            variant={activeTab === key ? "filled" : "outlined"}
            className={activeTab === key ? "bg-primary text-white" : "text-blue-gray-700"}
            onClick={() => onTabChange(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner className="h-12 w-12" />
        </div>
      ) : error ? (
        <Alert color="red">{error}</Alert>
      ) : (
        rowsRenderer(activeTab)
      )}
    </div>
  );
}
