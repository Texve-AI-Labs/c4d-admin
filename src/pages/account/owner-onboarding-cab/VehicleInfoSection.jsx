import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Chip, IconButton, Typography, Button } from "@material-tailwind/react";
import { PencilIcon } from "@heroicons/react/24/solid";
import CabDriverWalletLog from '@/components/CabDriverWallet';

const getSuggestionText = (suggestion) => {
  if (typeof suggestion === "string") return suggestion;
  if (suggestion && typeof suggestion === "object") {
    return (
      suggestion.fullText ||
      suggestion.title ||
      suggestion.name ||
      suggestion.address ||
      suggestion.label ||
      suggestion.subtitle ||
      suggestion.formatted_address ||
      suggestion.description ||
      suggestion.display_name ||
      ""
    );
  }
  return "";
};

const getDriverSuggestionKey = (sectionId) => `driver-${sectionId}`;

const isActivePackage = (option) => {
  return option?.status === "1";
};

const VehicleInfoSection = ({
  vehicleSections = [],
  getStatusChipColor,
  carTypeOptions = [],
  packageOptions = [],
  getLuggageForCarType,
  isTravels = false,
  accountRelatedDrivers = [],
  getVehicleAddressSuggestionsBySection,
  onVehicleAddressSearch,
  getVehicleStatusBySection,
  onVehicleStatusChange,
  getVehicleBlockedReasonBySection,
  onVehicleBlockedReasonChange,
  onVehicleStatusUpdate,
  statusUpdating = false,
  onSaveVehicleDetails,
  vehicleDetailsSavingId = null,
}) => {
  const sections = Array.isArray(vehicleSections) ? vehicleSections : [];
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [draftValues, setDraftValues] = useState({});
  const [activeLogTabBySection, setActiveLogTabBySection] = useState({});
  const [activeVehicleSectionId, setActiveVehicleSectionId] = useState(null);

  const editableLabels = useMemo(() => {
    const labels = ["Vehicle Number", "Vehicle Name", "Car Type", "Vehicle Type", "Model Year", "Seater", "Luggage", "Packages"];
    labels.push("Address", "Insurance Expiry Date");
    if (isTravels) labels.push("Owner Name", "Assigned To", "With Driver");
    return new Set(labels);
  }, [isTravels]);

  const getInitialDraft = (section) => {
    const map = {};
    (section?.vehicleDetailsRows || []).forEach((row) => {
      if (editableLabels.has(row.label)) map[row.label] = row.value === "-" ? "" : row.value;
    });
    const rawCarType = String(section?.rawValues?.carType || "").toUpperCase();
    if (["MINI", "SUV", "MUV", "SEDAN"].includes(rawCarType)) {
      map["Car Type"] =
        rawCarType === "MINI"
          ? "Mini"
          : rawCarType === "SEDAN"
            ? "Sedan"
            : rawCarType;
    }
    map["Insurance Expiry Date"] = section?.rawValues?.insurance
      ? String(section.rawValues.insurance).slice(0, 10)
      : (map["Insurance Expiry Date"] || "");
    map["Address"] = section?.rawValues?.curAddress || map["Address"] || "";
    if (isTravels) {
      const rawAssigned = String(section?.rawValues?.assigned || "").trim();
      map["Assigned To"] =
        rawAssigned.toLowerCase() === "individual"
          ? "Owner"
          : rawAssigned || map["Assigned To"] || "";
      map["With Driver"] = section?.rawValues?.withDriver || map["With Driver"] || "";
      map["Assign or Add Driver"] = "Assign";
      map["Driver ID"] = section?.rawValues?.Drivers?.[0]?.id || "";
      map["Driver Name"] = section?.rawValues?.driverName || "";
      map["Driver Phone Number"] = section?.rawValues?.phoneNumber || "";
      map["Driver Address"] = section?.rawValues?.driverAddress || "";
      map["Driver License Number"] = section?.rawValues?.driverLicense || "";
    }
    map.Packages = Array.isArray(section?.rawValues?.packages) ? section.rawValues.packages : [];
    return map;
  };

  const normalizeCarType = (value) => {
    const upper = String(value || "").toUpperCase();
    if (upper === "SEDAN") return "Sedan";
    if (upper === "MINI") return "Mini";
    if (upper === "SUV") return "SUV";
    if (upper === "MUV") return "MUV";
    return "";
  };

  const getVehicleTypeOptions = (selectedCarType, currentVehicleType) => {
    const normalizedSelected = normalizeCarType(selectedCarType);
    let filtered = carTypeOptions.filter((item) => {
      const itemType = String(item?.carType || "").toUpperCase();
      return itemType === String(normalizedSelected || "").toUpperCase();
    });

    // Fallback: many datasets keep MUV models under SUV bucket.
    if (filtered.length === 0 && String(normalizedSelected).toUpperCase() === "MUV") {
      filtered = carTypeOptions.filter((item) => {
        const itemType = String(item?.carType || "").toUpperCase();
        return itemType === "SUV" || itemType === "MUV";
      });
    }

    // Final fallback: show all unique models so dropdown is never empty.
    if (filtered.length === 0) {
      const seen = new Set();
      filtered = carTypeOptions.filter((item) => {
        const model = String(item?.carModel || "").trim().toLowerCase();
        if (!model || seen.has(model)) return false;
        seen.add(model);
        return true;
      });
    }

    const current = String(currentVehicleType || "").trim();
    const exists = filtered.some(
      (item) => String(item?.carModel || "").toLowerCase() === current.toLowerCase()
    );
    if (current && !exists) {
      return [{ id: "current-value", carModel: current }, ...filtered];
    }
    return filtered;
  };

  const leftDisplayOrder = useMemo(() => {
    const base = ["Vehicle Name", "Vehicle Number", "Car Type", "Vehicle Type", "Model Year", "Seater", "Luggage", "Packages"];
    return isTravels
      ? [...base, "Address", "Insurance Expiry Date", "Owner Name", "Assigned To", "With Driver"]
      : [...base, "Address", "Insurance Expiry Date"];
  }, [isTravels]);

  const rightDisplayOrder = useMemo(
    () => [
      "Status",
      "Subscription Status",
      "Subscription Start Date",
      "Subscription End Date",
      "Credit Status",
      "Wallet",
      "Cashback Wallet",
      "Credit Remaining",
      "Credit Created At",
    ],
    []
  );

  useEffect(() => {
    if (sections.length === 0) {
      setActiveVehicleSectionId(null);
      return;
    }
    const hasActive = sections.some((section) => section.id === activeVehicleSectionId);
    if (!hasActive) {
      setActiveVehicleSectionId(sections[0].id);
    }
  }, [sections, activeVehicleSectionId]);

  const visibleSections =
    sections.length > 1 && activeVehicleSectionId
      ? sections.filter((section) => section.id === activeVehicleSectionId)
      : sections;

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
        <>
          {sections.length > 1 && (
            <Card className="bg-white border border-blue-gray-100 shadow-sm md:col-span-2">
              <CardBody className="py-3">
                <div className="rounded-xl border border-blue-gray-100 bg-blue-gray-50/40 p-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {sections.map((section, idx) => (
                      <button
                        key={`vehicle-tab-${section.id || idx}`}
                        type="button"
                        onClick={() => {
                          setActiveVehicleSectionId(section.id);
                          setEditingSectionId(null);
                          setDraftValues({});
                        }}
                        className={`h-9 w-full rounded-lg px-4 text-sm font-medium transition ${
                          activeVehicleSectionId === section.id
                            ? "bg-primary text-white shadow-sm"
                            : "bg-white text-blue-gray-700 border border-blue-gray-100 hover:border-blue-gray-200"
                        }`}
                      >
                        {`Cab Id: ${section.cabId || "-"}`}
                      </button>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
          {visibleSections.map((section) => (
          <React.Fragment key={section.sectionKey || section.id}>
            {(() => {
              const sectionStatus = getVehicleStatusBySection?.(section.id) || "IN_ACTIVE";
              const sectionBlockedReason = getVehicleBlockedReasonBySection?.(section.id) || "";
              return (
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
                      Cab ID: {section.cabId}
                    </Typography>
                  </div>
                  <div className="ml-auto rounded-lg border border-blue-gray-100 bg-blue-gray-50/40 p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={sectionStatus}
                        onChange={(e) => onVehicleStatusChange?.(section.id, e.target.value)}
                        disabled={statusUpdating}
                        className="h-9 w-[170px] px-2.5 rounded-md border border-gray-300 bg-white text-sm"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="IN_ACTIVE">In_Active</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                      {sectionStatus === "BLOCKED" && (
                        <input
                          type="text"
                          value={sectionBlockedReason}
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
                {section.vehicleDetailsRows.length === 0 ? (
                  <Typography className="text-black mt-2">-</Typography>
                ) : (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                    {(() => {
                      const rowsByLabel = new Map((section.vehicleDetailsRows || []).map((row) => [row.label, row]));
                      const leftRows = leftDisplayOrder.map((label) => rowsByLabel.get(label)).filter(Boolean);
                      const rightRows = rightDisplayOrder.map((label) => rowsByLabel.get(label)).filter(Boolean);
                      const renderRow = (row) => (
                      <div key={`${section.id}-${row.label}`} className="flex items-start gap-2">
                        <Typography className="text-blue-gray-400 font-semibold min-w-[170px]">{row.label}:</Typography>
                        {editingSectionId === section.id && editableLabels.has(row.label) ? (
                          row.label === "Car Type" ? (
                            <select
                              value={draftValues[row.label] || ""}
                              onChange={(e) => {
                                const nextCarType = e.target.value;
                                setDraftValues((prev) => ({
                                  ...prev,
                                  [row.label]: nextCarType,
                                  Luggage: getLuggageForCarType?.(nextCarType.toUpperCase()) || prev.Luggage || "",
                                }));
                              }}
                              className="h-9 px-2.5 w-full max-w-[220px] rounded-md border border-gray-300 bg-white text-sm"
                            >
                              <option value="">Select</option>
                              <option value="Mini">Mini</option>
                              <option value="SUV">SUV</option>
                              <option value="MUV">MUV</option>
                              <option value="Sedan">Sedan</option>
                            </select>
                          ) : row.label === "Vehicle Type" ? (
                            (() => {
                              const options = getVehicleTypeOptions(draftValues?.["Car Type"], draftValues?.["Vehicle Type"]);
                              const currentVehicleType = String(draftValues?.["Vehicle Type"] || "").trim();
                              const matched = options.find(
                                (item) =>
                                  String(item?.carModel || "").trim().toLowerCase() ===
                                  currentVehicleType.toLowerCase()
                              );
                              const selectedValue = matched ? matched.carModel : currentVehicleType;
                              return (
                                <select
                                  value={selectedValue || ""}
                                  onChange={(e) => setDraftValues((prev) => ({ ...prev, [row.label]: e.target.value }))}
                                  className="h-9 px-2.5 w-full max-w-[220px] rounded-md border border-gray-300 bg-white text-sm"
                                >
                                  <option value="">Select</option>
                                  {options.map((item) => (
                                    <option key={item.id} value={item.carModel}>
                                      {item.carModel}
                                    </option>
                                  ))}
                                </select>
                              );
                            })()
                          ) : row.label === "Packages" ? (
                            <div className="w-full max-w-[320px] rounded-md border border-gray-300 bg-white p-2">
                              <div className="max-h-40 overflow-y-auto space-y-1">
                                {packageOptions.filter(isActivePackage).length === 0 ? (
                                  <Typography className="text-xs text-blue-gray-500">No packages found</Typography>
                                ) : (
                                  packageOptions.filter(isActivePackage).map((option) => {
                                    const selectedPackages = Array.isArray(draftValues.Packages) ? draftValues.Packages : [];
                                    const isChecked = selectedPackages.map(String).includes(String(option.id));
                                    return (
                                      <label key={option.id} className="flex items-center gap-2 text-sm text-blue-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            setDraftValues((prev) => {
                                              const current = Array.isArray(prev.Packages) ? prev.Packages : [];
                                              const next = e.target.checked
                                                ? [...current, option.id]
                                                : current.filter((item) => String(item) !== String(option.id));
                                              return { ...prev, Packages: next };
                                            });
                                          }}
                                        />
                                        <span>{option.label}</span>
                                      </label>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          ) : row.label === "Assigned To" ? (
                            <select
                              value={draftValues[row.label] || ""}
                              onChange={(e) => setDraftValues((prev) => ({ ...prev, [row.label]: e.target.value }))}
                              className="h-9 px-2.5 w-full max-w-[220px] rounded-md border border-gray-300 bg-white text-sm"
                            >
                              <option value="">Select</option>
                              <option value="Driver">Driver</option>
                              <option value="Owner">Owner</option>
                            </select>
                          ) : row.label === "With Driver" ? (
                            <select
                              value={draftValues[row.label] || ""}
                              onChange={(e) => setDraftValues((prev) => ({ ...prev, [row.label]: e.target.value }))}
                              className="h-9 px-2.5 w-full max-w-[220px] rounded-md border border-gray-300 bg-white text-sm"
                            >
                              <option value="">Select</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : row.label === "Insurance Expiry Date" ? (
                            <input
                              type="date"
                              value={draftValues[row.label] || ""}
                              onChange={(e) => setDraftValues((prev) => ({ ...prev, [row.label]: e.target.value }))}
                              className="h-9 px-2.5 w-full max-w-[220px] rounded-md border border-gray-300 bg-white text-sm"
                            />
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
                                        setDraftValues((prev) => ({
                                          ...prev,
                                          [row.label]: getSuggestionText(suggestion),
                                        }));
                                        onVehicleAddressSearch?.(section.id, "");
                                      }}
                                    >
                                      <span className="block text-blue-gray-900">
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
                        ) : row.label === "Status" || row.label === "Subscription Status" || row.label === "Credit Status" ? (
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
                      <div className="md:col-span-2 space-y-3">
                        {isTravels && (draftValues?.["With Driver"] || "") === "Yes" ? (
                          <div className="rounded-lg border border-blue-gray-100 bg-blue-gray-50/40 p-3">
                            <Typography className="text-sm font-semibold text-blue-gray-700 mb-2">Driver Assignment</Typography>
                            <div className="flex items-center gap-4 mb-3">
                              <label className="inline-flex items-center gap-2 text-sm text-blue-gray-700">
                                <input
                                  type="radio"
                                  name={`assign-or-add-${section.id}`}
                                  checked={(draftValues?.["Assign or Add Driver"] || "Assign") === "Assign"}
                                  onChange={() =>
                                    setDraftValues((prev) => ({ ...prev, "Assign or Add Driver": "Assign" }))
                                  }
                                />
                                Assign
                              </label>
                              <label className="inline-flex items-center gap-2 text-sm text-blue-gray-700">
                                <input
                                  type="radio"
                                  name={`assign-or-add-${section.id}`}
                                  checked={(draftValues?.["Assign or Add Driver"] || "Assign") === "Add"}
                                  onChange={() =>
                                    setDraftValues((prev) => ({ ...prev, "Assign or Add Driver": "Add" }))
                                  }
                                />
                                Add
                              </label>
                            </div>
                            {(draftValues?.["Assign or Add Driver"] || "Assign") === "Assign" ? (
                              <div className="max-w-[300px]">
                                <Typography className="text-xs text-blue-gray-500 mb-1">Driver</Typography>
                                <select
                                  value={draftValues?.["Driver ID"] || ""}
                                  onChange={(e) =>
                                    setDraftValues((prev) => ({ ...prev, "Driver ID": e.target.value }))
                                  }
                                  className="h-9 px-2.5 w-full rounded-md border border-gray-300 bg-white text-sm"
                                >
                                  <option value="">Select Driver</option>
                                  {accountRelatedDrivers.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.firstName} ({option.phoneNumber})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                  placeholder="Driver Name"
                                  value={draftValues?.["Driver Name"] || ""}
                                  onChange={(e) =>
                                    setDraftValues((prev) => ({ ...prev, "Driver Name": e.target.value }))
                                  }
                                  className="h-9 px-2.5 rounded-md border border-gray-300 bg-white text-sm"
                                />
                                <input
                                  placeholder="Phone Number"
                                  value={draftValues?.["Driver Phone Number"] || ""}
                                  onChange={(e) =>
                                    setDraftValues((prev) => ({ ...prev, "Driver Phone Number": e.target.value }))
                                  }
                                  className="h-9 px-2.5 rounded-md border border-gray-300 bg-white text-sm"
                                />
                                <div className="relative md:col-span-2">
                                  <input
                                    placeholder="Driver Address"
                                    value={draftValues?.["Driver Address"] || ""}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setDraftValues((prev) => ({ ...prev, "Driver Address": value }));
                                      onVehicleAddressSearch?.(getDriverSuggestionKey(section.id), value);
                                    }}
                                    className="h-9 px-2.5 w-full rounded-md border border-gray-300 bg-white text-sm"
                                  />
                                  {(getVehicleAddressSuggestionsBySection?.(getDriverSuggestionKey(section.id)) || []).length > 0 ? (
                                    <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                      {(getVehicleAddressSuggestionsBySection?.(getDriverSuggestionKey(section.id)) || []).map(
                                        (suggestion, idx) => (
                                          <button
                                            key={`${section.id}-driver-addr-${idx}`}
                                            type="button"
                                            className="w-full text-left px-2.5 py-2 text-sm hover:bg-blue-gray-50"
                                            onClick={() => {
                                              setDraftValues((prev) => ({
                                                ...prev,
                                                "Driver Address": getSuggestionText(suggestion),
                                              }));
                                              onVehicleAddressSearch?.(getDriverSuggestionKey(section.id), "");
                                            }}
                                          >
                                            <span className="block text-blue-gray-900">
                                              {typeof suggestion === "object" && suggestion?.title
                                                ? suggestion.title
                                                : getSuggestionText(suggestion)}
                                            </span>
                                            {typeof suggestion === "object" && suggestion?.fullText ? (
                                              <span className="block text-xs text-blue-gray-600">{suggestion.fullText}</span>
                                            ) : null}
                                          </button>
                                        )
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                                <input
                                  placeholder="License Number"
                                  value={draftValues?.["Driver License Number"] || ""}
                                  onChange={(e) =>
                                    setDraftValues((prev) => ({ ...prev, "Driver License Number": e.target.value }))
                                  }
                                  className="h-9 px-2.5 rounded-md border border-gray-300 bg-white text-sm"
                                />
                              </div>
                            )}
                          </div>
                        ) : null}
                        <div className="flex justify-end gap-2">
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
                            const selectedCarType = String(draftValues?.["Car Type"] || "").toUpperCase();
                            if (!["MINI", "SUV", "MUV", "SEDAN"].includes(selectedCarType)) {
                              window.alert("Please select a valid Car Type.");
                              return;
                            }
                            onSaveVehicleDetails?.(section.id, draftValues, () => {
                              setEditingSectionId(null);
                              setDraftValues({});
                            });
                          }}
                        >
                          {vehicleDetailsSavingId === section.id ? "Saving..." : "Save"}
                        </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
              );
            })()}
            <Card className="bg-white border border-blue-gray-100 shadow-sm md:col-span-2">
              <CardBody>
                <div className="px-3 pt-1">
                  <div className="flex items-center gap-5 border-b border-blue-gray-100">
                    <button
                      type="button"
                      className={`h-10 px-1 text-sm font-medium transition border-b-2 ${
                        (activeLogTabBySection[section.id] || "wallet") === "credit"
                          ? "text-primary border-primary"
                          : "text-blue-gray-500 border-transparent hover:text-blue-gray-700"
                      }`}
                      onClick={() =>
                        setActiveLogTabBySection((prev) => ({ ...prev, [section.id]: "credit" }))
                      }
                    >
                      Credit Log
                    </button>
                    <button
                      type="button"
                      className={`h-10 px-1 text-sm font-medium transition border-b-2 ${
                        (activeLogTabBySection[section.id] || "wallet") === "wallet"
                          ? "text-primary border-primary"
                          : "text-blue-gray-500 border-transparent hover:text-blue-gray-700"
                      }`}
                      onClick={() =>
                        setActiveLogTabBySection((prev) => ({ ...prev, [section.id]: "wallet" }))
                      }
                    >
                      Wallet Log
                    </button>
                  </div>
                </div>
                <div className="border-t border-blue-gray-50 mt-2 mb-3" />
                {(activeLogTabBySection[section.id] || "wallet") === "credit" ? (
                  section.creditLogRows.length === 0 ? (
                  <Typography className="text-black mt-2">-</Typography>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1800px] text-left">
                      <thead>
                        <tr className="border-b border-blue-100 bg-blue-50">
                          {[
                            "Type",
                            "Amount",
                            "Transaction Type",
                            "Base Credit",
                            "Bonus Credit",
                            "Utilized Credit",
                            "Nett Credit",
                            // "Remaining Credit",
                            "Status",
                            "Cashback Amount",
                            "Created At",
                            "Updated At",
                            "Invoice ID",
                            "Receipt ID",
                            "Subscription ID",
                            "Subscription Start Date",
                            "Subscription End Date",
                          ].map((header) => (
                            <th key={header} className="px-3 py-2">
                              <Typography className="text-blue-700 font-semibold">{header}</Typography>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.creditLogRows.map((row) => (
                          <tr key={row.id} className="border-b border-blue-gray-50">
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.type}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.amount}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.transactionType}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.baseCredit}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.bonusCredit}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.utilizedCredit}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.nettCredit}</Typography>
                            </td>
                            {/* <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.remainingCredit}</Typography>
                            </td> */}
                            <td className="px-3 py-2">
                              <Chip value={row.status} color={getStatusChipColor(row.status)} variant="ghost" className="w-fit" />
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.cashbackAmount}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.createdAt}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.updatedAt}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.invoiceId}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.receiptId}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.subscriptionId}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.subscriptionStartDate}</Typography>
                            </td>
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.subscriptionEndDate}</Typography>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )
                ) : (
                  <CabDriverWalletLog cabId={section.cabId} />
                )}
              </CardBody>
            </Card>
          </React.Fragment>
          ))}
        </>
      )}
    </>
  );
};

export default VehicleInfoSection;
