import React from "react";
import { ErrorMessage, Field } from "formik";

function ServiceContentBasicDetails({ values, setFieldValue, serviceTypes, formatLabel }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <div className="text-base font-semibold text-slate-800">Basic Details</div>
        {/* <div className="text-sm text-slate-500">Choose the service and define its publication state.</div> */}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Service Type</label>
          <Field as="select" name="serviceType" className="mt-1 w-full rounded-md border border-slate-300 p-2">
            <option value="">Select Service Type</option>
            {serviceTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </Field>
          <ErrorMessage name="serviceType" component="div" className="mt-1 text-sm text-red-600" />
        </div>
        <div className="hidden">
          <label className="block text-sm font-medium">Usage Type</label>
          <Field name="usageType" disabled className="mt-1 w-full rounded-md border border-slate-200 bg-slate-100 p-2" />
        </div>
        <div className="hidden">
          <label className="block text-sm font-medium">Content Mode</label>
          <Field name="contentMode" disabled className="mt-1 w-full rounded-md border border-slate-200 bg-slate-100 p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Sort Order</label>
          <Field name="sortOrder" type="number" min="0" className="mt-1 w-full rounded-md border border-slate-300 p-2" />
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <label className="block text-sm font-medium">Is Active</label>
          <button
            type="button"
            onClick={() => setFieldValue("isActive", !values.isActive)}
            className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${values.isActive ? "bg-green-500" : "bg-gray-300"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${values.isActive ? "translate-x-5" : "translate-x-1"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServiceContentBasicDetails;