import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import { Button } from '@material-tailwind/react';
import moment from 'moment';
import { UserIcon } from '@heroicons/react/24/solid';

const DriverAccountBookingNotes = ({ accountId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Only notes field is required
  const validationSchema = Yup.object({
    notes: Yup.string().required('Note is required'),
  });

  // Default noteType is DOCUMENT, but hidden
  const initialValues = { notes: '' };

  const fetchNotes = async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const response = await ApiRequestUtils.get(
        `${API_ROUTES.GET_ACCOUNT_BY_ID}/${accountId}`
      );
      setNotes(response?.data?.notes || response?.data?.data?.notes || []);
    } catch (err) {
      console.error('Error fetching driver notes:', err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) fetchNotes();
  }, [accountId]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await ApiRequestUtils.post(API_ROUTES.ADD_NOTES_BOOKING, {
        accountId,
        noteType: 'DOCUMENT', // Hardcoded
        notes: values.notes,
      });

      resetForm();
      await fetchNotes();
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // if (!accountId) {
  //   return <div className="p-4 text-red-500">Driver ID is missing.</div>;
  // }

  return (
    <div className="p-2 border rounded-sm bg-white  mt-2 shadow-sm">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Document Notes</h2>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting }) => (
          <Form className="space-y-5">
            {/* Hidden noteType */}
            <input type="hidden" name="noteType" value="DOCUMENT" />

            {/* Only Notes Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note
              </label>
              <Field
                as="textarea"
                name="notes"
                rows={4}
                placeholder="Enter your note here..."
                className="w-full p-2 border h-16 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
              />
              <ErrorMessage name="notes" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition"
            >
              {isSubmitting ? 'Adding...' : 'Add Note'}
            </Button>
          </Form>
        )}
      </Formik>

      {/* Previous Notes */}
      <div className="mt-1">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Previous Notes</h3>
        {loading ? (
          <p className="text-gray-500 animate-pulse">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-gray-500 italic bg-gray-100 p-4 rounded-lg text-center">
            No notes added yet.
          </p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white p-5 rounded-xl shadow border border-gray-200 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                     <UserIcon className="h-5 w-5 text-gray-600" />
                     <span className="text-sm font-medium text-gray-800">
                      {note.User?.name || 'Admin'}
                    </span>
                    <span className="bg-gray-700 text-white text-xs px-3 py-1 rounded-full hidden">
                      {note.noteType}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {moment(note.created_at).format('DD MMM YYYY, hh:mm A')}
                  </span>
                </div>
                <p className="text-gray-800 leading-relaxed">{note.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverAccountBookingNotes;