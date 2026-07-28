import React, { useEffect, useState } from 'react';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { Button } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';

const validationSchema = Yup.object({
  value: Yup.string().required('Value is required'),
  isActive: Yup.boolean().required(),
});

const EditDynamicText = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState({
    key: '',
    appScope: '',
    screen: '',
    type: 'TEXT',
    value: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    const loadItem = async () => {
      try {
        const response = await ApiRequestUtils.get(`${API_ROUTES.GET_UI_CONTENT}/${id}`);
        const data = response?.data || {};
        setInitialValues({
          key: data.key || '',
          appScope: data.appScope || '',
          screen: data.screen || '',
          type: data.type || 'TEXT',
          value: data.value || '',
          description: data.description || '',
          isActive: Boolean(data.isActive),
        });
      } catch (error) {
        console.error('Failed to load UI content:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadItem();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = { 
        value: values.value, 
        isActive: Boolean(values.isActive),
        description:values.description 
    };
      const response = await ApiRequestUtils.update(`${API_ROUTES.UPDATE_UI_CONTENT}/${id}`, payload, 0, {
        suppressAlert: true,
      });
      if (response?.success) {
        navigate('/dashboard/vendors/dynamic-text');
      } else {
        await Swal.fire('Error', response?.message || 'Failed to update UI content', 'error');
      }
    } catch (error) {
      await Swal.fire('Error', error?.response?.data?.message || 'Failed to update UI content', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-4 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">Edit Dynamic Text</h2>
      <Formik enableReinitialize initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ isSubmitting, values, setFieldValue }) => (
          <Form className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Key</label>
              <Field
                name="key"
                disabled
                placeholder="customer.dashboard.trust_badge"
                className="w-full rounded-md border-2 bg-gray-100 p-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">App Scope</label>
              <Field name="appScope" disabled className="w-full rounded-md border-2 bg-gray-100 p-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Screen</label>
              <Field name="screen" disabled className="w-full rounded-md border-2 bg-gray-100 p-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Field name="type" disabled className="w-full rounded-md border-2 bg-gray-100 p-2" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Value</label>
              <Field as="textarea" name="value" rows="4" className="w-full rounded-md border-2 p-2" />
              <ErrorMessage name="value" component="div" className="text-sm text-red-500" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Field as="textarea" name="description" rows="3" className="w-full rounded-md border-2 p-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Field
                as="select"
                name="isActive"
                className="w-full rounded-md border-2 p-2"
                value={values.isActive ? 'true' : 'false'}
                onChange={(event) => {
                  setFieldValue('isActive', event.target.value === 'true');
                }}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Field>
            </div>
            <div className="flex justify-center md:col-span-2  gap-3">
              <Button className={ColorStyles.backButton} type="button" onClick={() => navigate('/dashboard/vendors/dynamic-text')}>
                Back
              </Button>
              <Button className={ColorStyles.continueButtonColor} type="submit" disabled={isSubmitting}>
                Update
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EditDynamicText;