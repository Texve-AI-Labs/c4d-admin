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

export const VendorManagementOrdersDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);

  useEffect(() => {
    ApiRequestUtils.get(API_ROUTES.GET_ORDER_BY_ID.replace(":id", id))
      .then((r) => setRecord(r?.data || null))
      .catch(() => {});
  }, [id]);

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl">
      <CardHeader variant="gradient" className={`p-6 ${ColorStyles.bgColor}`}>
        <Typography variant="h6" color="white">
          Order Details
        </Typography>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldCard label="Vendor ID" value={record?.vendorId} />
          <FieldCard label="Customer ID" value={record?.customerId} />
          <FieldCard label="Order Number" value={record?.orderNumber} />
          <FieldCard label="Status" value={record?.status} />
          <FieldCard label="Payment Status" value={record?.paymentStatus} />
          <FieldCard label="Total Amount" value={record?.totalAmount} />
          <FieldCard label="Note" value={record?.note} />
        </div>
        <div className="rounded-lg border border-gray-300 p-4">
          <div className="text-sm font-bold">Items</div>
          <div className="mt-2 space-y-2 text-sm">
            {(Array.isArray(record?.items) ? record.items : []).length === 0 ? (
              <div className="text-gray-500">-</div>
            ) : (
              (Array.isArray(record?.items) ? record.items : []).map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-md border border-gray-200 px-3 py-2">
                  {String(item ?? "-")}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-lg border border-gray-300 p-4">
          <div className="text-sm font-bold">Pricing Snapshot</div>
          <div className="mt-2 space-y-2 text-sm">
            {record?.pricingSnapshot && typeof record.pricingSnapshot === "object" && Object.keys(record.pricingSnapshot).length > 0 ? (
              <>
                <div className="flex justify-between gap-4 rounded-md border border-gray-200 px-3 py-2">
                  <span className="font-medium">Snapshot</span>
                  <span className="text-right">{JSON.stringify(record.pricingSnapshot)}</span>
                </div>
              </>
            ) : (
              <div className="text-gray-500">-</div>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-gray-300 p-4">
          <div className="text-sm font-bold">Delivery Info</div>
          <div className="mt-2 space-y-2 text-sm">
            {record?.deliveryInfo && typeof record.deliveryInfo === "object" && Object.keys(record.deliveryInfo).length > 0 ? (
              <>
                <div className="flex justify-between gap-4 rounded-md border border-gray-200 px-3 py-2">
                  <span className="font-medium">Delivery</span>
                  <span className="text-right">{JSON.stringify(record.deliveryInfo)}</span>
                </div>
              </>
            ) : (
              <div className="text-gray-500">-</div>
            )}
          </div>
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="outlined" onClick={() => navigate("/dashboard/vendor-management/orders")}>
            Back
          </Button>
          <Button className={ColorStyles.continueButtonColor} onClick={() => navigate(`/dashboard/vendor-management/orders/edit/${id}`)}>
            Edit
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
export default VendorManagementOrdersDetails;
