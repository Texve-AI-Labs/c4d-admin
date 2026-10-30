import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Spinner, Typography } from "@material-tailwind/react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { isSuperUserRole } from "@/utils/roleUtils";

export const VendorManagementProducts = ({ embeddedVendorId = "" } = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const vendorId = embeddedVendorId || new URLSearchParams(location.search).get("vendorId") || "";
  const categoryIdParam = new URLSearchParams(location.search).get("categoryId") || "";
  const productIdParam = new URLSearchParams(location.search).get("productId") || "";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const canDelete = isSuperUserRole();
  const resolveImageUrl = (value) => {
    if (Array.isArray(value)) {
      return value.find(Boolean) || "";
    }
    if (typeof value === "string") {
      return value;
    }
    return value?.url || value?.path || value?.imageUrl || value?.src || "";
  };

  // useEffect(() => {
  //   console.log("[ProductsList] context", { embeddedVendorId, vendorId, categoryIdParam, productIdParam });
  // }, [embeddedVendorId, vendorId, categoryIdParam, productIdParam]);

  const load = async () => {
    try {
      setLoading(true);
      const response = await ApiRequestUtils.get(API_ROUTES.GET_PRODUCTS);
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
    const hasVendorField = rows.some((row) => row && Object.prototype.hasOwnProperty.call(row, "vendorId"));
    const hasCategoryField = rows.some((row) => row && Object.prototype.hasOwnProperty.call(row, "categoryId"));
    const hasProductField = rows.some((row) => row && Object.prototype.hasOwnProperty.call(row, "productId"));
    return rows.filter((row) => {
      const vendorMatch = !vendorId || !hasVendorField || String(row?.vendorId ?? "") === String(vendorId);
      const categoryMatch = !categoryIdParam || !hasCategoryField || String(row?.categoryId ?? "") === String(categoryIdParam);
      const productMatch = !productIdParam || !hasProductField || String(row?.productId ?? "") === String(productIdParam);
      const searchable = [row?.name, row?.productName, row?.sku, row?.brand].filter(Boolean).join(" ").toLowerCase();
      const statusMatch =
        !statusFilter ||
        (statusFilter === "true" && row?.status) ||
        (statusFilter === "false" && !row?.status);
      return searchable.includes(search) && statusMatch && vendorMatch && categoryMatch && productMatch;
    });
  }, [rows, query, statusFilter, vendorId, categoryIdParam, productIdParam]);

  const handleDelete = async (rowId) => {
    if (!rowId || !window.confirm("Delete this product?")) return;
    await ApiRequestUtils.delete(`/products/${rowId}`);
    await load();
  };

  return (
    <Card className="mx-auto mt-8 w-full bg-white shadow-none">
      <CardHeader variant="gradient" className={`rounded-2xl p-6 ${ColorStyles.bgColor}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Typography variant="h6" color="white">Products</Typography>
          </div>
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-w-[160px] rounded-md border border-white/20 bg-white px-3 py-2 text-gray-900">
              <option value="">Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <Button className="bg-pink-400 text-white font-bold" onClick={() => navigate(`/dashboard/vendor-management/products/add${vendorId ? `?vendorId=${encodeURIComponent(vendorId)}` : ""}`)}>
              Add Product
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="px-0 pt-6 pb-2">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Spinner className="h-12 w-12" /></div>
          ) : (
            <table className="w-full min-w-[1100px] table-auto rounded-2xl bg-white shadow-sm">
              <thead className="bg-slate-100">
                <tr>
                  {["Image", "Image URL", "Name", "SKU (Unique)", "Brand", "Status", "Actions"].map((h) => (
                    <th key={h} className="border-b border-slate-200 py-3 px-2 text-left">
                      <Typography variant="small" color="blue-gray" className="font-semibold">{h}</Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-6 text-center text-sm text-blue-gray-500">No records found</td></tr>
                ) : (
                  filteredRows.map((row) => {
                    const rowId = row?.productId ?? row?.id;
                    const firstImage = resolveImageUrl(row?.images) || row?.imageUrl || row?.image;
                    return (
                      <tr key={rowId || JSON.stringify(row)} className="hover:bg-slate-50">
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">{firstImage ? <img src={firstImage} alt={row?.name || "product"} className="h-10 w-10 rounded object-cover" /> : "-"}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm max-w-[240px] truncate">{firstImage || "-"}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.name || row?.productName || `Product ${rowId ?? "-"}`}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.sku ?? "-"}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.brand ?? "-"}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-sm"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${row?.status ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{row?.status ? "Active" : "Inactive"}</span></td>
                        <td className="border-b border-slate-100 px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outlined" onClick={() => navigate(`/dashboard/vendor-management/products/details/${rowId}${vendorId ? `?vendorId=${encodeURIComponent(vendorId)}` : ""}`)}>View</Button>
                            <Button size="sm" className={ColorStyles.bgColor} onClick={() => navigate(`/dashboard/vendor-management/products/edit/${rowId}${vendorId ? `?vendorId=${encodeURIComponent(vendorId)}` : ""}`)}>Edit</Button>
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

export default VendorManagementProducts;
