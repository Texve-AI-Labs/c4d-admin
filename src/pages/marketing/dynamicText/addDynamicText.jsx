import React from 'react';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { Button } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';

const validationSchema = Yup.object({
  key: Yup.string().required('Key is required'),
  appScope: Yup.string().required('App scope is required'),
  screen: Yup.string().required('Screen is required'),
  type: Yup.string().oneOf(['TEXT']).required('Type is required'),
  value: Yup.string().required('Value is required'),
  description: Yup.string().required('Description is required'),
  isActive: Yup.boolean().required(),
});

const initialValues = {
  key: '',
  appScope: 'CUSTOMER',
  screen: '',
  type: 'TEXT',
  value: '',
  description: '',
  isActive: true,
};

const AddDynamicText = () => {
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const response = await ApiRequestUtils.post(API_ROUTES.POST_UI_CONTENT, values, 0, {
        suppressAlert: true,
      });
      if (response?.success) {
        navigate('/dashboard/vendors/dynamic-text');
      } else {
        await Swal.fire('Error', response?.message || 'Failed to create UI content', 'error');
      }
    } catch (error) {
      await Swal.fire('Error', error?.response?.data?.message || 'Failed to create UI content', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-4 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">Add Dynamic Text</h2>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ isSubmitting, values, setFieldValue }) => (
          <Form className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Key</label>
              <Field
                name="key"
                placeholder="customer.dashboard.trust_badge"
                className="w-full rounded-md border-2 p-2"
              />
              <ErrorMessage name="key" component="div" className="text-sm text-red-500" />
            </div>
            <div>
              <label className="text-sm font-medium">App Scope</label>
              <Field as="select" name="appScope" className="w-full rounded-md border-2 p-2">
                <option value="CUSTOMER">CUSTOMER</option>
                <option value="DRIVER">DRIVER</option>
                {/* <option value="ADMIN">ADMIN</option> */}
              </Field>
              <ErrorMessage name="appScope" component="div" className="text-sm text-red-500" />
            </div>
            <div>
              <label className="text-sm font-medium">Screen</label>
              <Field name="screen" className="w-full rounded-md border-2 p-2" />
              <ErrorMessage name="screen" component="div" className="text-sm text-red-500" />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Field as="select" name="type" className="w-full rounded-md border-2 p-2">
                <option value="TEXT">TEXT</option>
              </Field>
              <ErrorMessage name="type" component="div" className="text-sm text-red-500" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Value</label>
              <Field as="textarea" name="value" rows="4" className="w-full rounded-md border-2 p-2" />
              <ErrorMessage name="value" component="div" className="text-sm text-red-500" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Field as="textarea" name="description" rows="3" className="w-full rounded-md border-2 p-2" />
              <ErrorMessage name="description" component="div" className="text-sm text-red-500" />
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
            <div className="flex justify-center md:col-span-2 gap-3">
              <Button className={ColorStyles.backButton} type="button" onClick={() => navigate('/dashboard/vendors/dynamic-text')}>
                Back
              </Button>
              <Button className={ColorStyles.continueButtonColor} type="submit" disabled={isSubmitting}>
                Save
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AddDynamicText;