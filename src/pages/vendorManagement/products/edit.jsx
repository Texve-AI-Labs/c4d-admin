import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, Switch, Typography } from "@material-tailwind/react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const schema = Yup.object({ name: Yup.string().trim().required("Name is required"), sku: Yup.string().trim().required("SKU is required"), description: Yup.string().trim(), brand: Yup.string().trim(), image: Yup.mixed().required("Image is required") });
export const VendorManagementProductsEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    Promise.all([ApiRequestUtils.get(API_ROUTES.GET_PRODUCT_BY_ID.replace(":id", id))])
      .then(([r]) => {
        setRecord(r?.data || null);
        setPreview(r?.data?.images?.[0] || r?.data?.images || r?.data?.image || "");
      })
      .catch(() => {});
  }, [id]);

  const initialValues = useMemo(
    () => ({
      name: record?.name ?? "",
      sku: record?.sku ?? "",
      description: record?.description ?? "",
      brand: record?.brand ?? "",
      image: record?.images?.[0] ?? record?.images ?? record?.image ?? null,
      status: Boolean(record?.status ?? true),
    }),
    [record]
  );

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append("productId", Number(id));
      formData.append("name", values.name);
      formData.append("sku", values.sku);
      formData.append("description", values.description);
      formData.append("brand", values.brand);
      formData.append("status", Boolean(values.status));
      formData.append("image", values.image || "");
      if (values.image?.name) {
        formData.append("fileTypeImage", values.image.type || "");
        formData.append("extImage", values.image.name.split(".").pop()?.toLowerCase() || "");
      }
      await ApiRequestUtils.updateDocs(API_ROUTES.UPDATE_PRODUCT, formData);
      navigate("/dashboard/vendor-management/products");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Edit Product</div>
        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={onSubmit}
        >
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold">Name <span className="text-red-600">*</span></label>
                  <Field name="name" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="name" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">SKU <span className="text-red-600">*</span></label>
                  <Field name="sku" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="sku" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Brand <span className="text-red-600">*</span></label>
                  <Field name="brand" className="w-full rounded-md border-2 border-gray-300 p-2" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Image <span className="text-red-600">*</span></label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full rounded-md border-2 border-gray-300 p-2"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFieldValue("image", file);
                      setPreview(file ? URL.createObjectURL(file) : "");
                    }}
                  />
                  <ErrorMessage name="image" component="div" className="text-sm text-red-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-bold">Description <span className="text-red-600">*</span></label>
                  <Field as="textarea" rows={4} name="description" className="w-full rounded-md border-2 border-gray-300 p-2" />
                </div>
                <div className="rounded-lg border-2 border-gray-300 p-3">
                  <div className="mb-2 text-sm font-bold">Status</div>
                  <Switch
                    checked={Boolean(values.status)}
                    onChange={(e) => setFieldValue("status", e.target.checked)}
                    label={values.status ? "Active" : "Inactive"}
                  />
                </div>
              </div>
              {preview ? (
                <img src={preview} alt="preview" className="h-24 w-24 rounded object-cover" />
              ) : null}
              <div className="flex justify-center gap-3">
                <Button
                  variant="outlined"
                  onClick={() => navigate("/dashboard/vendor-management/products")}
                >
                  Cancel
                </Button>
                <Button
                  className={ColorStyles.continueButtonColor}
                  type="submit"
                  disabled={!dirty || !isValid || isSubmitting}
                >
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
export default VendorManagementProductsEdit;
