import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { Alert, Button } from '@material-tailwind/react';
import { useNavigate, useParams } from "react-router-dom";

const CustomerAdd = (props) => {
    const [customerVal, setCustomerVal] = useState({});
    const [zones, setZones] = useState([]);
    const [alert, setAlert] = useState(false);
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();
    useEffect(() => {
        if (isEditMode) {
            fetchItem(id);
        }
    }, [id, isEditMode]);
    const fetchItem = async (itemId) => {
        const data = await ApiRequestUtils.get(API_ROUTES.GET_CUSTOMER + `/${itemId}`);
        setCustomerVal(data.data);
    };
    const initialValues = {
        salutation: customerVal?.salutation || '',
        firstName: customerVal?.firstName || '',
        phoneNumber: props.customerNumber || '', //customerVal?.phoneNumber ? customerVal?.phoneNumber.replace(/^(\+91)/, ''): "",
        zone: customerVal?.zone || '',
        carNumber: '',
        nickName: '',
        carType: '',
        fuelType: '',
        transmissionType: '',
        source: customerVal?.source || '',
        // sourceType: customerVal?.sourceType || 'App', // New field with default value
    };

    useEffect(() => {
        const fetchGeoData = async () => {
            try {
                const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS, {
                    type: 'Service Area',
                });
                setZones(response?.data || []);
            } catch (error) {
                console.error('Error fetching zones:', error);
            }
        };

        fetchGeoData();
    }, []);

    const validationSchema = Yup.object({
        salutation: Yup.string().required('Salutation is required'),
        firstName: Yup.string().required('Name is required').matches(/^[a-zA-Z\s]+$/, 'Only letters are allowed'),
        source: Yup.string().required('source is required'),
        zone: Yup.string().required('Zone is required'),
        // sourceType: Yup.string().required('Source type is required'), // New validation
        ...(isEditMode
            ? {}
            : {
                phoneNumber: Yup.string().matches(/^[6-9][0-9]{9}$/, 'Must be a valid 10-digit number').required('Phone number is required'),
                zone: Yup.string().required('Zone is required')
                // carNumber: Yup.string().required('Car number is required'),
                // nickName: Yup.string().required('Car name is required'),
                // carType: Yup.string().required('Car type is required'),
                // fuelType: Yup.string().required('Fuel type is required'),
                // transmissionType: Yup.string().required('Transmission type number is required')
            }),
    });

    const onSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            const customerData = {
                salutation: values.salutation,
                firstName: values.firstName,
                source: values.source,
                zone: values.zone,
                // sourceType: values.sourceType, // Include new field
            };
            let data;
            if (isEditMode) {
                customerData['id'] = id;
                data = await ApiRequestUtils.update(API_ROUTES.UPDATE_CUSTOMER, customerData);

                navigate('/dashboard/customers', {
                    state: {
                        customerUpdated: true,
                        customerName: values.firstName
                    }
                });
            } else {
                customerData['phoneNumber'] = "+91" + values.phoneNumber;
                // customerData['sourceType'] = values.sourceType; // Ensure sourceType is included for new customers
                data = await ApiRequestUtils.post(API_ROUTES.REGISTER_CUSTOMER, customerData);

                if (!data?.success && data?.code === 203) {
                    setAlert({ message: 'Customer already exists!', color: 'red' });
                    setTimeout(() => setAlert(null), 5000);
                    resetForm();
                } else {
                    // setAlert({ show: true, message: isEditMode ? 'User updated successfully!' : 'User added successfully!', color: 'green' });
                    // setTimeout(() => {
                    //     resetForm();
                    if (props.isQuickCreate) {
                        return navigate('/dashboard/booking', {
                            state: {
                                refreshData: true,
                                customerPhoneNumber: data?.data?.phoneNumber
                            }
                        });
                    }
                    navigate('/dashboard/customers', {
                        state: {
                            customerAdded: true,
                            customerName: values.firstName
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error creating user and car:', error);
            // Handle error (e.g., show an error message)
        }
        setSubmitting(false);
    };

    const handleCancel = () => {
        if (props.isQuickCreate) {
            return navigate('/dashboard/booking', {
                state: {
                    refreshData: true,
                    customerPhoneNumber:'',
                    selectCustomer: 0
                }
            });
        } else {
            navigate('/dashboard/customers');
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            {alert && (
                <div className='mb-2'>
                    <Alert
                        color={alert.color}
                        className='py-3 px-6 rounded-xl'
                    >
                        {alert.message}
                    </Alert>
                </div>
            )}
            <h2 className="text-2xl font-bold mb-4">{isEditMode ? 'Edit Customer' : 'New Customer'}</h2>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {({ handleSubmit, dirty, isValid }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="salutation" className="text-sm font-medium text-gray-700">Salutation</label>
                                <Field as="select" name="salutation" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                    <option value="">Select salutation</option>
                                    <option value="Mr">Mr</option>
                                    <option value="Mrs">Mrs</option>
                                    <option value="Miss">Miss</option>
                                    <option value="Others">Others</option>
                                </Field>
                                <ErrorMessage name="salutation" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <label htmlFor="firstName" className="text-sm font-medium text-gray-700">Full Name</label>
                                <Field type="text" name="firstName" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                <ErrorMessage name="firstName" component="div" className="text-red-500 text-sm my-1" />
                            </div>

                            {!isEditMode && (
                                <>
                                    <div>
                                        <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                                        <div className="flex items-center p-2 w-full rounded-md border-2 border-gray-300">
                                            <span className="text-gray-700 font-medium">+91</span>
                                            <Field 
                                                type="tel" 
                                                name="phoneNumber" 
                                                className="ml-2 flex-1 outline-none bg-transparent" 
                                                maxLength={10} 
                                            />
                                        </div>
                                        <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
                                        <text className='text-[10px] text-gray-700 font-normal'>Please enter a phone number with 10 digits</text>
                                    </div>
                                </>
                            )}
                            <div>
                                <label htmlFor="source" className="text-sm font-medium text-gray-700">Source</label>
                                <Field as="select" name="source" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                    <option value="">Select Source</option>
                                    <option value="Walk In">Walk In</option>
                                    <option value="Mobile App">Mobile App</option>
                                    <option value="Website">Website</option>
                                    <option value="Call">Call</option>
                                </Field>
                                <ErrorMessage name="source" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="zone" className="text-sm font-medium text-gray-700">Zone</label>
                                <Field as="select" name="zone" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                    <option value="">Select Zone</option>
                                    {zones.map((zone) => (
                                        <option key={zone?.id || zone?.name} value={zone?.name || ''}>
                                            {zone?.name || ''}
                                        </option>
                                    ))}
                                </Field>
                                <ErrorMessage name="zone" component="div" className="text-red-500 text-sm" />
                            </div>
                        </div>

                        <div className='flex flex-row'>
                            <Button
                                fullWidth
                                onClick={handleCancel}
                                className='my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl'
                            >
                                Cancel
                            </Button>
                            <Button
                                fullWidth
                                // color="text-black"
                                onClick={handleSubmit}
                                disabled={isEditMode ? false : !dirty || !isValid}
                                className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}
                            >
                                {isEditMode ? 'Update' : 'Continue'}
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default CustomerAdd;