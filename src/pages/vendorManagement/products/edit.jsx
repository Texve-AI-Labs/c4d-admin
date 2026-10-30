import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, Switch } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const schema = Yup.object({ name: Yup.string().trim().required("Name is required"), sku: Yup.string().trim().required("SKU is required") });

export const VendorManagementProductsEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const vendorIdParam = new URLSearchParams(location.search).get("vendorId") || "";
  const [record, setRecord] = useState(null);
  const [preview, setPreview] = useState("");
  const resolveImageUrl = (value) => {
    if (Array.isArray(value)) return value.find(Boolean) || "";
    if (typeof value === "string") return value;
    return value?.url || value?.path || value?.imageUrl || value?.src || "";
  };

  useEffect(() => {
    ApiRequestUtils.get(API_ROUTES.GET_PRODUCT_BY_ID.replace(":id", id)).then((productResponse) => {
      setRecord(productResponse?.data || null);
      setPreview(resolveImageUrl(productResponse?.data?.images) || productResponse?.data?.imageUrl || productResponse?.data?.image || "");
    }).catch(() => {});
  }, [id]);

  const initialValues = useMemo(() => ({ name: record?.name ?? "", sku: record?.sku ?? "", description: record?.description ?? "", brand: record?.brand ?? "", image: null, status: Boolean(record?.status ?? true) }), [record]);

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append("productId", Number(id));
      formData.append("name", values.name);
      formData.append("sku", values.sku);
      formData.append("description", values.description);
      formData.append("brand", values.brand);
      formData.append("status", Boolean(values.status));
      if (values.image && values.image.name) {
        formData.append("image", values.image);
        formData.append("fileTypeImage", values.image.type || "");
        formData.append("extImage", values.image.name.split(".").pop()?.toLowerCase() || "");
      }
      await ApiRequestUtils.updateDocs(API_ROUTES.UPDATE_PRODUCT, formData);
      navigate(vendorIdParam ? `/dashboard/vendor-management/vendors/details/${vendorIdParam}?tab=Products` : "/dashboard/vendor-management/products");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl bg-white shadow-none">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Edit Product</div>
        <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit}>
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Name <span className="text-red-600">*</span></label><Field name="name" className="w-full rounded-md border-2 border-gray-300 p-2" /><ErrorMessage name="name" component="div" className="text-sm text-red-500" /></div>
                <div><label className="mb-1 block text-sm font-bold text-gray-700">SKU (Unique) <span className="text-red-600">*</span></label><Field name="sku" className="w-full rounded-md border-2 border-gray-300 p-2" /><ErrorMessage name="sku" component="div" className="text-sm text-red-500" /></div>
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Brand</label><Field name="brand" className="w-full rounded-md border-2 border-gray-300 p-2" /></div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Image</label>
                  <input type="file" accept="image/*" className="w-full rounded-md border-2 border-gray-300 p-2" onChange={(e) => { const file = e.target.files?.[0] || null; setFieldValue("image", file); setPreview(file ? URL.createObjectURL(file) : preview); }} />
                  <ErrorMessage name="image" component="div" className="text-sm text-red-500" />
                  {preview ? <div className="rounded-lg border-2 border-gray-300 p-4 mt-2"><div className="mb-2 text-sm font-bold text-gray-700">Preview</div><img src={preview} alt="preview" className="h-24 w-24 rounded object-cover" /></div> : null}                  
                </div>
                <div className="md:col-span-2"><label className="mb-1 block text-sm font-bold text-gray-700">Description</label><Field as="textarea" rows={4} name="description" className="w-full rounded-md border-2 border-gray-300 p-2" /></div>
                <div className="rounded-lg border-2 border-gray-300 p-3"><div className="mb-2 text-sm font-bold text-gray-700">Status</div><Switch checked={Boolean(values.status)} onChange={(e) => setFieldValue("status", e.target.checked)} label={values.status ? "Active" : "Inactive"} /></div>
              </div>              
              <div className="flex justify-center gap-3 pt-2">
                <Button type="button" variant="outlined" className="border-gray-800 text-black" onClick={() => navigate(vendorIdParam ? `/dashboard/vendor-management/vendors/details/${vendorIdParam}?tab=Products` : "/dashboard/vendor-management/products")}>Cancel</Button>
                <Button type="submit" className={ColorStyles.continueButtonColor} disabled={!dirty || !isValid || isSubmitting}>Update</Button>
              </div>
            </Form>
          )}
        </Formik>
      </CardBody>
    </Card>
  );
};

export default VendorManagementProductsEdit;
