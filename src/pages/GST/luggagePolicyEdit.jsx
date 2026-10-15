import React, { useEffect, useState } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Alert, Button, Spinner } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { LUGGAGE_POLICY_SCHEMA, createPolicyValues, buildPolicyConfig } from "./luggagePolicyConfig.js";
import LuggageCapacityFields from "./LuggageCapacityFields.jsx";

const LuggagePolicyEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (location.state?.gst) {
      const raw = location.state.gst;
      setData(createPolicyValues(raw));
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await ApiRequestUtils.get(`${API_ROUTES.GET_GST}?id=${id}`);
        if (!response?.success || !response.data) throw new Error(response?.message || "Unable to load luggage policy");
        if (response?.success && response.data) {
          const raw = Array.isArray(response.data) ? response.data.find((item) => String(item.id) === String(id)) : response.data;
          if (!raw) throw new Error("Luggage policy not found");
          setData(createPolicyValues(raw));
        }
      } catch (error) {
        setAlert({ color: "red", message: "Unable to load luggage policy. Please return to the list and try again." });
        console.error("Failed to fetch luggage policy data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, location.state]);

  const initialValues = createPolicyValues(data);

  const onSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus(null);
    try {
      const payload = {
        settingId: parseInt(id),
        serviceType:"ALL",
        type: "TERMS_AND_CONDITIONS",
        name: "LUGGAGE_POLICY",
        description: values.description,
        config: buildPolicyConfig(values.config),
        isActive: values.isActive === true || values.isActive === "true",
      };
      const response = await ApiRequestUtils.update(API_ROUTES.PUT_GST, payload);
      if (!response?.success) {
        setStatus(response?.message || "Unable to save settings. Please try again.");
        return;
      }
      navigate("/dashboard/finance/GSTList", { state: { selectedType: "LUGGAGE_POLICY" } });
    } catch (error) {
      setStatus(error?.response?.data?.message || "Unable to save settings. Please try again.");
      console.error("Error updating luggage policy:", error);
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
      <h2 className="text-2xl font-bold mb-4">Edit Luggage Policy</h2>
      <Formik enableReinitialize initialValues={initialValues} validationSchema={LUGGAGE_POLICY_SCHEMA} onSubmit={onSubmit}>
        {({ status, isSubmitting, isValid }) => (
          <Form className="space-y-4">
            {status && <div role="alert" className="text-red-500 text-sm">{status}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Service Type</label>
                <Field as="select" name="serviceType" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" disabled>
                  {/* <option value="DRIVER">DRIVER</option>
                  <option value="RIDES">RIDES</option>
                  <option value="RENTAL">RENTAL</option> */}
                  <option value="ALL">ALL</option>
                </Field>
                <ErrorMessage name="serviceType" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Field as="select" name="isActive" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Field>
                <ErrorMessage name="isActive" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <Field as="select" name="name" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" disabled>
                  <option value="LUGGAGE_POLICY">LUGGAGE_POLICY</option>
                </Field>
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Field name="description" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="description" component="div" className="text-red-500 text-sm" />
              </div>


            </div>

            <LuggageCapacityFields />

            <div className="flex flex-row">
              <Button
                fullWidth
                type="button"
                className={`my-6 mx-2 rounded-xl ${ColorStyles.backButton}`}
                onClick={() => navigate("/dashboard/finance/GSTList", { state: { selectedType: "LUGGAGE_POLICY" } })}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                type="submit"
                disabled={isSubmitting || !isValid || Boolean(alert)}
                className={`my-6 px-8 border-2 rounded-xl ${ColorStyles.continueButtonColor}`}
              >
                Update
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default LuggagePolicyEdit;