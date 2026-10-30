import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, Switch } from "@material-tailwind/react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const initialValues = { vendorId: "", productId: "", mrp: "", salePrice: "", discountAmount: "", effectiveFrom: "", effectiveTo: "", status: true };
const schema = Yup.object({
  vendorId: Yup.string().required("Vendor is required"),
  productId: Yup.string().required("Product is required"),
  salePrice: Yup.number().typeError("Sale price is required").required("Sale price is required"),
});

export const VendorManagementPricingAdd = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const vendorIdParam = new URLSearchParams(location.search).get("vendorId") || "";
  const defaultVendorId = vendorIdParam || "";
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([ApiRequestUtils.get(API_ROUTES.GET_VENDORS), ApiRequestUtils.get(API_ROUTES.GET_PRODUCTS)]).then(([v, p]) => {
      setVendors(Array.isArray(v?.data) ? v.data : v?.data?.rows || []);
      setProducts(Array.isArray(p?.data) ? p.data : p?.data?.rows || []);
    }).catch(() => {});
  }, []);

  const vendorOptions = useMemo(() => vendors.map((v) => ({ value: v.vendorId ?? v.id, label: v.name ?? `Vendor ${v.vendorId ?? v.id}` })), [vendors]);
  const productOptions = useMemo(() => products.map((p) => ({ value: p.productId ?? p.id, label: p.name ?? `Product ${p.productId ?? p.id}` })), [products]);
  const vendorName = useMemo(() => {
    const match = vendors.find((v) => String(v?.vendorId ?? v?.id ?? "") === String(defaultVendorId ?? ""));
    return match?.name || (defaultVendorId ? `Vendor ${defaultVendorId}` : "-");
  }, [vendors, defaultVendorId]);
  const productNameById = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      const key = String(product?.productId ?? product?.id ?? "");
      if (key) map.set(key, product?.name || key);
    });
    return map;
  }, [products]);

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      await ApiRequestUtils.post(API_ROUTES.ADD_PRICING, {
        vendorId: Number(values.vendorId),
        productId: Number(values.productId),
        mrp: values.mrp === "" ? null : Number(values.mrp),
        salePrice: Number(values.salePrice),
        discountAmount: values.discountAmount === "" ? null : Number(values.discountAmount),
        effectiveFrom: values.effectiveFrom,
        effectiveTo: values.effectiveTo,
        status: Boolean(values.status),
      });
      navigate(defaultVendorId ? `/dashboard/vendor-management/vendors/details/${defaultVendorId}?tab=Pricing` : "/dashboard/vendor-management/pricing");
    } finally { setSubmitting(false); }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl bg-white shadow-none">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Add Pricing</div>
        <Formik initialValues={{ ...initialValues, vendorId: defaultVendorId }} enableReinitialize validationSchema={schema} onSubmit={onSubmit}>
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="hidden"><label className="mb-1 block text-sm font-bold text-gray-700">Vendor</label><input value={vendorName} disabled className="w-full rounded-md border-2 border-gray-300 bg-gray-100 p-2" /></div>
                {/* {!defaultVendorId ? <div><label className="mb-1 block text-sm font-bold text-gray-700">Vendor <span className="text-red-600">*</span></label><Field as="select" name="vendorId" className="w-full rounded-md border-2 border-gray-300 p-2"><option value="">Select Vendor</option>{vendorOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Field><ErrorMessage name="vendorId" component="div" className="text-sm text-red-500" /></div> : <div><label className="mb-1 block text-sm font-bold text-gray-700">Vendor</label><input value={defaultVendorId} disabled className="w-full rounded-md border-2 border-gray-300 bg-gray-100 p-2" /></div>} */}
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Product <span className="text-red-600">*</span></label><Field as="select" name="productId" className="w-full rounded-md border-2 border-gray-300 p-2"><option value="">Select Product</option>{productOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Field><ErrorMessage name="productId" component="div" className="text-sm text-red-500" /></div>
                {/* <div><label className="mb-1 block text-sm font-bold text-gray-700">Selected Product</label><input value={productNameById.get(String(values.productId)) || "-"} disabled className="w-full rounded-md border-2 border-gray-300 bg-gray-100 p-2" /></div> */}
                <div><label className="mb-1 block text-sm font-bold text-gray-700">MRP</label><Field name="mrp" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" /></div>
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Sale Price <span className="text-red-600">*</span></label><Field name="salePrice" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" /><ErrorMessage name="salePrice" component="div" className="text-sm text-red-500" /></div>
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Discount Amount</label><Field name="discountAmount" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" /></div>
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Effective From</label><Field name="effectiveFrom" type="date" className="w-full rounded-md border-2 border-gray-300 p-2" /></div>
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Effective To</label><Field name="effectiveTo" type="date" className="w-full rounded-md border-2 border-gray-300 p-2" /></div>
                <div className="rounded-lg border-2 border-gray-300 p-3"><div className="mb-2 text-sm font-bold text-gray-700">Status</div><Switch checked={Boolean(values.status)} onChange={(e) => setFieldValue("status", e.target.checked)} label={values.status ? "Active" : "Inactive"} /></div>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Button type="button" variant="outlined" className="border-gray-800 text-black" onClick={() => navigate(defaultVendorId ? `/dashboard/vendor-management/vendors/details/${defaultVendorId}?tab=Pricing` : "/dashboard/vendor-management/pricing")}>Cancel</Button>
                <Button className={ColorStyles.continueButtonColor} type="submit" disabled={!dirty || !isValid || isSubmitting}>Save</Button>
              </div>
            </Form>
          )}
        </Formik>
      </CardBody>
    </Card>
  );
};

export default VendorManagementPricingAdd;
