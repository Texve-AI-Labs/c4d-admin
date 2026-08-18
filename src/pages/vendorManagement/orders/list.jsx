import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { isSuperUserRole } from "@/utils/roleUtils";

export const VendorManagementOrders = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const canManage = isSuperUserRole();

  const load = async () => {
    setLoading(true);
    try {
      const response = await ApiRequestUtils.get(API_ROUTES.GET_VENDOR_ORDERS.replace(":vendorId", ""));
      setRows(Array.isArray(response?.data) ? response.data : response?.data?.rows || []);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (rowId, status) => {
    if (!rowId || !status) return;
    await ApiRequestUtils.update(`/orders/${rowId}/status`, { status });
    await load();
  };

  const handleCancel = async (rowId) => {
    if (!rowId || !window.confirm("Cancel this order?")) return;
    await ApiRequestUtils.post(`/orders/${rowId}/cancel`, {});
    await load();
  };

  return (
    <Card className="mx-auto mt-8 w-full">
      <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
        <div className="flex items-center justify-between gap-4">
          <Typography variant="h6" color="white">
            Orders
          </Typography>
          <Button className="bg-white text-black font-bold hover:bg-gray-100" onClick={() => navigate("/dashboard/vendor-management/orders/add")}>
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
          <table className="w-full min-w-[1000px] table-auto">
            <thead>
              <tr>
                {["Order Number", "Vendor ID", "Status", "Total Amount", "Actions"].map((h) => (
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
                  <td colSpan={5} className="px-5 py-4 text-center text-sm text-blue-gray-500">
                    No records found
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row?.orderId ?? row?.id ?? JSON.stringify(row)}>
                    <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.orderNumber ?? "-"}</td>
                    <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.vendorId ?? "-"}</td>
                    <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">
                      {canManage ? (
                        <select
                          className="w-full rounded-md border border-gray-300 p-2 text-sm"
                          value={row?.status ?? ""}
                          onChange={(e) => handleStatusChange(row?.orderId ?? row?.id, e.target.value)}
                        >
                          <option value="">Select</option>
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      ) : (
                        row?.status ?? "-"
                      )}
                    </td>
                    <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.totalAmount ?? "-"}</td>
                    <td className="border-b border-blue-gray-50 py-3 px-5">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outlined" onClick={() => navigate(`/dashboard/vendor-management/orders/details/${row?.orderId ?? row?.id}`)}>
                          Details
                        </Button>
                        <Button size="sm" className={ColorStyles.bgColor} onClick={() => navigate(`/dashboard/vendor-management/orders/edit/${row?.orderId ?? row?.id}`)}>
                          Edit
                        </Button>
                        {canManage && (
                          <Button size="sm" color="red" variant="outlined" onClick={() => handleCancel(row?.orderId ?? row?.id)}>
                            Cancel
                          </Button>
                        )}
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
export default VendorManagementOrders;
