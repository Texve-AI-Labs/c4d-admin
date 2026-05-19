import React from 'react';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button } from '@material-tailwind/react';
import { ColorStyles, API_ROUTES } from '@/utils/constants';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { useNavigate } from 'react-router-dom';
import { GST_ADD_SCHEMA } from '@/utils/validations';

const GstAdd = () => {
  const navigate = useNavigate();

  const initialValues = {
    serviceType: '',
    name: '',
    totalGst: '',
    hsnCode: '',
    serviceCategory: '',
    serviceDescription: '',
    gstNo: '',
    isActive: true,
  };

 

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const isDriverService = values.serviceType === "DRIVER";
      const payload = isDriverService
        ? {
            serviceType: "DRIVER",
            type: "DRIVER_FEEDBACK",
            name: values.name,
            description: values.serviceDescription || "",
            config: {
              enabled: true,
            },
            isActive: Boolean(values.isActive),
          }
        : {
        serviceType: values.serviceType,
        name: values.name,
        totalGst: parseFloat(values.totalGst),
        hsnCode: values.hsnCode,
        serviceCategory: values.serviceCategory,
        serviceDescription: values.serviceDescription,
        gstNo: values.gstNo,
        isActive: values.isActive,
      };

      await ApiRequestUtils.post(API_ROUTES.POST_GST, payload);

      navigate('/dashboard/finance/GSTList', {
        state: { updatedGst: payload },
      });
    } catch (error) {
      console.error('GST save failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 mx-auto bg-white rounded-lg shadow-md max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Add GST</h2>

      <Formik initialValues={initialValues} validationSchema={GST_ADD_SCHEMA} onSubmit={handleSubmit}>
        {({ isSubmitting, values }) => (
          <Form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Service Type</label>
                <Field as="select" name="serviceType" className="p-2 w-full rounded-md border border-gray-300 shadow-sm">
                  <option value="">Select Service Type</option>
                  <option value="DRIVER">DRIVER</option>
                  <option value="RIDES">RIDES</option>
                  <option value="RENTAL">RENTAL</option>
                  <option value="ALL">ALL</option>
                </Field>
                <ErrorMessage name="serviceType" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <Field name="name" type="text" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
              </div>

              {values.serviceType !== "DRIVER" && (
              <div>
                <label className="text-sm font-medium text-gray-700">Total GST (%)</label>
                <Field name="totalGst" type="number" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="totalGst" component="div" className="text-red-500 text-sm" />
              </div>
              )}

              {values.serviceType !== "DRIVER" && (
              <div>
                <label className="text-sm font-medium text-gray-700">HSN Code</label>
                <Field name="hsnCode" type="text" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="hsnCode" component="div" className="text-red-500 text-sm" />
              </div>
              )}

              {values.serviceType !== "DRIVER" && (
              <div>
                <label className="text-sm font-medium text-gray-700">Service Category</label>
                <Field name="serviceCategory" type="text" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="serviceCategory" component="div" className="text-red-500 text-sm" />
              </div>
              )}            
              <div>
                <label className="text-sm font-medium text-gray-700">Service Description</label>
                <Field name="serviceDescription" type="text" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="serviceDescription" component="div" className="text-red-500 text-sm" />
              </div>
              {values.serviceType !== "DRIVER" && (
              <div>
                <label className="text-sm font-medium text-gray-700">GST No</label>
                <Field name="gstNo" type="text" className="p-2 w-full rounded-md border border-gray-300 shadow-sm" />
                <ErrorMessage name="gstNo" component="div" className="text-red-500 text-sm" />
              </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Field as="select" name="isActive" className="p-2 w-full rounded-md border border-gray-300 shadow-sm">
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </Field>
                <ErrorMessage name="isActive" component="div" className="text-red-500 text-sm" />
              </div>
            </div>

            <div className="flex flex-row">
              <Button
                fullWidth
                type="button"
                onClick={() => navigate('/dashboard/finance/GSTList')}
                className={`my-6 mx-2 border-2 rounded-xl ${ColorStyles.backButton}`}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                type="submit"
                disabled={isSubmitting}
                color="black"
                className={`my-6 mx-2 border-2 rounded-xl ${ColorStyles.continueButtonColor}`}
              >
                Add
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default GstAdd;
