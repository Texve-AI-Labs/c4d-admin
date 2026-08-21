import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { VendorManagementCategories } from "@/pages/vendorManagement/categories/list";
// import { VendorManagementProducts } from "@/pages/vendorManagement/products/list";
import { VendorManagementCatalogMapping } from "@/pages/vendorManagement/catalogMapping/list";
import { VendorManagementInventory } from "@/pages/vendorManagement/inventory/list";
import { VendorManagementPricing } from "@/pages/vendorManagement/pricing/list";

export const VendorManagementVendorsDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const tabParam = useMemo(() => new URLSearchParams(location.search).get("tab") || "Vendor", [location.search]);
  const [record, setRecord] = useState(null);
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    ApiRequestUtils.get(API_ROUTES.GET_VENDOR_BY_ID.replace(":id", id)).then((r) => setRecord(r?.data || null)).catch(() => {});
  }, [id]);

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    console.log("[VendorWorkspace] context", { vendorId: id, tab: tabParam, activeTab });
  }, [id, tabParam, activeTab]);

  const handleTabClick = (tab) => {
    setActiveTab(tab.label);
    if (tab.label === "Vendor") {
      navigate(`/dashboard/vendor-management/vendors/details/${id}`);
      return;
    }
    navigate(`/dashboard/vendor-management/vendors/details/${id}?tab=${encodeURIComponent(tab.label)}`);
  };

  const tabs = useMemo(() => ([
    { label: "Vendor", path: "/dashboard/vendor-management/vendors" },
    { label: "Categories", path: "/dashboard/vendor-management/categories" },
    // { label: "Products", path: "/dashboard/vendor-management/products" },
    { label: "Catalog Mapping", path: "/dashboard/vendor-management/catalog-mapping" },
    { label: "Inventory", path: "/dashboard/vendor-management/inventory" },
    { label: "Pricing", path: "/dashboard/vendor-management/pricing" },
  ]), []);

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl bg-white shadow-none">
      <CardHeader variant="gradient" className={`rounded-2xl p-6 ${ColorStyles.bgColor}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="text-white">
            <div className="text-sm font-semibold opacity-80">Vendor Workspace</div>
            <div className="text-xl font-bold">{record?.name || "Vendor"}</div>
          </div>
          <Button variant="outlined" className="border-white px-2 py-3 text-white" onClick={() => navigate("/dashboard/vendor-management/vendors")}>Back to Vendors</Button>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {record?.logoUrl ? (
              <img src={record.logoUrl} alt={record?.name || "Vendor logo"} className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-xl font-bold text-blue-700">
                {(record?.name || "V").slice(0, 1)}
              </div>
            )}
            <div className="flex-1">
              <div className="text-xl font-bold text-slate-900">{record?.name || "-"}</div>
              <div className="text-sm text-slate-500">{record?.slug || "-"}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{record?.city || "-"}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${record?.status ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{record?.status ? "Active" : "Inactive"}</span>
                {record?.storefrontUrl ? <a href={record.storefrontUrl} target="_blank" rel="noreferrer" className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{record.storefrontUrl}</a> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.label}
                variant="text"
                className={`rounded-none border-b-4 px-4 py-3 text-sm font-semibold ${activeTab === tab.label ? "border-blue-600 text-blue-600" : "border-transparent text-slate-700 hover:border-blue-600 hover:text-blue-600"}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
{activeTab === "Vendor" ? (
  <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">City</div>
            <div className="mt-1 text-sm text-gray-900">{record?.city || "-"}</div>
          </div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Status</div>
            <div className="mt-1 text-sm text-gray-900">{record?.status ? "Active" : "Inactive"}</div>
          </div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <div className="text-sm font-bold text-gray-700">Description</div>
            <div className="mt-1 text-sm text-gray-900">{record?.description || "-"}</div>
          </div>
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="outlined" className="border-gray-800 text-black" onClick={() => navigate("/dashboard/vendor-management/vendors")}>Back</Button>
          <Button className={ColorStyles.continueButtonColor} onClick={() => navigate(`/dashboard/vendor-management/vendors/edit/${id}`)}>Edit</Button>
        </div>
        </> ): null}

        {activeTab === "Categories" ? (
          <VendorManagementCategories embeddedVendorId={id} />
        // ) : activeTab === "Products" ? (
        //   <VendorManagementProducts embeddedVendorId={id} />
        ) : activeTab === "Catalog Mapping" ? (
          <VendorManagementCatalogMapping embeddedVendorId={id} />
        ) : activeTab === "Inventory" ? (
          <VendorManagementInventory embeddedVendorId={id} />
        ) : activeTab === "Pricing" ? (
          <VendorManagementPricing embeddedVendorId={id} />
        ) : null}
      </CardBody>
    </Card>
  );
};

export default VendorManagementVendorsDetails;
