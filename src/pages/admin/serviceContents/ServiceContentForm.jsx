import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Typography } from "@material-tailwind/react";
import { Form, Formik } from "formik";
import Swal from "sweetalert2";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import ServiceContentBasicDetails from "./components/ServiceContentBasicDetails";
import ServiceContentContentEditor from "./components/ServiceContentContentEditor";
import ServiceContentImagesEditor from "./components/ServiceContentImagesEditor";
import ServiceContentMetadataEditor from "./components/ServiceContentMetadataEditor";
import {
  SERVICE_TYPES,
  formatLabel,
  buildInitialValues,
  validateMetadataText,
  isNonEmpty,
} from "./serviceContentFormUtils";

function ServiceContentForm({ mode = "create", record = null }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [metadataCollapsed, setMetadataCollapsed] = useState(true);
  const [metadataError, setMetadataError] = useState("");

  const initialValues = useMemo(() => buildInitialValues(record), [record]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError("");
      const metadataCheck = validateMetadataText(values.metadataText);
      if (!metadataCheck.ok) {
        setMetadataError("Metadata must be valid JSON.");
        return;
      }

      const payload = {
        serviceType: values.serviceType,
        usageType: values.usageType,
        contentMode: values.contentMode,
        content: {
          title: values.content?.title || "",
          clariText: values.content?.clariText || "",
          terms: Array.isArray(values.content?.terms) ? values.content.terms.filter(isNonEmpty) : [],
        },
        images: Array.isArray(values.images)
          ? values.images
              .filter((image) => isNonEmpty(image?.url))
              .map((image) => ({
                url: image.url || "",
                alt: image.alt || "",
                title: image.title || "",
                sortOrder: Number(image.sortOrder) || 0,
              }))
          : [],
        metadata: metadataCheck.parsed,
        isActive: Boolean(values.isActive),
        sortOrder: Number(values.sortOrder) || 0,
      };

      if (!payload.serviceType) {
        setError("Service type is required.");
        return;
      }
      if (!payload.content.title) {
        setError("Content title is required.");
        return;
      }
      if (!payload.content.terms.every(isNonEmpty)) {
        setError("All terms must be non-empty.");
        return;
      }

      const response =
        mode === "edit" && record?.id
          ? await ApiRequestUtils.update(`${API_ROUTES.PUT_SERVICE_CONTENT}/${record.id}`, payload, 0, { suppressAlert: true })
          : await ApiRequestUtils.post(API_ROUTES.POST_SERVICE_CONTENT, payload, 0, { suppressAlert: true });

      if (response?.success === false) {
        setError(response?.message || "Unable to save service content.");
        return;
      }

      navigate("/dashboard/admin/service-contents");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to save service content.");
      await Swal.fire("Error", err?.response?.data?.message || err?.message || "Unable to save service content.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!record?.id) return;
    const result = await Swal.fire({
      title: "Deactivate service content?",
      text: "This will mark the record inactive.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Deactivate",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    const response = await ApiRequestUtils.delete(`${API_ROUTES.DELETE_SERVICE_CONTENT}/${record.id}`);
    if (response?.success) navigate("/dashboard/admin/service-contents");
  };

  return (
    <div className="mb-8 mt-8">
      <Card className="overflow-hidden">
        {/* <CardHeader variant="gradient" className={`rounded-sm p-6 mt-2 ${ColorStyles.bgColor}`}>
          
        </CardHeader> */}
        <CardBody className="bg-slate-50">
          <div className="flex flex-col gap-1 mb-2">
            <Typography variant="h6" color="black">
              {mode === "edit" ? "Edit Service Content" : "Add Service Content"}
            </Typography>
            <Typography variant="small" color="black" className="opacity-80">
              Manage onboarding content shown to users.
            </Typography>
          </div>
          {error ? <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <Formik initialValues={initialValues} onSubmit={handleSubmit} enableReinitialize>
            {({ values, isSubmitting, setFieldValue }) => (
              <Form className="space-y-6">
                <ServiceContentBasicDetails
                  values={values}
                  setFieldValue={setFieldValue}
                  serviceTypes={SERVICE_TYPES}
                  formatLabel={formatLabel}
                />
                <ServiceContentContentEditor values={values} setFieldValue={setFieldValue} />
                <ServiceContentImagesEditor values={values} setFieldValue={setFieldValue} />
                <ServiceContentMetadataEditor
                  values={values}
                  setFieldValue={setFieldValue}
                  collapsed={metadataCollapsed}
                  setCollapsed={setMetadataCollapsed}
                  metadataError={metadataError}
                  setMetadataError={setMetadataError}
                  validateMetadataText={validateMetadataText}
                />
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Button type="submit" disabled={isSubmitting} className={`min-w-[120px] ${ColorStyles.continueButtonColor}`}>
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" variant="outlined" className="min-w-[120px]" onClick={() => navigate("/dashboard/admin/service-contents")}>
                    Cancel
                  </Button>
                  {/* {mode === "edit" ? (
                    <Button type="button" color="red" variant="outlined" className="min-w-[120px]" onClick={handleDelete}>
                      Deactivate
                    </Button>
                  ) : null} */}
                </div>
              </Form>
            )}
          </Formik>
        </CardBody>
      </Card>
    </div>
  );
}

export default ServiceContentForm;