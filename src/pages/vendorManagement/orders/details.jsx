import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

export const VendorManagementOrdersDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const vendorIdParam = new URLSearchParams(location.search).get("vendorId") || "";
  const [record, setRecord] = useState(null);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    Promise.all([
      ApiRequestUtils.get(API_ROUTES.GET_ORDER_BY_ID.replace(":id", id)),
      ApiRequestUtils.get(API_ROUTES.GET_VENDORS).catch(() => null),
    ]).then(([orderResponse, vendorsResponse]) => {
      setRecord(orderResponse?.data || null);
      setVendors(Array.isArray(vendorsResponse?.data) ? vendorsResponse.data : vendorsResponse?.data?.rows || []);
    }).catch(() => {});
  }, [id]);

  const vendorNameById = useMemo(() => {
    const map = new Map();
    vendors.forEach((vendor) => {
      const key = String(vendor?.vendorId ?? vendor?.id ?? "");
      if (key) map.set(key, vendor?.name || key);
    });
    return map;
  }, [vendors]);

  const resolveVendorName = (value) => vendorNameById.get(String(value ?? "")) || value || "-";
  const resolveDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-GB").format(date);
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl bg-white shadow-none">
      <CardHeader variant="gradient" className={`rounded-2xl p-6 ${ColorStyles.bgColor}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="text-white">
            <div className="text-sm font-semibold">Order Details</div>
            {/* <div className="text-xl font-bold">{record?.orderNumber || `Order ${id}`}</div> */}
          </div>
          {/* <Button variant="outlined" className="border-white px-2 py-3 text-white" onClick={() => navigate("/dashboard/vendor-management/orders")}>Back to Orders</Button> */}
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Order Number</div>
            <div className="mt-1 text-sm text-gray-900">{record?.orderNumber || "-"}</div>
          </div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Vendor</div>
            <div className="mt-1 text-sm text-gray-900">{resolveVendorName(record?.vendorId)}</div>
          </div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Customer ID</div>
            <div className="mt-1 text-sm text-gray-900">{record?.customerId ?? "-"}</div>
          </div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Status</div>
            <div className="mt-1 text-sm text-gray-900">{record?.status || "-"}</div>
          </div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Payment Status</div>
            <div className="mt-1 text-sm text-gray-900">{record?.paymentStatus || "-"}</div>
          </div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Total Amount</div>
            <div className="mt-1 text-sm text-gray-900">{record?.totalAmount ?? "-"}</div>
          </div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Created At</div>
            <div className="mt-1 text-sm text-gray-900">{resolveDate(record?.created_at || record?.createdAt)}</div>
          </div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Note</div>
            <div className="mt-1 text-sm text-gray-900">{record?.note || "-"}</div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Button variant="outlined" className="border-gray-800 text-black" onClick={() => navigate("/dashboard/vendor-management/orders")}>Back</Button>
          {/* <Button className={ColorStyles.continueButtonColor} onClick={() => navigate(`/dashboard/vendor-management/orders/details/${id}${vendorIdParam ? `?vendorId=${encodeURIComponent(vendorIdParam)}` : ""}`)}>Refresh</Button> */}
        </div>
      </CardBody>
    </Card>
  );
};

export default VendorManagementOrdersDetails;
