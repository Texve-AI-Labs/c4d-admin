import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, IconButton, Input, Switch, Textarea, Typography } from "@material-tailwind/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, FieldArray } from "formik";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import DriverAdsZone from "@/components/driverAdsZone";
import { driverAdsEditValidationSchema } from "./driverAdsEditValidation";

function DriverAdsEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await ApiRequestUtils.get(`${API_ROUTES.GET_BY_ID_DRIVER_ADVERISEMENT}/${id}`);
        const data = response?.data || {};
        setInitialValues({
          name: data.name || "",
          description: data.description || "",
          zone: data.zone || "",
          subZoneId: String(data.subZoneId || ""),
          imageFile: null,
          image: data.image || "",
          timeSlots: Array.isArray(data?.config?.timeSlots) && data.config.timeSlots.length ? data.config.timeSlots : [{ from: "", to: "" }],
          launchAt: data.launchAt ? moment(data.launchAt).format("YYYY-MM-DD") : "",
          isActive: Boolean(data.isActive),
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load advertisement.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleSubmit = async (values, { setSubmitting }) => {
    setError("");
    setSuccess("");
    try {
      const payload = {
        id,
        name: values.name.trim(),
        description: values.description.trim(),
        zone: values.zone,
        launchAt: values.launchAt,
        isActive: values.isActive,
      };
      if (values.subZoneId) payload.subZoneId = Number(values.subZoneId);
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== undefined && val !== null) formData.append(key, String(val));
      });
      formData.append(
        "config",
        JSON.stringify({
          timeSlots: values.timeSlots.map((slot) => ({ from: slot.from, to: slot.to })),
        })
      );
      if (values.imageFile) {
        formData.append("image1", values.imageFile);
        formData.append("extImage1", values.imageFile.name.split(".").pop());
        formData.append("fileTypeImage1", values.imageFile.type);
      }

      const response = await ApiRequestUtils.updateDocs(`${API_ROUTES.UPDATE_BY_ID_DRIVER_ADVERISEMENT}/${id}`, formData);
      if (response?.success) {
        setSuccess("Advertisement updated successfully.");
        navigate("/dashboard/support/driver-ads");
      } else {
        setError(response?.message || "Failed to update advertisement.");
      }
    } catch (err) {
      console.error("Failed to update driver advertisement:", err);
      setError("Failed to update advertisement.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !initialValues) {
    return (
      <div className="mb-8 mt-8">
        <Card>
          <CardBody>
            <Typography>Loading...</Typography>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8 mt-8">
      <Card>
        <CardBody className="flex flex-col gap-6">
          <Typography variant="h5" className="text-black">Edit Driver Advertisement</Typography>
          {error ? <Alert color="red">{error}</Alert> : null}
          {success ? <Alert color="green">{success}</Alert> : null}
          <Formik initialValues={initialValues} validationSchema={driverAdsEditValidationSchema} onSubmit={handleSubmit} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, submitForm }) => (
              <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Name <span className="text-red-500">*</span></Typography>
                  <Input name="name" value={values.name} onChange={handleChange} onBlur={handleBlur} className="w-full" />
                  {touched.name && errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
                </div>
                <div>
                  <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Description <span className="text-red-500">*</span></Typography>
                  <Textarea name="description" value={values.description} onChange={handleChange} onBlur={handleBlur} className="w-full" />
                  {touched.description && errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description}</p> : null}
                </div>
                <DriverAdsZone label= {<>Zone <span className="text-red-500">*</span></>} placeholder="Select Zone" value={values.zone} error={errors.zone} touched={touched.zone} showAll={false} onChange={(value) => { setFieldValue("zone", value); setFieldValue("subZoneId", ""); }} />
                <DriverAdsZone label= {<>Sub Zone <span className="text-red-500">*</span> </>} placeholder="Select Sub Zone" value={values.subZoneId} error={errors.subZoneId} touched={touched.subZoneId} showAll={false} isSubZone parentValue={values.zone} onChange={(value) => setFieldValue("subZoneId", value)} />
                <div>
                  <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Launch At <span className="text-red-500">*</span></Typography>
                  <Input type="date" name="launchAt" value={values.launchAt} onChange={handleChange} onBlur={handleBlur} className="w-full" />
                  {touched.launchAt && errors.launchAt ? <p className="mt-1 text-xs text-red-600">{errors.launchAt}</p> : null}
                </div>
                <div>
                  <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Image <span className="text-red-500">*</span></Typography>
                  <Input type="file" accept="image/*" onChange={(e) => setFieldValue("imageFile", e.currentTarget.files?.[0] || null)} className="w-full" />
                  {values.image && !values.imageFile ? (
                    <div className="mt-3">
                      <img src={values.image} alt={values.name || "driver advertisement"} className="h-32 w-full rounded-lg border object-contain" />
                    </div>
                  ) : null}
                  {values.imageFile ? (
                    <div className="mt-3">
                      <img
                        src={URL.createObjectURL(values.imageFile)}
                        alt="Selected preview"
                        className="h-32 w-full rounded-lg border object-contain"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 md:pt-6">
                  <Switch checked={values.isActive} onChange={(e) => setFieldValue("isActive", e.target.checked)} />
                  <Typography className="text-sm font-medium text-blue-gray-700">Active <span className="text-red-500">*</span></Typography>
                </div>
                <div className="md:col-span-2 rounded-xl border border-blue-gray-100 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <Typography className="text-sm font-medium text-black">Time Slots</Typography>
                    <Button type="button" size="sm" className={`${ColorStyles.bgColor} inline-flex items-center text-white`} onClick={() => setFieldValue("timeSlots", [...values.timeSlots, { from: "", to: "" }])}>
                      <span className="mr-2 inline-flex items-center"><PlusIcon className="h-4 w-4" /></span>Add Slot
                    </Button>
                  </div>
                  <FieldArray name="timeSlots">
                    {({ remove }) => (
                      <div className="space-y-3">
                        {values.timeSlots.map((slot, index) => (
                          <div key={index} className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
                            <div className="flex-1">
                              <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">From <span className="text-red-500">*</span></Typography>
                              <Input type="time" value={slot.from} onChange={(e) => setFieldValue(`timeSlots[${index}].from`, e.target.value)} className="w-full" />
                            </div>
                            <div className="flex-1">
                              <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">To <span className="text-red-500">*</span></Typography>
                              <Input type="time" value={slot.to} onChange={(e) => setFieldValue(`timeSlots[${index}].to`, e.target.value)} className="w-full" />
                            </div>
                            <div className="flex items-end">
                              <IconButton variant="text" color="red" onClick={() => remove(index)} disabled={values.timeSlots.length === 0}>
                                <TrashIcon className="h-5 w-5" />
                              </IconButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </FieldArray>
                </div>
                <div className="md:col-span-2 flex justify-center gap-3">
                  <Button type="button" className="bg-red-600 text-white" onClick={() => navigate("/dashboard/support/driver-ads")}>Cancel</Button>
                  <Button type="button" className={`${ColorStyles.bgColor} text-white`} onClick={submitForm} disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Update"}</Button>
                </div>
              </form>
            )}
          </Formik>
        </CardBody>
      </Card>
    </div>
  );
}

export default DriverAdsEdit;