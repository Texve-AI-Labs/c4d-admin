import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Input, Option, Select, Spinner, Textarea, Typography } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const fuelTypeOptions = [
  { label: "CNG", value: "CNG" },
  { label: "Petrol", value: "PETROL" },
  { label: "Diesel", value: "DIESEL" },
];

const emptyForm = {
  tripStartDate: "",
  tripEndDateTime: "",
  vehicleNumber: "",
  driverName: "",
  startKm: "",
  endKm: "",
  totalTripAmount: "",
  fuelType: "CNG",
  fuelAmount: "",
  otherExpense: "",
  notes: "",
};

const requiredLabel = (label) => (
  <span>
    {label} <span className="text-red-600">*</span>
  </span>
);

const toInputDateTime = (value) => {
  if (!value) return "";
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DDTHH:mm") : "";
};

const normalizeRecord = (response) => {
  const body = response?.data ?? response?.result ?? response;
  if (Array.isArray(body)) return body[0] || null;
  if (body?.data && !Array.isArray(body.data)) return body.data;
  return body || null;
};

const rowToForm = (row = {}) => ({
  tripStartDate: toInputDateTime(row?.tripStartDate),
  tripEndDateTime: toInputDateTime(row?.tripEndDateTime),
  vehicleNumber: row?.vehicleNumber || "",
  driverName: row?.driverName || "",
  startKm: row?.startKm ?? "",
  endKm: row?.endKm ?? "",
  totalTripAmount: row?.totalTripAmount ?? "",
  fuelType: row?.fuelType || "CNG",
  fuelAmount: row?.fuelAmount ?? "",
  otherExpense: row?.otherExpense ?? "",
  notes: row?.notes || "",
});

const buildPayload = (form) => ({
  tripStartDate: new Date(form.tripStartDate).toISOString(),
  tripEndDateTime: new Date(form.tripEndDateTime).toISOString(),
  vehicleNumber: form.vehicleNumber.trim(),
  driverName: form.driverName.trim(),
  startKm: Number(form.startKm),
  endKm: Number(form.endKm),
  totalTripAmount: Number(form.totalTripAmount || 0),
  fuelType: form.fuelType,
  fuelAmount: Number(form.fuelAmount || 0),
  otherExpense: Number(form.otherExpense || 0),
  notes: form.notes?.trim() || "",
});

