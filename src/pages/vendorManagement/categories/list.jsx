import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { isSuperUserRole } from "@/utils/roleUtils";

export const VendorManagementCategories = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const canDelete = isSuperUserRole();

  useEffect(() => {
    setLoading(true);
    ApiRequestUtils.get(API_ROUTES.GET_CATEGORIES)
      .then((r) => setRows(Array.isArray(r?.data) ? r.data : r?.data?.rows || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (rowId) => {
    if (!rowId || !window.confirm("Delete this category?")) return;
    await ApiRequestUtils.delete(`/categories/${rowId}`);
    const response = await ApiRequestUtils.get(API_ROUTES.GET_CATEGORIES);
    setRows(Array.isArray(response?.data) ? response.data : response?.data?.rows || []);
  };

  return (
    <Card className="mx-auto mt-8 w-full">
      <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
        <div className="flex items-center justify-between gap-4">
          <Typography variant="h6" color="white">
            Categories
          </Typography>
          <Button className="bg-white text-black font-bold hover:bg-gray-100" onClick={() => navigate("/dashboard/vendor-management/categories/add")}>
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
          <table className="w-full min-w-[900px] table-auto">
            <thead>
              <tr>
                {["Vendor ID", "Name", "Slug", "Sort Order", "Status", "Actions"].map((h) => (
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
                  <tr key={row?.categoryId ?? row?.id ?? JSON.stringify(row)}>
                    <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.vendorId ?? "-"}</td>
                    <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.name ?? "-"}</td>
                    <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.slug ?? "-"}</td>
                    <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.sortOrder ?? "-"}</td>
                    <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.status ? "Active" : "Inactive"}</td>
                    <td className="border-b border-blue-gray-50 py-3 px-5">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outlined" onClick={() => navigate(`/dashboard/vendor-management/categories/details/${row?.categoryId ?? row?.id}`)}>
                          Details
                        </Button>
                        <Button size="sm" className={ColorStyles.bgColor} onClick={() => navigate(`/dashboard/vendor-management/categories/edit/${row?.categoryId ?? row?.id}`)}>
                          Edit
                        </Button>
                        {canDelete && (
                          <Button size="sm" color="red" variant="outlined" onClick={() => handleDelete(row?.categoryId ?? row?.id)}>
                            Delete
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
export default VendorManagementCategories;
