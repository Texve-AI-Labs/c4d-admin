import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { ACCOUNT_ADD_SCHEMA } from '@/utils/validations';
import { Button } from '@material-tailwind/react';
import { useNavigate } from "react-router-dom";
import AccountCreationTabs from './AccountCreationTabs';

const AddAccountNew = () => {
    const navigate = useNavigate();

    const onSubmit = async (values, { setSubmitting }) => {
        // console.log('Form submission started with values:', values);
        try {
            const reqBody = {
                type: values?.type,
                name: values?.name,
                phoneNumber: values?.phoneNumber,
                email: values?.email,
                address: "",
                street: "",
                thaluk: "",
                district: "",
                state: "",
                pincode: "",
                source: values?.source,
            }
            let data;
            data = await ApiRequestUtils.post(API_ROUTES.CREATE_ACCOUNT, reqBody);
            if (!data?.success && data?.code === 203) {
                setSubmitting(false);
                return;
            }
            const accountId = data?.data?.id;
            if (data?.success && accountId) {
                navigate(`/dashboard/vendors/account/owner-onboarding-auto/documents/${accountId}`);
                return;
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
        setSubmitting(false);
    };

    const initialValues = {
        type: "",
        name: "",
        phoneNumber: "",
        email: "",
        source: "",
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <AccountCreationTabs activeStage={1} />
            <div className="mb-4">
                {/* <h2 className="text-2xl font-bold">Add new Account</h2> */}
                {/* <span className='text-xs text-blue-gray-600 mt-1'>All fields are required</span> */}
            </div>
            <Formik
                initialValues={initialValues}
                validationSchema={ACCOUNT_ADD_SCHEMA}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {({ handleSubmit, dirty, isValid, values }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label htmlFor="type" className="text-sm font-medium text-gray-700">Service Type</label>
                                    <Field as="select" name="type" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                        <option value="">Select Type</option>
                                        <option value="Auto">Auto</option>
                                        {/* <option value="Company">Travels</option> */}
                                    </Field>
                                    <ErrorMessage name="type" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="name" className="text-sm font-medium text-gray-700">{"Company Name"}</label>
                                    <Field type="text" name="name" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                    <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
                                </div>
                                <div>
                                    <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <Field type="text" name="phoneNumber" className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={10} />
                                    <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="source" className="text-sm font-medium text-gray-700">Source</label>
                                    <Field as="select" name="source" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                        <option value="">Select Type</option>
                                        <option value="Mobile App">Mobile App</option>
                                        <option value="Walk In">Walk In</option>
                                        <option value="Call">Call</option>
                                        <option value="Website">Website</option>
                                    </Field>
                                    <ErrorMessage name="source" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                                    <Field type="email" name="email" className="p-2 w-full rounded-md border-2  shadow-sm border-gray-300" />
                                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
                                </div>
                            </div>
                        </div>
                        <div className='flex flex-row'>
                            <Button
                                fullWidth
                                onClick={() => { navigate('/dashboard/vendors/account/owner-onboarding-auto'); }}
                                className='my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl'
                            >
                                Cancel
                            </Button>
                            <Button
                                fullWidth
                                // color="blue-gray-50"
                                onClick={handleSubmit}
                                disabled={!dirty || !isValid}
                                className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}
                            >
                                Continue
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default AddAccountNew;