import React, { useMemo, useState } from "react";
import { Card, CardBody, Chip, IconButton, Typography, Button } from "@material-tailwind/react";
import { PencilIcon } from "@heroicons/react/24/solid";

const VehicleInfoSection = ({
  vehicleSections = [],
  getStatusChipColor,
  getVehicleStatusBySection,
  onVehicleStatusChange,
  getVehicleBlockedReasonBySection,
  onVehicleBlockedReasonChange,
  onVehicleStatusUpdate,
  statusUpdating = false,
  onSaveVehicleDetails,
  vehicleDetailsSavingId = null,
  getVehicleAddressSuggestionsBySection,
  onVehicleAddressSearch,
  serviceAreaOptions = [],
  zoneOptions = [],
}) => {
  const sections = Array.isArray(vehicleSections) ? vehicleSections : [];
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [draftValues, setDraftValues] = useState({});
  const getSuggestionText = (suggestion) => {
    if (typeof suggestion === "string") return suggestion;
    if (suggestion && typeof suggestion === "object") {
      return (
        suggestion.fullText ||
        suggestion.name ||
        suggestion.address ||
        suggestion.label ||
        suggestion.title ||
        suggestion.subtitle ||
        suggestion.formatted_address ||
        suggestion.description ||
        suggestion.display_name ||
        ""
      );
    }
    return "";
  };

  const editableLabels = useMemo(
    () =>
      new Set([
        "Vehicle Name",
        "Bike Number",
        "Address",
        "Insurance Expiry Date",
        "Vehicle Type",
        "Model Year",
        "Seater",
        "Service Area Name",
        "Zone Name",
      ]),
    []
  );

  const leftDisplayOrder = useMemo(
    () => [
      "Vehicle Name",
      "Bike Number",
      "Insurance Expiry Date",
      "Vehicle Type",
      "Model Year",
      "Seater",
      "Status",
    ],
    []
  );

  const rightDisplayOrder = useMemo(
    () => [
      "Address",
      "Service Area Name",
      "Zone Name",
      "Blocked Reason",
      "Sub Zone ID",
    ],
    []
  );

  const getInitialDraft = (section) => {
    const map = {};
    (section?.vehicleDetailsRows || []).forEach((row) => {
      if (editableLabels.has(row.label)) map[row.label] = row.value === "-" ? "" : row.value;
    });
    return map;
  };

  const normalizeId = (value) => (value === null || value === undefined ? "" : String(value));
  const serviceAreaSelectOptions = useMemo(
    () =>
      (serviceAreaOptions || []).map((area) => ({
        id: normalizeId(area?.id),
        name: area?.name || "",
      })),
    [serviceAreaOptions]
  );
  const zoneSelectOptions = useMemo(
    () =>
      (zoneOptions || []).map((zone) => ({
        id: normalizeId(zone?.id),
        name: zone?.name || "",
        parentId: normalizeId(zone?.parent_id),
      })),
    [zoneOptions]
  );

  return (
    <>
      {sections.length === 0 ? (
        <Card className="bg-white border border-blue-gray-100 shadow-sm md:col-span-2">
          <CardBody>
            <Typography variant="h5" className="text-blue-gray-900 font-semibold rounded-md px-3 py-2 inline-block">
              Vehicle Details
            </Typography>
            <div className="border-t border-blue-gray-50 mt-3" />
            <Typography className="text-black mt-2">-</Typography>
          </CardBody>
        </Card>
      ) : (
        sections.map((section) => (
          <React.Fragment key={section.sectionKey || section.id}>
            <Card className="bg-white border border-blue-gray-100 shadow-sm md:col-span-2">
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Typography variant="h5" className="text-blue-gray-900 font-semibold inline-block">
                        Vehicle Details
                      </Typography>
                      <IconButton
                        variant="text"
                        className="h-9 w-9 rounded-md bg-blue-50 text-blue-600"
                        onClick={() => {
                          setEditingSectionId(section.id);
                          setDraftValues(getInitialDraft(section));
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                    <Typography className="text-xs text-blue-gray-500 px-3 -mt-1">
                      Bike ID: {section.cabId}
                    </Typography>
                  </div>
                  <div className="ml-auto rounded-lg border border-blue-gray-100 bg-blue-gray-50/40 p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={getVehicleStatusBySection?.(section.id) || "IN_ACTIVE"}
                        onChange={(e) => onVehicleStatusChange?.(section.id, e.target.value)}
                        disabled={statusUpdating}
                        className="h-9 w-[170px] px-2.5 rounded-md border border-gray-300 bg-white text-sm"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="IN_ACTIVE">In_Active</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                      {(getVehicleStatusBySection?.(section.id) || "IN_ACTIVE") === "BLOCKED" && (
                        <input
                          type="text"
                          value={getVehicleBlockedReasonBySection?.(section.id) || ""}
                          onChange={(e) => onVehicleBlockedReasonChange?.(section.id, e.target.value)}
                          disabled={statusUpdating}
                          placeholder="Enter block reason"
                          className="h-9 w-[220px] px-2.5 rounded-md border border-gray-300 bg-white text-sm"
                        />
                      )}
                      <Button
                        onClick={() => onVehicleStatusUpdate?.(section.id)}
                        disabled={statusUpdating}
                        size="sm"
                        className="h-9 px-4 bg-primary text-xs normal-case"
                      >
                        {statusUpdating ? "Updating..." : "Update Status"}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="border-t border-blue-gray-50 mt-3" />

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                  {(() => {
                    const rowsByLabel = new Map((section.vehicleDetailsRows || []).map((row) => [row.label, row]));
                    const leftRows = leftDisplayOrder.map((label) => rowsByLabel.get(label)).filter(Boolean);
                    const rightRows = rightDisplayOrder.map((label) => rowsByLabel.get(label)).filter(Boolean);

                    const renderRow = (row) => (
                      <div key={`${section.id}-${row.label}`} className="flex items-start gap-2">
                        <Typography className="text-blue-gray-400 font-semibold min-w-[170px]">{row.label}:</Typography>
                        {editingSectionId === section.id && editableLabels.has(row.label) ? (
                          row.label === "Vehicle Type" ? (
                            <select
                              value={draftValues[row.label] || ""}
                              onChange={(e) => setDraftValues((prev) => ({ ...prev, [row.label]: e.target.value }))}
                              className="h-9 px-2.5 w-full max-w-[220px] rounded-md border border-gray-300 bg-white text-sm"
                            >
                              <option value="">Select</option>
                              <option value="BIKE">BIKE</option>
                              <option value="Bike">Bike</option>
                            </select>
                          ) : row.label === "Service Area Name" ? (
                            <select
                              value={draftValues[row.label] || ""}
                              onChange={(e) => {
                                const nextAreaName = e.target.value;
                                setDraftValues((prev) => ({
                                  ...prev,
                                  [row.label]: nextAreaName,
                                  "Zone Name": "",
                                  "Sub Zone ID": "",
                                }));
                              }}
                              className="h-9 px-2.5 w-full max-w-[220px] rounded-md border border-gray-300 bg-white text-sm"
                            >
                              <option value="">Select</option>
                              {serviceAreaSelectOptions.map((area) => (
                                <option key={area.id} value={area.name}>
                                  {area.name}
                                </option>
                              ))}
                            </select>
                          ) : row.label === "Zone Name" ? (
                            (() => {
                              const selectedArea = serviceAreaSelectOptions.find(
                                (area) => area.name === String(draftValues?.["Service Area Name"] || "")
                              );
                              const filteredZones = zoneSelectOptions.filter(
                                (zone) => !selectedArea?.id || zone.parentId === selectedArea.id
                              );
                              return (
                                <select
                                  value={draftValues[row.label] || ""}
                                  onChange={(e) => {
                                    const zoneName = e.target.value;
                                    const selectedZone = filteredZones.find((z) => z.name === zoneName);
                                    setDraftValues((prev) => ({
                                      ...prev,
                                      [row.label]: zoneName,
                                      "Sub Zone ID": selectedZone?.id || "",
                                    }));
                                  }}
                                  className="h-9 px-2.5 w-full max-w-[220px] rounded-md border border-gray-300 bg-white text-sm"
                                >
                                  <option value="">Select</option>
                                  {filteredZones.map((zone) => (
                                    <option key={zone.id} value={zone.name}>
                                      {zone.name}
                                    </option>
                                  ))}
                                </select>
                              );
                            })()
                          ) : row.label === "Address" ? (
                            <div className="relative w-full max-w-[220px]">
                              <input
                                value={draftValues[row.label] || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setDraftValues((prev) => ({ ...prev, [row.label]: value }));
                                  onVehicleAddressSearch?.(section.id, value);
                                }}
                                className="h-9 px-2.5 w-full rounded-md border border-gray-300 bg-white text-sm"
                              />
                              {(getVehicleAddressSuggestionsBySection?.(section.id) || []).length > 0 ? (
                                <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                  {(getVehicleAddressSuggestionsBySection?.(section.id) || []).map((suggestion, idx) => (
                                    <button
                                      key={`${section.id}-addr-${idx}`}
                                      type="button"
                                      className="w-full text-left px-2.5 py-2 text-sm hover:bg-blue-gray-50"
                                      onClick={() => {
                                        setDraftValues((prev) => ({ ...prev, [row.label]: getSuggestionText(suggestion) }));
                                        onVehicleAddressSearch?.(section.id, "");
                                      }}
                                    >
                                      <span className="block font-semibold text-gray-900">
                                        {typeof suggestion === "object" && suggestion?.title
                                          ? suggestion.title
                                          : getSuggestionText(suggestion)}
                                      </span>
                                      {typeof suggestion === "object" && suggestion?.fullText ? (
                                        <span className="block text-xs text-blue-gray-600">{suggestion.fullText}</span>
                                      ) : null}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <input
                              value={draftValues[row.label] || ""}
                              onChange={(e) => setDraftValues((prev) => ({ ...prev, [row.label]: e.target.value }))}
                              className="h-9 px-2.5 w-full max-w-[220px] rounded-md border border-gray-300 bg-white text-sm"
                            />
                          )
                        ) : row.label === "Status" || row.label === "Commission Status" ? (
                          <Chip value={row.value} color={getStatusChipColor(row.value)} variant="ghost" className="w-fit" />
                        ) : (
                          <Typography className="text-blue-gray-900 font-medium break-words">{row.value}</Typography>
                        )}
                      </div>
                    );

                    return (
                      <>
                        <div className="space-y-3">{leftRows.map(renderRow)}</div>
                        <div className="space-y-3">{rightRows.map(renderRow)}</div>
                      </>
                    );
                  })()}

                  {editingSectionId === section.id && (
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs normal-case bg-white text-black border border-gray-300 shadow-none"
                        onClick={() => {
                          setEditingSectionId(null);
                          setDraftValues({});
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs normal-case bg-primary"
                        disabled={vehicleDetailsSavingId === section.id}
                        onClick={() => {
                          onSaveVehicleDetails?.(section.id, draftValues, () => {
                            setEditingSectionId(null);
                            setDraftValues({});
                          });
                        }}
                      >
                        {vehicleDetailsSavingId === section.id ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </React.Fragment>
        ))
      )}
    </>
  );
};

export default VehicleInfoSection;
