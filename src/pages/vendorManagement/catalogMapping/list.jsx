import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Input, Spinner, Typography } from "@material-tailwind/react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { isSuperUserRole } from "@/utils/roleUtils";

export const VendorManagementCatalogMapping = ({ embeddedVendorId = "" } = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const vendorId = new URLSearchParams(location.search).get("vendorId") || "";
  const [rows, setRows] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState(embeddedVendorId || vendorId || "");
  const [query, setQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const canDelete = isSuperUserRole();

  const load = async (vendorId = selectedVendorId) => {
    try {
      setLoading(true);
      const [catalogRes, vendorsRes] = await Promise.all([
        vendorId ? ApiRequestUtils.get(API_ROUTES.GET_VENDOR_CATALOG.replace(":vendorId", vendorId)).catch(() => null) : Promise.resolve(null),
        ApiRequestUtils.get(API_ROUTES.GET_VENDORS).catch(() => null),
      ]);
      const catalogRows = Array.isArray(catalogRes?.data) ? catalogRes.data : catalogRes?.data?.rows || catalogRes?.data?.data || [];
      setRows(catalogRows);
      setVendors(Array.isArray(vendorsRes?.data) ? vendorsRes.data : vendorsRes?.data?.rows || []);
      ApiRequestUtils.get(API_ROUTES.GET_CATEGORIES).then((c) => setCategories(Array.isArray(c?.data) ? c.data : c?.data?.rows || [])).catch(() => {});
      ApiRequestUtils.get(API_ROUTES.GET_PRODUCTS).then((p) => setProducts(Array.isArray(p?.data) ? p.data : p?.data?.rows || [])).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!embeddedVendorId && !vendorId) {
      setRows([]);
      setLoading(false);
      return;
    }
    load(embeddedVendorId || vendorId || selectedVendorId);
  }, []);

  useEffect(() => {
    if (embeddedVendorId) {
      setSelectedVendorId(String(embeddedVendorId));
      load(String(embeddedVendorId));
    }
  }, [embeddedVendorId]);

  useEffect(() => {
    if (!embeddedVendorId && vendorId) {
      setSelectedVendorId(String(vendorId));
      load(String(vendorId));
    }
  }, [embeddedVendorId, vendorId]);

  const vendorOptions = useMemo(() => vendors.map((vendor) => ({ value: vendor.vendorId ?? vendor.id, label: vendor.name ?? `Vendor ${vendor.vendorId ?? vendor.id}` })), [vendors]);
  const selectedVendorName = useMemo(() => {
    const match = vendors.find((vendor) => String(vendor?.vendorId ?? vendor?.id ?? "") === String(selectedVendorId || embeddedVendorId || vendorId || ""));
    const fallback = selectedVendorId || embeddedVendorId || vendorId || "";
    return match?.name || (fallback ? `Vendor ${fallback}` : "-");
  }, [vendors, selectedVendorId, embeddedVendorId, vendorId]);
  const categoryNameById = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      const key = String(category?.categoryId ?? category?.id ?? "");
      if (key) map.set(key, category?.name || key);
    });
    return map;
  }, [categories]);
  const productNameById = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      const key = String(product?.productId ?? product?.id ?? "");
      if (key) map.set(key, product?.name || key);
    });
    return map;
  }, [products]);
  const vendorNameById = useMemo(() => {
    const map = new Map();
    vendors.forEach((vendor) => {
      const key = String(vendor?.vendorId ?? vendor?.id ?? "");
      if (key) map.set(key, vendor?.name || key);
    });
    return map;
  }, [vendors]);

  const resolveVendorName = (value) => vendorNameById.get(String(value ?? "")) || value || "-";
  const resolveCategoryName = (value) => categoryNameById.get(String(value ?? "")) || value || "-";
  const resolveProductName = (value) => productNameById.get(String(value ?? "")) || value || "-";

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return rows.filter((row) => {
      const searchable = [
        resolveCategoryName(row?.categoryId),
        resolveProductName(row?.productId),
        resolveVendorName(row?.vendorId),
        row?.overrideName,
      ].filter(Boolean).join(" ").toLowerCase();
      const effectiveVendorId = selectedVendorId || vendorId;
      const vendorMatch = !effectiveVendorId || String(row?.vendorId ?? "") === String(effectiveVendorId);
      const visibilityMatch =
        !visibilityFilter ||
        String(Boolean(row?.isVisible)) === visibilityFilter;
      return searchable.includes(search) && vendorMatch && visibilityMatch;
    });
  }, [rows, query, selectedVendorId, visibilityFilter, vendorId]);

  const handleDelete = async (rowId) => {
    if (!rowId || !window.confirm("Delete this catalog mapping?")) return;
    await ApiRequestUtils.delete(`/catalog-mappings/${rowId}`);
    await load();
  };
  const vendorScopeId = selectedVendorId || vendorId || embeddedVendorId || "";

  return (
    <Card className="mx-auto mt-8 w-full bg-white shadow-none">
      <CardHeader variant="gradient" className="mt-2 rounded-2xl p-3 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            {/* <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search mapping..." className="min-w-[240px] rounded-md bg-white px-3 py-2 text-gray-900" /> */}
            {!embeddedVendorId ? (
              <select value={selectedVendorId} onChange={(e) => { setSelectedVendorId(e.target.value); load(e.target.value); }} className="min-w-[180px] rounded-md border-2 bg-white px-2 py-2 text-gray-900">
                <option value="">Vendor</option>
                {vendorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : (
              <input value={selectedVendorName} disabled className="min-w-[180px] rounded-md border-2 bg-gray-100 px-2 py-2 text-gray-900 hidden" />
            )}
            <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)} className="min-w-[180px] rounded-md border-2 bg-white px-2 py-2 text-gray-900">
              <option value="">Visibility</option>
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
            <Button className="bg-pink-600 text-white font-bold" onClick={() => navigate(`/dashboard/vendor-management/catalog-mapping/add${vendorScopeId ? `?vendorId=${encodeURIComponent(vendorScopeId)}` : ""}`)}>Add Mapping</Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="px-0 pt-6 pb-2">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Spinner className="h-12 w-12" /></div>
          ) : (
            <table className="w-full min-w-[1200px] table-auto rounded-2xl bg-white shadow-sm">
              <thead className="bg-primary">
                <tr>
                  {["Category", "Product", "Override Name", "Image", "Vendor", "Visible", "Sort", "Actions"].map((heading) => (
                    <th key={heading} className="border-b border-slate-200 py-3 px-2 text-left">
                      <Typography variant="small" color="white" className="font-semibold">{heading}</Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-6 text-center text-sm text-blue-gray-500">No records found</td></tr>
                ) : filteredRows.map((row) => {
                  const rowId = row?.catalogMappingId ?? row?.id;
                  return (
                    <tr key={rowId || JSON.stringify(row)} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-5 py-4 text-sm">{resolveCategoryName(row?.categoryId)}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-sm">{resolveProductName(row?.productId)}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.overrideName || "-"}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.image || row?.overrideImageUrl ? <img src={row?.image || row?.overrideImageUrl} alt={row?.overrideName || "override"} className="h-10 w-10 rounded object-cover" /> : "-"}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-sm">{resolveVendorName(row?.vendorId)}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-sm"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${row?.isVisible ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{row?.isVisible ? "Visible" : "Hidden"}</span></td>
                      <td className="border-b border-slate-100 px-5 py-4 text-sm">{row?.sortOrder ?? "-"}</td>
                      <td className="border-b border-slate-100 px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outlined" onClick={() => navigate(`/dashboard/vendor-management/catalog-mapping/details/${rowId}${vendorScopeId ? `?vendorId=${encodeURIComponent(vendorScopeId)}` : ""}`)}>View</Button>
                          <Button size="sm" className={ColorStyles.bgColor} onClick={() => navigate(`/dashboard/vendor-management/catalog-mapping/edit/${rowId}${vendorScopeId ? `?vendorId=${encodeURIComponent(vendorScopeId)}` : ""}`)}>Edit</Button>
                          {/* {canDelete ? <Button size="sm" color="red" variant="outlined" onClick={() => handleDelete(rowId)}>Delete</Button> : null} */}
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

export default VendorManagementCatalogMapping;
