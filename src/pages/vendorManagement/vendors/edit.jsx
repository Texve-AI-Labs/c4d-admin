import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, Switch, Typography } from "@material-tailwind/react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const schema = Yup.object({
  name: Yup.string().trim().required("Name is required"),
  slug: Yup.string().trim().required("Slug is required"),
  image: Yup.mixed().required("Image is required"),
  city: Yup.string().trim(),
  description: Yup.string().trim(),
});

export const VendorManagementVendorsEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [preview, setPreview] = useState("");
  const [serviceAreas, setServiceAreas] = useState([]);

  useEffect(() => {
    const loadZones = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: "Service Area" });
        const areas = Array.isArray(response?.data) ? response.data : [];
        setServiceAreas(areas);
      } catch (error) {
        console.error("Error fetching GEO_MARKINGS_LIST:", error);
      }
    };
    loadZones();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await ApiRequestUtils.get(API_ROUTES.GET_VENDOR_BY_ID.replace(":id", id));
        setRecord(response?.data || null);
        setPreview(response?.data?.logoUrl || "");
      } catch (error) {
        console.error("Failed to load vendor:", error);
      }
    };
    load();
  }, [id]);

  const initialValues = useMemo(() => ({
    name: record?.name ?? "",
    slug: record?.slug ?? "",
    image: record?.logoUrl ?? null,
    city: record?.city ?? "",
    description: record?.description ?? "",
    status: Boolean(record?.status ?? true),
  }), [record]);

  const ZONE_OPTIONS = useMemo(
    () => [
      { value: "All", label: "All" },
      ...serviceAreas.map((area) => ({
        value: area.name,
        label: area.name,
      })),
    ],
    [serviceAreas]
  );

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append("vendorId", Number(id));
      formData.append("name", values.name);
      formData.append("slug", values.slug);
      formData.append("city", values.city);
      formData.append("description", values.description);
      formData.append("status", Boolean(values.status));
      if (values.image && values.image.name) {
        formData.append("image", values.image);
        formData.append("fileTypeImage", values.image.type || "");
        formData.append("extImage", values.image.name.split(".").pop()?.toLowerCase() || "");
      }
      await ApiRequestUtils.updateDocs(API_ROUTES.UPDATE_VENDOR, formData);
      navigate("/dashboard/vendor-management/vendors");
    } catch (error) {
      console.error("Failed to update vendor:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Edit Vendor</div>
        <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit}>
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Name <span className="text-red-600">*</span></label><Field name="name" className="w-full rounded-md border-2 border-gray-300 p-2" /><ErrorMessage name="name" component="div" className="text-sm text-red-500" /></div>
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Slug <span className="text-red-600">*</span></label><Field name="slug" className="w-full rounded-md border-2 border-gray-300 p-2" /><ErrorMessage name="slug" component="div" className="text-sm text-red-500" /></div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Image <span className="text-red-600">*</span></label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full rounded-md border-2 border-gray-300 p-2"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFieldValue("image", file);
                      setPreview(file ? URL.createObjectURL(file) : preview || "");
                    }}
                  />
                  <ErrorMessage name="image" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label htmlFor="city" className="mb-1 block text-sm font-bold text-gray-700">Zone <span className="text-red-600">*</span></label>
                  <Select
                    options={ZONE_OPTIONS}
                    value={ZONE_OPTIONS.find((opt) => opt.value === values.city) || null}
                    onChange={(opt) => setFieldValue("city", opt?.value || "")}
                    placeholder="Select Zone"
                    className="w-full"
                    name="city"
                  />
                  <ErrorMessage name="city" component="div" className="text-sm text-red-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-bold text-gray-700">Description <span className="text-red-600">*</span></label>
                <Field as="textarea" rows={4} name="description" className="w-full rounded-md border-2 border-gray-300 p-2" />
                <ErrorMessage name="description" component="div" className="text-sm text-red-500" />
                </div>
                <div className="rounded-lg border-2 border-gray-300 p-3">
                  <div className="mb-2 text-sm font-bold text-gray-700">Status <span className="text-red-600">*</span></div>
                  <Switch
                    checked={Boolean(values.status)}
                    onChange={(e) => setFieldValue("status", e.target.checked)}
                    label={values.status ? "Active" : "Inactive"}
                  />
                </div>
              </div>
              {preview ? (
                <div className="rounded-lg border-2 border-gray-300 p-4">
                  <div className="mb-2 text-sm font-bold text-gray-700">Preview</div>
                  <img src={preview} alt="Image preview" className="h-24 w-24 rounded object-cover" />
                </div>
              ) : null}
              <div className="flex justify-center gap-3">
                <Button variant="outlined" onClick={() => navigate("/dashboard/vendor-management/vendors")}>Cancel</Button>
                <Button className={ColorStyles.continueButtonColor} type="submit" disabled={!dirty || !isValid || isSubmitting}>Update</Button>
              </div>
            </Form>
          )}
        </Formik>
      </CardBody>
    </Card>
  );
};

export default VendorManagementVendorsEdit;
