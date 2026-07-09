import React, { useEffect, useRef, useState } from 'react';
import { Formik, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles, KYC_PROCESS } from '@/utils/constants';
import { useParams, useNavigate } from 'react-router-dom';
import Multiselect from 'multiselect-react-dropdown';
import PriceTable from '@/components/PriceTable';
import { Button, Typography } from '@material-tailwind/react';
// import WalletDetails from '@/components/WalletDetails';
import PrintDriverDetails from '@/components/PrintDriverDetails';
import DocumentsList from '@/components/DocumentsList';
import DocumentLogs from '@/components/DocumentLogs';
import SubscriptionLog from '@/components/SubscriptionLog';
import DriverWalletLog from '@/components/DriverWalletLog';
import DriverAccountBookingNotes from '@/components/DriverAccountBookingNotes';
import ActingDriverBookingNotes from '@/components/ActingDriverBookingNotes';

const DriverDetails = ({ btnShow = false, noApprove = false }) => {
    // const [enablePrint, setEnablePrint] = useState(false);
    const printRef = useRef();

    const handlePrintClick = () => {
        //     setEnablePrint(true);
        if (printRef.current) {
            printRef.current.print();  // Trigger the print action
        }
    };

    const navigate = useNavigate();
    const [driver, setDriver] = useState({});
    const [packageDetails, setPackageDetails] = useState([]);
    const { id } = useParams();

    const getPackageListDetails = async () => {
        const data = await ApiRequestUtils.get(API_ROUTES.PACKAGES_LIST);
        if (data?.success) {
            const packageData = data?.data.map(option => {
                const suffix = option.type === 'Local' ? 'hr' : option.type === 'Outstation' ? 'd' : '';
                return {
                    ...option,
                    period: `${option.period} ${suffix}`, // Append 'hr' or 'd'
                };
            });
            const intercityPackage = packageData.filter(val => val.type === 'Local');
            const outstationPackage = packageData.filter(val => { return val.type === 'Outstation' && val.period === '1 d' });
            const carWashPackage = packageData.filter(val => val.type === 'CarWash');
            setPackageDetails([...intercityPackage, ...outstationPackage, ...carWashPackage]);
        }
    };
    useEffect(() => {
        if (id) {
            getPackageListDetails();
            fetchItem(id);
        }
    }, [id]);
    const fetchItem = async (itemId) => {
        const data = await ApiRequestUtils.get(API_ROUTES.GET_DRIVERS_ADMIN + `${itemId}`);
        setDriver(data?.data);
    };
    const initialValues = {
        salutation: driver?.result?.salutation || "",
        firstName: driver?.result?.firstName || "",
        fatherName: driver?.result?.fatherName || "",
        dateOfBirth: driver?.result?.dob || "",
        age: driver?.result?.age || "",
        status: driver?.result?.status || "",
        // driverExperience: driver?.result?.driverExperience || "",
        phoneNumber: driver?.result?.phoneNumber ? driver?.result?.phoneNumber.replace(/^(\+91)/, '') : "",
        license: driver?.result?.license || "",
        licenseType: driver?.result?.licenseType || "",
        licenseExpiryDate: driver?.result?.licenseExpiry || "",
        address: driver?.result?.address || "",
        streetName: driver?.result?.street || "",
        thaluk: driver?.result?.thaluk || "",
        district: driver?.result?.district || "",
        state: driver?.result?.state || "",
        pinCode: driver?.result?.pincode || "",
        source: driver?.result?.source || "",
        serviceType: driver?.result?.serviceType || "",
        reference1: driver?.result?.reference1 || "",
        phoneNumber1: driver?.result?.reference1_phone ? driver?.result?.reference1_phone.replace(/^(\+91)/, '') : "",
        reference2: driver?.result?.reference2 || "",
        phoneNumber2: driver?.result?.reference2_phone ? driver?.result?.reference2_phone.replace(/^(\+91)/, '') : "",
        transmissionType: driver?.result?.transmissionType || "",
        packages: driver?.result?.packages || ""
    };

    const getDocumentByType = (type) => {
        return driver?.result?.Proofs?.find(proof => proof.type === type)?.image1 || "";
    }

    const handleOpenDocument = (type) => {
        const documentUrl = getDocumentByType(type);
        window.open(documentUrl, "_blank", "noopener,noreferrer");
    };

    return (
        <>
            <div className="p-4 mx-auto bg-white rounded-xl shadow-md sm:p-8">
                <div className="flex flex-row justify-between pr-5">
                    <h2 className="text-2xl font-bold mb-4">Driver Details</h2>
                    <img src="/img/printing.png" height={30} width={30} alt="" onClick={handlePrintClick} />
                </div>
                <Formik
                    initialValues={initialValues}
                    enableReinitialize={true}
                    onSubmit={() => { }}
                >
                    {({ values }) => (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="salutation" className="text-sm font-medium text-gray-700">Salutation</label>
                                        <Field as="select" name="salutation" disabled className="p-2 w-full rounded-md border border-gray-300 bg-gray-200">
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
                                        <Field type="text" name="firstName" disabled className="p-2 w-full rounded-md border border-gray-300 shadow-sm bg-gray-200" />
                                        <ErrorMessage name="firstName" component="div" className="text-red-500 text-sm my-1" />
                                    </div>

                                    <div>
                                        <label htmlFor="fatherName" className="text-sm font-medium text-gray-700">Father / Guardian Name</label>
                                        <Field type="text" name="fatherName" disabled className="p-2 w-full rounded-md border border-gray-300 shadow-sm bg-gray-200" />
                                        <ErrorMessage name="fatherName" component="div" className="text-red-500 text-sm my-1" />
                                    </div>

                                    <div>
                                        <label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">Date of Birth</label>
                                        <Field type="date" name="dateOfBirth" disabled className="p-2 w-full rounded-md border border-gray-300 shadow-sm bg-gray-200" />
                                        <ErrorMessage name="dateOfBirth" component="div" className="text-red-500 text-sm" />
                                    </div>

                                    <div>
                                        <label htmlFor="age" className="text-sm font-medium text-gray-700">Age</label>
                                        <Field type="text" name="age" disabled className="p-2 w-full rounded-md border border-gray-300 shadow-sm bg-gray-200" />
                                        <ErrorMessage name="age" component="div" className="text-red-500 text-sm my-1" />
                                    </div>

                                     <div>
                                        <label htmlFor="status" className="text-sm font-medium text-gray-700">Driver Status</label>
                                        <Field type="text" name="status" disabled className="p-2 w-full rounded-md border border-gray-300 shadow-sm bg-gray-200" />
                                        <ErrorMessage name="status" component="div" className="text-red-500 text-sm my-1" />
                                        {values.status === 'BLOCKED' && driver?.result?.blockedReason && (
        <div className="mt-2 p-2 bg-gray-100 rounded-md">
            <Typography variant="small" className="font-semibold">Block Reason:</Typography>
            <Typography variant="small">{driver?.result?.blockedReason}</Typography>
        </div>
    )}
                                    </div>
                                    

                                    {/* <div>
                                            <label htmlFor="driverExperience" className="text-sm font-medium text-gray-700">Driver Experience</label>
                                            <Field type="text" name="driverExperience" disabled className="p-2 w-full rounded-md border border-gray-300 bg-gray-200"/>
                                            <ErrorMessage name="driverExperience" component="div" className="text-red-500 text-sm" />
                                        </div> */}

                                    <div>
                                        <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                                        <Field type="tel" name="phoneNumber" disabled className="p-2 w-full rounded-md border border-gray-300 bg-gray-200" maxLength={10} />
                                        <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
                                    </div>

                                    <div>
                                        <label htmlFor="license" className="text-sm font-medium text-gray-700">License Number</label>
                                        <Field type="text" name="license" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" maxLength={16} />
                                        <ErrorMessage name="license" component="div" className="text-red-500 text-sm" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">License Type</p>
                                        <div className="space-x-4">
                                            <label className="inline-flex items-center">
                                                <Field type="radio" name="licenseType" disabled value="type1" className="form-radio" />
                                                <span className="ml-2">White Board</span>
                                            </label>
                                            <label className="inline-flex items-center">
                                                <Field type="radio" name="licenseType" disabled value="type2" className="form-radio" />
                                                <span className="ml-2">Yellow Board</span>
                                            </label>
                                        </div>
                                        <ErrorMessage name="mode" component="div" className="text-red-500 text-sm" />
                                    </div>

                                    <div>
                                        <label htmlFor="licenseExpiryDate" className="text-sm font-medium text-gray-700">License Expiry Date</label>
                                        <Field type="date" name="licenseExpiryDate" disabled className="p-2 w-full rounded-xl border border-gray-300 bg-gray-200" />
                                        <ErrorMessage name="licenseExpiryDate" component="div" className="text-red-500 text-sm" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Preference</p>
                                        <div className="space-x-4">
                                            <label className="inline-flex items-center">
                                                <Field type="radio" disabled name="transmissionType" value="Automatic" className="form-radio" />
                                                <span className="ml-2">Automatic</span>
                                            </label>
                                            <label className="inline-flex items-center">
                                                <Field type="radio" disabled name="transmissionType" value="Manual" className="form-radio" />
                                                <span className="ml-2">Manual</span>
                                            </label>
                                        </div>
                                        <ErrorMessage name="transmissionType" component="div" className="text-red-500 text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="source" className="text-sm font-medium text-gray-700">Source</label>
                                        <Field as="select" name="source" disabled className="p-2 w-full rounded-md border border-gray-300 bg-gray-200">
                                            <option value="">Select Source</option>
                                            <option value="Walk In">Walk In</option>
                                            <option value="Mobile App">Mobile App</option>
                                            <option value="Website">Website</option>
                                            <option value="Call">Call</option>
                                        </Field>
                                        <ErrorMessage name="source" component="div" className="text-red-500 text-sm" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Service Type</p>
                                        <div className="space-x-4">
                                            <label className="inline-flex items-center">
                                                <Field
                                                    type="radio"
                                                    name="serviceType"
                                                    value="DRIVER"
                                                    className="form-radio"
                                                    disabled
                                                />
                                                <span className="ml-2">Acting Driver</span>
                                            </label>
                                            <label className="inline-flex items-center">
                                                <Field
                                                    type="radio"
                                                    name="serviceType"
                                                    value="DRIVER_WITH_CAB"
                                                    className="form-radio"
                                                    disabled
                                                />
                                                <span className="ml-2">Driver With Vehicle</span>
                                            </label>
                                            <label className="inline-flex items-center">
                                                <Field
                                                    type="radio"
                                                    name="serviceType"
                                                    value="OWNER"
                                                    className="form-radio"
                                                    disabled
                                                />
                                                <span className="ml-2">OWNER</span>
                                            </label>
                                        </div>
                                        <ErrorMessage
                                            name="serviceType"
                                            component="div"
                                            className="text-red-500 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="address" className="text-sm font-medium text-gray-700">Current Address</label>
                                        <Field type="text" name="address" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                        <ErrorMessage name="address" component="div" className="text-red-500 text-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-800 my-2">Permanent Address</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="streetName" className="text-sm font-medium text-gray-700">Street Name</label>
                                            <Field type="text" name="streetName" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                            <ErrorMessage name="streetName" component="div" className="text-red-500 text-sm my-1" />
                                        </div>
                                        <div>
                                            <label htmlFor="thaluk" className="text-sm font-medium text-gray-700">Thaluk</label>
                                            <Field type="text" name="thaluk" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                            <ErrorMessage name="thaluk" component="div" className="text-red-500 text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="district" className="text-sm font-medium text-gray-700">District</label>
                                            <Field type="text" name="district" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                            <ErrorMessage name="district" component="div" className="text-red-500 text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="state" className="text-sm font-medium text-gray-700">State</label>
                                            <Field type="text" name="state" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                            <ErrorMessage name="state" component="div" className="text-red-500 text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="pinCode" className="text-sm font-medium text-gray-700">Pincode</label>
                                            <Field type="text" name="pinCode" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                            <ErrorMessage name="pinCode" component="div" className="text-red-500 text-sm my-1" />
                                        </div>
                                        <div>
                                            <label htmlFor="reference1" className="text-sm font-medium text-gray-700">Reference 1</label>
                                            <Field type="text" name="reference1" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                            <ErrorMessage name="reference1" component="div" className="text-red-500 text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="phoneNumber1" className="text-sm font-medium text-gray-700">Phone Number</label>
                                            <Field type="tel" name="phoneNumber1" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" maxLength={10} />
                                            <ErrorMessage name="phoneNumber1" component="div" className="text-red-500 text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="reference2" className="text-sm font-medium text-gray-700">Reference 2</label>
                                            <Field type="text" name="reference2" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                            <ErrorMessage name="reference2" component="div" className="text-red-500 text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="phoneNumber2" className="text-sm font-medium text-gray-700">Phone Number</label>
                                            <Field type="tel" name="phoneNumber2" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" maxLength={10} />
                                            <ErrorMessage name="phoneNumber2" component="div" className="text-red-500 text-sm" />
                                        </div>
                                        {/* <div>
                                            <label htmlFor="wallet" className="text-sm font-medium text-gray-700">Wallet</label>
                                            <Field type="number" name="wallet" disabled className="p-2 w-full rounded-md border-gray-300 border bg-gray-200" />
                                            <ErrorMessage name="wallet" component="div" className="text-red-500 text-sm" />
                                        </div> */}
                                        {/* <div>
                                            <label htmlFor="packages" className="text-sm font-medium text-gray-700">Package</label>
                                            <Multiselect
                                                options={packageDetails}
                                                displayValue="period"
                                                selectedValues={packageDetails.filter(option => values.packages.includes(option.id))}
                                                placeholder=""
                                                className="w-full rounded-xl border-gray-300 bg-gray-200 border"
                                                disable={true}
                                                style={{
                                                    chips: {
                                                        backgroundColor: '#3b82f6',
                                                        color: 'white',
                                                    },
                                                }}
                                            />
                                        </div> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Formik>
            </div>
            {/* {driver?.price && <PriceTable type={"driverId"} id={id} packages={packageDetails} selectedPackages={driver?.result?.packages} />} */}
            {/* {driver?.wallet && <WalletDetails wallet={driver?.wallet} onFetch={() => fetchItem(id)} />} */}
            {/* <PrintDriverDetails ref={printRef} packages={packageDetails} driverId={id} onFetch={() => fetchItem(id)} /> */}
            
            <ActingDriverBookingNotes driverId={id} />
            <DriverWalletLog driverId={id} />
            {driver && driver?.creditLog && <SubscriptionLog subscriptionlog={driver?.creditLog} />}
            {driver && driver?.result?.id && <DocumentsList id={driver?.result?.id} type={'driver'} noApprove={noApprove} />}
            {driver && driver?.documentLog && <DocumentLogs documentlogs={driver?.documentLog} />}
            {!btnShow && <div className='flex w-full'>
                <Button
                    fullWidth
                    onClick={() => navigate('/dashboard/vendors/account/drivers')}
                    className={`my-6 mx-2  ${ColorStyles.backButton}`}
                >
                    Back
                </Button>
                <Button
                    fullWidth
                    onClick={() => navigate(`/dashboard/vendors/account/drivers/edit/${id}`)}
                    className={`my-6 mx-2 ${ColorStyles.editButton}`}>
                    Edit
                </Button>
            </div>}
        </>
    );
};

export default DriverDetails;

{/* <div>
    <label htmlFor="status" className="text-sm font-medium text-gray-700">Driver Status</label>
    <Field type="text" name="status" disabled className="p-2 w-full rounded-md border border-gray-300 shadow-sm bg-gray-200" />
    <ErrorMessage name="status" component="div" className="text-red-500 text-sm my-1" />
    
    {/* Add this block to show the blocked reason */}
//     {values.status === 'BLOCKED' && driver?.result?.blockedReason && (
//         <div className="mt-2 p-2 bg-gray-100 rounded-md">
//             <Typography variant="small" className="font-semibold">Block Reason:</Typography>
//             <Typography variant="small">{driver?.result?.blockedReason}</Typography>
//         </div>
//     )}
// </div> */}