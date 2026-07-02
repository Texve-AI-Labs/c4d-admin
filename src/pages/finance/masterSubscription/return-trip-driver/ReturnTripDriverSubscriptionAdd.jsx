import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";

const initialValues = {
  planName: "",
  serviceType: "RIDES_RENTAL_CABS",
  eligibleForReturnTrip: false,
  status: "ACTIVE",
  notes: "",
};

const validationSchema = Yup.object({
  planName: Yup.string().required("Plan Name is required"),
  serviceType: Yup.string().required("Service Type is required"),
  eligibleForReturnTrip: Yup.boolean().required("Eligible For Return Trip is required"),
  status: Yup.string().required("Status is required"),
});

const handleAddSubmit = async (values, { setSubmitting, setFieldError }, navigate) => {
  try {
    const response = await ApiRequestUtils.post(API_ROUTES.ADD_RETURN_TRIP_ELIGIBILITY, values);
    if (response?.success === false) {
      setFieldError("planName", response?.message || "Unable to save rule.");
      return;
    }
    navigate("/dashboard/finance/master-subscription/return-trip-driver");
  } catch (err) {
    setFieldError("planName", err?.response?.data?.message || err?.message || "Unable to save rule.");
  } finally {
    setSubmitting(false);
  }
};

export default function ReturnTripDriverSubscriptionAdd() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Add Return Trip Subscription</h2>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={(values, formikHelpers) => handleAddSubmit(values, formikHelpers, navigate)}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div className="hidden">
                <label className="block text-sm font-medium">Service Type</label>
                <Field as="select" name="serviceType" className="mt-1 w-full rounded-md border p-2">
                  <option value="RIDES_RENTAL_CABS">RIDES_RENTAL_CABS</option>
                  <option value="ACTING_DRIVER">ACTING_DRIVER</option>
                  <option value="AUTO">AUTO</option>
                </Field>
                <ErrorMessage name="serviceType" component="div" className="mt-1 text-sm text-red-600" />
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
                <button disabled={isSubmitting} className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50" type="submit">
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
                <button type="button" className="rounded-md border px-4 py-2" onClick={() => navigate("/dashboard/finance/master-subscription/return-trip-driver")}>
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