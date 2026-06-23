import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, USER_ROLE, ROLE_PERMISSIONS, PERMISSION_OPTIONS, STATUS_OPTIONS, ColorStyles, expandPermissionsByGroup, applyPermissionSelection } from '@/utils/constants';
import { Alert, Button } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import Multiselect from 'multiselect-react-dropdown';
import Select from 'react-select';
import { ADD_USER_SCHEMA } from '@/utils/validations';

const UserAdd = () => {
    const [userVal, setUserVal] = useState({});
    const [alert, setAlert] = useState(false);
    const [role, setRole] = useState('');
    const { id } = useParams();
    const navigate = useNavigate();
    
    // Handle role selection
    const handleRoleChange = (selectedOption, setFieldValue) => {
        const selectedRole = selectedOption?.value || '';
        setFieldValue('role', selectedRole);
        setFieldValue('permission', expandPermissionsByGroup(ROLE_PERMISSIONS[selectedRole] || []));
        setRole(selectedRole);
    };
    const initialValues = {
        name: "",
        phoneNumber: "",
        email: "",
        password: "",
        permission: null,
        role: "",
        status:"",
    };

    const onSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            const userData = {
                name: values.name,
                phoneNumber: values.phoneNumber,
                email: values.email,
                permission: values.permission,
                role: role,
                password: values.password,
                status: values.status
            };
                
            const data = await ApiRequestUtils.post(API_ROUTES.ADD_USER, userData);
            
            if (!data?.success && data?.code === 203) {
                // setAlert({ message: 'User already exists!', color: 'red' });
                // setTimeout(() => setAlert(null), 5000);
                // resetForm();
                navigate('/dashboard/users',{
                    state:{
                        userExist: true,
                    }
                })
            } else {
                // setAlert({ show: true, message: isEditMode ? 'User updated successfully!' : 'User added successfully!', color: 'green' });
                // setTimeout(() => {
                //     resetForm();
                navigate('/dashboard/users', {
                    state: {
                        userAdded: true,
                        userUpdated: false,
                        userName: values.name
                    }
                });
            }

        } catch (error) {
            console.error('Error creating user and car:', error);
            // Handle error (e.g., show an error message)
        }
        setSubmitting(false);
    };

    return (
        <div className="p-4 mx-auto bg-white rounded-xl shadow-md w-full">
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
            <h2 className="text-2xl font-bold mb-4">Add New User</h2>
            <Formik
                initialValues={initialValues}
                validationSchema={ADD_USER_SCHEMA}
                onSubmit={onSubmit}
                enableReinitialize={true}

            >
                {({ handleSubmit, values, dirty, isValid, setFieldValue, errors }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">

                            <div>
                                <label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</label>
                                <Field type="text" name="name" className="p-2 w-full rounded-md border-gray-300 shadow-sm border-2" />
                                <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
                            </div>

                            <div>
                                <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                                <Field type="tel" name="phoneNumber" className="border-2 p-2 w-full rounded-md border-gray-300" maxLength={10} />
                                <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                                <Field type="text" name="email" className="border-2 p-2 w-full rounded-md border-gray-300" />
                                <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                                <Field type="text" name="password" className="border-2 p-2 w-full rounded-md border-gray-300" />
                                <ErrorMessage name="password" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="role" className="text-sm font-medium text-gray-700">Role</label>
                                <Select
                                    id="role"
                                    options={USER_ROLE.map((user) => ({
                                        value: user.id,
                                        label: user.role,
                                    }))}
                                    onChange={(val) => handleRoleChange(val,setFieldValue)}
                                    placeholder="Select Role"
                                    className="w-full"
                                    classNamePrefix="react-select"
                                />
                            </div>
                            <div>
                                <label htmlFor="permission" className="text-sm font-medium text-gray-700 mt-4">Permission</label>
                                <Multiselect
                                    options={PERMISSION_OPTIONS}
                                    displayValue="name"
                                    selectedValues={PERMISSION_OPTIONS.filter((option) =>
                                        Array.isArray(values.permission) && values.permission.includes(option.id)
                                    )}
                                    placeholder="Select options"
                                    className="w-full rounded-md border-gray-300"
                                    showCheckbox={true}
                                    style={{
                                        chips: {
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                        },
                                    }}
                                    onSelect={(selectedList, selectedItem) => {
                                        setFieldValue('permission',applyPermissionSelection(
                                                selectedList.map((item) => item.id),
                                                selectedItem?.id,
                                                'select'
                                            )
                                        );
                                    }}
                                    onRemove={(selectedList, removedItem) => {
                                        setFieldValue(
                                            'permission',
                                            applyPermissionSelection(
                                                selectedList.map((item) => item.id),
                                                removedItem?.id,
                                                'remove'
                                            )
                                        );
                                    }}
                                />
                            </div>
                            <div>
                                <label htmlFor="status" className="text-sm font-medium text-gray-700">Status</label>
                                <Select
                                    id="status"
                                    options={STATUS_OPTIONS}
                                    onChange={(selectedOption) => setFieldValue('status', selectedOption.value)}
                                    placeholder="Select Status"
                                    className="w-full"
                                    classNamePrefix="react-select"
                                />
                                <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                            </div>
                        </div>
                        <div className='flex flex-row'>
                            <Button
                                fullWidth
                                onClick={() => { navigate('/dashboard/users'); }}
                                className='my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl'
                            >
                                Cancel
                            </Button>
                            <Button
                                fullWidth
                                color="black"
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

export default UserAdd;