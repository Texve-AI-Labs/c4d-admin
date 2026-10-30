import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, Switch } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const schema = Yup.object({ 
  vendorId: Yup.string().required("Vendor is required"), 
  productId: Yup.string().required("Product is required"), 
  warehouseLocation: Yup.string().trim().required("Warehouse location is required") });

export const VendorManagementInventoryEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const vendorIdParam = new URLSearchParams(location.search).get("vendorId") || "";
  const [record, setRecord] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([ApiRequestUtils.get(API_ROUTES.GET_VENDORS), ApiRequestUtils.get(API_ROUTES.GET_PRODUCTS)])
      .then(([v, p]) => {
        setVendors(Array.isArray(v?.data) ? v.data : v?.data?.rows || []);
        setProducts(Array.isArray(p?.data) ? p.data : p?.data?.rows || []);
        return vendorIdParam ? ApiRequestUtils.get(API_ROUTES.GET_VENDOR_INVENTORY.replace(":vendorId", vendorIdParam)) : Promise.resolve(null);
      })
      .then((r) => {
        const rows = Array.isArray(r?.data) ? r.data : r?.data?.rows || r?.data?.data || [];
        setRecord(rows.find((row) => String(row?.inventoryId ?? row?.id ?? "") === String(id)) || null);
      })
      .catch(() => {});
  }, [id, vendorIdParam]);

  const vendorOptions = useMemo(() => vendors.map((v) => ({ value: v.vendorId ?? v.id, label: v.name ?? `Vendor ${v.vendorId ?? v.id}` })), [vendors]);
  const productOptions = useMemo(() => products.map((p) => ({ value: p.productId ?? p.id, label: p.name ?? `Product ${p.productId ?? p.id}` })), [products]);
  const vendorName = useMemo(() => {
    const match = vendors.find((v) => String(v?.vendorId ?? v?.id ?? "") === String(record?.vendorId ?? vendorIdParam ?? ""));
    const fallback = record?.vendorId ?? vendorIdParam ?? "";
    return match?.name || (fallback ? `Vendor ${fallback}` : "-");
  }, [vendors, record?.vendorId, vendorIdParam]);
  const productName = useMemo(() => {
    const match = products.find((p) => String(p?.productId ?? p?.id ?? "") === String(record?.productId ?? ""));
    const fallback = record?.productId ?? "";
    return match?.name || (fallback ? `Product ${fallback}` : "-");
  }, [products, record?.productId]);

  const initialValues = useMemo(() => ({
    vendorId: record?.vendorId ?? "",
    productId: record?.productId ?? "",
    availableQty: record?.availableQty ?? "",
    reservedQty: record?.reservedQty ?? "",
    warehouseLocation: record?.warehouseLocation ?? "",
    status: Boolean(record?.status ?? true),
  }), [record]);

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      await ApiRequestUtils.update(API_ROUTES.UPDATE_INVENTORY, {
        inventoryId: Number(id),
        vendorId: Number(values.vendorId),
        productId: Number(values.productId),
        availableQty: values.availableQty === "" ? null : Number(values.availableQty),
        reservedQty: values.reservedQty === "" ? null : Number(values.reservedQty),
        warehouseLocation: values.warehouseLocation,
        status: Boolean(values.status),
      });
      navigate(vendorIdParam ? `/dashboard/vendor-management/vendors/details/${vendorIdParam}?tab=Inventory` : "/dashboard/vendor-management/inventory");
    } finally { setSubmitting(false); }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl bg-white shadow-none">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Edit Inventory</div>
        <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit}>
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="hidden"><label className="mb-1 block text-sm font-bold text-gray-700">Vendor</label><input value={vendorName} disabled className="w-full rounded-md border-2 border-gray-300 bg-gray-100 p-2" /></div>
                {/* <div>
                  {!vendorIdParam ? 
                  <><label className="mb-1 block text-sm font-bold text-gray-700">Vendor <span className="text-red-600">*</span></label>
                  <Field as="select" name="vendorId" className="w-full rounded-md border-2 border-gray-300 p-2">
                    <option value="">Select Vendor</option>{vendorOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Field>
                    <ErrorMessage name="vendorId" component="div" className="text-sm text-red-500" /></> 
                    : <><label className="mb-1 block text-sm font-bold text-gray-700">Vendor</label><input value={vendorIdParam} disabled className="w-full rounded-md border-2 border-gray-300 bg-gray-100 p-2" /></>}
                    </div> */}
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Product <span className="text-red-600">*</span></label><Field as="select" name="productId" className="w-full rounded-md border-2 border-gray-300 p-2"><option value="">Select Product</option>{productOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Field><ErrorMessage name="productId" component="div" className="text-sm text-red-500" /></div>
                {/* <div><label className="mb-1 block text-sm font-bold text-gray-700">Selected Product</label><input value={productName} disabled className="w-full rounded-md border-2 border-gray-300 bg-gray-100 p-2" /></div> */}
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Available Qty</label><Field name="availableQty" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" /></div>
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Reserved Qty</label><Field name="reservedQty" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" /></div>
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Warehouse Location <span className="text-red-600">*</span></label><Field name="warehouseLocation" className="w-full rounded-md border-2 border-gray-300 p-2" /><ErrorMessage name="warehouseLocation" component="div" className="text-sm text-red-500" /></div>
                <div className="rounded-lg border-2 border-gray-300 p-3"><div className="mb-2 text-sm font-bold text-gray-700">Status</div><Switch checked={Boolean(values.status)} onChange={(e) => setFieldValue("status", e.target.checked)} label={values.status ? "Active" : "Inactive"} /></div>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Button type="button" variant="outlined" className="border-gray-800 text-black" onClick={() => navigate(vendorIdParam ? `/dashboard/vendor-management/vendors/details/${vendorIdParam}?tab=Inventory` : "/dashboard/vendor-management/inventory")}>Cancel</Button>
                <Button className={ColorStyles.continueButtonColor} type="submit" disabled={!dirty || !isValid || isSubmitting}>Update</Button>
              </div>
            </Form>
          )}
        </Formik>
      </CardBody>
    </Card>
  );
};

export default VendorManagementInventoryEdit;
