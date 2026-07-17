import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, CardHeader, Typography } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { WITHDRAWAL_RULE_ENTITY_TYPES, WITHDRAWAL_RULE_TIERS } from "./constants";

const initialValues = {
  entityType: "",
  tier: "",
  isWithdrawalAllowed: false,
  minWithdrawalAmount: "",
  maxWithdrawalAmount: "",
  name: "",
  description: "",
  isActive: true,
};

const validationSchema = Yup.object({
  entityType: Yup.string().required("Entity Type is required"),
  tier: Yup.string().required("Tier is required"),
  minWithdrawalAmount: Yup.number().required("Min Withdrawal Amount is required"),
  maxWithdrawalAmount: Yup.number().required("Max Withdrawal Amount is required"),
  name: Yup.string().required("Name is required"),
  description: Yup.string().required("Description is required"),
});

export default function WithdrawalRulesAdd() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError("");
      const response = await ApiRequestUtils.post(API_ROUTES.ADMIN_WITHDRAWAL_RULES_ADD, values, 0, { suppressAlert: true });
      if (response?.success === false) {
        setError(response?.error || response?.message || "Unable to save withdrawal rule.");
        return;
      }
      navigate("/dashboard/finance/withdrawal-rules");
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unable to save withdrawal rule.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-8 mt-8">
      <Card>
        <CardHeader variant="gradient" className={`mb-4 p-6 rounded-xl ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">Add Withdrawal Rule</Typography>
        </CardHeader>
        <CardBody>
          {error ? <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
            {({ values, setFieldValue, isSubmitting }) => (
              <Form className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium">Entity Type</label>
                  <Field as="select" name="entityType" className="mt-1 w-full rounded-md border p-2">
                    <option value="">Select Entity Type</option>
                    {WITHDRAWAL_RULE_ENTITY_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </Field>
                  <ErrorMessage name="entityType" component="div" className="mt-1 text-sm text-red-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Tier</label>
                  <Field as="select" name="tier" className="mt-1 w-full rounded-md border p-2">
                    <option value="">Select Tier</option>
                    {WITHDRAWAL_RULE_TIERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </Field>
                  <ErrorMessage name="tier" component="div" className="mt-1 text-sm text-red-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Withdrawal Allowed</label>
                  <button
                    type="button"
                    onClick={() => setFieldValue("isWithdrawalAllowed", !values.isWithdrawalAllowed)}
                    className={`mt-2 inline-flex h-6 w-11 items-center rounded-full transition-colors ${values.isWithdrawalAllowed ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${values.isWithdrawalAllowed ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium">Active</label>
                  <button
                    type="button"
                    onClick={() => setFieldValue("isActive", !values.isActive)}
                    className={`mt-2 inline-flex h-6 w-11 items-center rounded-full transition-colors ${values.isActive ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${values.isActive ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium">Min Withdrawal Amount</label>
                  <Field name="minWithdrawalAmount" type="number" step="0.01" className="mt-1 w-full rounded-md border p-2" />
                  <ErrorMessage name="minWithdrawalAmount" component="div" className="mt-1 text-sm text-red-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Max Withdrawal Amount</label>
                  <Field name="maxWithdrawalAmount" type="number" step="0.01" className="mt-1 w-full rounded-md border p-2" />
                  <ErrorMessage name="maxWithdrawalAmount" component="div" className="mt-1 text-sm text-red-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <Field name="name" className="mt-1 w-full rounded-md border p-2" />
                  <ErrorMessage name="name" component="div" className="mt-1 text-sm text-red-600" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium">Description</label>
                  <Field as="textarea" name="description" rows="4" className="mt-1 w-full rounded-md border p-2" />
                  <ErrorMessage name="description" component="div" className="mt-1 text-sm text-red-600" />
                </div>
                <div className="sm:col-span-2 flex gap-3 pt-2">
                  <Button type="submit" disabled={isSubmitting} className={`${ColorStyles.continueButtonColor}`}>
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" variant="outlined" onClick={() => navigate("/dashboard/finance/withdrawal-rules")}>
                    Cancel
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
