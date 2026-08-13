import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import * as Yup from "yup";

const initialValues = {
  serviceType: "",
  zone: "",
  earningStrategy: "",
  validityDays: "",
  earningWindowDays: "",
  price: "",
  status: "ACTIVE",
};

const SERVICE_TYPE_OPTIONS = [
  { value: "ACTING_DRIVER", label: "Driver" },
  { value: "RIDES_RENTAL_CABS", label: "Rides/Rental Cabs" },
  { value: "AUTO", label: "Auto" },
  { value: "BIKE", label: "Bike" },
];

const validationSchema = Yup.object().shape({
  serviceType: Yup.string().required("Service Type is required"),
  zone: Yup.string().required("Zone is required"),
  earningStrategy: Yup.string().oneOf(["UNLIMITED", "CREDIT"]).required("Earning Strategy is required"),
  validityDays: Yup.number()
  .typeError("Validity Days must be a number")
  .when("earningStrategy", {
    is: "CREDIT",
    then: (schema) => schema.required("Validity Days is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  earningWindowDays: Yup.number()
    .typeError("Earning Window Days must be a number")
    .when("earningStrategy", {
      is: "UNLIMITED",
      then: (schema) => schema.required("Earning Window Days is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  price: Yup.number()
    .typeError("Price must be a number")
    .when("earningStrategy", {
      is: "CREDIT",
      then: (schema) => schema.required("Price is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  status: Yup.string().required("Status is required"),
});

const ActionModal = ({ open, message, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Notice</h3>
        <p className="text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default function JoiningBonusAdd() {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [zoneOptions, setZoneOptions] = useState([]);

  useEffect(() => {
    const loadZones = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS, { type: "Service Area" });
        setZoneOptions(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error("Error loading zones:", error);
      }
    };
    loadZones();
  }, []);

  const onSubmit = async (values) => {
    const payload = {
      serviceType: values.serviceType,
      zone: values.zone,
      earningStrategy: values.earningStrategy,
      validityDays: Number(values.validityDays || 0),
      status: values.status || "ACTIVE",
      name: "Free Plan",
      type: "FREE",
      packagePrice: 0,
      planGroupId: null,
      planGroupCode: null,
      earningWindowDays: values.earningStrategy === "UNLIMITED" ? Number(values.earningWindowDays || 0) : undefined,
      price: values.earningStrategy === "CREDIT" ? Number(values.price || 0) : 0,
      totalPrice: values.earningStrategy === "CREDIT" ? Number(values.price || 0) : 0,
      bonusPrice: 0,
    };

    try {
      const response = await ApiRequestUtils.post(API_ROUTES.ADD_MASTER_JOINS_BOUNCE, payload);
      if (response?.success) navigate("/dashboard/finance/joining-bonus");
      else setAlert({ message: response?.message || "Request failed" });
    } catch (error) {
      setAlert({ message: error?.response?.data?.message || "Failed to save Joining Bonus." });
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl sm:p-6 lg:p-8">
      <ActionModal open={Boolean(alert)} message={alert?.message || ""} onClose={() => setAlert(null)} />
      <h2 className="mb-4 text-2xl font-bold">Add Joining Bonus</h2>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
        {({ values, setFieldValue, handleSubmit }) => (
          <Form>
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Service Type</label>
                <Field
                  as="select"
                  name="serviceType"
                  className="w-full rounded-md border border-gray-300 p-2"
                  onChange={(e) => {
                    setFieldValue("serviceType", e.target.value);
                  }}
                >
                  <option value="">Select Service Type</option>
                  {SERVICE_TYPE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="serviceType" component="div" className="mt-1 text-sm text-red-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Zone</label>
                <Field
                  as="select"
                  name="zone"
                  className="w-full rounded-md border border-gray-300 p-2"
                  onChange={(e) => {
                    setFieldValue("zone", e.target.value);
                  }}
                >
                  <option value="">Select Zone</option>
                  {zoneOptions.map((item) => (
                    <option key={item.id || item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="zone" component="div" className="mt-1 text-sm text-red-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Earning Strategy</label>
                <Field as="select" name="earningStrategy" className="w-full rounded-md border border-gray-300 p-2">
                  <option value="">Select Strategy</option>
                  <option value="CREDIT">Credit</option>
                  <option value="UNLIMITED">Unlimited</option>
                </Field>
                <ErrorMessage name="earningStrategy" component="div" className="mt-1 text-sm text-red-500" />
              </div>
              {values.earningStrategy === "CREDIT" ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Validity Days</label>
                <Field type="number" name="validityDays" className="w-full rounded-md border border-gray-300 p-2" />
                <ErrorMessage name="validityDays" component="div" className="mt-1 text-sm text-red-500" />
              </div>
              ) : null}
              {values.earningStrategy === "UNLIMITED" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Earning Window Days</label>
                  <Field type="number" name="earningWindowDays" className="w-full rounded-md border border-gray-300 p-2" />
                  <ErrorMessage name="earningWindowDays" component="div" className="mt-1 text-sm text-red-500" />
                </div>
              ) : null}
              {values.earningStrategy === "CREDIT" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
                  <Field type="number" name="price" className="w-full rounded-md border border-gray-300 p-2" />
                  <ErrorMessage name="price" component="div" className="mt-1 text-sm text-red-500" />
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                <Field as="select" name="status" className="w-full rounded-md border border-gray-300 p-2">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Field>
                <ErrorMessage name="status" component="div" className="mt-1 text-sm text-red-500" />
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={() => navigate("/dashboard/finance/joining-bonus")} className="rounded-xl border border-gray-300 bg-white px-5 py-2 font-semibold text-gray-700">
                Cancel
              </button>
              <button type="button" onClick={handleSubmit} className="rounded-xl bg-primary-600 px-5 py-2 font-semibold text-white">
                Submit
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}