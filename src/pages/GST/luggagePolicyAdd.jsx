import React from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@material-tailwind/react";
import { ColorStyles, API_ROUTES } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { useNavigate } from "react-router-dom";

const LUGGAGE_POLICY_SCHEMA = Yup.object().shape({
  serviceType: Yup.string().required("Service Type is required"),
  name: Yup.string().required("Name is required"),
  description: Yup.string().required("Description is required"),
  mini: Yup.number().typeError("Mini must be a number").min(0, "Mini cannot be negative").required("Mini is required"),
  sedan: Yup.number().typeError("Sedan must be a number").min(0, "Sedan cannot be negative").required("Sedan is required"),
  suv: Yup.number().typeError("SUV must be a number").min(0, "SUV cannot be negative").required("SUV is required"),
  muv: Yup.number().typeError("MUV must be a number").min(0, "MUV cannot be negative").required("MUV is required"),
  isActive: Yup.mixed()
    .oneOf([true, false, "true", "false"], "Status is required")
    .required("Status is required"),
});

const LuggagePolicyAdd = () => {
  const navigate = useNavigate();

  const initialValues = {
    serviceType: "ALL",
    name: "LUGGAGE_POLICY",
    description: "",
    mini: 1,
    sedan: 1,
    suv: 2,
    muv: 2,
    isActive: "true",
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        serviceType: "ALL",
        type: "TERMS_AND_CONDITIONS",
        name: "LUGGAGE_POLICY",
        description: values.description,
        config: {
          luggageCapacity: {
            mini: Number(values.mini),
            sedan: Number(values.sedan),
            suv: Number(values.suv),
            muv: Number(values.muv),
          },
        },
        isActive: values.isActive === true || values.isActive === "true",
      };
      await ApiRequestUtils.post(API_ROUTES.POST_GST, payload);
      navigate("/dashboard/finance/GSTList");
    } catch (error) {
      console.error("Luggage policy save failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 mx-auto bg-white rounded-lg shadow-md max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Add Luggage Policy</h2>

      <Formik initialValues={initialValues} validationSchema={LUGGAGE_POLICY_SCHEMA} onSubmit={handleSubmit}>
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Service Type</label>
                <Field as="select" name="serviceType" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" disabled>
                  {/* <option value="DRIVER">DRIVER</option>
                  <option value="RIDES">RIDES</option>
                  <option value="RENTAL">RENTAL</option> */}
                  <option value="ALL">ALL</option>
                </Field>
                <ErrorMessage name="serviceType" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Field as="select" name="isActive" className="p-2 w-full rounded-md border border-gray-300 shadow-sm">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Field>
                <ErrorMessage name="isActive" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <Field as="select" name="name" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" disabled>
                  <option value="LUGGAGE_POLICY">LUGGAGE_POLICY</option>
                </Field>
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Field name="description" type="text" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="description" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Mini</label>
                <Field name="mini" type="number" min="0" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="mini" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Sedan</label>
                <Field name="sedan" type="number" min="0" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="sedan" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">SUV</label>
                <Field name="suv" type="number" min="0" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="suv" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">MUV</label>
                <Field name="muv" type="number" min="0" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="muv" component="div" className="text-red-500 text-sm" />
              </div>
            </div>

            <div className="flex flex-row">
              <Button
                fullWidth
                type="button"
                onClick={() => navigate("/dashboard/finance/GSTList")}
                className={`my-6 mx-2 border-2 rounded-xl ${ColorStyles.backButton}`}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                type="submit"
                disabled={isSubmitting}
                className={`my-6 mx-2 border-2 rounded-xl ${ColorStyles.continueButtonColor}`}
              >
                Add
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default LuggagePolicyAdd;