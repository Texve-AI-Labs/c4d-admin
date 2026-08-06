import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, IconButton, Input, Option, Select, Switch, Textarea, Typography } from "@material-tailwind/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, FieldArray } from "formik";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import DriverAdsZone from "@/components/driverAdsZone";
import { driverAdsEditValidationSchema } from "./driverAdsEditValidation";
import { appendFormFields, mapPlacementsToConfig, normalizeSubZoneId } from "./driverAdsPayload";

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
          contractPeriod: data.contractPeriod || 30,
          paymentFrequency: data.paymentFrequency || "MONTHLY",
          paymentAmount: data.paymentAmount ?? "",
          claimRequest: Boolean(data.claimRequest),
          imageFile: null,
          image: data.image || "",
          placements: Array.isArray(data?.config?.placements) && data.config.placements.length
            ? data.config.placements.map((item) => ({
                place: item.place || "",
                from: item?.slot?.from || "",
                to: item?.slot?.to || "",
              }))
            : [{ place: "", from: "", to: "" }],
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
      const subZoneId = normalizeSubZoneId(values.subZoneId);
      const payload = {
        name: values.name.trim(),
        description: values.description.trim(),
        zone: values.zone,
        contractPeriod: values.contractPeriod,
        paymentFrequency: values.paymentFrequency,
        paymentAmount: values.paymentAmount,
        claimRequest: values.claimRequest,
        isActive: values.isActive,
      };
      const formData = new FormData();
      appendFormFields(formData, payload);
      if (subZoneId !== null) appendFormFields(formData, { subZoneId });
      formData.append("config", JSON.stringify(mapPlacementsToConfig(values.placements)));
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
                <DriverAdsZone label="Zone" placeholder="Select Zone" value={values.zone} error={errors.zone} touched={touched.zone} showAll={false} returnLabel onChange={(value) => { setFieldValue("zone", value); setFieldValue("subZoneId", ""); }} />
                <DriverAdsZone label="Sub Zone" placeholder="Select Sub Zone" value={values.subZoneId} error={errors.subZoneId} touched={touched.subZoneId} showAll={false} isSubZone parentValue={values.zone} onChange={(value) => setFieldValue("subZoneId", value)} />
                <div>
                  <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Contract Period <span className="text-red-500">*</span></Typography>
                  <Select value={String(values.contractPeriod)} onChange={(value) => setFieldValue("contractPeriod", Number(value))}>
                    {[30, 60, 90].map((item) => <Option key={item} value={String(item)}>{item}</Option>)}
                  </Select>
                  {touched.contractPeriod && errors.contractPeriod ? <p className="mt-1 text-xs text-red-600">{errors.contractPeriod}</p> : null}
                </div>
                <div>
                  <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Payment Frequency <span className="text-red-500">*</span></Typography>
                  <Select value={values.paymentFrequency} selected={() => values.paymentFrequency || "MONTHLY"} onChange={(value) => setFieldValue("paymentFrequency", value)}>
                    <Option value="MONTHLY">MONTHLY</Option>
                  </Select>
                  {touched.paymentFrequency && errors.paymentFrequency ? <p className="mt-1 text-xs text-red-600">{errors.paymentFrequency}</p> : null}
                </div>
                <div>
                  <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Payment Amount <span className="text-red-500">*</span></Typography>
                  <Input type="number" min="0" name="paymentAmount" value={values.paymentAmount} onChange={handleChange} onBlur={handleBlur} className="w-full" />
                  {touched.paymentAmount && errors.paymentAmount ? <p className="mt-1 text-xs text-red-600">{errors.paymentAmount}</p> : null}
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
                <div className="flex items-center gap-3 md:pt-6">
                  <Switch checked={values.claimRequest} onChange={(e) => setFieldValue("claimRequest", e.target.checked)} />
                  <Typography className="text-sm font-medium text-blue-gray-700">Claim Request</Typography>
                </div>
                <div className="md:col-span-2 rounded-xl border border-blue-gray-100 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <Typography className="text-sm font-medium text-black">Placements</Typography>
                      <Button type="button" size="sm" className={`${ColorStyles.bgColor} inline-flex items-center text-white`} onClick={() => setFieldValue("placements", [...values.placements, { place: "", from: "", to: "" }])}>
                      <span className="mr-2 inline-flex items-center"><PlusIcon className="h-4 w-4" /></span>Add Slot
                    </Button>
                  </div>
                  <FieldArray name="placements">
                    {({ remove }) => (
                      <div className="space-y-3">
                        {values.placements.map((slot, index) => (
                          <div key={index} className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
                            <div className="flex-1">
                              <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">Place <span className="text-red-500">*</span></Typography>
                              <Input value={slot.place} onChange={(e) => setFieldValue(`placements[${index}].place`, e.target.value)} className="w-full" />
                            </div>
                            <div className="flex-1">
                              <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">From <span className="text-red-500">*</span></Typography>
                              <Input type="time" value={slot.from} onChange={(e) => setFieldValue(`placements[${index}].from`, e.target.value)} className="w-full" />
                            </div>
                            <div className="flex items-end">
                              <IconButton variant="text" color="red" onClick={() => remove(index)} disabled={values.placements.length === 0}>
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
