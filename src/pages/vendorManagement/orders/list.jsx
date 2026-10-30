import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Spinner, Typography } from "@material-tailwind/react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

export const VendorManagementOrders = ({ embeddedVendorId = "" } = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const vendorIdParam = new URLSearchParams(location.search).get("vendorId") || "";
  const vendorId = embeddedVendorId || vendorIdParam || "";
  const [rows, setRows] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const [ordersResponse, vendorsResponse] = await Promise.all([
        ApiRequestUtils.get(API_ROUTES.GET_VENDOR_ORDERS),
        ApiRequestUtils.get(API_ROUTES.GET_VENDORS).catch(() => null),
      ]);
      setRows(Array.isArray(ordersResponse?.data) ? ordersResponse.data : ordersResponse?.data?.rows || ordersResponse?.data?.data || []);
      setVendors(Array.isArray(vendorsResponse?.data) ? vendorsResponse.data : vendorsResponse?.data?.rows || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return rows.filter((row) => {
      const searchable = [
        row?.orderNumber,
        row?.status,
        row?.paymentStatus,
        row?.note,
        row?.customerId,
        row?.vendorId,
      ].filter(Boolean).join(" ").toLowerCase();
      const vendorMatch = !vendorId || String(row?.vendorId ?? "") === String(vendorId);
      const statusMatch =
        !statusFilter ||
        (statusFilter === "true" && row?.status) ||
        (statusFilter === "false" && !row?.status);
      return searchable.includes(search) && vendorMatch && statusMatch;
    });
  }, [rows, query, statusFilter, vendorId]);

  const resolveDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-GB").format(date);
  };
  const vendorNameById = useMemo(() => {
    const map = new Map();
    vendors.forEach((vendor) => {
      const key = String(vendor?.vendorId ?? vendor?.id ?? "");
      if (key) map.set(key, vendor?.name || key);
    });
    return map;
  }, [vendors]);
  const resolveVendorName = (value) => vendorNameById.get(String(value ?? "")) || value || "-";

  return (
    <Card className="mx-auto mt-8 w-full bg-white shadow-none">
      <CardHeader variant="gradient" className={`rounded-2xl p-6 ${ColorStyles.bgColor}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Typography variant="h6" color="white">Orders</Typography>
          </div>
          {/* <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders..."
              className="min-w-[260px] rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900 outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-[160px] rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900"
            >
              <option value="">Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <Button
              className="bg-pink-400 text-white font-bold"
              onClick={() => navigate(`/dashboard/vendor-management/orders${vendorId ? `?vendorId=${encodeURIComponent(vendorId)}` : ""}`)}
            >
              Refresh
            </Button>
          </div> */}
        </div>
      </CardHeader>
      <CardBody className="px-0 pt-6 pb-2">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-12 w-12" />
            </div>
          ) : (
            <table className="w-full min-w-[1200px] table-auto rounded-2xl bg-white shadow-sm">
              <thead className="bg-slate-100">
                <tr>
                  {["Order Number", "Vendor", "Customer ID", "Status", "Payment Status", "Total Amount", "Created At", "Actions"].map((heading) => (
                    <th key={heading} className="border-b border-slate-200 py-3 px-2 text-left">
                      <Typography variant="small" color="blue-gray" className="font-semibold">
                        {heading}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-6 text-center text-sm text-blue-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const rowId = row?.orderId ?? row?.id;
                    return (
                      <tr key={rowId || JSON.stringify(row)} className="hover:bg-slate-50">
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.orderNumber || `Order ${rowId ?? "-"}`}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">{resolveVendorName(row?.vendorId)}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.customerId ?? "-"}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row?.status ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {row?.status || "Unknown"}
                          </span>
                        </td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.paymentStatus || "-"}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.totalAmount ?? "-"}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">{resolveDate(row?.created_at || row?.createdAt)}</td>
                        <td className="border-b border-slate-100 px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outlined"
                              onClick={() => navigate(`/dashboard/vendor-management/orders/details/${rowId}${vendorId ? `?vendorId=${encodeURIComponent(vendorId)}` : ""}`)}
                            >
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default VendorManagementOrders;
