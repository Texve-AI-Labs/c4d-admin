import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Button, Spinner } from "@material-tailwind/react";
import * as Yup from "yup";
import { ColorStyles } from "@/utils/constants";

export const REFERRAL_RULE_OPTIONS = [
  { value: "DRIVER_TO_DRIVER", label: "Driver to Driver" },
  { value: "DRIVER_TO_CUSTOMER", label: "Driver to Customer" },
  { value: "CUSTOMER_TO_CUSTOMER", label: "Customer to Customer" },
];

export const REFERRAL_RULE_DESCRIPTIONS = {
  DRIVER_TO_DRIVER: "Driver refers another driver",
  DRIVER_TO_CUSTOMER: "Driver refers customer",
  CUSTOMER_TO_CUSTOMER: "Customer refers customer",
};

export const REFERRAL_RULE_CONFIG_MAP = {
  DRIVER_TO_DRIVER: {
    triggerEvent: "DRIVER_VERIFIED",
    referrerType: "DRIVER",
    referredType: "DRIVER",
  },
  DRIVER_TO_CUSTOMER: {
    triggerEvent: "CUSTOMER_FIRST_TRIP",
    referrerType: "DRIVER",
    referredType: "CUSTOMER",
  },
  CUSTOMER_TO_CUSTOMER: {
    triggerEvent: "CUSTOMER_FIRST_TRIP",
    referrerType: "CUSTOMER",
    referredType: "CUSTOMER",
  },
};

const schema = Yup.object({
  name: Yup.string().required("Name is required"),
  config: Yup.object({
    referrerAmount: Yup.number().typeError("Referrer amount is required").min(0).required(),
    // referredAmount: Yup.number().typeError("Referred amount is required").min(0).required(),
    triggerEvent: Yup.string().required("Trigger event is required"),
    referrerType: Yup.string().required("Referrer type is required"),
    referredType: Yup.string().required("Referred type is required"),
  }),
});

const ReferralRuleForm = ({ title, submitLabel, initialValues, onSubmit, loading = false }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto bg-white">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit}>
        {({ isSubmitting, values, setFieldValue }) => (
          <Form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <Field as="select" name="name" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                  onChange={(e) => {
                    const nextName = e.target.value;
                    setFieldValue("name", nextName);
                    setFieldValue("description", REFERRAL_RULE_DESCRIPTIONS[nextName] || "");
                    setFieldValue("config.triggerEvent", REFERRAL_RULE_CONFIG_MAP[nextName]?.triggerEvent || "");
                    setFieldValue("config.referrerType", REFERRAL_RULE_CONFIG_MAP[nextName]?.referrerType || "");
                    setFieldValue("config.referredType", REFERRAL_RULE_CONFIG_MAP[nextName]?.referredType || "");
                  }}
                >
                  <option value="">Select rule</option>
                  {REFERRAL_RULE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Field>
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
              </div>
              <div className="hidden">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Field name="description" disabled className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm bg-gray-100" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Referrer Amount</label>
                <Field type="number" name="config.referrerAmount" min="0" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="config.referrerAmount" component="div" className="text-red-500 text-sm" />
              </div>
              <div className="hidden">
                <label className="text-sm font-medium text-gray-700">Referred Amount</label>
                <Field type="number" name="config.referredAmount" min="0" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="config.referredAmount" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Field as="select" name="isActive" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" value={String(values.isActive)}
                  onChange={(e) => setFieldValue("isActive", e.target.value === "true")}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Field>
              </div>
              <Field type="hidden" name="config.triggerEvent" />
              <Field type="hidden" name="config.referrerType" />
              <Field type="hidden" name="config.referredType" />
              <Field type="hidden" name="config.enabled" />
            </div>
            <div className="flex gap-3 justify-center">
              <Button type="button" className={`rounded-xl ${ColorStyles.backButton}`} onClick={() => window.history.back()}>
                Back
              </Button>
              <Button type="submit" className={`rounded-xl ${ColorStyles.continueButtonColor}`} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : submitLabel}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ReferralRuleForm;
