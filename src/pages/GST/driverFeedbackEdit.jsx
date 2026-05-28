import React, { useEffect, useState } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Alert, Button, Spinner } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import * as Yup from "yup";

const DRIVER_FEEDBACK_SCHEMA = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  serviceDescription: Yup.string(),
  isActive: Yup.mixed()
    .oneOf([true, false, "true", "false"], "Status is required")
    .required("Status is required"),
  configEnabled: Yup.boolean(),
});

const DriverFeedbackEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [alert] = useState(null);

  useEffect(() => {
    if (location.state?.gst) {
      const raw = location.state.gst;
      setData({
        name: raw.name || "",
        serviceDescription: raw.config?.serviceDescription || raw.description || "",
        isActive: raw.isActive ?? true,
        configEnabled: typeof raw.config?.enabled === "boolean" ? raw.config.enabled : true,
      });
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const response = await ApiRequestUtils.get(`${API_ROUTES.GET_GST}?id=${id}`);
        if (response?.success && response.data) {
          const raw = response.data;
          setData({
            name: raw.name || "",
            serviceDescription: raw.config?.serviceDescription || raw.description || "",
            isActive: raw.isActive ?? true,
            configEnabled: typeof raw.config?.enabled === "boolean" ? raw.config.enabled : true,
          });
        }
      } catch (error) {
        console.error("Failed to fetch driver feedback data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, location.state]);

  const initialValues = {
    name: data?.name || "",
    serviceDescription: data?.serviceDescription || "",
    isActive: data?.isActive ?? true,
    configEnabled: data?.configEnabled ?? true,
  };

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const isActive = values.isActive === true || values.isActive === "true";
      const payload = {
        settingId: parseInt(id),
        serviceType: "DRIVER",
        type: "DRIVER_FEEDBACK",
        name: values.name,
        description: values.serviceDescription || "",
        config: {
          enabled: Boolean(values.configEnabled),
        },
        isActive,
      };
      const response = await ApiRequestUtils.update(API_ROUTES.PUT_GST, payload);
      if (response?.success) navigate("/dashboard/finance/GSTList");
    } catch (error) {
      console.error("Error updating driver feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto bg-white rounded-lg shadow-md max-w-3xl">
      {alert && <Alert color={alert.color} className="mb-4">{alert.message}</Alert>}
      <h2 className="text-2xl font-bold mb-4">Edit Driver Feedback</h2>
      <Formik enableReinitialize initialValues={initialValues} validationSchema={DRIVER_FEEDBACK_SCHEMA} onSubmit={onSubmit}>
        {({ isSubmitting, isValid }) => (
          <Form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <Field name="name" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Field as="select" name="isActive" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Field>
                <ErrorMessage name="isActive" component="div" className="text-red-500 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">Service Description</label>
                <Field name="serviceDescription" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="serviceDescription" component="div" className="text-red-500 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <Field type="checkbox" name="configEnabled" />
                  <span>Config Enabled</span>
                </label>
              </div>
            </div>
            <div className="flex flex-row">
              <Button fullWidth type="button" className={`my-6 mx-2 rounded-xl ${ColorStyles.backButton}`} onClick={() => navigate("/dashboard/finance/GSTList")}>
                Cancel
              </Button>
              <Button fullWidth type="submit" disabled={isSubmitting || !isValid} className={`my-6 px-8 border-2 rounded-xl ${ColorStyles.continueButtonColor}`}>
                Update
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default DriverFeedbackEdit;
