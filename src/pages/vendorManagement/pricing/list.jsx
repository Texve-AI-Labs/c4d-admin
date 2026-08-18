import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

export const VendorManagementPricing = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    ApiRequestUtils.get(API_ROUTES.GET_VENDOR_PRICING.replace(":vendorId", ""))
      .then((r) => setRows(Array.isArray(r?.data) ? r.data : r?.data?.rows || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="mx-auto mt-8 w-full">
      <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
        <div className="flex items-center justify-between gap-4">
          <Typography variant="h6" color="white">
            Pricing
          </Typography>
          <Button className="bg-white text-black font-bold hover:bg-gray-100" onClick={() => navigate("/dashboard/vendor-management/pricing/add")}>
            Add New
          </Button>
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
