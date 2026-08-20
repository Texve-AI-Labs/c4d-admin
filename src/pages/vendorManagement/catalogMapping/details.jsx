import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Typography } from "@material-tailwind/react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const FieldCard = ({ label, value }) => (
  <div className="rounded-lg border-2 border-gray-300 p-4">
    <div className="text-sm font-bold text-gray-700">{label}</div>
    <div className="mt-1 text-sm text-gray-900">{String(value ?? "-")}</div>
  </div>
);

export const VendorManagementCatalogMappingDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await ApiRequestUtils.get(API_ROUTES.GET_CATALOG_MAPPING_BY_ID, { catalogMappingId: Number(id) });
        setRecord(response?.data || null);
      } catch (error) {
        console.error("Failed to load catalog mapping details:", error);
      }
    };
    load();
  }, [id]);

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl">
      <CardHeader variant="gradient" className={`p-6 ${ColorStyles.bgColor}`}>
        <Typography variant="h6" color="white">Catalog Mapping Details</Typography>
      </CardHeader>
      <CardBody className="space-y-4">
        {record?.overrideImageUrl ? (
          <div className="rounded-lg border-2 border-gray-300 p-4">
            <div className="text-sm font-bold text-gray-700">Override Image</div>
            <img src={record.overrideImageUrl} alt={record?.overrideName || "Catalog Mapping"} className="mt-2 h-24 w-24 rounded object-cover" />
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldCard label="Vendor ID" value={record?.vendorId} />
          <FieldCard label="Category ID" value={record?.categoryId} />
          <FieldCard label="Product ID" value={record?.productId} />
          <FieldCard label="Vendor SKU" value={record?.vendorSku} />
          <FieldCard label="Override Name" value={record?.overrideName} />
          <FieldCard label="Override Image URL" value={record?.overrideImageUrl} />
          <FieldCard label="Visible" value={record?.isVisible ? "Active" : "Inactive"} />
          <FieldCard label="Sort Order" value={record?.sortOrder} />
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="outlined" onClick={() => navigate("/dashboard/vendor-management/catalog-mapping")}>Back</Button>
          <Button className={ColorStyles.continueButtonColor} onClick={() => navigate(`/dashboard/vendor-management/catalog-mapping/edit/${id}`)}>Edit</Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default VendorManagementCatalogMappingDetails;
