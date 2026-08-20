import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

export const VendorManagementPricing = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorId, setVendorId] = useState("");

  const vendorOptions = useMemo(
    () =>
      vendors.map((item) => ({
        value: item.vendorId ?? item.id,
        label: item.name || item.title || `Vendor ${item.vendorId ?? item.id}`,
      })),
    [vendors]
  );

  useEffect(() => {
    ApiRequestUtils.get(API_ROUTES.GET_VENDORS)
      .then((r) => {
        const list = Array.isArray(r?.data) ? r.data : r?.data?.rows || [];
        setVendors(list);
        const firstVendorId = list?.[0]?.vendorId ?? list?.[0]?.id ?? "";
        if (firstVendorId) setVendorId(String(firstVendorId));
      })
      .catch(() => {})
  }, []);

  useEffect(() => {
    if (!vendorId) {
      setRows([]);
      return;
    }
    setLoading(true);
    ApiRequestUtils.get(API_ROUTES.GET_VENDOR_PRICING.replace(":vendorId", vendorId))
      .then((r) => setRows(Array.isArray(r?.data) ? r.data : r?.data?.rows || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vendorId]);

  return (
    <Card className="mx-auto mt-8 w-full">
      <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Typography variant="h6" color="white">
            Pricing
          </Typography>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="min-w-[220px] rounded-md border border-white/30 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
            >
              <option value="">Select Vendor</option>
              {vendorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button className="bg-white text-black font-bold hover:bg-gray-100" onClick={() => navigate("/dashboard/vendor-management/pricing/add")}>
              Add New
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-0 px-0 pb-2">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Spinner className="h-12 w-12" />
            </div>
          ) : (
          <table className="w-full min-w-[1100px] table-auto">
            <thead>
              <tr>
                {["Vendor ID", "Product ID", "MRP", "Sale Price", "Status", "Actions"].map((h) => (
                  <th key={h} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                    <Typography variant="small" color="blue-gray" className="font-semibold">
                      {h}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-4 text-center text-sm text-blue-gray-500">
                    No records found
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row?.pricingId ?? row?.id ?? JSON.stringify(row)}>
                    <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.vendorId ?? "-"}</td>
                    <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.productId ?? "-"}</td>
                    <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.mrp ?? "-"}</td>
                    <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.salePrice ?? "-"}</td>
                    <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.status ? "Active" : "Inactive"}</td>
                    <td className="border-b border-blue-gray-50 py-3 px-5">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outlined" onClick={() => navigate(`/dashboard/vendor-management/pricing/details/${row?.pricingId ?? row?.id}`)}>
                          Details
                        </Button>
                        <Button size="sm" className={ColorStyles.bgColor} onClick={() => navigate(`/dashboard/vendor-management/pricing/edit/${row?.pricingId ?? row?.id}`)}>
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
export default VendorManagementPricing;
