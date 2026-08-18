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

export const VendorManagementPricingDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);

  useEffect(() => {
    ApiRequestUtils.get(API_ROUTES.GET_PRICING_BY_ID.replace(":id", id))
      .then((r) => setRecord(r?.data || null))
      .catch(() => {});
  }, [id]);

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl">
      <CardHeader variant="gradient" className={`p-6 ${ColorStyles.bgColor}`}>
        <Typography variant="h6" color="white">
          Pricing Details
        </Typography>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldCard label="Vendor ID" value={record?.vendorId} />
          <FieldCard label="Product ID" value={record?.productId} />
          <FieldCard label="MRP" value={record?.mrp} />
          <FieldCard label="Sale Price" value={record?.salePrice} />
          <FieldCard label="Discount Amount" value={record?.discountAmount} />
          <FieldCard label="Effective From" value={record?.effectiveFrom} />
          <FieldCard label="Effective To" value={record?.effectiveTo} />
          <FieldCard label="Status" value={record?.status ? "Active" : "Inactive"} />
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="outlined" onClick={() => navigate("/dashboard/vendor-management/pricing")}>
            Back
          </Button>
          <Button className={ColorStyles.continueButtonColor} onClick={() => navigate(`/dashboard/vendor-management/pricing/edit/${id}`)}>
            Edit
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
export default VendorManagementPricingDetails;
