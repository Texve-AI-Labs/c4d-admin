import React, { useState, useEffect } from 'react';
import { Formik, Field, ErrorMessage, Form } from 'formik';
import { Button } from '@material-tailwind/react';
import { ColorStyles, API_ROUTES } from '@/utils/constants';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { useNavigate, useParams } from 'react-router-dom';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  message: Yup.string().required('Message is required'),
  image: Yup.mixed().required('Image is required'),
});

const DriverNotificationListEdit = () => {
  const [userId, setUserId] = useState(null);
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserId(userData.id);
    }
  }, []);

  useEffect(() => {
    const fetchItem = async (notificationId) => {
      try {
        const response = await ApiRequestUtils.get(`${API_ROUTES.GET_DRIVER_NOTIFY}?id=${notificationId}`);
        const notificationData = response.data.find(item => item.id === parseInt(notificationId));
        if (notificationData) {
          setData(notificationData);
          setImagePreview(notificationData.url || null);
        } else {
          console.warn('No notification found for id:', notificationId);
        }
      } catch (err) {
        console.error('Error fetching notification:', err);
      }
    };

    if (id) {
      fetchItem(id);
    }
  }, [id]);

  const initialValues = {
    title: data?.title || '',
    message: data?.message || '',
    image: data?.url || '',
  };

  const handleImageUpload = (file, setFieldValue) => {
    if (file) {
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        return;
      }
      setFieldValue('image', file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(data?.url || null);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    if (!userId || !id) {
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('notificationId', id);
      formData.append('userId', userId);
      formData.append('title', values.title);
      formData.append('message', values.message);
      formData.append('type', 'DRIVER');


      if (values.image instanceof File) {
        formData.append('image', values.image);
        formData.append('extImage', values.image.name.split('.').pop()?.toLowerCase());
        formData.append('fileType', values.image.type);
      }

      const response = await ApiRequestUtils.updateDocs(API_ROUTES.UPDATE_DRIVER_NOTIFY, formData);

      if (response?.success) {
        navigate('/dashboard/vendors/driverNotificationList');
      } else {
        console.warn("Update failed:", response);
      }
    } catch (error) {
      console.error("response is error", error.response ? error.response.data : error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 mx-auto bg-white rounded-xl shadow-md max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Update Driver Notification</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, setFieldValue }) => (
          <Form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="text-sm font-medium text-gray-700">Title</label>
                <Field type="text" name="title" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                <ErrorMessage name="title" component="div" className="text-red-500 text-sm my-1" />
              </div>
              <div>
                <label htmlFor="type" className="text-sm font-medium text-gray-700">Type</label>
                <Field
                  as="select"
                  name="type"
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  disabled
                >
                  <option value="DRIVER">Driver App</option>
                </Field>
              </div>
              <div>
                <label htmlFor="image" className="text-sm font-medium text-gray-700">Image</label>
                {imagePreview && (
                  <img src={imagePreview} alt="Current notification" className="w-32 h-32 object-cover mb-2" />
                )}
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                  onChange={(event) => handleImageUpload(event.target.files[0], setFieldValue)}
                  onClick={(event) => {
                    if (!event.target.files.length) {
                      handleImageUpload(null, setFieldValue);
                    }
                  }}
                />
                <ErrorMessage name="image" component="div" className="text-red-500 text-sm my-1" />
              </div>
              <div>
                <label htmlFor="message" className="text-sm font-medium text-gray-700">Summary</label>
                <Field as="textarea" name="message" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" rows="4" />
                <ErrorMessage name="message" component="div" className="text-red-500 text-sm my-1" />
              </div>
            </div>
            <div className="flex flex-row">
              <Button
                fullWidth
                className={`my-6 mx-2 rounded-xl ${ColorStyles.backButton}`}
                type="button"
                onClick={() => navigate('/dashboard/vendors/driverNotificationList')}
              >
                Back
              </Button>
              <Button
                fullWidth
                color="black"
                className={`my-6 px-8 border-2 rounded-xl ${ColorStyles.continueButtonColor}`}
                type="submit"
                disabled={isSubmitting || !userId}
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

export default DriverNotificationListEdit;