import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, Switch } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const schema = Yup.object({ 
  vendorId: Yup.string().required("Vendor is required"), 
  name: Yup.string().trim().required("Name is required"), 
  slug: Yup.string().trim().required("Slug is required") });

export const VendorManagementCategoriesEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const vendorIdParam = new URLSearchParams(location.search).get("vendorId") || "";
  const [record, setRecord] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    console.log("[CategoriesEdit] context", { id, vendorIdParam });
  }, [id, vendorIdParam]);

  useEffect(() => {
    Promise.all([ApiRequestUtils.get(API_ROUTES.GET_VENDORS), ApiRequestUtils.get(API_ROUTES.GET_CATEGORY_BY_ID.replace(":id", id))])
      .then(([v, r]) => { setVendors(Array.isArray(v?.data) ? v.data : v?.data?.rows || []); setRecord(r?.data || null); setPreview(r?.data?.imageUrl || ""); })
      .catch(() => {});
  }, [id]);

  const vendorOptions = useMemo(() => vendors.map((v) => ({ value: v.vendorId ?? v.id, label: v.name ?? `Vendor ${v.vendorId ?? v.id}` })), [vendors]);
  const initialValues = useMemo(() => ({ vendorId: record?.vendorId ?? "", name: record?.name ?? "", slug: record?.slug ?? "", image: null, sortOrder: record?.sortOrder ?? "", status: Boolean(record?.status ?? true) }), [record]);
  const selectedVendorName = useMemo(() => {
    const match = vendors.find((v) => String(v?.vendorId ?? v?.id ?? "") === String(record?.vendorId ?? vendorIdParam ?? ""));
    const fallback = record?.vendorId ?? vendorIdParam ?? "";
    return match?.name || (fallback ? `Vendor ${fallback}` : "-");
  }, [vendors, record?.vendorId, vendorIdParam]);

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      console.log("[CategoriesEdit] submit", { id, vendorIdParam, values });
      const formData = new FormData();
      formData.append("categoryId", Number(id));
      formData.append("vendorId", Number(values.vendorId));
      formData.append("name", values.name);
      formData.append("slug", values.slug);
      formData.append("sortOrder", values.sortOrder || 0);
      formData.append("status", Boolean(values.status));
      // if (values.image && values.image.name) {
      //   formData.append("image", values.image);
      //   formData.append("fileTypeImage", values.image.type || "");
      //   formData.append("extImage", values.image.name.split(".").pop()?.toLowerCase() || "");
      // }
      await ApiRequestUtils.updateDocs(API_ROUTES.UPDATE_CATEGORY, formData);
      navigate(vendorIdParam ? `/dashboard/vendor-management/vendors/details/${vendorIdParam}?tab=Categories` : "/dashboard/vendor-management/categories");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl bg-white shadow-none">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Edit Category</div>
        <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit}>
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="hidden">
                  <label className="mb-1 block text-sm font-bold text-gray-700">Vendor</label>
                  <input value={selectedVendorName} disabled className="w-full rounded-md border-2 border-gray-300 bg-gray-100 p-2" />
                </div>
                {/* <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Vendor <span className="text-red-600">*</span></label>
                  <Field as="select" name="vendorId" className="w-full rounded-md border-2 border-gray-300 p-2">
                    <option value="">Select Vendor</option>{vendorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Field>
                    <ErrorMessage name="vendorId" component="div" className="text-sm text-red-500" />
                </div> */}
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Name <span className="text-red-600">*</span></label>
                  <Field name="name" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="name" component="div" className="text-sm text-red-500" /></div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Slug <span className="text-red-600">*</span></label>
                  <Field name="slug" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="slug" component="div" className="text-sm text-red-500" /></div>
                {/* <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Image</label>
                  <input type="file" accept="image/*" className="w-full rounded-md border-2 border-gray-300 p-2" onChange={(e) => { const file = e.target.files?.[0] || null; setFieldValue("image", file); setPreview(file ? URL.createObjectURL(file) : preview); }} />
                  <ErrorMessage name="image" component="div" className="text-sm text-red-500" />
                  {preview ? 
                  <div className="rounded-lg border-2 border-gray-300 p-4 mt-2">
                    <div className="mb-2 text-sm font-bold text-gray-700">Preview</div>
                    <img src={preview} alt="preview" className="h-24 w-24 rounded object-cover" />
                    </div> : null}
                </div> */}
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Sort Order</label>
                  <Field name="sortOrder" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" /></div>
                <div className="rounded-lg border-2 border-gray-300 p-3">
                  <div className="mb-2 text-sm font-bold text-gray-700">Status</div>
                  <Switch checked={Boolean(values.status)} onChange={(e) => setFieldValue("status", e.target.checked)} label={values.status ? "Active" : "Inactive"} />
                  </div>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Button variant="outlined" className="border-gray-800 text-black" onClick={() => {
                  console.log("[CategoriesEdit] cancel", { id, vendorIdParam });
                  navigate(vendorIdParam ? `/dashboard/vendor-management/vendors/details/${vendorIdParam}?tab=Categories` : "/dashboard/vendor-management/categories");
                }}>Cancel</Button>
                <Button className={ColorStyles.continueButtonColor} type="submit" disabled={!dirty || !isValid || isSubmitting}>Update</Button>
              </div>
            </Form>
          )}
        </Formik>
      </CardBody>
    </Card>
  );
};

export default VendorManagementCategoriesEdit;
