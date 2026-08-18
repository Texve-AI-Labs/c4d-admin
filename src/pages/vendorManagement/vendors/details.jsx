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

export const VendorManagementVendorsDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await ApiRequestUtils.get(API_ROUTES.GET_VENDOR_BY_ID.replace(":id", id));
        setRecord(response?.data || null);
      } catch (error) {
        console.error("Failed to load vendor details:", error);
      }
    };
    load();
  }, [id]);

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl">
      <CardHeader variant="gradient" className={`p-6 ${ColorStyles.bgColor}`}>
        <Typography variant="h6" color="white">Vendor Details</Typography>
      </CardHeader>
      <CardBody className="space-y-4">
        {record?.logoUrl ? (
          <div className="rounded-lg border-2 border-gray-300 p-4">
            <div className="text-sm font-bold text-gray-700">Logo</div>
            <img src={record.logoUrl} alt={record?.name || "Vendor logo"} className="mt-2 h-24 w-24 rounded object-cover" />
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldCard label="Name" value={record?.name} />
          <FieldCard label="Slug" value={record?.slug} />
          <FieldCard label="City" value={record?.city} />
          <FieldCard label="Description" value={record?.description} />
          <FieldCard label="Status" value={record?.status ? "Active" : "Inactive"} />
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="outlined" onClick={() => navigate("/dashboard/vendor-management/vendors")}>Back</Button>
          <Button className={ColorStyles.continueButtonColor} onClick={() => navigate(`/dashboard/vendor-management/vendors/edit/${id}`)}>Edit</Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default VendorManagementVendorsDetails;
