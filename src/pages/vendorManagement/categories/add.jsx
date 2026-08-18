import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, Switch, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const initialValues = { vendorId: "", name: "", slug: "", image: null, sortOrder: "", status: true };
const schema = Yup.object({
  vendorId: Yup.string().required("Vendor is required"),
  name: Yup.string().trim().required("Name is required"),
  slug: Yup.string().trim().required("Slug is required"),
  image: Yup.mixed().required("Image is required"),
  sortOrder: Yup.number().typeError("Sort order must be a number").nullable(),
});

export const VendorManagementCategoriesAdd = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  useEffect(() => {
    ApiRequestUtils.get(API_ROUTES.GET_VENDORS)
      .then((r) => setVendors(Array.isArray(r?.data) ? r.data : r?.data?.rows || []))
      .catch(() => {});
  }, []);

  const options = useMemo(
    () =>
      vendors.map((v) => ({
        value: v.vendorId ?? v.id,
        label: v.name ?? `Vendor ${v.vendorId ?? v.id}`,
      })),
    [vendors]
  );

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append("vendorId", Number(values.vendorId));
      formData.append("name", values.name);
      formData.append("slug", values.slug);
      formData.append("sortOrder", values.sortOrder === "" ? "" : Number(values.sortOrder));
      formData.append("status", Boolean(values.status));
      formData.append("image", values.image || "");
      if (values.image?.name) {
        formData.append("fileTypeImage", values.image.type || "");
        formData.append("extImage", values.image.name.split(".").pop()?.toLowerCase() || "");
      }
      await ApiRequestUtils.postDocs(API_ROUTES.ADD_CATEGORY, formData);
      navigate("/dashboard/vendor-management/categories");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Add Category</div>
        <Formik initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit}>
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold">Vendor <span className="text-red-600">*</span></label>
                  <Field as="select" name="vendorId" className="w-full rounded-md border-2 border-gray-300 p-2">
                    <option value="">Select Vendor</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="vendorId" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Name <span className="text-red-600">*</span></label>
                  <Field name="name" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="name" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Slug <span className="text-red-600">*</span></label>
                  <Field name="slug" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="slug" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Image <span className="text-red-600">*</span></label>
                  <input type="file" accept="image/*" className="w-full rounded-md border-2 border-gray-300 p-2" onChange={(e) => setFieldValue("image", e.target.files?.[0] || null)} />
                  <ErrorMessage name="image" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Sort Order <span className="text-red-600">*</span></label>
                  <Field name="sortOrder" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="sortOrder" component="div" className="text-sm text-red-500" />
                </div>
                <div className="rounded-lg border-2 border-gray-300 p-3">
                  <div className="mb-2 text-sm font-bold">Status <span className="text-red-600">*</span></div>
                  <Switch
                    checked={Boolean(values.status)}
                    onChange={(e) => setFieldValue("status", e.target.checked)}
                    label={values.status ? "Active" : "Inactive"}
                  />
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="outlined" onClick={() => navigate("/dashboard/vendor-management/categories")}>
                  Cancel
                </Button>
                <Button className={ColorStyles.continueButtonColor} type="submit" disabled={!dirty || !isValid || isSubmitting}>
                  Save
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </CardBody>
    </Card>
  );
};

export default VendorManagementCategoriesAdd;
