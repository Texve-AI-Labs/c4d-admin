import React, { useMemo, useState } from "react";
import { Card, CardBody, Chip, IconButton, Typography, Button } from "@material-tailwind/react";
import { PencilIcon } from "@heroicons/react/24/solid";
import CabDriverWalletLog from '@/components/CabDriverWallet';

const VehicleInfoSection = ({
  vehicleSections = [],
  getStatusChipColor,
  carTypeOptions = [],
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

  const editableLabels = useMemo(
    () => new Set(["Vehicle Number", "Vehicle Name", "Car Type", "Vehicle Type", "Model Year", "Seater", "Luggage"]),
    []
  );

  const getInitialDraft = (section) => {
    const map = {};
    (section?.vehicleDetailsRows || []).forEach((row) => {
      if (editableLabels.has(row.label)) map[row.label] = row.value === "-" ? "" : row.value;
    });
    const rawCarType = String(section?.rawValues?.carType || "").toUpperCase();
    if (["MINI", "SUV", "MUV", "SEDAN"].includes(rawCarType)) {
      map["Car Type"] = rawCarType === "SEDAN" ? "Sedan" : rawCarType;
    }
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

  const leftDisplayOrder = useMemo(
    () => ["Vehicle Name", "Vehicle Number", "Car Type", "Vehicle Type", "Model Year", "Seater", "Luggage"],
    []
  );

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
                              onChange={(e) => setDraftValues((prev) => ({ ...prev, [row.label]: e.target.value }))}
                              className="h-9 px-2.5 w-full max-w-[220px] rounded-md border border-gray-300 bg-white text-sm"
                            >
                              <option value="">Select</option>
                              <option value="MINI">Mini</option>
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
                  <div className="flex items-end gap-1 border-b border-gray-300">
                  <Button
                    size="sm"
                    className={`rounded-b-none rounded-t-md px-5 py-2 text-xs normal-case shadow-none border ${
                      activeLogTabBySection[section.id] === "credit"
                        ? "bg-white text-blue-gray-800 border-gray-300 border-b-white -mb-px"
                        : "bg-gray-100 text-blue-gray-500 border-gray-300"
                    }`}
                    onClick={() =>
                      setActiveLogTabBySection((prev) => ({ ...prev, [section.id]: "credit" }))
                    }
                  >
                    Credit Log
                  </Button>
                  <Button
                    size="sm"
                    className={`rounded-b-none rounded-t-md px-5 py-2 text-xs normal-case shadow-none border ${
                      (activeLogTabBySection[section.id] || "wallet") === "wallet"
                        ? "bg-white text-blue-gray-800 border-gray-300 border-b-white -mb-px"
                        : "bg-gray-100 text-blue-gray-500 border-gray-300"
                    }`}
                    onClick={() =>
                      setActiveLogTabBySection((prev) => ({ ...prev, [section.id]: "wallet" }))
                    }
                  >
                    Wallet Log
                  </Button>
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
                            "Remaining Credit",
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
                            <td className="px-3 py-2">
                              <Typography className="text-blue-gray-900 font-medium">{row.remainingCredit}</Typography>
                            </td>
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
        ))
      )}
    </>
  );
};

export default VehicleInfoSection;
