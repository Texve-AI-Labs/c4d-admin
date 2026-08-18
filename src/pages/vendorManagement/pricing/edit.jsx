import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, Switch, Typography } from "@material-tailwind/react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const schema = Yup.object({
  vendorId: Yup.string().required("Vendor is required"),
  productId: Yup.string().required("Product is required"),
  salePrice: Yup.number().typeError("Sale price is required").required("Sale price is required"),
  mrp: Yup.number().typeError("MRP must be a number"),
  discountAmount: Yup.number().typeError("Discount must be a number"),
  effectiveFrom: Yup.string(),
  effectiveTo: Yup.string(),
});

export const VendorManagementPricingEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([ApiRequestUtils.get(API_ROUTES.GET_VENDORS), ApiRequestUtils.get(API_ROUTES.GET_PRODUCTS)])
      .then(([vendorRes, productRes]) => {
        setVendors(Array.isArray(vendorRes?.data) ? vendorRes.data : vendorRes?.data?.rows || []);
        setProducts(Array.isArray(productRes?.data) ? productRes.data : productRes?.data?.rows || []);
      })
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

  const productOptions = useMemo(
    () =>
      products.map((item) => ({
        value: item.productId ?? item.id,
        label: item.name || item.title || `Product ${item.productId ?? item.id}`,
      })),
    [products]
  );

  useEffect(() => {
    ApiRequestUtils.get(API_ROUTES.GET_PRICING_BY_ID.replace(":id", id))
      .then((r) => setRecord(r?.data || null))
      .catch(() => {});
  }, [id]);

  const initialValues = useMemo(
    () => ({
      vendorId: record?.vendorId ?? "",
      productId: record?.productId ?? "",
      mrp: record?.mrp ?? "",
      salePrice: record?.salePrice ?? "",
      discountAmount: record?.discountAmount ?? "",
      effectiveFrom: record?.effectiveFrom ? String(record.effectiveFrom).slice(0, 10) : "",
      effectiveTo: record?.effectiveTo ? String(record.effectiveTo).slice(0, 10) : "",
      status: Boolean(record?.status ?? true),
    }),
    [record]
  );

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      await ApiRequestUtils.update(API_ROUTES.UPDATE_PRICING, {
        pricingId: Number(id),
        vendorId: Number(values.vendorId),
        productId: Number(values.productId),
        mrp: values.mrp === "" ? null : Number(values.mrp),
        salePrice: Number(values.salePrice),
        discountAmount: values.discountAmount === "" ? null : Number(values.discountAmount),
        effectiveFrom: values.effectiveFrom,
        effectiveTo: values.effectiveTo,
        status: Boolean(values.status),
      });
      navigate("/dashboard/vendor-management/pricing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Edit Pricing</div>
        <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit}>
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
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
                  <label className="mb-1 block text-sm font-bold">Product ID <span className="text-red-600">*</span></label>
                  <Field as="select" name="productId" className="w-full rounded-md border-2 border-gray-300 p-2">
                    <option value="">Select Product</option>
                    {productOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="productId" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">MRP <span className="text-red-600">*</span></label>
                  <Field name="mrp" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Sale Price <span className="text-red-600">*</span></label>
                  <Field name="salePrice" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="salePrice" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Discount Amount <span className="text-red-600">*</span></label>
                  <Field name="discountAmount" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Effective From <span className="text-red-600">*</span></label>
                  <Field name="effectiveFrom" type="date" className="w-full rounded-md border-2 border-gray-300 p-2" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Effective To <span className="text-red-600">*</span></label>
                  <Field name="effectiveTo" type="date" className="w-full rounded-md border-2 border-gray-300 p-2" />
                </div>
                <div className="rounded-lg border-2 border-gray-300 p-3">
                  <div className="mb-2 text-sm font-bold">Status</div>
                  <Switch checked={Boolean(values.status)} onChange={(e) => setFieldValue("status", e.target.checked)} label={values.status ? "Active" : "Inactive"} />
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="outlined" onClick={() => navigate("/dashboard/vendor-management/pricing")}>
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
export default VendorManagementPricingEdit;
