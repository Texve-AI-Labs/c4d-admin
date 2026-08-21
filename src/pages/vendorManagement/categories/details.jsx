import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

export const VendorManagementCategoriesDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const vendorIdParam = new URLSearchParams(location.search).get("vendorId") || "";
  const [record, setRecord] = useState(null);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    console.log("[CategoriesDetails] context", { id, vendorIdParam });
  }, [id, vendorIdParam]);

  useEffect(() => {
    ApiRequestUtils.get(API_ROUTES.GET_CATEGORY_BY_ID.replace(":id", id)).then((r) => setRecord(r?.data || null)).catch(() => {});
  }, [id]);

  useEffect(() => {
    ApiRequestUtils.get(API_ROUTES.GET_VENDORS).then((r) => setVendors(Array.isArray(r?.data) ? r.data : r?.data?.rows || [])).catch(() => {});
  }, []);

  const vendorName = useMemo(() => {
    const match = vendors.find((v) => String(v?.vendorId ?? v?.id ?? "") === String(record?.vendorId ?? vendorIdParam ?? ""));
    const fallback = record?.vendorId ?? vendorIdParam ?? "";
    return match?.name || (fallback ? `Vendor ${fallback}` : "-");
  }, [vendors, record?.vendorId, vendorIdParam]);

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl bg-white shadow-none">
        <div className="text-black p-2">
          <div className="text-xl font-bold">Category Detalis</div>
        </div>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Vendor</div>
            <div className="mt-1 text-sm text-gray-900">{vendorName}</div>
          </div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Name</div>
            <div className="mt-1 text-sm text-gray-900">{record?.name || "-"}</div>
          </div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Slug</div>
            <div className="mt-1 text-sm text-gray-900">{record?.slug || "-"}</div>
          </div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Sort Order</div>
            <div className="mt-1 text-sm text-gray-900">{record?.sortOrder ?? "-"}</div>
          </div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Status</div>
            <div className="mt-1 text-sm text-gray-900">{record?.status ? "Active" : "Inactive"}</div>
          </div>
          {/* <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Image URL</div>
            <div className="mt-1 text-sm text-gray-900">{record?.imageUrl || "-"}</div>
          </div> */}
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="outlined" onClick={() => {
            console.log("[CategoriesDetails] back", { id, vendorIdParam });
            navigate(vendorIdParam ? `/dashboard/vendor-management/vendors/details/${vendorIdParam}?tab=Categories` : "/dashboard/vendor-management/categories");
          }}>Back</Button>
          <Button className={ColorStyles.continueButtonColor} onClick={() => {
            console.log("[CategoriesDetails] edit", { id, vendorIdParam });
            navigate(`/dashboard/vendor-management/categories/edit/${id}${vendorIdParam ? `?vendorId=${encodeURIComponent(vendorIdParam)}` : ""}`);
          }}>Edit</Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default VendorManagementCategoriesDetails;
