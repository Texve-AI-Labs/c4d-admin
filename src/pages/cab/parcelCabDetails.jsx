import React, { useEffect, useRef, useState } from 'react';
import { Formik, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@material-tailwind/react';
import DriverBookingNotes from '@/components/DriverBookingNotes';

const ParcelCabDetails = ({ btnShow = false, noApprove = false }) => {
    const navigate = useNavigate();
    const [bike, setBike] = useState({});
    const { id } = useParams();

    useEffect(() => {
        if (id) {
            fetchItem(id);
        }
    }, [id]);
    const fetchItem = async (itemId) => {
        const data = await ApiRequestUtils.get(API_ROUTES.GET_PARCEL_CAB_BY_ID + `${itemId}`);
        setBike(data?.data);
    };
    const initialValues = {
        accountId: bike?.result?.Account?.id || "",
        name: bike?.result?.name || "",
        ownerName: bike?.result?.Account ? bike?.result?.Account?.name : "",
        vehicleNumber: bike?.result?.vehicleNumber || "",
        address: bike?.result?.curAddress || "",
        status: bike?.result?.status || "",
        insurance: bike?.result?.insurance || "",
        vehicleType: "BIKE",
        seater: bike?.result?.seater || "",
        modelYear: bike?.result?.modelYear || "",
        serviceArea: bike?.result?.serviceArea || bike?.result?.subZone?.parent?.name || "",
        zone: bike?.result?.subZone?.name || bike?.result?.zoneDescription || bike?.result?.zone || "",
    };
    return (
        <>
            <div className="p-4 mx-auto">
                <div className="flex flex-row justify-between pr-5">
                    <h2 className="text-2xl font-bold mb-4">Bike Details</h2>
                </div>
                <Formik
                    initialValues={initialValues}
                    enableReinitialize={true}
                    onSubmit={() => { }}
                >
                    {({ values }) => (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="text-sm font-medium text-gray-700">Vehicle Name</label>
                                    <Field type="text" name="name" disabled className="p-2 w-full rounded-md border border-gray-300 shadow-sm bg-gray-200" />
                                    <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
                                </div>
                                <div>
                                    <label htmlFor="ownerName" className="text-sm font-medium text-gray-700">Owner Name</label>
                                    <Field type="text" name="ownerName" disabled className="p-2 w-full rounded-md border border-gray-300 shadow-sm bg-gray-200" />
                                    <ErrorMessage name="ownerName" component="div" className="text-red-500 text-sm my-1" />
                                </div>
                                <div>
                                    <label htmlFor="vehicleNumber" className="text-sm font-medium text-gray-700">Bike Number</label>
                                    <Field type="text" name="vehicleNumber" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" maxLength={10} />
                                    <ErrorMessage name="vehicleNumber" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="address" className="text-sm font-medium text-gray-700">Address</label>
                                    <Field type="text" name="address" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                    <ErrorMessage name="address" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="insurance" className="text-sm font-medium text-gray-700">Insurance Expiry Date</label>
                                    <Field type="text" name="insurance" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                    <ErrorMessage name="insurance" component="div" className="text-red-500 text-sm" />
                                </div>

                                <div className='hidden'>
                                    <label htmlFor="vehicleType" className="text-sm font-medium text-gray-700">Bike Type</label>
                                    <Field type="text" name="vehicleType" disabled className="p-2 w-full rounded-md border-gray-300" maxLength={10} />
                                    <ErrorMessage name="vehicleType" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="seater" className="text-sm font-medium text-gray-700">Seater</label>
                                    <Field type="text" name="seater" disabled className="p-2 w-full rounded-md border-gray-300" maxLength={10} />
                                    <ErrorMessage name="seater" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="modelYear" className="text-sm font-medium text-gray-700">Year of Model</label>
                                    <Field type="text" name="modelYear" disabled className="p-2 w-full rounded-md border-gray-300" maxLength={10} />
                                    <ErrorMessage name="modelYear" component="div" className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="status" className="text-sm font-medium text-gray-700">Status</label>
                                    <Field type="text" name="status" disabled className="p-2 w-full rounded-md border border-gray-300 shadow-sm bg-gray-200" />
                                    <ErrorMessage name="status" component="div" className="text-red-500 text-sm my-1" />
                                </div>
                                <div>
                                    <label htmlFor="serviceArea" className="text-sm font-medium text-gray-700">Service Area</label>
                                    <Field type="text" name="serviceArea" disabled className="p-2 w-full rounded-md border border-gray-300 shadow-sm bg-gray-200" />
                                    <ErrorMessage name="serviceArea" component="div" className="text-red-500 text-sm my-1" />
                                </div>
                                <div>
                                    <label htmlFor="zone" className="text-sm font-medium text-gray-700">Zone</label>
                                    <Field type="text" name="zone" disabled className="p-2 w-full rounded-md border border-gray-300 shadow-sm bg-gray-200" />
                                    <ErrorMessage name="zone" component="div" className="text-red-500 text-sm my-1" />
                                </div>
                            </div>
                        </div>
                    )}
                </Formik>
            </div>
            <DriverBookingNotes cabId={id} />            
            
            {!btnShow && <div className='flex justify-center w-full'>
                <Button
                    onClick={() => navigate(`/dashboard/vendors/account/parcel/details/${bike?.result?.Account?.id}`)}
                    className={`my-6 px-8 ${ColorStyles.backButton}`}
                >
                    Back
                </Button>
                <Button
                    onClick={() => navigate(`/dashboard/vendors/account/parcel/allVehicles/details/edit/${id}`)}
                    className='my-6 px-8 text-white border-2 rounded-xl'
                >
                    Edit
                </Button>
            </div>}
        </>
    );
};

export default ParcelCabDetails;
