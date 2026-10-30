import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Spinner, Typography } from "@material-tailwind/react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const SERVICE_TYPES = ["RIDES_RENTAL_CABS", "ACTING_DRIVER", "BIKE", "AUTO"];
const STATUS_OPTIONS = ["ACTIVE", "INACTIVE"];
const PLACEMENT_OPTIONS = ["PLAN_PAGE"];

const formatOptionLabel = (value) =>
  String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const validationSchema = Yup.object().shape({
  serviceType: Yup.string().oneOf(SERVICE_TYPES).required("Service Type is required"),
  placement: Yup.string().required("Placement is required"),
  overallLabel: Yup.string().trim().required("Overall Label is required"),
  firstLabel: Yup.string().trim().required("First Label is required"),
  star: Yup.number().typeError("Star must be a number").min(1, "Star must be at least 1").max(5, "Star must be at most 5").required("Star is required"),
  secondLabel: Yup.string().trim().required("Second Label is required"),
  sortOrder: Yup.number().typeError("Sort Order must be a number").required("Sort Order is required"),
  status: Yup.string().oneOf(STATUS_OPTIONS).required("Status is required"),
});

const buildInitialValues = (row = {}) => ({
  serviceType: row?.serviceType || "AUTO",
  placement: row?.placement || "PLAN_PAGE",
  overallLabel: row?.overallLabel || "",
  firstLabel: row?.firstLabel || "",
  star: row?.star ?? 5,
  secondLabel: row?.secondLabel || "",
  sortOrder: row?.sortOrder ?? 1,
  status: row?.status || "ACTIVE",
});

export default function DriverSubscriptionForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [loading, setLoading] = useState(Boolean(id));
  const [rows, setRows] = useState([]);
  const [modalMessage, setModalMessage] = useState("");

  const mode = id ? "Edit" : "Add";

  useEffect(() => {
    const fetchRows = async () => {
      try {
        const response = await ApiRequestUtils.get(API_ROUTES.GET_DRIVER_SUBSCRIPTIONS_FEEDBACK);
        const data = Array.isArray(response?.data) ? response.data : Array.isArray(response?.result) ? response.result : [];
        setRows(data);
      } catch (error) {
        console.error("Failed to load driver subscriptions:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRows();
  }, [id]);

  const row = useMemo(() => {
    if (location?.state?.row) return location.state.row;
    return rows.find((item) => String(item?.id) === String(id)) || {};
  }, [id, location.state, rows]);

  const initialValues = useMemo(() => buildInitialValues(row), [row]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        serviceType: values.serviceType,
        placement: values.placement,
        overallLabel: values.overallLabel.trim(),
        firstLabel: values.firstLabel.trim(),
        star: Number(values.star),
        secondLabel: values.secondLabel.trim(),
        sortOrder: Number(values.sortOrder),
        status: values.status,
      };

      const response = id
        ? await ApiRequestUtils.update(`${API_ROUTES.UPDATE_DRIVER_SUBSCRIPTION_FEEDBACK}/${encodeURIComponent(String(id))}`, payload)
        : await ApiRequestUtils.post(API_ROUTES.CREATE_DRIVER_SUBSCRIPTION_FEEDBACK, payload);

      if (response?.success) {
        navigate("/dashboard/finance/driver-subscription-feedback");
        return;
      }

      setModalMessage(response?.error || response?.message || `Unable to ${mode.toLowerCase()} driver subscription.`);
    } catch (error) {
      console.error(`Failed to ${mode.toLowerCase()} driver subscription:`, error);
      setModalMessage(error?.response?.data?.error || error?.response?.data?.message || error?.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Card>
        <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">
            {mode} Driver Subscription
          </Typography>
        </CardHeader>
        <CardBody>
          <DialogMessage message={modalMessage} onClose={() => setModalMessage("")} />
          <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
            {({ isSubmitting }) => (
              <Form className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FieldSelect name="serviceType" label="Service Type" options={SERVICE_TYPES} />
                <FieldSelect name="placement" label="Placement" options={PLACEMENT_OPTIONS} />
                <FieldText name="overallLabel" label="Overall Label" />
                <FieldText name="firstLabel" label="First Label" />
                <FieldNumber name="star" label="Star" min="1" max="5" />
                <FieldNumber name="sortOrder" label="Sort Order" />
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Second Label</label>
                  <Field as="textarea" name="secondLabel" rows="4" className="w-full rounded-md border border-gray-300 p-2 shadow-sm" />
                  <ErrorMessage name="secondLabel" component="div" className="mt-1 text-sm text-red-500" />
                </div>
                <FieldSelect name="status" label="Status" options={STATUS_OPTIONS} />

                <div className="md:col-span-2 flex justify-center gap-3 pt-4">
                  <Button type="button" variant="outlined" onClick={() => navigate("/dashboard/finance/driver-subscription-feedback")} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className={ColorStyles.continueButtonColor} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : mode === "Add" ? "Add" : "Update"}
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

function FieldText({ name, label }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <Field name={name} type="text" className="w-full rounded-md border border-gray-300 p-2 shadow-sm" />
      <ErrorMessage name={name} component="div" className="mt-1 text-sm text-red-500" />
    </div>
  );
}

function FieldNumber({ name, label, min, max }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <Field name={name} type="number" min={min} max={max} className="w-full rounded-md border border-gray-300 p-2 shadow-sm" />
      <ErrorMessage name={name} component="div" className="mt-1 text-sm text-red-500" />
    </div>
  );
}

function FieldSelect({ name, label, options }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <Field as="select" name={name} className="w-full rounded-md border border-gray-300 p-2 shadow-sm">
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOptionLabel(option)}
          </option>
        ))}
      </Field>
      <ErrorMessage name={name} component="div" className="mt-1 text-sm text-red-500" />
    </div>
  );
}

function DialogMessage({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="whitespace-pre-wrap">{message}</div>
      <div className="mt-3 flex justify-center">
        <Button type="button" variant="outlined" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
