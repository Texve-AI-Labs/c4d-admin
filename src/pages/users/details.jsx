import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles, PERMISSION_OPTIONS, USER_ROLE } from '@/utils/constants';
import { Button } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import Multiselect from 'multiselect-react-dropdown';

const UserDetails = () => {
    const [userVal, setUserVal] = useState({});
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            fetchItem(id);
        }
    }, [id]);
    const fetchItem = async (itemId) => {
        const data = await ApiRequestUtils.get(API_ROUTES.GET_USER_BY_ID + `${itemId}`);
        setUserVal(data.data);
    };
    const initialValues = {
        name: userVal?.name || "",
        phoneNumber: userVal?.phoneNumber || "",
        email: userVal?.email || "",
        password: "",
        permission: userVal?.permission || "",
        role: USER_ROLE.find(item => item.id === userVal?.role)?.role || '',
        status: userVal?.status == "ACTIVE" ? "ACTIVE" : "INACTIVE" || "",
    };
    return (
        <>
            <div className="p-4 mx-auto bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">User Details</h2>
                <Formik
                    initialValues={initialValues}
                    onSubmit={() => { }}
                    enableReinitialize={true}

                >
                    {({ values }) => (
                        <Form className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="text-sm font-medium text-gray-700">Name</label>
                                    <Field type="text" disabled name="name" className="p-2 w-full rounded-md border bg-gray-200 border-gray-300 shadow-sm" />
                                    <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
                                </div>

                                <div>
                                    <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <Field type="tel" disabled name="phoneNumber" className="p-2 w-full rounded-md border bg-gray-200 border-gray-300" maxLength={10} />
                                    <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                                    <Field type="text" disabled name="email" className="p-2 w-full rounded-md border bg-gray-200 border-gray-300" />
                                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="role" className="text-sm font-medium text-gray-700">Role</label>
                                    <Field type="text" name="role" className="p-2 w-full rounded-md border bg-gray-200 border-gray-300" disabled />
                                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="permission" className="text-sm font-medium text-gray-700">Permission</label>
                                    <Multiselect
                                        options={PERMISSION_OPTIONS}
                                        displayValue="name"
                                        selectedValues={PERMISSION_OPTIONS.filter(option => values.permission.includes(option.id))}
                                        placeholder=""
                                        className="w-full rounded-md border-gray-300 border bg-gray-200"
                                        disable={true}
                                        style={{
                                            chips: {
                                                backgroundColor: '#3b82f6',
                                                color: 'white',
                                            },
                                        }}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="status" className="text-sm font-medium text-gray-700">Status</label>
                                    <Field type="text" name="status" className="p-2 w-full rounded-md border bg-gray-200 border-gray-300" disabled />
                                    <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                                </div>
                            </div>

                        </Form>
                    )}
                </Formik>
            </div>
            <div className='flex justify-center w-full gap-2'>
                <Button
                    onClick={() => { navigate('/dashboard/users'); }}
                    className={`my-6 px-8 ${ColorStyles.backButton}`}
                >
                    Back
                </Button>
                <Button
                     onClick={() => navigate(`/dashboard/users/edit/${id}`)}
                    className={`my-6 px-8 ${ColorStyles.editButton}`}
                >
                    Edit
                </Button>
            </div>
        </>
    );
};

export default UserDetails;