import React, { useEffect, useState } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Alert, Button, Spinner } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import * as Yup from "yup";

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

const LuggagePolicyEdit = () => {
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
        serviceType: raw.serviceType || "ALL",
        name: raw.name || "LUGGAGE_POLICY",
        description: raw.description || "",
        mini: raw?.config?.luggageCapacity?.mini ?? 1,
        sedan: raw?.config?.luggageCapacity?.sedan ?? 1,
        suv: raw?.config?.luggageCapacity?.suv ?? 2,
        muv: raw?.config?.luggageCapacity?.muv ?? 2,
        isActive: raw.isActive ?? true,
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
            serviceType: raw.serviceType || "ALL",
            name: raw.name || "LUGGAGE_POLICY",
            description: raw.description || "",
            mini: raw?.config?.luggageCapacity?.mini ?? 1,
            sedan: raw?.config?.luggageCapacity?.sedan ?? 1,
            suv: raw?.config?.luggageCapacity?.suv ?? 2,
            muv: raw?.config?.luggageCapacity?.muv ?? 2,
            isActive: raw.isActive ?? true,
          });
        }
      } catch (error) {
        console.error("Failed to fetch luggage policy data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, location.state]);

  const initialValues = {
    serviceType: data?.serviceType || "ALL",
    name: data?.name || "LUGGAGE_POLICY",
    description: data?.description || "",
    mini: data?.mini ?? 1,
    sedan: data?.sedan ?? 1,
    suv: data?.suv ?? 2,
    muv: data?.muv ?? 2,
    isActive: data?.isActive ?? true,
  };

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        settingId: parseInt(id),
        serviceType: values.serviceType,
        type: "TERMS_AND_CONDITIONS",
        name: values.name,
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
      const response = await ApiRequestUtils.update(API_ROUTES.PUT_GST, payload);
      if (response?.success) navigate("/dashboard/finance/GSTList");
    } catch (error) {
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
        {({ isSubmitting, isValid }) => (
          <Form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Service Type</label>
                <Field as="select" name="serviceType" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                  <option value="DRIVER">DRIVER</option>
                  <option value="RIDES">RIDES</option>
                  <option value="RENTAL">RENTAL</option>
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
                <Field name="name" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Field name="description" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="description" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Mini</label>
                <Field name="mini" type="number" min="0" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="mini" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Sedan</label>
                <Field name="sedan" type="number" min="0" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="sedan" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">SUV</label>
                <Field name="suv" type="number" min="0" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="suv" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">MUV</label>
                <Field name="muv" type="number" min="0" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="muv" component="div" className="text-red-500 text-sm" />
              </div>
            </div>

            <div className="flex flex-row">
              <Button
                fullWidth
                type="button"
                className={`my-6 mx-2 rounded-xl ${ColorStyles.backButton}`}
                onClick={() => navigate("/dashboard/finance/GSTList")}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                type="submit"
                disabled={isSubmitting || !isValid}
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