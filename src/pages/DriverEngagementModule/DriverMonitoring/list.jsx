import React, { useEffect, useMemo, useRef, useState } from "react";
import { Typography } from "@material-tailwind/react";
import MonitoringStatCards from "./MonitoringStatCards";
import MonitoringFilters from "./MonitoringFilters";
import MonitoringTable from "./MonitoringTable";
import { fetchDriverMonitoringData, fetchDriverTierHistory, fetchGeoData } from "./monitoringApi";
import { normalizeMonitoringRows } from "./monitoringMapper";
import ActionViewModal from "../common/ActionViewModal";

const resolvePartnerId = (source = {}, partnerType = "CAB") => {
  const normalizedType = String(partnerType || "").toUpperCase();
  if (normalizedType === "CAB") {
    return source.cabId || source.cabPartnerId || source.partnerId || source.partner?.id || source.partner?._id;
  }
  if (normalizedType === "AUTO") {
    return source.autoId || source.autoPartnerId || source.partnerId || source.partner?.id || source.partner?._id;
  }
  if (normalizedType === "BIKE" || normalizedType === "PARCEL") {
    return source.partnerId || source.bikeId || source.parcelId || source.driverId || source.id || source.partner?.id || source.partner?._id;
  }
  return source.driverId || source.partnerId || source.id || source.partner?.id || source.partner?._id;
};

const useDebouncedValue = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

const extractMonitoringRows = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(response?.data?.rows)) return response.data.rows;
  if (Array.isArray(response?.data?.data?.rows)) return response.data.data.rows;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

function DriverMonitoringList() {
  const [rows, setRows] = useState([]);
  const [zoneOptions, setZoneOptions] = useState(["ALL"]);
  const [selectedPartnerType, setSelectedPartnerType] = useState("CAB");
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState("ALL");
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [selectedVehicle, setSelectedVehicle] = useState("ALL");
  const [statsSummary, setStatsSummary] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");
  const [viewPayload, setViewPayload] = useState(null);
  const viewRequestSeq = useRef(0);
  const debouncedSearch = useDebouncedValue(search, 350);

  useEffect(() => {
    const loadZones = async () => {
      try {
        const serviceAreas = await fetchGeoData();
        const normalizedZones = [
          "ALL",
          ...serviceAreas
            .map((area) => String(area?.name || "").trim())
            .filter(Boolean),
        ];
        setZoneOptions(Array.from(new Set(normalizedZones)));
      } catch (error) {
        console.error("Failed to load zones:", error);
        setZoneOptions(["ALL"]);
      }
    };

    loadZones();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await fetchDriverMonitoringData({
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
          partnerType: selectedPartnerType,
          search: debouncedSearch,
          tier: selectedTier,
          zone: selectedZone,
          vehicleType: selectedVehicle,
        });

        const monitoringRows = extractMonitoringRows(response);
        const normalizedRows = normalizeMonitoringRows(monitoringRows);
        const nextPagination = response?.pagination || {};

        setRows(normalizedRows);
        setStatsSummary(response?.summary || null);
        setPagination((prev) => ({
          ...prev,
          currentPage: Number(nextPagination.currentPage || prev.currentPage || 1),
          totalPages: Number(nextPagination.totalPages || 1),
          totalItems: Number(nextPagination.totalItems || normalizedRows.length),
          itemsPerPage: Number(nextPagination.itemsPerPage || prev.itemsPerPage || 10),
        }));
      } catch (error) {
        console.error("Failed to load driver monitoring data:", error);
        setRows([]);
        setStatsSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [
    pagination.currentPage,
    pagination.itemsPerPage,
    selectedPartnerType,
    debouncedSearch,
    selectedTier,
    selectedZone,
    selectedVehicle,
  ]);

  const onFilterChange = (setter) => (value) => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setter(value);
  };

  const onPageChange = (nextPage) => {
    setPagination((prev) => ({
      ...prev,
      currentPage: Math.max(1, Math.min(nextPage, prev.totalPages || 1)),
    }));
  };

  const onView = async (row) => {
    setIsViewOpen(true);
    setViewLoading(true);
    setViewError("");
    setViewPayload(row?.raw || null);
    const requestSeq = ++viewRequestSeq.current;

    try {
      const source = row?.raw || {};
      const resolvedPartnerType = selectedPartnerType;
      const partnerId = resolvePartnerId(source, resolvedPartnerType);

      const response = await fetchDriverTierHistory({
        partnerType: resolvedPartnerType,
        partnerId,
        limit: 20,
        offset: 0,
      });

      if (requestSeq !== viewRequestSeq.current) return;

      setViewPayload({
        selectedRow: source,
        history: response?.data || response?.rows || response || {},
      });
    } catch (error) {
      if (requestSeq !== viewRequestSeq.current) return;
      setViewError(error?.message || "Failed to load partner history");
    } finally {
      if (requestSeq !== viewRequestSeq.current) return;
      setViewLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (statsSummary) {
      return {
        totalDrivers: Number(statsSummary.totalPartners || statsSummary.totalDrivers || statsSummary.total || pagination.totalItems || 0),
        silverTier: Number(statsSummary.silverTier || statsSummary.silver || 0),
        goldTier: Number(statsSummary.goldTier || statsSummary.gold || 0),
        eliteTier: Number(statsSummary.eliteTier || statsSummary.elite || 0),
      };
    }

    const silver = rows.filter((row) => row.tier === "SILVER").length;
    const gold = rows.filter((row) => row.tier === "GOLD").length;
    const elite = rows.filter((row) => row.tier === "ELITE").length;

    return {
      totalDrivers: pagination.totalItems || rows.length,
      silverTier: silver,
      goldTier: gold,
      eliteTier: elite,
    };
  }, [statsSummary, rows, pagination.totalItems]);

  return (
    <div className="mt-5 mb-10 space-y-4 px-4 bg-white shadow-sm p-2">
      <div>
        <Typography variant="h5" color="blue-gray" className="font-bold">
          Driver Tier Monitoring
        </Typography>
        <Typography color="gray" className="mt-1 text-base font-normal">
          View driver statuses and tier eligibility
        </Typography>
      </div>

      <MonitoringStatCards stats={stats} />

      <MonitoringFilters
        selectedPartnerType={selectedPartnerType}
        onPartnerTypeChange={onFilterChange(setSelectedPartnerType)}
        search={search}
        onSearchChange={onFilterChange(setSearch)}
        selectedTier={selectedTier}
        onTierChange={onFilterChange(setSelectedTier)}
        selectedZone={selectedZone}
        onZoneChange={onFilterChange(setSelectedZone)}
        selectedVehicle={selectedVehicle}
        onVehicleChange={onFilterChange(setSelectedVehicle)}
        zoneOptions={zoneOptions}
      />

      <MonitoringTable
        rows={rows}
        loading={isLoading}
        pagination={pagination}
        onPageChange={onPageChange}
        onView={onView}
      />

      <ActionViewModal
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Partner History"
        loading={viewLoading}
        error={viewError}
        payload={viewPayload}
      />
    </div>
  );
}

export default DriverMonitoringList;
