import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, USER_ROLE, ROLE_PERMISSIONS, PERMISSION_OPTIONS,STATUS_OPTIONS, expandPermissionsByGroup, applyPermissionSelection } from '@/utils/constants';
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from '@material-tailwind/react';
import { useNavigate, useParams } from 'react-router-dom';
import Multiselect from 'multiselect-react-dropdown';
import Select from 'react-select';
import { EDIT_USER_SCHEMA } from '@/utils/validations';
import PasswordStrengthMessage from '@/components/PasswordStrengthMessage';

const UserEdit = () => {
    const [userVal, setUserVal] = useState({});
    const [duplicateModalMessage, setDuplicateModalMessage] = useState('');
    const [role, setRole] = useState('');
    const { id } = useParams();
    const navigate = useNavigate();
    
    // const initialRoleValue = USER_ROLE.find(user => user.id === role);

    const handleRoleChange = (selectedOption, setFieldValue, setFieldTouched) => {
        const selectedRole = selectedOption?.value || '';
        setRole(selectedRole);
        setFieldValue('role', selectedRole);
        setFieldTouched('role', true);

       
        setFieldValue('permission', expandPermissionsByGroup(ROLE_PERMISSIONS[selectedRole] || []));
        setFieldTouched('permission', true);
    };

    useEffect(() => {
        if (id) {
            fetchItem(id);
        }
    }, [id]);

    useEffect(() => {
        if (userVal.role) {
            setRole(userVal.role);
        }
    }, [userVal.role]); 
    
    const fetchItem = async (itemId) => {
        try {
            const data = await ApiRequestUtils.get(`${API_ROUTES.GET_USER_BY_ID}${itemId}`);
            // console.log('Fetched User Data:', data.data);
            const permissionIds = data.data.permission.map((permName) => {
                const matchingOption = PERMISSION_OPTIONS.find( (option) => option.name === permName || option.id === permName );
                return matchingOption ? matchingOption.id : null;
            }).filter(Boolean);
            setUserVal({ ...data.data, permission: permissionIds });
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    const initialValues = {
        name: userVal?.name || "",
        phoneNumber: userVal?.phoneNumber || "",
        email: userVal?.email || "",
        password: "",
        permission: Array.isArray(userVal?.permission) ? userVal.permission : [],
        role: userVal?.role || "",
        status: userVal?.status || "",
    };

    const onSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            const userData = {
                name: values.name.trim(),
                phoneNumber: values.phoneNumber,
                email: values.email,
                permission: values.permission, // permisions need to be updated 
                role: role,
                status: values.status,
                userId: id
            };

            if (values.password) {
                userData.password = values.password; // Pasword not updating backend Issue
            }
                
            const data = await ApiRequestUtils.update(API_ROUTES.UPDATE_USER, userData);
            
            if (!data?.success && data?.code === 203) {
                setDuplicateModalMessage(data?.message || 'check the User already exists or not');
                setSubmitting(false);
                return;
            } else {
                // setAlert({ show: true, message: isEditMode ? 'User updated successfully!' : 'User added successfully!', color: 'green' });
                // setTimeout(() => {
                //     resetForm();
                navigate('/dashboard/users', {
                    state: {
                        userAdded: false,
                        userUpdated: true,
                        userName: values.name.trim()
                    }
                });
            }

        } catch (error) {
            console.error('Error updating user :', error);
            // Handle error (e.g., show an error message)
        }
        setSubmitting(false);
    };

    return (
        <div className="p-4 mx-auto bg-white rounded-xl shadow-md w-full">
            <Dialog open={Boolean(duplicateModalMessage)} handler={() => setDuplicateModalMessage('')} size="xs">
                <DialogHeader>Alert !</DialogHeader>
                <DialogBody divider>
                    <p className="text-sm text-gray-700">{duplicateModalMessage}</p>
                </DialogBody>
                <DialogFooter>
                    <Button color="blue" onClick={() => setDuplicateModalMessage('')}>
                        OK
                    </Button>
                </DialogFooter>
            </Dialog>
            <h2 className="text-2xl font-bold mb-4">Edit User</h2>
            <Formik
                initialValues={initialValues}
                validationSchema={EDIT_USER_SCHEMA}
                onSubmit={onSubmit}
                enableReinitialize={true}
            >
                {({ handleSubmit, values, isSubmitting, setFieldValue, setFieldTouched, errors }) => (
                    <Form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">

                            <div>
                                <label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name <span className="text-red-600">*</span></label>
                                <Field type="text" name="name" className="border-2 p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
                            </div>

                            <div>
                                <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number <span className="text-red-600">*</span></label>
                                <Field type="tel" name="phoneNumber" className="border-2 p-2 w-full rounded-md border-gray-300" maxLength={10} />
                                <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
                            </div>

                            <div>
                                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email <span className="text-red-600">*</span></label>
                                <Field type="text" name="email" className="border-2 p-2 w-full rounded-md border-gray-300" />
                                <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                                <Field
                                    type="password"
                                    name="password"
                                    placeholder="Leave blank to keep existing password"
                                    className="border-2 p-2 w-full rounded-md border-gray-300"
                                    onChange={(event) => {
                                        setFieldTouched('password', true, false);
                                        setFieldValue('password', event.target.value);
                                    }}
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave blank to keep existing password.</p>
                                <PasswordStrengthMessage password={values.password} />
                                <ErrorMessage name="password" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="role" className="text-sm font-medium text-gray-700">Role <span className="text-red-600">*</span></label>
                                <Select
                                    id="role"
                                    options={USER_ROLE.map((user) => ({
                                        value: user.id,
                                        label: user.role,
                                    }))}
                                    value={USER_ROLE.find(user => user.id === role) 
                                        ? { value: role, label: USER_ROLE.find(user => user.id === role).role } 
                                        : null}
                                    onChange={(val) => handleRoleChange(val,setFieldValue,setFieldTouched)}
                                    onBlur={() => setFieldTouched('role', true)}
                                    placeholder="Select Role"
                                    className="w-full"
                                    classNamePrefix="react-select"
                                />
                                <ErrorMessage name="role" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="permission" className="text-sm font-medium mt-4">Permission <span className="text-red-600">*</span></label>
                                <Multiselect
                                    options={PERMISSION_OPTIONS}
                                    displayValue="name"
                                    selectedValues={PERMISSION_OPTIONS.filter((option) => values.permission.includes(option.id) )}
                                    placeholder="Select options"
                                    className="w-full rounded-md border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                                    showCheckbox={true}
                                    onSelect={(selectedList, selectedItem) => {
                                        setFieldTouched('permission', true);
                                        setFieldValue(
                                            'permission',
                                            applyPermissionSelection(
                                                selectedList.map((item) => item.id),
                                                selectedItem?.id,
                                                'select'
                                            )
                                        );
                                    }}
                                    onRemove={(selectedList, removedItem) => {
                                        setFieldTouched('permission', true);
                                        setFieldValue(
                                            'permission',
                                            applyPermissionSelection(
                                                selectedList.map((item) => item.id),
                                                removedItem?.id,
                                                'remove'
                                            )
                                        );
                                    }}
                                    style={{
                                        multiselectContainer: {
                                        backgroundColor: 'white',
                                        borderRadius: '0.375rem',
                                        },
                                        searchBox: {
                                        border: 'none',
                                        padding: '8px',
                                        fontSize: '14px',
                                        color: '#1f2937',
                                        },
                                        option: {
                                        color: '#1f2937',
                                        backgroundColor: 'white',
                                        padding: '8px 12px',
                                        },
                                        optionContainer: {
                                        backgroundColor: 'white',
                                        borderRadius: '0.375rem',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        },
                                        chips: {
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        borderRadius: '0.375rem',
                                        margin: '2px',
                                        padding: '4px 8px',
                                        },
                                        highlightOption: {
                                        backgroundColor: '#e5e7eb',
                                        },
                                    }}
                                />
                                <ErrorMessage name="permission" component="div" className="text-red-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="status" className="text-sm font-medium text-gray-700">Status <span className="text-red-600">*</span></label>
                                <Select
                                    id="status"
                                    options={STATUS_OPTIONS}
                                    value={STATUS_OPTIONS.find(option => option.value === values.status) || null}
                                    onChange={(selectedOption) => {
                                        setFieldValue('status', selectedOption.value);
                                        setFieldTouched('status', true);
                                    }}
                                    onBlur={() => setFieldTouched('status', true)}
                                    placeholder="Select Status"
                                    className="w-full"
                                    classNamePrefix="react-select"
                                />
                                <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                            </div>
                        </div>
                        <div className='flex flex-row'>
                            <Button
                                type="button"
                                fullWidth
                                onClick={() => { navigate('/dashboard/users'); }}
                                className='my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl'
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                fullWidth
                                color="blue"
                                disabled={isSubmitting}
                                className='my-6 mx-2'
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

export default UserEdit;
