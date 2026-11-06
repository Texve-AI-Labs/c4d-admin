import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Typography,
} from "@material-tailwind/react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { fetchZoneOptions } from "../masterSubscription/return-trip-driver/zoneOptions";
import { findEligibilityById, getEligibilityRecords } from "./data";
import {
  PLAN_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  STATUS_OPTIONS,
  TIER_OPTIONS,
} from "./constants";

const INITIAL_VALUES = {
  planName: "",
  serviceType: "RIDES_RENTAL_CABS",
  zone: "ALL",
  tier: "ALL",
  eligibleForFutureBooking: true,
  status: "ACTIVE",
  notes: "",
};

const VALIDATION_SCHEMA = Yup.object({
  planName: Yup.string().required("Plan Name is required"),
  serviceType: Yup.string().required("Service Type is required"),
  zone: Yup.string().required("Zone is required"),
  tier: Yup.string().when("serviceType", {
    is: "DRIVER",
    then: (schema) => schema.notRequired(),
    otherwise: (schema) => schema.required("Tier is required"),
  }),
  eligibleForFutureBooking: Yup.boolean().required(),
  status: Yup.string().oneOf(STATUS_OPTIONS).required(),
});

const formatLabel = (value) =>
  String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

function SelectField({ name, label, options }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <Field as="select" name={name} className="w-full rounded-md border p-2">
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </Field>
      <ErrorMessage name={name} component="div" className="mt-1 text-sm text-red-500" />
    </div>
  );
}

function ErrorMessageBox({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
            !
          </div>
          <Typography variant="h6" className="text-red-700">
            Alert
          </Typography>
        </div>
        <Typography className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
          {message}
        </Typography>
        <div className="mt-6 flex justify-end">
          <Button color="red" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FutureBookingEligibilityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const editing = Boolean(id);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [zones, setZones] = useState(["ALL"]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchZoneOptions()
      .then((options) => {
        const zoneValues = options
          .filter((option) => option.value && option.value !== "ALL")
          .map((option) => option.value);
        setZones(["ALL", ...new Set(zoneValues)]);
      })
      .catch(() => setZones(["ALL"]));

    if (!editing) return;

    const loadRule = async () => {
      const response = await ApiRequestUtils.get(API_ROUTES.GET_FUTURE_BOOKING_ELIGIBILITY);
      const rows = getEligibilityRecords(response);
      const row = response?.data?.id || response?.data?._id
        ? response.data
        : location.state?.row || findEligibilityById(rows, id);
      if (row) {
        setValues({
          ...INITIAL_VALUES,
          ...row,
          eligibleForFutureBooking: Boolean(row.eligibleForFutureBooking),
          status: row.status || "ACTIVE",
          notes: row.notes || "",
        });
      }
    };

    loadRule().catch((err) => setError(err?.message || "Unable to load rule."));
  }, [editing, id, location.state]);

  const handleSubmit = async (formValues, { setSubmitting }) => {
    try {
      const payload = {
        planName: formValues.planName,
        serviceType: formValues.serviceType,
        zone: formValues.zone,
        eligibleForFutureBooking: formValues.eligibleForFutureBooking,
        notes: String(formValues.notes || "").trim(),
      };

      if (formValues.serviceType === "DRIVER") {
        payload.tier = 'ALL';
      }

      if (!editing) payload.status = formValues.status;

      const response = editing
        ? await ApiRequestUtils.update(
            `${API_ROUTES.UPDATE_FUTURE_BOOKING_ELIGIBILITY}/${id}`,
            payload,
            0,
            { suppressAlert: true }
          )
        : await ApiRequestUtils.post(
            API_ROUTES.CREATE_FUTURE_BOOKING_ELIGIBILITY,
            payload,
            0,
            { suppressAlert: true }
          );

      if (response?.success === false) {
        throw new Error(response?.error || response?.message || "Unable to save rule.");
      }

      navigate("/dashboard/finance/future-booking-eligibility");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to save rule.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8">
      <Card>
        <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">
            {editing ? "Edit" : "Add"} Future Booking Eligibility
          </Typography>
        </CardHeader>
        <CardBody>
          <ErrorMessageBox message={error} onClose={() => setError("")} />
          <Formik
            enableReinitialize
            initialValues={values}
            validationSchema={VALIDATION_SCHEMA}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, values: formValues, setFieldValue }) => (
              <Form className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectField name="planName" label="Plan Name" options={PLAN_OPTIONS} />
                <SelectField name="serviceType" label="Service Type" options={SERVICE_TYPE_OPTIONS} />
                <SelectField name="zone" label="Zone" options={zones} />
                {formValues.serviceType !== "DRIVER" && (
                  <SelectField name="tier" label="Tier" options={TIER_OPTIONS} />
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Eligible For Future Booking
                  </label>
                  <div className="mt-2 flex items-center gap-3 rounded-md border p-2">
                    <span className="text-sm text-gray-600">No</span>
                    <button
                      type="button"
                      onClick={() => setFieldValue("eligibleForFutureBooking", !formValues.eligibleForFutureBooking)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formValues.eligibleForFutureBooking ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formValues.eligibleForFutureBooking ? "translate-x-5" : "translate-x-1"}`}
                      />
                    </button>
                    <span className="text-sm text-gray-600">Yes</span>
                  </div>
                </div>
                {!editing && <SelectField name="status" label="Status" options={STATUS_OPTIONS} />}
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                  <Field as="textarea" name="notes" rows="4" className="w-full rounded-md border p-2" />
                </div>
                <div className="flex justify-center gap-3 pt-4 md:col-span-2">
                  <Button type="button" variant="outlined" onClick={() => navigate("/dashboard/finance/future-booking-eligibility")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className={ColorStyles.continueButtonColor}>
                    {isSubmitting ? "Saving..." : editing ? "Update" : "Add"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </CardBody>
      </Card>
    </div>
  );
}
