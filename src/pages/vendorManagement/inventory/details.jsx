import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

export const VendorManagementInventoryDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const vendorIdParam = new URLSearchParams(location.search).get("vendorId") || "";
  const [record, setRecord] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!vendorIdParam) {
          setRecord(null);
          return;
        }
        const [res, vendorRes, productRes] = await Promise.all([
          ApiRequestUtils.get(API_ROUTES.GET_VENDOR_INVENTORY.replace(":vendorId", vendorIdParam)),
          ApiRequestUtils.get(API_ROUTES.GET_VENDORS).catch(() => null),
          ApiRequestUtils.get(API_ROUTES.GET_PRODUCTS).catch(() => null),
        ]);
        const rows = Array.isArray(res?.data) ? res.data : res?.data?.rows || res?.data?.data || [];
        setRecord(rows.find((row) => String(row?.inventoryId ?? row?.id ?? "") === String(id)) || null);
        setVendors(Array.isArray(vendorRes?.data) ? vendorRes.data : vendorRes?.data?.rows || []);
        setProducts(Array.isArray(productRes?.data) ? productRes.data : productRes?.data?.rows || []);
      } catch {
        setRecord(null);
      }
    };
    load();
  }, [id, vendorIdParam]);

  const vendorNameById = new Map(vendors.map((vendor) => [String(vendor?.vendorId ?? vendor?.id ?? ""), vendor?.name || String(vendor?.vendorId ?? vendor?.id ?? "")]));
  const productNameById = new Map(products.map((product) => [String(product?.productId ?? product?.id ?? ""), product?.name || String(product?.productId ?? product?.id ?? "")]));

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl bg-white shadow-none">
      <CardHeader variant="gradient" className={`rounded-2xl p-6 ${ColorStyles.bgColor}`}>
        <div className="text-white">
          <div className="text-sm font-semibold">Inventory Detail</div>
          {/* <div className="text-2xl font-bold">Inventory #{id}</div> */}
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">ID</div><div className="mt-1 text-sm text-gray-900">{record?.inventoryId || record?.id || "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Vendor</div><div className="mt-1 text-sm text-gray-900">{record?.vendorName || vendorNameById.get(String(record?.vendorId ?? "")) || record?.vendorId || "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Product</div><div className="mt-1 text-sm text-gray-900">{record?.productName || productNameById.get(String(record?.productId ?? "")) || record?.productId || "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Available Qty</div><div className="mt-1 text-sm text-gray-900">{record?.availableQty ?? "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Reserved Qty</div><div className="mt-1 text-sm text-gray-900">{record?.reservedQty ?? "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Warehouse Location</div><div className="mt-1 text-sm text-gray-900">{record?.warehouseLocation || "-"}</div></div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4"><div className="text-sm font-bold text-gray-700">Status</div><div className="mt-1 text-sm text-gray-900">{record?.status ? "Active" : "Inactive"}</div></div>
        </div>
        <div className="flex justify-center gap-3">
          <Button type="button" variant="outlined" onClick={() => navigate(vendorIdParam ? `/dashboard/vendor-management/vendors/details/${vendorIdParam}?tab=Inventory` : "/dashboard/vendor-management/inventory")}>Back</Button>
          <Button type="button" className={ColorStyles.continueButtonColor} onClick={() => navigate(`/dashboard/vendor-management/inventory/edit/${id}${vendorIdParam ? `?vendorId=${encodeURIComponent(vendorIdParam)}` : ""}`)}>Edit</Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default VendorManagementInventoryDetails;
