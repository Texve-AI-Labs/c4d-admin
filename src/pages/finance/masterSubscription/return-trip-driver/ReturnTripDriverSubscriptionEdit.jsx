import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { fetchZoneOptions } from "./zoneOptions";

const validationSchema = Yup.object({
  tier: Yup.string().required("Tier is required"),
  planName: Yup.string().required("Plan Name is required"),
  serviceType: Yup.string().required("Service Type is required"),
  zone: Yup.string().required("Zone is required"),
  eligibleForReturnTrip: Yup.boolean().required("Eligible For Return Trip is required"),
  status: Yup.string().required("Status is required"),
});

const handleEditSubmit = async (id, values, { setSubmitting, setFieldError }, navigate) => {
  try {
    const response = await ApiRequestUtils.update(`${API_ROUTES.UPDATE_RETURN_TRIP_ELIGIBILITY}/${id}`, values, 0, { suppressAlert: true });
    if (response?.success === false) {
      setFieldError("planName", response?.error || response?.message || "Unable to update rule.");
      return;
    }
    navigate("/dashboard/finance/master-subscription/return-trip-driver");
  } catch (err) {
    setFieldError("planName", err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unable to update rule.");
  } finally {
    setSubmitting(false);
  }
};

const normalizePlanName = (value) => {
  if (!value) return "";
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "premium") return "Premium";
  if (normalized === "standard") return "Standard";
  if (normalized === "regular") return "Regular";
  return value;
};

export default function ReturnTripDriverSubscriptionEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    tier: "",
    planName: "",
    serviceType: "RIDES_RENTAL_CABS",
    zone: "ALL",
    eligibleForReturnTrip: false,
    status: "ACTIVE",
    notes: "",
  });
  const [error, setError] = useState("");
  const [zoneOptions, setZoneOptions] = useState([{ label: "ALL", value: "" }]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await ApiRequestUtils.get(API_ROUTES.GET_RETURN_TRIP_ELIGIBILITY);
        const rows = Array.isArray(response?.data) ? response.data : Array.isArray(response?.result) ? response.result : [];
        const row = rows.find((item) => String(item.id) === String(id));
        if (row) {
          setForm({
            tier: row.tier || "",
            planName: normalizePlanName(row.planName),
            serviceType: row.serviceType || "RIDES_RENTAL_CABS",
            zone: row.zone || "ALL",
            eligibleForReturnTrip: Boolean(row.eligibleForReturnTrip),
            status: row.status || "ACTIVE",
            notes: row.notes || "",
          });
        }
      } catch (err) {
        setError(err?.message || "Unable to load record.");
      }
    };
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    fetchZoneOptions().then(setZoneOptions).catch(() => setZoneOptions([{ label: "ALL", value: "" }]));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-4 shadow-md sm:p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Return Trip Driver Subscription</h2>
        {error ? <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        <Formik
          enableReinitialize
          initialValues={form}
          validationSchema={validationSchema}
          onSubmit={(values, formikHelpers) => handleEditSubmit(id, values, formikHelpers, navigate)}
        >
          {({ values, setFieldValue }) => (
            <Form className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Tier</label>
                <Field as="select" name="tier" className="mt-1 w-full rounded-md border p-2">
                  <option value="">Select Tier</option>
                  <option value="SILVER">SILVER</option>
                  <option value="GOLD">GOLD</option>
                  <option value="ELITE">ELITE</option>
                </Field>
                <ErrorMessage name="tier" component="div" className="mt-1 text-sm text-red-600" />
              </div>
              <div>
                <label className="block text-sm font-medium">Plan Name</label>
                <Field as="select" name="planName" className="mt-1 w-full rounded-md border p-2">
                  <option value="">Select Plan Name</option>
                  <option value="Premium">Premium</option>
                  <option value="Standard">Standard</option>
                  <option value="Regular">Regular</option>
                </Field>
                <ErrorMessage name="planName" component="div" className="mt-1 text-sm text-red-600" />
              </div>
              <div>
                <label className="block text-sm font-medium">Service Type</label>
                <Field as="select" name="serviceType" disabled className="mt-1 w-full rounded-md border bg-gray-100 p-2 text-gray-700">
                  <option value="RIDES_RENTAL_CABS">RIDES_RENTAL_CABS</option>
                  <option value="ACTING_DRIVER">ACTING_DRIVER</option>
                  <option value="AUTO">AUTO</option>
                </Field>
                <ErrorMessage name="serviceType" component="div" className="mt-1 text-sm text-red-600" />
              </div>
              <div>
                <label className="block text-sm font-medium">Zone</label>
                <Field as="select" name="zone" className="mt-1 w-full rounded-md border p-2">
                  {zoneOptions.map((option) => (
                    <option key={`${option.value || "all"}-${option.label}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="zone" component="div" className="mt-1 text-sm text-red-600" />
              </div>
              <div>
                <label className="block text-sm font-medium">Eligible For Return Trip</label>
                <div className="mt-2 flex items-center gap-3 rounded-md border p-2">
                  <span className="text-sm text-gray-600">No</span>
                  <button
                    type="button"
                    onClick={() => setFieldValue("eligibleForReturnTrip", !values.eligibleForReturnTrip)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${values.eligibleForReturnTrip ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${values.eligibleForReturnTrip ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                  <span className="text-sm text-gray-600">Yes</span>
                </div>
                <ErrorMessage name="eligibleForReturnTrip" component="div" className="mt-1 text-sm text-red-600" />
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <div className="mt-2 flex items-center gap-3 rounded-md border p-2">
                  <span className="text-sm text-gray-600">Inactive</span>
                  <button
                    type="button"
                    onClick={() => setFieldValue("status", values.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${values.status === "ACTIVE" ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${values.status === "ACTIVE" ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                  <span className="text-sm text-gray-600">Active</span>
                </div>
                <ErrorMessage name="status" component="div" className="mt-1 text-sm text-red-600" />
              </div>
              <div>
                <label className="block text-sm font-medium">Notes</label>
                <Field as="textarea" name="notes" rows="4" className="mt-1 w-full rounded-md border p-2" />
                <ErrorMessage name="notes" component="div" className="mt-1 text-sm text-red-600" />
              </div>
              <div className="col-span-1 flex justify-center gap-3 pt-2 sm:col-span-2">
                <button className="rounded-md border border-blue-700 bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" type="submit">
                  Update
                </button>
                <button
                  type="button"
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-100"
                  onClick={() => navigate("/dashboard/finance/master-subscription/return-trip-driver")}
                >
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}