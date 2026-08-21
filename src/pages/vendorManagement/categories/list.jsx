import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Input, Spinner, Typography } from "@material-tailwind/react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { isSuperUserRole } from "@/utils/roleUtils";

export const VendorManagementCategories = ({ embeddedVendorId = "" } = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const vendorId = embeddedVendorId || new URLSearchParams(location.search).get("vendorId") || "";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const canDelete = isSuperUserRole();
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    console.log("[CategoriesList] context", { embeddedVendorId, vendorId });
  }, [embeddedVendorId, vendorId]);

  useEffect(() => {
    ApiRequestUtils.get(API_ROUTES.GET_VENDORS).then((r) => setVendors(Array.isArray(r?.data) ? r.data : r?.data?.rows || [])).catch(() => {});
  }, []);

  const vendorName = useMemo(() => {
    if (!vendorId) return "";
    const match = vendors.find((v) => String(v?.vendorId ?? v?.id ?? "") === String(vendorId));
    return match?.name || `Vendor ${vendorId}`;
  }, [vendors, vendorId]);

  const vendorNameById = useMemo(() => {
    return (value) => {
      if (!value) return "-";
      const match = vendors.find((v) => String(v?.vendorId ?? v?.id ?? "") === String(value));
      return match?.name || `Vendor ${value}`;
    };
  }, [vendors]);

  const load = async () => {
    try {
      setLoading(true);
      const response = await ApiRequestUtils.get(API_ROUTES.GET_CATEGORIES);
      setRows(Array.isArray(response?.data) ? response.data : response?.data?.rows || []);
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
      const vendorMatch = !vendorId || String(row?.vendorId ?? "") === String(vendorId);
      const searchable = [row?.name, row?.slug, row?.vendorId, row?.sortOrder].filter(Boolean).join(" ").toLowerCase();
      const statusMatch =
        !statusFilter ||
        (statusFilter === "true" && row?.status) ||
        (statusFilter === "false" && !row?.status);
      return searchable.includes(search) && statusMatch && vendorMatch;
    });
  }, [rows, query, statusFilter, vendorId]);

  const handleDelete = async (rowId) => {
    if (!rowId || !window.confirm("Delete this category?")) return;
    await ApiRequestUtils.delete(`/categories/${rowId}`);
    await load();
  };

  return (
    <Card className="mx-auto mt-8 w-full bg-white shadow-none">
      <CardHeader variant="gradient" className='rounded-2xl p-3 mt-2 shadow-none'>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            {/* <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search categories..." className="min-w-[240px] rounded-md bg-white px-3 py-2 text-gray-900" /> */}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-w-[160px] rounded-md border-2 px-2 py-2 text-gray-900">
              <option value="">Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <Button className="bg-pink-600 font-bold text-white" onClick={() => navigate(`/dashboard/vendor-management/categories/add${vendorId ? `?vendorId=${encodeURIComponent(vendorId)}` : ""}`)}>Add Category</Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="px-0 pt-6 pb-2">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Spinner className="h-12 w-12" /></div>
          ) : (
            <table className="w-full min-w-[1100px] table-auto rounded-2xl bg-white shadow-sm">
              <thead className="bg-primary">
                <tr>
                  {["Vendor", "Name", "Slug", "Sort Order", "Status", "Actions"].map((h) => (
                    <th key={h} className="border-b border-slate-200 py-3 px-2 text-left">
                      <Typography variant="small" color="white" className="font-semibold">{h}</Typography></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-6 text-center text-sm text-blue-gray-500">No records found</td></tr>
                ) : (
                  filteredRows.map((row) => {
                    const rowId = row?.categoryId ?? row?.id;
                    return (
                      <tr key={rowId || JSON.stringify(row)} className="hover:bg-slate-50">
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">{vendorNameById(row?.vendorId)}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.name ?? "-"}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.slug ?? "-"}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.sortOrder ?? "-"}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${row?.status ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{row?.status ? "Active" : "Inactive"}</span></td>
                        <td className="border-b border-slate-100 px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outlined" onClick={() => navigate(`/dashboard/vendor-management/categories/details/${rowId}${vendorId ? `?vendorId=${encodeURIComponent(vendorId)}` : ""}`)}>View</Button>
                            <Button size="sm" className={ColorStyles.bgColor} onClick={() => navigate(`/dashboard/vendor-management/categories/edit/${rowId}${vendorId ? `?vendorId=${encodeURIComponent(vendorId)}` : ""}`)}>Edit</Button>
                            {/* {canDelete && <Button size="sm" color="red" variant="outlined" onClick={() => handleDelete(rowId)}>Delete</Button>} */}
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

export default VendorManagementCategories;
