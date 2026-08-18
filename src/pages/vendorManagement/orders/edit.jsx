import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, Typography } from "@material-tailwind/react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const objectToLines = (value) => {
  if (!value || typeof value !== "object") return "";
  return Object.entries(value)
    .map(([key, val]) => `${key}: ${typeof val === "object" ? JSON.stringify(val) : String(val ?? "")}`)
    .join("\n");
};

const linesToArray = (text) =>
  String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const linesToObject = (text) =>
  String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((acc, line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return acc;
      const key = line.slice(0, idx).trim();
      const rawValue = line.slice(idx + 1).trim();
      if (!key) return acc;
      try {
        acc[key] = JSON.parse(rawValue);
      } catch {
        acc[key] = rawValue;
      }
      return acc;
    }, {});

const schema = Yup.object({
  vendorId: Yup.string().required("Vendor is required"),
  orderNumber: Yup.string().trim().required("Order number is required"),
  status: Yup.string().trim().required("Status is required"),
  paymentStatus: Yup.string().trim().required("Payment status is required"),
  items: Yup.string().trim().required("Items are required"),
  totalAmount: Yup.number().typeError("Total amount is required").required("Total amount is required"),
  pricingSnapshot: Yup.string().trim(),
  deliveryInfo: Yup.string().trim(),
  note: Yup.string().trim(),
});

export const VendorManagementOrdersEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    ApiRequestUtils.get(API_ROUTES.GET_VENDORS)
      .then((r) => setVendors(Array.isArray(r?.data) ? r.data : r?.data?.rows || []))
      .catch(() => {});
  }, []);

  const vendorOptions = useMemo(
    () =>
      vendors.map((item) => ({
        value: item.vendorId ?? item.id,
        label: item.name || item.title || `Vendor ${item.vendorId ?? item.id}`,
      })),
    [vendors]
  );

  useEffect(() => {
    ApiRequestUtils.get(API_ROUTES.GET_ORDER_BY_ID.replace(":id", id))
      .then((r) => setRecord(r?.data || null))
      .catch(() => {});
  }, [id]);

  const initialValues = useMemo(
    () => ({
      vendorId: record?.vendorId ?? "",
      customerId: record?.customerId ?? "",
      orderNumber: record?.orderNumber ?? "",
      status: record?.status ?? "PLACED",
      paymentStatus: record?.paymentStatus ?? "PENDING",
      items: Array.isArray(record?.items) ? record.items.join("\n") : "",
      pricingSnapshot: objectToLines(record?.pricingSnapshot ?? {}),
      totalAmount: record?.totalAmount ?? "",
      deliveryInfo: objectToLines(record?.deliveryInfo ?? {}),
      note: record?.note ?? "",
    }),
    [record]
  );

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      await ApiRequestUtils.update(API_ROUTES.UPDATE_ORDER, {
        orderId: Number(id),
        vendorId: Number(values.vendorId),
        customerId: values.customerId ? Number(values.customerId) : null,
        orderNumber: values.orderNumber,
        status: values.status,
        paymentStatus: values.paymentStatus,
        items: linesToArray(values.items),
        pricingSnapshot: linesToObject(values.pricingSnapshot),
        totalAmount: Number(values.totalAmount),
        deliveryInfo: linesToObject(values.deliveryInfo),
        note: values.note,
      });
      navigate("/dashboard/vendor-management/orders");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Edit Order</div>
        <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit}>
          {({ isValid, dirty, isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold">Vendor ID <span className="text-red-600">*</span></label>
                  <Field as="select" name="vendorId" className="w-full rounded-md border-2 border-gray-300 p-2">
                    <option value="">Select Vendor</option>
                    {vendorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="vendorId" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Customer ID <span className="text-red-600">*</span></label>
                  <Field name="customerId" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Order Number <span className="text-red-600">*</span></label>
                  <Field name="orderNumber" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="orderNumber" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Status <span className="text-red-600">*</span></label>
                  <Field as="select" name="status" className="w-full rounded-md border-2 border-gray-300 p-2">
                    <option value="PLACED">PLACED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </Field>
                  <ErrorMessage name="status" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Payment Status <span className="text-red-600">*</span></label>
                  <Field as="select" name="paymentStatus" className="w-full rounded-md border-2 border-gray-300 p-2">
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="FAILED">FAILED</option>
                  </Field>
                  <ErrorMessage name="paymentStatus" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Total Amount <span className="text-red-600">*</span></label>
                  <Field name="totalAmount" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="totalAmount" component="div" className="text-sm text-red-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-bold">Items <span className="text-red-600">*</span></label>
                  <Field as="textarea" rows={4} name="items" placeholder={"item 1\nitem 2"} className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="items" component="div" className="text-sm text-red-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-bold">Pricing Snapshot</label>
                  <Field as="textarea" rows={4} name="pricingSnapshot" placeholder={"mrp: 1000\nsalePrice: 900\ndiscountAmount: 100"} className="w-full rounded-md border-2 border-gray-300 p-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-bold">Delivery Info</label>
                  <Field as="textarea" rows={4} name="deliveryInfo" placeholder={"address: Chennai\npincode: 600001"} className="w-full rounded-md border-2 border-gray-300 p-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-bold">Note</label>
                  <Field as="textarea" rows={3} name="note" className="w-full rounded-md border-2 border-gray-300 p-2" />
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="outlined" onClick={() => navigate("/dashboard/vendor-management/orders")}>
                  Cancel
                </Button>
                <Button className={ColorStyles.continueButtonColor} type="submit" disabled={!dirty || !isValid || isSubmitting}>
                  Update
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </CardBody>
    </Card>
  );
};
export default VendorManagementOrdersEdit;
