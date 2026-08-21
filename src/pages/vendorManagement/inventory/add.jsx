import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, Switch } from "@material-tailwind/react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const initialValues = { vendorId: "", productId: "", availableQty: "", reservedQty: "", warehouseLocation: "", status: true };
const schema = Yup.object({
  vendorId: Yup.string().required("Vendor is required"),
  productId: Yup.string().required("Product is required"),
  warehouseLocation: Yup.string().trim().required("Warehouse location is required"),
});

export const VendorManagementInventoryAdd = () => {
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
  const vendorNameById = useMemo(() => {
    const map = new Map();
    vendors.forEach((vendor) => {
      const key = String(vendor?.vendorId ?? vendor?.id ?? "");
      if (key) map.set(key, vendor?.name || key);
    });
    return map;
  }, [vendors]);
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
      await ApiRequestUtils.post(API_ROUTES.ADD_INVENTORY, {
        vendorId: Number(values.vendorId),
        productId: Number(values.productId),
        availableQty: values.availableQty === "" ? null : Number(values.availableQty),
        reservedQty: values.reservedQty === "" ? null : Number(values.reservedQty),
        warehouseLocation: values.warehouseLocation,
        status: Boolean(values.status),
      });
      navigate(defaultVendorId ? `/dashboard/vendor-management/vendors/details/${defaultVendorId}?tab=Inventory` : "/dashboard/vendor-management/inventory");
    } finally { setSubmitting(false); }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl bg-white shadow-none">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Add Inventory</div>
        <Formik initialValues={{ ...initialValues, vendorId: defaultVendorId }} enableReinitialize validationSchema={schema} onSubmit={onSubmit}>
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="hidden"><label className="mb-1 block text-sm font-bold text-gray-700">Vendor</label><input value={vendorNameById.get(String(values.vendorId || defaultVendorId || "")) || "-"} disabled className="w-full rounded-md border-2 border-gray-300 bg-gray-100 p-2" /></div>
                {/* {!defaultVendorId ? <div><label className="mb-1 block text-sm font-bold text-gray-700">Vendor <span className="text-red-600">*</span></label><Field as="select" name="vendorId" className="w-full rounded-md border-2 border-gray-300 p-2"><option value="">Select Vendor</option>{vendorOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Field><ErrorMessage name="vendorId" component="div" className="text-sm text-red-500" /></div> : <div><label className="mb-1 block text-sm font-bold text-gray-700">Vendor</label><input value={defaultVendorId} disabled className="w-full rounded-md border-2 border-gray-300 bg-gray-100 p-2" /></div>} */}
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Product <span className="text-red-600">*</span></label><Field as="select" name="productId" className="w-full rounded-md border-2 border-gray-300 p-2"><option value="">Select Product</option>{productOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Field><ErrorMessage name="productId" component="div" className="text-sm text-red-500" /></div>
                {/* <div><label className="mb-1 block text-sm font-bold text-gray-700">Selected Product</label><input value={productNameById.get(String(values.productId)) || "-"} disabled className="w-full rounded-md border-2 border-gray-300 bg-gray-100 p-2" /></div> */}
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Available Qty</label><Field name="availableQty" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" /></div>
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Reserved Qty</label><Field name="reservedQty" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" /></div>
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Warehouse Location <span className="text-red-600">*</span></label><Field name="warehouseLocation" className="w-full rounded-md border-2 border-gray-300 p-2" placeholder="Enter warehouse location" /><ErrorMessage name="warehouseLocation" component="div" className="text-sm text-red-500" /></div>
                <div className="rounded-lg border-2 border-gray-300 p-3"><div className="mb-2 text-sm font-bold text-gray-700">Status</div><Switch checked={Boolean(values.status)} onChange={(e) => setFieldValue("status", e.target.checked)} label={values.status ? "Active" : "Inactive"} /></div>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Button type="button" variant="outlined" className="border-gray-800 text-black" onClick={() => navigate(defaultVendorId ? `/dashboard/vendor-management/vendors/details/${defaultVendorId}?tab=Inventory` : "/dashboard/vendor-management/inventory")}>Cancel</Button>
                <Button className={ColorStyles.continueButtonColor} type="submit" disabled={!dirty || !isValid || isSubmitting}>Save</Button>
              </div>
            </Form>
          )}
        </Formik>
      </CardBody>
    </Card>
  );
};

export default VendorManagementInventoryAdd;
