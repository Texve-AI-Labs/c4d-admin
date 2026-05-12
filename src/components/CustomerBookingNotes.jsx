import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { Button } from '@material-tailwind/react';

const CustomerBookingNotes = ({ customerId, onNoteAdded }) => {
  const validationSchema = Yup.object({
    noteType: Yup.string().required('Note type is required'),
    notes: Yup.string().required('Note is required'),
  });

  const initialValues = {
    noteType: '',
    notes: '',
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await ApiRequestUtils.post(API_ROUTES.ADD_NOTES_BOOKING, {
        customerId,
        noteType: values.noteType,
        notes: values.notes,
      });
      resetForm();
      if (typeof onNoteAdded === 'function') {
        await onNoteAdded();
      }
    } catch (error) {
      console.error('Failed to add note. Please try again.', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 border rounded-md bg-gray-50">
      <h2 className="text-xl font-bold mb-4">Add Notes</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label htmlFor="noteType" className="text-sm font-medium text-gray-700">
                Note Type
              </label>
              <Field
                as="select"
                name="noteType"
                className="p-2 w-full rounded-md border bg-white border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              >
                <option value="">Select Note Type</option>
                <option value="INQUIRY">Inquiry</option>
                <option value="TRIP">Trip</option>
                <option value="PAYMENT">Payment</option>
                <option value="FEEDBACK">Feedback</option>
              </Field>
              <ErrorMessage name="noteType" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            {values.noteType && (
              <div>
                <label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Note
                </label>
                <Field
                  as="textarea"
                  name="notes"
                  rows="4"
                  className="p-2 w-full rounded-md border bg-white border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  placeholder="Enter your note here..."
                />
                <ErrorMessage name="notes" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            )}

            {values.noteType && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 ${ColorStyles.addButtonColor}`}
              >
                {isSubmitting ? 'Adding...' : 'Add Note'}
              </Button>
            )}
          </Form>
        )}
      </Formik>
    </div>
    
  );
};

export default CustomerBookingNotes;