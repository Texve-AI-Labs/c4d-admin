import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Input, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { isSuperUserRole } from "@/utils/roleUtils";

export const VendorManagementVendors = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const canDelete = isSuperUserRole();

  const load = async () => {
    try {
      setLoading(true);
      const response = await ApiRequestUtils.get(API_ROUTES.GET_VENDORS);
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
      const searchable = [row?.name, row?.slug, row?.city, row?.storefrontUrl].filter(Boolean).join(" ").toLowerCase();
      const cityMatch = !cityFilter || String(row?.city || "").toLowerCase() === cityFilter.toLowerCase();
      const statusMatch = !statusFilter || String(Boolean(row?.status)) === statusFilter;
      return searchable.includes(search) && cityMatch && statusMatch;
    });
  }, [rows, query, cityFilter, statusFilter]);

  const handleDelete = async (rowId) => {
    if (!rowId || !window.confirm("Delete this vendor?")) return;
    await ApiRequestUtils.delete(API_ROUTES.GET_VENDOR_BY_ID(rowId));
    await load();
  };

  return (
    <Card className="mx-auto mt-8 w-full bg-white shadow-none">
      <CardHeader variant="gradient" className={`rounded-2xl p-6 ${ColorStyles.bgColor}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {/* <div className="text-sm font-semibold text-white/80">Vendor Directory</div> */}
            <Typography variant="h6" color="white">Vendors</Typography>
          </div>
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            {/* <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search vendors..." className="min-w-[240px] rounded-md bg-white px-3 py-2 text-gray-900" /> */}
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="min-w-[160px] rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900">
              <option value="">City</option>
              {[...new Set(rows.map((row) => row?.city).filter(Boolean))].map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-w-[160px] rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900">
              <option value="">Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <Button className="bg-pink-400 text-white font-bold" onClick={() => navigate("/dashboard/vendor-management/vendors/add")}>
              Add Vendor
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="px-0 pt-6 pb-2">
        <div className="overflow-x-auto">
          {loading ? <div className="flex justify-center py-10"><Spinner className="h-12 w-12" /></div> : (
            <table className="w-full min-w-[1100px] table-auto rounded-2xl bg-white shadow-sm">
              <thead className="bg-slate-100">
                <tr>
                  {["Logo", "Vendor Name", "City", "Status", "Actions"].map((h) => (
                    <th key={h} className="border-b border-slate-200 py-4 px-5 text-left"><Typography variant="small" color="blue-gray" className="font-semibold">{h}</Typography></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? <tr><td colSpan={6} className="px-5 py-6 text-center text-sm text-blue-gray-500">No records found</td></tr> : filteredRows.map((row) => {
                  const rowId = row?.vendorId ?? row?.id;
                  return (
                    <tr key={rowId || JSON.stringify(row)} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.logoUrl ? <img src={row.logoUrl} alt={row?.name || "logo"} className="h-10 w-10 rounded object-cover" /> : "-"}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-sm"><div className="font-semibold text-slate-900">{row?.name || "-"}</div><div className="text-xs text-slate-500">{row?.slug || "-"}</div></td>
                      <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.city || "-"}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-sm"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${row?.status ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{row?.status ? "Active" : "Inactive"}</span></td>
                      <td className="border-b border-slate-100 px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {/* <Button size="sm" variant="outlined" onClick={() => navigate(`/dashboard/vendor-management/vendors/details/${rowId}`)}>View</Button> */}
                          <Button size="sm" className={ColorStyles.bgColor} onClick={() => navigate(`/dashboard/vendor-management/vendors/edit/${rowId}`)}>Edit</Button>
                          <Button size="sm" variant="outlined" onClick={() => navigate(`/dashboard/vendor-management/vendors/details/${rowId}`)}>Product Mapping</Button>
                          {/* {canDelete && <Button size="sm" color="red" variant="outlined" onClick={() => handleDelete(rowId)}>Delete</Button>} */}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default VendorManagementVendors;