function OwnVehicleForm({ mode = "add" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isDetailsMode = mode === "details";
  const isEditMode = mode === "edit";
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(Boolean(id && !location.state?.row));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalKm = useMemo(() => Number(form.endKm || 0) - Number(form.startKm || 0), [form.endKm, form.startKm]);
  const closingAmount = useMemo(
    () => Number(form.totalTripAmount || 0) - Number(form.fuelAmount || 0) - Number(form.otherExpense || 0),
    [form.totalTripAmount, form.fuelAmount, form.otherExpense]
  );
  const fieldLabel = (label) => (isDetailsMode ? label : requiredLabel(label));

  useEffect(() => {
    if (location.state?.row) {
      setForm(rowToForm(location.state.row));
      setLoading(false);
      return;
    }

    if (!id) return;

    const fetchRecord = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await ApiRequestUtils.get(`${API_ROUTES.OWN_VEHICLE_TRIPS}/${id}`);
        if (response?.success === false) {
          setError(response?.message || "Failed to load own vehicle trip.");
          return;
        }
        const record = normalizeRecord(response);
        if (record) setForm(rowToForm(record));
      } catch (err) {
        console.error("Error fetching own vehicle trip:", err);
        setError("Failed to load own vehicle trip.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id, location.state]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!form.tripStartDate) return "Trip start date time is required.";
    if (!form.tripEndDateTime) return "Trip end date time is required.";
    if (moment(form.tripEndDateTime).isBefore(moment(form.tripStartDate))) return "Trip End Date Time cannot be earlier than Trip Start Date Time.";
    if (!form.vehicleNumber.trim()) return "Vehicle number is required.";
    if (!form.driverName.trim()) return "Driver name is required.";
    if (form.startKm === "") return "Start KM is required.";
    if (form.endKm === "") return "End KM is required.";
    if (form.totalTripAmount === "") return "Total Trip Amount is required.";
    if (!form.fuelType) return "Fuel type is required.";
    if (form.fuelAmount === "") return "Fuel Amount is required.";
    if (form.otherExpense === "") return "Other Expense is required.";
    if (Number(form.endKm) < Number(form.startKm)) return "End KM should be greater than or equal to Start KM.";
    const numberFields = ["startKm", "endKm", "totalTripAmount", "fuelAmount", "otherExpense"];
    if (numberFields.some((key) => Number(form[key] || 0) < 0)) return "KM and amount values cannot be negative.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = buildPayload(form);
      const response = isEditMode
        ? await ApiRequestUtils.update(`${API_ROUTES.OWN_VEHICLE_TRIPS}/${id}`, payload, 0, { suppressAlert: true })
        : await ApiRequestUtils.post(API_ROUTES.OWN_VEHICLE_TRIPS, payload, 0, { suppressAlert: true });

      if (response?.success === false) {
        setError(response?.message || "Failed to save own vehicle trip.");
        return;
      }
      navigate("/dashboard/support/own-vehicle");
    } catch (err) {
      console.error("Error saving own vehicle trip:", err);
      setError("Failed to save own vehicle trip.");
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "add" ? "Add Own Vehicle Trip" : isEditMode ? "Edit Own Vehicle Trip" : "Own Vehicle Trip Details";

  return (
    <div className="mb-8 mt-8 flex flex-col gap-6">
      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Typography variant="h6" color="black">{title}</Typography>
          </div>

          {error && <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

          {loading ? (
            <div className="flex justify-center py-10"><Spinner className="h-7 w-7" /></div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input type="datetime-local" label={fieldLabel("Trip Start Date Time")} value={form.tripStartDate} onChange={(e) => setField("tripStartDate", e.target.value)} disabled={isDetailsMode} />
              <Input type="datetime-local" label={fieldLabel("Trip End Date Time")} value={form.tripEndDateTime} onChange={(e) => setField("tripEndDateTime", e.target.value)} disabled={isDetailsMode} />
              <Input label={fieldLabel("Vehicle Number")} value={form.vehicleNumber} onChange={(e) => setField("vehicleNumber", e.target.value)} disabled={isDetailsMode} />
              <Input label={fieldLabel("Driver Name")} value={form.driverName} onChange={(e) => setField("driverName", e.target.value)} disabled={isDetailsMode} />
              <Input type="number" label={fieldLabel("Start KM")} value={form.startKm} onChange={(e) => setField("startKm", e.target.value)} disabled={isDetailsMode} />
              <Input type="number" label={fieldLabel("End KM")} value={form.endKm} onChange={(e) => setField("endKm", e.target.value)} disabled={isDetailsMode} />
              <Input type="number" label={fieldLabel("Total Trip Amount")} value={form.totalTripAmount} onChange={(e) => setField("totalTripAmount", e.target.value)} disabled={isDetailsMode} />
              <Select label={fieldLabel("Fuel Type")} value={form.fuelType} onChange={(value) => setField("fuelType", value)} disabled={isDetailsMode}>
                {fuelTypeOptions.map((option) => (
                  <Option key={option.value} value={option.value}>{option.label}</Option>
                ))}
              </Select>
              <Input type="number" label={fieldLabel("Fuel Amount")} value={form.fuelAmount} onChange={(e) => setField("fuelAmount", e.target.value)} disabled={isDetailsMode} />
              <Input type="number" label={fieldLabel("Other Expense")} value={form.otherExpense} onChange={(e) => setField("otherExpense", e.target.value)} disabled={isDetailsMode} />
              <Input label="Total KM Preview" value={Number.isFinite(totalKm) ? totalKm : 0} readOnly />
              <Input label="Closing Amount Preview" value={Number.isFinite(closingAmount) ? closingAmount : 0} readOnly />
              <div>
                <Textarea label="Notes" value={form.notes} onChange={(e) => setField("notes", e.target.value)} disabled={isDetailsMode} />
              </div>
              <div className="flex justify-center gap-3 md:col-span-2">
                {!isDetailsMode && (
                  <Button type="submit" className={`${ColorStyles.bgColor} text-white`} disabled={submitting}>
                    {submitting ? "Saving..." : isEditMode ? "Update" : "Add"}
                  </Button>
                )}
                <Button type="button" variant="outlined" onClick={() => navigate("/dashboard/support/own-vehicle")} disabled={submitting}>Back</Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default OwnVehicleForm;