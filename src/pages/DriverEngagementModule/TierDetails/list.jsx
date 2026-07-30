import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import { normalizeTierRows } from "./shared/tierApi";
import TierExpandedDetails from "./TierExpandedDetails";
import TierListFilters from "./TierListFilters";
import {
  EXPAND_ICON_PATH,
  TIER_BADGE_CLASS,
  formatLabelCase,
  formatTypeLabel,
  getTierDisplay,
  getTierList,
} from "./listFormatters";

function TierDetailsList() {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [partnerTypeFilter, setPartnerTypeFilter] = useState("CAB");
  const [parcelVehicleTypeFilter, setParcelVehicleTypeFilter] = useState("ALL");
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRowIds, setExpandedRowIds] = useState({});

  const toggleExpand = (rowId) => {
    setExpandedRowIds((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  useEffect(() => {
    const fetchTiers = async () => {
      setIsLoading(true);
      try {
        const query = {};
        if (typeFilter !== "ALL") {
          query.ruleType = typeFilter;
        }
        if (statusFilter !== "ALL") {
          query.isActive = statusFilter === "ACTIVE";
        }
        if (partnerTypeFilter !== "ALL") {
          query.partnerType = partnerTypeFilter;
        }
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.LIST_DE_TIER, query);
        const normalizedRows = normalizeTierRows(response?.data || []);
        setRows(normalizedRows);
      } catch (error) {
        console.error("Failed to fetch tiers:", error);
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTiers();
  }, [typeFilter, statusFilter, partnerTypeFilter, parcelVehicleTypeFilter]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const typeMatches = typeFilter === "ALL" ? true : row.type === typeFilter;
      const statusMatches =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
            ? row.isActive === true
            : row.isActive === false;
      const partnerType =
        row?.raw?.config?.scope?.partnerType || row?.raw?.scope?.partnerType || row?.raw?.partnerType || "ALL";
      const parcelVehicleType = row?.raw?.config?.scope?.parcelVehicleType || row?.raw?.config?.scope?.vehicleType || row?.raw?.scope?.parcelVehicleType || row?.raw?.scope?.vehicleType || "ALL";
      const partnerTypeMatches =
        partnerTypeFilter === "ALL" ? true : String(partnerType || "").toUpperCase() === partnerTypeFilter;
      const parcelVehicleTypeMatches =
        partnerTypeFilter === "PARCEL"
          ? parcelVehicleTypeFilter === "ALL"
            ? true
            : String(parcelVehicleType || "").toUpperCase() === parcelVehicleTypeFilter
          : true;
      return typeMatches && statusMatches && partnerTypeMatches && parcelVehicleTypeMatches;
    });
  }, [rows, typeFilter, statusFilter, partnerTypeFilter, parcelVehicleTypeFilter]);

  return (
    <div className="mt-5 mb-10 bg-white p-2 px-4 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <Typography variant="h4" color="blue-gray">
            Tier Details
          </Typography>
          <Typography color="gray" className="mt-1 text-sm font-normal">
            Manage driver engagement tiers
          </Typography>
        </div>

        <Link to={`/dashboard/driverengagement/tier/add?type=${typeFilter === "ALL" ? "TIER_RULES" : encodeURIComponent(typeFilter)}`}>
          <Button color="blue">Add Tier</Button>
        </Link>
      </div>

      <TierListFilters
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        partnerTypeFilter={partnerTypeFilter}
        parcelVehicleTypeFilter={parcelVehicleTypeFilter}
        onTypeFilterChange={setTypeFilter}
        onStatusFilterChange={setStatusFilter}
        onPartnerTypeFilterChange={setPartnerTypeFilter}
        onParcelVehicleTypeFilterChange={setParcelVehicleTypeFilter}
      />

      <Card>
        <CardBody className="overflow-x-auto px-0 py-0">
          <table className="w-full min-w-[640px] table-auto text-left">
            <thead>
              <tr>
                {["Type", "Rule Name", "Tier", "Status",  "Zone","Created At", "Updated At", "Action", "Expand"].map((head) => (
                  <th key={head} className="bg-primary border-b border-blue-gray-50 px-5 py-3 text-left">
                    <Typography variant="small" color="white" className="font-semibold">
                      {head}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => {
                const isLast = index === filteredRows.length - 1;
                const cellClass = isLast ? "p-4" : "border-b border-blue-gray-50 p-4";
                const isExpanded = Boolean(expandedRowIds[row.id]);
                const createdAtRaw = row?.raw?.created_at || row?.raw?.createdAt;
                const updatedAtRaw = row?.raw?.updated_at || row?.raw?.updatedAt;

                return (
                  <Fragment key={row.id}>
                    <tr>
                      <td className={cellClass}>
                        <Typography variant="small" color="blue-gray" className="font-medium">
                          {formatTypeLabel(row.type)}
                        </Typography>
                      </td>
                      <td className={cellClass}>
                        <Typography variant="small" color="blue-gray" className="font-semibold">
                          {row.name}
                        </Typography>
                      </td>
                      <td className={cellClass}>
                        {(() => {
                          const tierList = getTierList(row);
                          if (!tierList.length) {
                            return (
                              <Typography variant="small" color="blue-gray" className="font-medium">
                                {getTierDisplay(row)}
                              </Typography>
                            );
                          }
                          return (
                            <div className="flex flex-wrap gap-2">
                              {tierList.map((tier) => (
                                <span
                                  key={`${row.id}-${tier}`}
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TIER_BADGE_CLASS[tier] || "bg-blue-gray-100 text-blue-gray-700"
                                    }`}
                                >
                                  {formatLabelCase(tier)}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className={cellClass}>
                        <Typography
                          variant="small"
                          className={row.isActive ? "font-medium text-green-600" : "font-medium text-blue-gray-500"}
                        >
                          {row.isActive ? "Active" : "Inactive"}
                        </Typography>
                      </td>
                      <td className={cellClass}>
                        <Typography variant="small" color="blue-gray" className="font-semibold">
                          {row.zone}
                        </Typography>
                      </td>
                      <td className={cellClass}>
                        <Typography variant="small" color="blue-gray" className="font-medium">
                          {createdAtRaw ? moment(createdAtRaw).format("DD-MM-YYYY / hh:mm A") : "-"}
                        </Typography>
                      </td>
                      <td className={cellClass}>
                        <Typography variant="small" color="blue-gray" className="font-medium">
                          {updatedAtRaw ? moment(updatedAtRaw).format("DD-MM-YYYY / hh:mm A") : "-"}
                        </Typography>
                      </td>
                      <td className={cellClass}>
                        <Link to={`/dashboard/driverengagement/tier/edit/${row.id}`} state={{ tier: row.raw }}>
                          <Typography variant="small" color="blue" className="font-medium">
                            Edit
                          </Typography>
                        </Link>
                      </td>
                      <td className={cellClass}>
                        <button
                          type="button"
                          onClick={() => toggleExpand(row.id)}
                          className="rounded-md border border-blue-gray-200 p-1"
                          aria-label={isExpanded ? "Collapse details" : "Expand details"}
                        >
                          <img
                            src={EXPAND_ICON_PATH}
                            alt={isExpanded ? "Hide details" : "View details"}
                            className="h-4 w-4 rounded-sm object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                              if (event.currentTarget.nextElementSibling) {
                                event.currentTarget.nextElementSibling.style.display = "inline";
                              }
                            }}
                          />
                          <span className="hidden px-1 text-xs font-semibold">+</span>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="border-b border-blue-gray-50 bg-blue-gray-50 px-4 py-3">
                          <TierExpandedDetails row={row} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!isLoading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center">
                    <Typography variant="small" color="gray">
                      No tier rules found for selected type.
                    </Typography>
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={8} className="p-6 text-center">
                    <Typography variant="small" color="gray">
                      Loading tiers...
                    </Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

export default TierDetailsList;
