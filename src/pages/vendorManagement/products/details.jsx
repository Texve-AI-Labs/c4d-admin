import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

export const VendorManagementProductsDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const vendorIdParam = new URLSearchParams(location.search).get("vendorId") || "";
  const [record, setRecord] = useState(null);
  const [vendors, setVendors] = useState([]);
  const resolveImageUrl = (value) => {
    if (Array.isArray(value)) return value.find(Boolean) || "";
    if (typeof value === "string") return value;
    return value?.url || value?.path || value?.imageUrl || value?.src || "";
  };

  useEffect(() => {
    Promise.all([
      ApiRequestUtils.get(API_ROUTES.GET_VENDORS),
      ApiRequestUtils.get(API_ROUTES.GET_PRODUCT_BY_ID.replace(":id", id)),
    ]).then(([vendorsResponse, productResponse]) => {
      setVendors(Array.isArray(vendorsResponse?.data) ? vendorsResponse.data : vendorsResponse?.data?.rows || []);
      setRecord(productResponse?.data || null);
    }).catch(() => {});
  }, [id]);

  const firstImage = resolveImageUrl(record?.images) || record?.imageUrl || record?.image || "";
  const vendorName = (() => {
    const match = vendors.find((v) => String(v?.vendorId ?? v?.id ?? "") === String(record?.vendorId ?? vendorIdParam ?? ""));
    const fallback = record?.vendorId ?? vendorIdParam ?? "";
    return match?.name || (fallback ? `Vendor ${fallback}` : "-");
  })();

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl bg-white shadow-none">      
        <div className="text-black p-3">
          <div className="text-xl font-semibold">Product Detail</div>
          {/* <div className="text-2xl font-bold">{record?.name || "Product"}</div> */}
        </div>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Name</div><div className="mt-1 text-sm text-gray-900">{record?.name || "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Vendor</div><div className="mt-1 text-sm text-gray-900">{vendorName}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">SKU (Unique)</div><div className="mt-1 text-sm text-gray-900">{record?.sku || "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Brand</div><div className="mt-1 text-sm text-gray-900">{record?.brand || "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Status</div><div className="mt-1 text-sm text-gray-900">{record?.status ? "Active" : "Inactive"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Description</div><div className="mt-1 text-sm text-gray-900">{record?.description || "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Image URL</div><div className="mt-1 text-sm text-gray-900">{firstImage || "-"}</div></div>
        </div>
        {firstImage ? (
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="mb-2 text-sm font-bold text-gray-700">Image Preview</div>
            <img src={firstImage} alt={record?.name || "product"} className="h-28 w-28 rounded object-cover" />
          </div>
        ) : null}
        <div className="flex justify-center gap-3">
          <Button type="button" variant="outlined" onClick={() => navigate(vendorIdParam ? `/dashboard/vendor-management/vendors/details/${vendorIdParam}?tab=Products` : "/dashboard/vendor-management/products")}>Back</Button>
          <Button type="button" className={ColorStyles.continueButtonColor} onClick={() => navigate(`/dashboard/vendor-management/products/edit/${id}${vendorIdParam ? `?vendorId=${encodeURIComponent(vendorIdParam)}` : ""}`)}>Edit</Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default VendorManagementProductsDetails;
