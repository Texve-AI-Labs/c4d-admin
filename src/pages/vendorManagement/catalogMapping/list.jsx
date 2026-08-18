import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { isSuperUserRole } from "@/utils/roleUtils";

export const VendorManagementCatalogMapping = () => {
  const navigate = useNavigate();
  const [vendorId, setVendorId] = useState("");
  const [vendors, setVendors] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const canDelete = isSuperUserRole();

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const response = await ApiRequestUtils.get(API_ROUTES.GET_VENDORS);
        setVendors(Array.isArray(response?.data) ? response.data : response?.data?.rows || []);
      } catch (error) {
        console.error("Failed to load vendors:", error);
      }
    };
    loadVendors();
  }, []);

  const vendorOptions = useMemo(
    () => vendors.map((item) => ({ value: item.vendorId ?? item.id, label: item.name || `Vendor ${item.vendorId ?? item.id}` })),
    [vendors]
  );

  const loadCatalog = async (selectedVendorId = vendorId) => {
    if (!selectedVendorId) return;
    try {
      setLoading(true);
      const response = await ApiRequestUtils.get(API_ROUTES.GET_VENDOR_CATALOG.replace(":vendorId", selectedVendorId));
      setRows(Array.isArray(response?.data) ? response.data : response?.data?.rows || []);
    } catch (error) {
      console.error("Failed to load catalog mappings:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) loadCatalog(vendorId);
  }, [vendorId]);

  const handleDelete = async (rowId) => {
    if (!rowId || !window.confirm("Delete this catalog mapping?")) return;
    await ApiRequestUtils.delete(`/catalog-mappings/${rowId}`);
    await loadCatalog();
  };

  return (
    <Card className="mx-auto mt-8 w-full">
      <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <Typography variant="h6" color="white">
            Catalog Mapping
          </Typography>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-[220px]">
              {/* <label className="mb-1 block text-sm font-bold text-white">Vendor</label> */}
              <select className="w-full rounded-lg border border-gray-300 p-3 text-gray-900" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                <option value="">Select Vendor</option>
                {vendorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Button className="bg-red-600 text-white font-bold" onClick={() => loadCatalog()}>
              Load
            </Button>
            <Button className="bg-white text-black font-bold hover:bg-gray-100" onClick={() => navigate("/dashboard/vendor-management/catalog-mapping/add")}>
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
                {["Vendor ID", "Category ID", "Product ID", "Vendor SKU", "Visible", "Actions"].map((header) => (
                  <th key={header} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                    <Typography variant="small" color="blue-gray" className="font-semibold">
                      {header}
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
                rows.map((row) => {
                  const rowId = row?.catalogMappingId ?? row?.id;
                  return (
                    <tr key={rowId || JSON.stringify(row)}>
                      <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.vendorId ?? "-"}</td>
                      <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.categoryId ?? "-"}</td>
                      <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.productId ?? "-"}</td>
                      <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.vendorSku ?? "-"}</td>
                      <td className="border-b border-blue-gray-50 py-3 px-5 text-sm">{row?.isVisible ? "Active" : "Inactive"}</td>
                      <td className="border-b border-blue-gray-50 py-3 px-5">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outlined" onClick={() => navigate(`/dashboard/vendor-management/catalog-mapping/details/${rowId}`)}>
                            Details
                          </Button>
                          <Button size="sm" className={ColorStyles.bgColor} onClick={() => navigate(`/dashboard/vendor-management/catalog-mapping/edit/${rowId}`)}>
                            Edit
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

export default VendorManagementCatalogMapping;
