import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Button } from "@material-tailwind/react";
import { BOOKING_TYPES, SERVICE_TYPES, ACCEPT_WINDOW_LABELS, createAcceptWindowValues, validateAcceptWindow } from "./futureBookingAcceptWindowConfig.js";


const minuteFields = [
  ...BOOKING_TYPES.map((key) => ({ group: "byBookingType", key })),
  ...SERVICE_TYPES.map((key) => ({ group: "byServiceType", key })),
];

const inputClass = "p-2 w-full rounded-md border border-gray-300 shadow-sm";

export default function FutureBookingAcceptWindowForm({ record, onSubmit, onCancel }) {
  return (
    <div className="p-4 mx-auto bg-white rounded-lg shadow-md max-w-3xl">
      <h2 className="text-xl font-bold mb-4 break-words">{record ? "Edit" : "Add"} Future Booking Accept Window</h2>
      <Formik initialValues={createAcceptWindowValues(record)} validate={validateAcceptWindow} onSubmit={onSubmit}>
        {({ isSubmitting, status }) => (
          <Form className="space-y-4">
            {status && <div role="alert" className="text-sm text-red-600">{status}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[ ["Name", "Future Booking Accept Window"], ["Type", "Future Booking Accept Window"], ["Service Type", "All"] ].map(([label, value]) => (
                <label key={label} className="text-sm font-medium">{label}<input readOnly value={value} className={`${inputClass} bg-gray-50`} /></label>
              ))}
              <label className="text-sm font-medium">Status
                <Field as="select" name="isActive" className={inputClass}><option value="true">Active</option><option value="false">Inactive</option></Field>
              </label>
            </div>
            <label className="block text-sm font-medium">Description<Field as="textarea" name="description" className={inputClass} /></label>
            <ErrorMessage name="description" component="div" className="text-sm text-red-600" />
              <fieldset className="border rounded-lg p-4">
                <legend className="text-sm font-semibold px-2">Accept Window (Minutes)</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {minuteFields.map(({ group, key }) => (
                    <label key={`${group}.${key}`} className="text-sm font-medium">{ACCEPT_WINDOW_LABELS[key] || key}
                      <Field name={`${group}.${key}`} type="number" min="1" step="1" className={inputClass} />
                      <ErrorMessage name={`${group}.${key}`} component="div" className="text-sm text-red-600" />
                    </label>
                  ))}
                </div>
              </fieldset>
            <div className="flex gap-4">
              <Button type="button" variant="outlined" onClick={onCancel} fullWidth>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary" fullWidth>{isSubmitting ? "Saving..." : record ? "Update" : "Add"}</Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
