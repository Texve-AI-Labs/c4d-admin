import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

export const VendorManagementCatalogMappingDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const vendorIdParam = new URLSearchParams(location.search).get("vendorId") || "";
  const [record, setRecord] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!vendorIdParam) {
          setRecord(null);
          return;
        }
        const [res, vendorRes, categoryRes, productRes] = await Promise.all([
          ApiRequestUtils.get(API_ROUTES.GET_VENDOR_CATALOG.replace(":vendorId", vendorIdParam)),
          ApiRequestUtils.get(API_ROUTES.GET_VENDORS).catch(() => null),
          ApiRequestUtils.get(API_ROUTES.GET_CATEGORIES).catch(() => null),
          ApiRequestUtils.get(API_ROUTES.GET_PRODUCTS).catch(() => null),
        ]);
        const rows = Array.isArray(res?.data) ? res.data : res?.data?.rows || res?.data?.data || [];
        setRecord(rows.find((row) => String(row?.id ?? row?.catalogMappingId ?? "") === String(id)) || null);
        setVendors(Array.isArray(vendorRes?.data) ? vendorRes.data : vendorRes?.data?.rows || []);
        setCategories(Array.isArray(categoryRes?.data) ? categoryRes.data : categoryRes?.data?.rows || []);
        setProducts(Array.isArray(productRes?.data) ? productRes.data : productRes?.data?.rows || []);
      } catch {
        setRecord(null);
      }
    };
    load();
  }, [id, vendorIdParam]);

  const vendorNameById = useMemo(() => new Map(vendors.map((vendor) => [String(vendor?.vendorId ?? vendor?.id ?? ""), vendor?.name || String(vendor?.vendorId ?? vendor?.id ?? "")])), [vendors]);
  const categoryNameById = useMemo(() => new Map(categories.map((category) => [String(category?.categoryId ?? category?.id ?? ""), category?.name || String(category?.categoryId ?? category?.id ?? "")])), [categories]);
  const productNameById = useMemo(() => new Map(products.map((product) => [String(product?.productId ?? product?.id ?? ""), product?.name || String(product?.productId ?? product?.id ?? "")])), [products]);

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl bg-white shadow-none">
      <CardHeader variant="gradient" className={`rounded-2xl p-6 ${ColorStyles.bgColor}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="text-white">
            <div className="text-sm font-semibold opacity-80">Catalog Mapping Details</div>
            <div className="text-2xl font-bold">{record?.overrideName || record?.productName || "Catalog Mapping"}</div>
          </div>
          <Button variant="outlined" className="border-white text-white" onClick={() => navigate(vendorIdParam ? `/dashboard/vendor-management/vendors/details/${vendorIdParam}?tab=Catalog%20Mapping` : "/dashboard/vendor-management/catalog-mapping")}>Back to List</Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">ID</div><div className="mt-1 text-sm text-gray-900">{record?.id || record?.catalogMappingId || "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Vendor</div><div className="mt-1 text-sm text-gray-900">{record?.vendorName || vendorNameById.get(String(record?.vendorId ?? "")) || record?.vendorId || "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Category</div><div className="mt-1 text-sm text-gray-900">{record?.categoryName || categoryNameById.get(String(record?.categoryId ?? "")) || record?.categoryId || "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Product</div><div className="mt-1 text-sm text-gray-900">{record?.productName || productNameById.get(String(record?.productId ?? "")) || record?.productId || "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Override Name</div><div className="mt-1 text-sm text-gray-900">{record?.overrideName || "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Visibility</div><div className="mt-1 text-sm text-gray-900">{record?.isVisible ? "Visible" : "Hidden"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Sort Order</div><div className="mt-1 text-sm text-gray-900">{record?.sortOrder ?? "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Image</div><div className="mt-1 text-sm text-gray-900">{record?.overrideImageUrl || record?.image || "-"}</div></div>
        </div>
        {record?.overrideImageUrl || record?.image ? (
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="mb-2 text-sm font-bold text-gray-700">Image Preview</div>
            <img src={record.overrideImageUrl || record.image} alt="override" className="h-28 w-28 rounded object-cover" />
          </div>
        ) : null}
        <div className="flex justify-center gap-3">
          <Button variant="outlined" onClick={() => navigate(vendorIdParam ? `/dashboard/vendor-management/vendors/details/${vendorIdParam}?tab=Catalog%20Mapping` : "/dashboard/vendor-management/catalog-mapping")}>Back</Button>
          <Button className={ColorStyles.continueButtonColor} onClick={() => navigate(`/dashboard/vendor-management/catalog-mapping/edit/${id}${vendorIdParam ? `?vendorId=${encodeURIComponent(vendorIdParam)}` : ""}`)}>Edit</Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default VendorManagementCatalogMappingDetails;
