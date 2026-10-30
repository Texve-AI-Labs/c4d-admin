import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, Switch } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const initialValues = { 
  name: "",
  slug: "", 
  image: null, 
  city: "", 
  description: "", 
  status: true 
};
const schema = Yup.object({ 
  name: Yup.string().trim().required("Name is required"), 
  slug: Yup.string().trim().required("Slug is required"), 
  image: Yup.mixed().required("Logo is required"), 
  city: Yup.string().trim().required("City is required"), 
});

export const VendorManagementVendorsAdd = () => {
  const navigate = useNavigate();
  const [preview, setPreview] = useState("");
  const [cities, setCities] = useState([]);

  useEffect(() => {
    ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" })
      .then((response) => {
        const rows = Array.isArray(response?.data) ? response.data : response?.data?.rows || [];
        const uniqueCities = [...new Set(rows.map((area) => area?.district || area?.name).filter(Boolean))];
        setCities(uniqueCities.map((city) => ({ value: city, label: city })));
      })
      .catch(() => {});
  }, []);

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("slug", values.slug);
      formData.append("city", values.city);
      formData.append("description", values.description);
      formData.append("status", Boolean(values.status));
      if (values.image?.name) {
        formData.append("image", values.image);
        formData.append("fileTypeImage", values.image.type || "");
        formData.append("extImage", values.image.name.split(".").pop()?.toLowerCase() || "");
      }
      await ApiRequestUtils.postDocs(API_ROUTES.ADD_VENDOR, formData);
      navigate("/dashboard/vendor-management/vendors");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl bg-white shadow-none">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Add Vendor</div>
        <Formik initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit}>
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Name <span className="text-red-600">*</span></label>
                  <Field name="name" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="name" component="div" className="text-sm text-red-500" /></div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Slug <span className="text-red-600">*</span></label>
                  <Field name="slug" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="slug" component="div" className="text-sm text-red-500" /></div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Logo <span className="text-red-600">*</span></label>
                  <input type="file" accept="image/*" className="w-full rounded-md border-2 border-gray-300 p-2" onChange={(e) => { const file = e.target.files?.[0] || null; setFieldValue("image", file); setPreview(file ? URL.createObjectURL(file) : ""); }} />
                  <ErrorMessage name="image" component="div" className="text-sm text-red-500" />
                  {preview ? 
                  <div className="rounded-lg border-2 border-gray-300 p-4 mt-2">
                    <div className="mb-2 text-sm font-bold text-gray-700">Preview</div>
                    <img src={preview} alt="preview" className="h-24 w-24 rounded object-cover" />
                    </div>
                  : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">City <span className="text-red-600">*</span></label>
                  <Select
                    name="city"
                    options={cities}
                    value={cities.find((option) => option.value === values.city) || null}
                    onChange={(option) => setFieldValue("city", option?.value || "")}
                    placeholder="Select City"
                    className="w-full"
                  />
                  <ErrorMessage name="city" component="div" className="text-sm text-red-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-bold text-gray-700">Description</label>
                  <Field as="textarea" rows={4} name="description" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  </div>
                <div className="rounded-lg border-2 border-gray-300 p-3">
                  <div className="mb-2 text-sm font-bold text-gray-700">Status <span className="text-red-600">*</span></div>
                  <Switch checked={Boolean(values.status)} onChange={(e) => setFieldValue("status", e.target.checked)} label={values.status ? "Active" : "Inactive"} />                    
                  </div>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="outlined" onClick={() => navigate("/dashboard/vendor-management/vendors")}>Cancel</Button>
                <Button className={ColorStyles.continueButtonColor} type="submit" disabled={!dirty || !isValid || isSubmitting}>Save</Button>
              </div>
            </Form>
          )}
        </Formik>
      </CardBody>
    </Card>
  );
};

export default VendorManagementVendorsAdd;