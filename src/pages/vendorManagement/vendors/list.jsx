import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Input, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { isSuperUserRole } from "@/utils/roleUtils";

export const VendorManagementVendors = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const canDelete = isSuperUserRole();

  const load = async () => {
    try {
      setLoading(true);
      const response = await ApiRequestUtils.get(API_ROUTES.GET_VENDORS);
      setRows(Array.isArray(response?.data) ? response.data : response?.data?.rows || []);
    } catch (error) {
      console.error("Failed to load vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return rows;
    return rows.filter((row) => {
      const searchable = [row?.name, row?.slug, row?.city, row?.storefrontUrl].filter(Boolean).join(" ").toLowerCase();
      return searchable.includes(value);
    });
  }, [rows, query]);

  const handleDelete = async (rowId) => {
    if (!rowId || !window.confirm("Delete this vendor?")) return;
    await ApiRequestUtils.delete(`/vendors/${rowId}`);
    load();
  };

  return (
    <Card className="mx-auto mt-8 w-full">
      <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Typography variant="h6" color="white">
            Vendors
          </Typography>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search vendor" className="min-w-[240px] rounded-md bg-white px-3 py-2 text-sm text-gray-900" />
            <Button className="bg-white text-black font-bold hover:bg-gray-100" onClick={() => navigate("/dashboard/vendor-management/vendors/add")}>
              Add Vendor
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
            <table className="w-full min-w-[900px] table-auto">
              <thead>
                <tr>
                  {["Logo", "Name", "Slug", "City", "Status", "Storefront URL", "Actions"].map((header) => (
                    <th key={header} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" color="blue-gray" className="font-semibold">
                        {header}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-4 text-center text-sm text-blue-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const rowId = row?.vendorId ?? row?.id;
                    return (
                      <tr key={rowId || JSON.stringify(row)}>
                        <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.logoUrl ? <img src={row.logoUrl} alt={row?.name || "logo"} className="h-10 w-10 rounded object-cover" /> : "-"}</td>
                        <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.name ?? "-"}</td>
                        <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.slug ?? "-"}</td>
                        <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.city ?? "-"}</td>
                        <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.status ? "Active" : "Inactive"}</td>
                        <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.storefrontUrl ?? "-"}</td>
                        <td className="border-b border-blue-gray-50 py-3 px-5">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outlined" onClick={() => navigate(`/dashboard/vendor-management/vendors/details/${rowId}`)}>
                              View
                            </Button>
                            <Button size="sm" className={ColorStyles.bgColor} onClick={() => navigate(`/dashboard/vendor-management/vendors/edit/${rowId}`)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="outlined" onClick={() => navigate(`/dashboard/vendor-management/vendors/details/${rowId}`)}>
                              Manage Catalog
                            </Button>
                            {canDelete && (
                              <Button size="sm" color="red" variant="outlined" onClick={() => handleDelete(rowId)}>
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default VendorManagementVendors;
