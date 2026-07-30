import React, { useState } from "react";
import { Alert, Button, Card, CardBody, IconButton, Input, Switch, Textarea, Typography } from "@material-tailwind/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { Formik, FieldArray } from "formik";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import DriverAdsZone from "@/components/driverAdsZone";
import { driverAdsValidationSchema } from "./driverAdsValidation";


const RequiredLabel = ({ children }) => (
  <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
    {children} <span className="text-red-500">*</span>
  </Typography>
);

function DriverAdsCreate() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const initialValues = {
    name: "",
    description: "",
    zone: "",
    subZoneId: "",
    imageFile: null,
    timeSlots: [{ from: "", to: "" }],
    launchAt: "",
    isActive: true,
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("description", values.description.trim());
      formData.append("zone", values.zone);
      if (values.subZoneId) formData.append("subZoneId", String(values.subZoneId));
      formData.append("launchAt", values.launchAt);
      formData.append("isActive", String(values.isActive));
      formData.append(
        "config",
        JSON.stringify({
          timeSlots: values.timeSlots.map((slot) => ({
            from: slot.from,
            to: slot.to,
          })),
        })
      );
      if (values.imageFile) {
        formData.append("image1", values.imageFile);
        formData.append("extImage1", values.imageFile.name.split(".").pop());
        formData.append("fileTypeImage1", values.imageFile.type);
      }

      const response = await ApiRequestUtils.postDocs(API_ROUTES.POST_DRIVER_ADVERISEMENT, formData);
      if (response?.success) {
        setSuccess("Advertisement created successfully.");
        navigate("/dashboard/support/driver-ads");
      } else {
        setError(response?.message || "Failed to create advertisement.");
      }
    } catch (err) {
      console.error("Failed to create driver advertisement:", err);
      setError("Failed to create advertisement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-8 mt-8">
      <Card>
        <CardBody className="flex flex-col gap-6">
          <Typography variant="h5" className="text-black">
            Create Driver Advertisement
          </Typography>

          {error ? <Alert color="red">{error}</Alert> : null}
          {success ? <Alert color="green">{success}</Alert> : null}

          <Formik
            initialValues={initialValues}
            validationSchema={driverAdsValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, submitForm }) => (
              <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <RequiredLabel>Name</RequiredLabel>
                  <Input
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full"
                  />
                  {touched.name && errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
                </div>

                <div>
                  <RequiredLabel>Description</RequiredLabel>
                  <Textarea
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full"
                  />
                  {touched.description && errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description}</p> : null}
                </div>

                <DriverAdsZone
                  label="Zone *"
                  placeholder="Select Zone"
                  value={values.zone}
                  error={errors.zone}
                  touched={touched.zone}
                  refreshKey={0}
                  showAll={false}
                  onChange={(value) => {
                    setFieldValue("zone", value);
                    setFieldValue("subZoneId", "");
                  }}
                />

                <DriverAdsZone
                  label={
                    <>
                      Sub Zone <span className="text-red-500">*</span>
                    </>
                  }
                  placeholder="Select Sub Zone"
                  value={values.subZoneId}
                  error={errors.subZoneId}
                  touched={touched.subZoneId}
                  refreshKey={0}
                  isSubZone
                  parentValue={values.zone}
                  showAll={false}
                  onChange={(value) => setFieldValue("subZoneId", value)}
                />

                <div>
                  <RequiredLabel>Launch At</RequiredLabel>
                  <Input
                    type="date"
                    name="launchAt"
                    value={values.launchAt}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full"
                  />
                  {touched.launchAt && errors.launchAt ? <p className="mt-1 text-xs text-red-600">{errors.launchAt}</p> : null}
                </div>

                <div>
                  <RequiredLabel>Image</RequiredLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFieldValue("imageFile", e.currentTarget.files?.[0] || null)}
                    onBlur={handleBlur}
                    className="w-full"
                  />
                  {touched.imageFile && errors.imageFile ? <p className="mt-1 text-xs text-red-600">{errors.imageFile}</p> : null}
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
                  <Switch
                    checked={values.isActive}
                    onChange={(e) => setFieldValue("isActive", e.target.checked)}
                  />
                  <Typography className="text-sm font-medium text-blue-gray-700">Active <span className="text-red-500">*</span></Typography>
                </div>

                <div className="md:col-span-2 rounded-xl border border-blue-gray-100 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <Typography className="text-sm font-medium text-black">Time Slots</Typography>

                    <Button
                      type="button"
                      size="sm"
                      className={`${ColorStyles.bgColor} inline-flex items-center text-white`}
                      onClick={() => setFieldValue("timeSlots", [...values.timeSlots, { from: "", to: "" }])}
                    >
                      <span className="mr-2 inline-flex items-center">
                        <PlusIcon className="h-4 w-4" />
                      </span>
                      Add Slot
                    </Button>
                  </div>
                  <FieldArray name="timeSlots">
                    {({ remove }) => (
                      <div className="space-y-3">
                        {values.timeSlots.map((slot, index) => (
                          <div key={index} className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
                            <div className="flex-1">
                              <RequiredLabel>From</RequiredLabel>
                              <Input
                                type="time"
                                value={slot.from}
                                onChange={(e) => setFieldValue(`timeSlots[${index}].from`, e.target.value)}
                                className="w-full"
                              />
                              {touched.timeSlots?.[index]?.from && errors.timeSlots?.[index]?.from ? (
                                <p className="mt-1 text-xs text-red-600">{errors.timeSlots[index].from}</p>
                              ) : null}
                            </div>
                            <div className="flex-1">
                              <RequiredLabel>To</RequiredLabel>
                              <Input
                                type="time"
                                value={slot.to}
                                onChange={(e) => setFieldValue(`timeSlots[${index}].to`, e.target.value)}
                                className="w-full"
                              />
                              {touched.timeSlots?.[index]?.to && errors.timeSlots?.[index]?.to ? (
                                <p className="mt-1 text-xs text-red-600">{errors.timeSlots[index].to}</p>
                              ) : null}
                            </div>
                            <div className="flex items-end">
                              <IconButton
                                variant="text"
                                color="red"
                                onClick={() => remove(index)}
                                disabled={values.timeSlots.length === 0}
                              >
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
                  <Button
                    type="button"
                    className="bg-red-600 text-white"
                    onClick={() => navigate("/dashboard/support/driver-ads")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className={`${ColorStyles.bgColor} text-white`}
                    onClick={submitForm}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Create Advertisement"}
                  </Button>
                </div>
              </form>
            )}
          </Formik>
        </CardBody>
      </Card>
    </div>
  );
}

export default DriverAdsCreate;