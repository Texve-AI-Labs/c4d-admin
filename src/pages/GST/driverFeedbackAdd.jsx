import React from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { Button } from "@material-tailwind/react";
import { ColorStyles, API_ROUTES } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

const DRIVER_FEEDBACK_SCHEMA = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  serviceDescription: Yup.string(),
  isActive: Yup.mixed()
    .oneOf([true, false, "true", "false"], "Status is required")
    .required("Status is required"),
  configEnabled: Yup.boolean(),
});

const DriverFeedbackAdd = () => {
  const navigate = useNavigate();

  const initialValues = {
    name: "",
    serviceDescription: "",
    isActive: true,
    configEnabled: true,
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const isActive = values.isActive === true || values.isActive === "true";
      const payload = {
        serviceType: "DRIVER",
        type: "DRIVER_FEEDBACK",
        name: values.name,
        description: values.serviceDescription || "",
        config: {
          enabled: Boolean(values.configEnabled),
        },
        isActive,
      };
      await ApiRequestUtils.post(API_ROUTES.POST_GST, payload);
      navigate("/dashboard/finance/GSTList");
    } catch (error) {
      console.error("Driver feedback save failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 mx-auto bg-white rounded-lg shadow-md max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Add Driver Feedback</h2>
      <Formik initialValues={initialValues} validationSchema={DRIVER_FEEDBACK_SCHEMA} onSubmit={handleSubmit}>
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <Field name="name" type="text" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Field as="select" name="isActive" className="p-2 w-full rounded-md border border-gray-300 shadow-sm">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Field>
                <ErrorMessage name="isActive" component="div" className="text-red-500 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">Service Description</label>
                <Field name="serviceDescription" type="text" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
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
              <Button fullWidth type="button" onClick={() => navigate("/dashboard/finance/GSTList")} className={`my-6 mx-2 border-2 rounded-xl ${ColorStyles.backButton}`}>
                Cancel
              </Button>
              <Button fullWidth type="submit" disabled={isSubmitting} className={`my-6 mx-2 border-2 rounded-xl ${ColorStyles.continueButtonColor}`}>
                Add
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default DriverFeedbackAdd;
