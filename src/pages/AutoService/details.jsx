import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { useNavigate, useParams } from "react-router-dom";
import DocumentsList from '@/components/DocumentsList';
import { Button, Spinner } from '@material-tailwind/react';
import DocumentLogs from '@/components/DocumentLogs';
import SubscriptionLog from '@/components/SubscriptionLog';
import AutoList from '@/components/AutoList';
import AutoDriverAccountNotes from '@/components/AutoDriverAccountNotes';

const AutoDetails = ({ btnShow = false, noApprove = false }) => {
    const navigate = useNavigate();
    const [accountVal, setAccountVal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();

    useEffect(() => {
        if (id) {
            fetchItem(id);
        }
    }, [id]);

    const fetchItem = async (itemId) => {
        try {
            setLoading(true);
            const response = await ApiRequestUtils.get(`${API_ROUTES.GET_ACCOUNT_BY_ID}/${itemId}`);

            if (response?.success) {
                setAccountVal(response.data?.data);
            } else {
                setError("Failed to fetch account details");
            }
        } catch (error) {
            console.error("Failed to fetch account details", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const initialValues = {
        name: accountVal?.name || '',
        type: accountVal?.type || '',
        phoneNumber: accountVal?.phoneNumber || "",
        email: accountVal?.email || '',
        source: accountVal?.source || '',
        address: accountVal?.address || '',
        street: accountVal?.street || '',
        thaluk: accountVal?.thaluk || '',
        district: accountVal?.district || '',
        state: accountVal?.state || '',
        pincode: accountVal?.pincode || '',
        status: accountVal?.availableStatus || 'Offline',
        ownerStatus: accountVal?.ownerStatus || 'InActive',
        kycStatus: accountVal?.documentStatus?.status || 'Pending'
    };

    if (loading) {
        return <div className="flex justify-center items-center py-10 mt-96">
            <Spinner className="h-10 w-10" />
        </div>
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
    }

    if (!accountVal) {
        return <div className="flex justify-center items-center h-screen">Account not found</div>;
    }

    return (
        <>
            <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">Account Details</h2>
                <Formik
                    initialValues={initialValues}
                    onSubmit={() => { }}
                    enableReinitialize={true}
                >
                    {({ values }) => (
                        <Form className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <label htmlFor="type" className="text-sm font-medium text-gray-700">Service Type</label>
                                        <Field as="select" disabled name="type" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                                            <option value="">Auto</option>

                                        </Field>
                                        <ErrorMessage name="type" component="div" className="text-red-500 text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="name" className="text-sm font-medium text-gray-700">{values.type == 'Individual' ? "Full Name" : 'Company Name'}</label>
                                        <Field type="text" name="name" disabled className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                        <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
                                    </div>
                                    <div>
                                        <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                                        <Field type="text" name="phoneNumber" disabled className="p-2 w-full rounded-md border-2 border-gray-300" maxLength={10} />
                                        <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                                        <Field type="email" name="email" disabled className="p-2 w-full rounded-md border-2 shadow-sm border-gray-300" />
                                        <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="status" className="text-sm font-medium text-gray-700">Status</label>
                                        <Field type="text" name="status" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                        <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="ownerStatus" className="text-sm font-medium text-gray-700">Subscription Status</label>
                                        <Field type="text" name="ownerStatus" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                        <ErrorMessage name="ownerStatus" component="div" className="text-red-500 text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="kycStatus" className="text-sm font-medium text-gray-700">KYC Status</label>
                                        <Field type="text" name="kycStatus" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                        <ErrorMessage name="kycStatus" component="div" className="text-red-500 text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="source" className="text-sm font-medium text-gray-700">Source</label>
                                        <Field type="text" name="source" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                        <ErrorMessage name="source" component="div" className="text-red-500 text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="address" className="text-sm font-medium text-gray-700">Current Address</label>
                                        <Field type="text" name="address" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                        <ErrorMessage name="address" component="div" className="text-red-500 text-sm" />
                                    </div>
                                </div>
                                <div className='space-y-2'>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800 mb-5">Permanent Address</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="street" className="text-sm font-medium text-gray-700">Street Name</label>
                                        <Field type="text" name="street" disabled className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                        <ErrorMessage name="street" component="div" className="text-red-500 text-sm my-1" />
                                    </div>
                                    <div>
                                        <label htmlFor="thaluk" className="text-sm font-medium text-gray-700">
                                            Thaluk
                                        </label>
                                        <Field type="text" name="thaluk" disabled className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                        <ErrorMessage
                                            name="thaluk"
                                            component="div"
                                            className="text-red-500 text-sm mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="district" className="text-sm font-medium text-gray-700">
                                            District
                                        </label>
                                        <Field type="text" disabled name="district" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                        <ErrorMessage
                                            name="district"
                                            component="div"
                                            className="text-red-500 text-sm mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="state" className="text-sm font-medium text-gray-700">
                                            State
                                        </label>
                                        <Field type="text" disabled name="state" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                        <ErrorMessage
                                            name="state"
                                            component="div"
                                            className="text-red-500 text-sm mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="pincode" className="text-sm font-medium text-gray-700">Pincode</label>
                                        <Field type="text" disabled name="pincode" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                        <ErrorMessage name="pincode" component="div" className="text-red-500 text-sm my-1" />
                                    </div>
                                </div>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
            <AutoDriverAccountNotes accountId={accountVal?.id} />
            {accountVal && !btnShow && <AutoList cabsList={accountVal?.Autos} id={accountVal?.id} ownerName={accountVal?.name} type={accountVal?.type} />}
            {accountVal && accountVal?.id && (<DocumentsList id={accountVal?.id} type={'account'} noApprove={noApprove} autoList={accountVal?.Autos} serviceType={accountVal?.type} /> )}
            {accountVal && accountVal?.documentLog && <DocumentLogs documentlogs={accountVal?.documentLog} />}
            {!btnShow &&
                <div className='flex justify-center w-full'>
                    <Button
                        onClick={() => { navigate('/dashboard/vendors/account/autoView'); }}
                        className={`my-6 px-8 ${ColorStyles.backButton}`}
                    >
                        Back
                    </Button>
                    <Button
                        onClick={() => { navigate(`/dashboard/vendors/account/autoView/details/edit/${id}`) }}
                        className={`my-6 px-8 border-2 rounded-xl ${ColorStyles.editButton}`}
                    >
                        Edit
                    </Button>
                </div>
            }
        </>
    );
};

export default AutoDetails;