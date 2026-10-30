import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Input, Spinner, Typography } from "@material-tailwind/react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { isSuperUserRole } from "@/utils/roleUtils";

export const VendorManagementInventory = ({ embeddedVendorId = "" } = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const vendorIdParam = new URLSearchParams(location.search).get("vendorId") || "";
  const [rows, setRows] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendorId, setVendorId] = useState(embeddedVendorId || vendorIdParam || "");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const canDelete = isSuperUserRole();

  useEffect(() => {
    Promise.all([
      ApiRequestUtils.get(API_ROUTES.GET_VENDORS),
      ApiRequestUtils.get(API_ROUTES.GET_PRODUCTS),
    ]).then(([vendorRes, productRes]) => {
      setVendors(Array.isArray(vendorRes?.data) ? vendorRes.data : vendorRes?.data?.rows || []);
      setProducts(Array.isArray(productRes?.data) ? productRes.data : productRes?.data?.rows || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!vendorId && (embeddedVendorId || vendorIdParam)) {
      setVendorId(embeddedVendorId || vendorIdParam);
      return;
    }
    if (!vendorId) return;
    setLoading(true);
    ApiRequestUtils.get(API_ROUTES.GET_VENDOR_INVENTORY.replace(":vendorId", vendorId))
      .then((r) => setRows(Array.isArray(r?.data) ? r.data : r?.data?.rows || []))
      .finally(() => setLoading(false));
  }, [vendorId, vendorIdParam, embeddedVendorId]);

  const vendorOptions = useMemo(() => vendors.map((v) => ({ value: v.vendorId ?? v.id, label: v.name ?? `Vendor ${v.vendorId ?? v.id}` })), [vendors]);
  const selectedVendorName = useMemo(() => {
    const match = vendors.find((v) => String(v?.vendorId ?? v?.id ?? "") === String(vendorId || embeddedVendorId || vendorIdParam || ""));
    const fallback = vendorId || embeddedVendorId || vendorIdParam || "";
    return match?.name || (fallback ? `Vendor ${fallback}` : "-");
  }, [vendors, vendorId, embeddedVendorId, vendorIdParam]);
  const vendorNameById = useMemo(() => {
    const map = new Map();
    vendors.forEach((vendor) => {
      const key = String(vendor?.vendorId ?? vendor?.id ?? "");
      if (key) map.set(key, vendor?.name || key);
    });
    return map;
  }, [vendors]);
  const productNameById = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      const key = String(product?.productId ?? product?.id ?? "");
      if (key) map.set(key, product?.name || key);
    });
    return map;
  }, [products]);
  const resolveVendorName = (value) => vendorNameById.get(String(value ?? "")) || value || "-";
  const resolveProductName = (value) => productNameById.get(String(value ?? "")) || value || "-";
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => [resolveVendorName(row?.vendorId), resolveProductName(row?.productId), row?.availableQty, row?.reservedQty, row?.warehouseLocation || row?.warehouseAddress?.name].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [rows, query, vendorNameById, productNameById]);

  const load = async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const response = await ApiRequestUtils.get(API_ROUTES.GET_VENDOR_INVENTORY.replace(":vendorId", vendorId));
      setRows(Array.isArray(response?.data) ? response.data : response?.data?.rows || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (rowId) => {
    if (!rowId || !window.confirm("Delete this inventory record?")) return;
    // delete is not supported for inventory
  };

  const vendorScopeId = vendorId || vendorIdParam || embeddedVendorId || "";

  return (
    <Card className="mx-auto mt-8 w-full bg-white shadow-none">
      <CardHeader variant="gradient" className="mt-2 rounded-2xl p-3 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
         
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            {!embeddedVendorId && !vendorIdParam ? (
              <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="min-w-[220px] rounded-md border-2 border-gray-700 bg-gray-600 px-3 py-2 text-gray-900">
                <option value="">Select Vendor</option>
                {vendorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : (
              <input value={selectedVendorName} disabled className="min-w-[220px] rounded-md border-2 border-gray-700 bg-gray-200 px-3 py-2 text-gray-900 hidden" />
            )}
            {/* <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search inventory..." className="min-w-[240px] rounded-md bg-white px-3 py-2 text-gray-900" /> */}
            <Button className="bg-pink-600 text-white font-bold shadow-sm hover:bg-pink-700" onClick={() => navigate(`/dashboard/vendor-management/inventory/add${vendorScopeId ? `?vendorId=${encodeURIComponent(vendorScopeId)}` : ""}`)}>Add Inventory</Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="px-0 pt-6 pb-2">
        <div className="overflow-x-auto">
          {loading ? <div className="flex justify-center py-10"><Spinner className="h-12 w-12" /></div> : (
            <table className="w-full min-w-[1100px] table-auto rounded-2xl bg-white shadow-sm">
              <thead className="bg-primary">
                <tr>
                  {["Vendor", "Product", "Available Qty", "Reserved Qty", "Warehouse Location", "Status", "Actions"].map((h) => <th key={h} className="border-b border-slate-200 py-4 px-5 text-left"><Typography variant="small" color="white" className="font-semibold">{h}</Typography></th>)}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? <tr><td colSpan={7} className="px-5 py-6 text-center text-sm text-blue-gray-500">No records found</td></tr> : filteredRows.map((row) => {
                  const rowId = row?.inventoryId ?? row?.id;
                  return (
                    <tr key={rowId || JSON.stringify(row)} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-5 py-4 text-sm">{resolveVendorName(row?.vendorId)}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-sm">{resolveProductName(row?.productId)}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.availableQty ?? "-"}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.reservedQty ?? "-"}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.warehouseLocation || "-"}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-sm"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${row?.status ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{row?.status ? "Active" : "Inactive"}</span></td>
                      <td className="border-b border-slate-100 px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outlined" onClick={() => navigate(`/dashboard/vendor-management/inventory/details/${rowId}${vendorScopeId ? `?vendorId=${encodeURIComponent(vendorScopeId)}` : ""}`)}>View</Button>
                          <Button size="sm" className={ColorStyles.bgColor} onClick={() => navigate(`/dashboard/vendor-management/inventory/edit/${rowId}${vendorScopeId ? `?vendorId=${encodeURIComponent(vendorScopeId)}` : ""}`)}>Edit</Button>
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

export default VendorManagementInventory;
