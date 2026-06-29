import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Button } from '@material-tailwind/react';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import { VERSION_CONTROL_EDIT } from '@/utils/validations';

const VersionControlEdit = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const initialValues = {
    name: state?.name || '',
    applicationFor: state?.applicationFor || '',
    type: state?.type ? state.type.toUpperCase() : '',
    latestVersion: state?.latestVersion || '',
    isMandatory: state?.isMandatory || false,
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const requestBody = {
        name: values.name,
        applicationFor: values.applicationFor,
        type: values.type.toUpperCase(),
        latestVersion: values.latestVersion,
        isMandatory: values.isMandatory,
      };


      await ApiRequestUtils.update(API_ROUTES.PUT_VERSIONCONTROL, requestBody);

      navigate('/dashboard/user/versionControlList');
    } catch (error) {
      console.error('POST update failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 mx-auto">
      <div className="max-w-8xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Version</h2>

        <Formik
          initialValues={initialValues}
          validationSchema={VERSION_CONTROL_EDIT}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, isValid, setFieldValue, values }) => (
            <Form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <Field
                    name="name"
                    type="text"
                    className="p-2 w-full rounded-md border-gray-300 shadow-sm"
                  />
                  <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Application For</label>
                  <Field
                    name="applicationFor"
                    as="select"
                    className="p-2 w-full rounded-md border border-gray-300"
                  >
                    <option value="">-- Select --</option>
                    <option value="DRIVER">DRIVER</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                  </Field>
                  <ErrorMessage name="applicationFor" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <Field
                    name="type"
                    as="select"
                    className="p-2 w-full rounded-md border border-gray-300"
                    disabled
                  >
                    <option value="">-- Select --</option>
                    <option value="IOS">IOS</option>
                    <option value="ANDROID">ANDROID</option>
                  </Field>
                  <ErrorMessage name="type" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 flex items-center">Mandatory</label>
                  <div className="flex gap-2 pt-2">
                    <Field
                      type="checkbox"
                      name="isMandatory"
                      checked={values.isMandatory === true}
                      onChange={() => setFieldValue('isMandatory', true)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label className="text-sm font-medium text-gray-700">True</label>
                    <Field
                      type="checkbox"
                      name="isMandatory"
                      checked={values.isMandatory === false}
                      onChange={() => setFieldValue('isMandatory', false)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label className="text-sm font-medium text-gray-700">False</label>
                    <ErrorMessage name="isMandatory" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Latest Version</label>
                  <Field
                    name="latestVersion"
                    type="text"
                    placeholder="Eg: 2.0.0"
                    className="p-2 w-full rounded-md border border-gray-300 shadow-sm"
                  />
                  <ErrorMessage name="latestVersion" component="div" className="text-red-500 text-sm mt-1" />
                </div>
              </div>

              <div className="flex flex-row">
                <Button
                  fullWidth
                  type="button"
                  onClick={() => navigate('/dashboard/user/versionControlList')}
                  className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  color="black"
                  className="my-6 mx-2"
                >
                  Update
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default VersionControlEdit;
