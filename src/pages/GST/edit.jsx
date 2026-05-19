import React, { useEffect, useState } from 'react';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Alert, Button, Spinner } from '@material-tailwind/react';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { GST_EDIT_SCHEMA } from '@/utils/validations';

const GstEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [gstData, setGstData] = useState({});
  const [loading, setLoading] = useState(true); 
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (location.state?.gst) {
      const raw = location.state.gst;
      const flatData = {
        serviceType: raw.serviceType,
        name: raw.name,
        totalGst: raw.config?.totalGst || '',
        hsnCode: raw.config?.hsnCode || '',
        serviceCategory: raw.config?.serviceCategory || '',
        serviceDescription: raw.config?.serviceDescription || raw.description || '',
        gstNo: raw.config?.gstNo || '',
        isActive: raw.isActive,
      };
      setGstData(flatData);
      setLoading(false); 
    } else if (id) {
      fetchGstData(id);
    }
  }, [id, location.state]);

  const fetchGstData = async (settingId) => {
    try {
      const response = await ApiRequestUtils.get(`${API_ROUTES.GET_GST}?id=${settingId}`);
      if (response?.success && response.data) {
        const raw = response.data;
        const flatData = {
          serviceType: raw.serviceType,
          name: raw.name,
          totalGst: raw.config?.totalGst || '',
          hsnCode: raw.config?.hsnCode || '',
          serviceCategory: raw.config?.serviceCategory || '',
          serviceDescription: raw.config?.serviceDescription || raw.description || '',
          gstNo: raw.config?.gstNo || '',
          isActive: raw.isActive,
        };
        setGstData(flatData);
      }
    } catch (error) {
      console.error('Failed to fetch GST data:', error);
    } finally {
      setLoading(false); 
    }
  };

  const initialValues = {
    serviceType: gstData?.serviceType || '',
    name: gstData?.name || '',
    totalGst: gstData?.totalGst || '',
    hsnCode: gstData?.hsnCode || '',
    serviceCategory: gstData?.serviceCategory || '',
    serviceDescription: gstData?.serviceDescription || '',
    gstNo: gstData?.gstNo || '',
    isActive: gstData?.isActive ?? true,
  };

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const isDriverService = values.serviceType === "DRIVER";
      const payload = isDriverService
        ? {
            settingId: parseInt(id),
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
        settingId: parseInt(id),
        serviceType: values.serviceType,
        name: values.name,
        totalGst: parseFloat(values.totalGst),
        hsnCode: values.hsnCode,
        serviceCategory: values.serviceCategory,
        serviceDescription: values.serviceDescription,
        gstNo: values.gstNo,
        isActive: values.isActive,
      };

      const response = await ApiRequestUtils.update(API_ROUTES.PUT_GST, payload);
      if (response?.success) {
        navigate('/dashboard/finance/GSTList', {
          state: { gstUpdated: true, gstName: values.name },
        });
      }
    } catch (error) {
      console.error('Error updating GST:', error);
    }
    setSubmitting(false);
  };

  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto bg-white rounded-lg shadow-md max-w-3xl">
      {alert && (
        <Alert color={alert.color} className="mb-4">
          {alert.message}
        </Alert>
      )}

      <h2 className="text-2xl font-bold mb-4">Edit TAX</h2>

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={GST_EDIT_SCHEMA}
        onSubmit={onSubmit}
      >
        {({ isSubmitting, isValid, values }) => (
          <Form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Service Type</label>
                <Field as="select" name="serviceType" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                  <option value="">Select Service Type</option>
                  <option value="DRIVER">DRIVER</option>
                  <option value="RIDES">RIDES</option>
                  <option value="RENTAL">RENTAL</option>
                  <option value="ALL">ALL</option>
                </Field>
                <ErrorMessage name="serviceType" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">GST Name</label>
                <Field name="name" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
              </div>

              {values.serviceType !== "DRIVER" && (
              <div>
                <label className="text-sm font-medium text-gray-700">Total GST (%)</label>
                <Field name="totalGst" type="number" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="totalGst" component="div" className="text-red-500 text-sm" />
              </div>
              )}

              {values.serviceType !== "DRIVER" && (
              <div>
                <label className="text-sm font-medium text-gray-700">HSN Code</label>
                <Field name="hsnCode" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="hsnCode" component="div" className="text-red-500 text-sm" />
              </div>
              )}

              {values.serviceType !== "DRIVER" && (
              <div>
                <label className="text-sm font-medium text-gray-700">Service Category</label>
                <Field name="serviceCategory" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="serviceCategory" component="div" className="text-red-500 text-sm" />
              </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Service Description</label>
                <Field name="serviceDescription" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="serviceDescription" component="div" className="text-red-500 text-sm" />
              </div>

              {values.serviceType !== "DRIVER" && (
              <div>
                <label className="text-sm font-medium text-gray-700">GST Number</label>
                <Field name="gstNo" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="gstNo" component="div" className="text-red-500 text-sm" />
              </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Field as="select" name="isActive" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
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
                className={`my-6 mx-2 rounded-xl ${ColorStyles.backButton}`}
                onClick={() => navigate('/dashboard/finance/GSTList')}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                type="submit"
                disabled={isSubmitting || !isValid}
                className={`my-6 px-8 border-2 rounded-xl ${ColorStyles.continueButtonColor}`}
              >
                Update
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default GstEdit;
