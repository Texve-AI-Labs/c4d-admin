import React, { useState, useEffect } from 'react';
import { Formik, Field, ErrorMessage } from 'formik';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { Button } from '@material-tailwind/react';
import { useNavigate, useParams } from "react-router-dom";
import { StarIcon } from '@heroicons/react/24/solid';
import CustomerWalletLog from '@/components/CustomerWalletLog';
import CustomerBookingNotes from '@/components/CustomerBookingNotes';
import CustomerCallsLog from '@/components/CustomerCallsLog';
import moment from "moment";

const CustomerDetails = () => {
    const navigate = useNavigate();
    const [driverVal, setDriverVal] = useState({});
    const { id } = useParams();
    const [notes, setNotes] = useState([]);
    const [bookingHistory, setBookingHistory] = useState([]);
    const [bookingHistoryPagination, setBookingHistoryPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 15,
    });
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { key: 'profile', label: 'Profile' },
        { key: 'feedback', label: 'Feedback Details' },
        { key: 'history', label: 'Booking History' },
        { key: 'activity', label: 'Calls & Wallet' },
        { key: 'notes', label: 'Notes' },
    ];
    useEffect(() => {
        if (id) {
            fetchItem(id, 1);
        }
    }, [id]);
    const fetchItem = async (itemId, page = 1) => {
        const data = await ApiRequestUtils.getWithQueryParam(
            API_ROUTES.GET_CUSTOMER + `/${itemId}`,
            {
                page,
                limit: bookingHistoryPagination.itemsPerPage,
            }
        );
        if (!data) {
            return;
        }
        setDriverVal(data.data);
        if (Array.isArray(data.notes)) {
            setNotes(data.notes);
        }
        setBookingHistory(Array.isArray(data.bookingHistory) ? data.bookingHistory : []);
        const responsePagination = data.bookingHistoryPagination || {};
        setBookingHistoryPagination((prev) => ({
            ...prev,
            currentPage: responsePagination.page || page,
            totalPages: responsePagination.totalPages || 1,
            totalItems: responsePagination.totalRecords || 0,
            itemsPerPage: responsePagination.limit || prev.itemsPerPage || 15,
        }));
    };
    const handleBookingHistoryPageChange = (page) => {
        if (page >= 1 && page <= bookingHistoryPagination.totalPages) {
            fetchItem(id, page);
        }
    };
    const renderBookingHistoryPageButtons = () => {
        const buttons = [];
        const maxVisible = 3;
        let startPage = Math.max(
            1,
            bookingHistoryPagination.currentPage - Math.floor(maxVisible / 2)
        );
        let endPage = Math.min(
            bookingHistoryPagination.totalPages,
            startPage + maxVisible - 1
        );

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <Button
                    key={i}
                    size="sm"
                    variant={i === bookingHistoryPagination.currentPage ? 'filled' : 'outlined'}
                    className={`mx-1 ${ColorStyles.bgColor} text-white`}
                    onClick={() => handleBookingHistoryPageChange(i)}
                >
                    {i}
                </Button>
            );
        }
        return buttons;
    };
    const initialValues = {
        salutation: driverVal?.salutation || '',
        firstName: driverVal?.firstName || '',
        phoneNumber: driverVal?.phoneNumber ? driverVal?.phoneNumber.replace(/^(\+91)/, '') : "",
        source: driverVal?.source || '',
        zone: driverVal?.zone || '',
        // sourceType: driverVal?.sourceType || '',

    };

    const getBookingStatusMeta = (trip = {}) => {
        const statusValue = trip?.tripStatus ?? trip?.status;
        const status = typeof statusValue === 'string' ? statusValue : '-';
        const followup = trip?.followup;

        const label =
            status === "CONFIRMED" ? "BOOKING CONFIRMED" :
                status === "BOOKING_ACCEPTED" ? "DRIVER_ACCEPTED" :
                    status === "ENDED" && trip?.tripStatus === true ? "Completed" :
                        status === "QUOTED" && followup === "FOLLOWUP" ? "Follow Up" :
                            status === "QUOTED" && followup === "FOLLOWUP_COMPLETED" ? "Call Back Completed" :
                                status;

        const className =
            status === "QUOTED" ? "bg-yellow-600 text-white" :
                status === "REQUEST_DRIVER" ? "bg-orange-600 text-white" :
                    status === "CONFIRMED" ? "bg-green-600 text-white" :
                        status === "BOOKING_ACCEPTED" ? "bg-green-600 text-white" :
                            status === "CUSTOMER_CANCELLED" ? "bg-gray-600 text-white" :
                                status === "ENDED" ? "bg-green-600 text-white" :
                                    status === "STARTED" ? "bg-primary text-white" :
                                        status === "INITIATED" ? "bg-gray-600 text-white" :
                                            status === "END_OTP" ? "bg-gray-600 text-white" :
                                                status === "DRIVER_ON_THE_WAY" ? "bg-primary text-white" :
                                                    status === "DRIVER_REACHED" ? "bg-yellow-600 text-white" :
                                                        status === "PAYMENT_REQUESTED" ? "bg-green-600 text-white" :
                                                            "bg-primary text-white";

        return { label, className };
    };

    const getPaymentStatusMeta = (paymentStatus = '-') => {
        const status = String(paymentStatus || '-').toUpperCase();
        const normalized = status.replace(/\s+/g, '_');

        const className =
            normalized === "PAID" || normalized === "SUCCESS" ? "bg-green-600 text-white" :
                normalized === "PENDING" ? "bg-yellow-600 text-white" :
                    normalized === "FAILED" ? "bg-red-600 text-white" :
                        normalized === "REFUNDED" ? "bg-blue-600 text-white" :
                            normalized === "CASH" ? "bg-primary text-white" :
                                "bg-gray-600 text-white";

        return { label: paymentStatus || '-', className };
    };


    return (
        <>
            <div className="p-4 bg-white rounded-lg shadow-md">

                <h2 className="text-2xl font-bold mb-4">Customer Details</h2>
                <div className="mb-4 border-b  border-gray-200">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <button
                                type="button"
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2 text-sm font-semibold rounded-t ${activeTab === tab.key
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <Formik
                    initialValues={initialValues}
                    onSubmit={() => { }}
                    enableReinitialize={true}
                >
                    {() => (
                        <div className="space-y-4">
                            {activeTab === 'profile' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="salutation" className="text-sm font-medium text-gray-700">Salutation</label>
                                        <Field as="select" disabled name="salutation" className="p-2 w-full rounded-md border bg-gray-200 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
                                            <option value="">Select salutation</option>
                                            <option value="Mr">Mr</option>
                                            <option value="Mrs">Mrs</option>
                                            <option value="Miss">Miss</option>
                                            <option value="Others">Others</option>
                                        </Field>
                                        <ErrorMessage name="salutation" component="div" className="text-red-500 text-sm" />
                                    </div>

                                    <div>
                                        <label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</label>
                                        <Field type="text" disabled name="firstName" className="p-2 w-full rounded-md border bg-gray-200 border-gray-300 shadow-sm" />
                                        <ErrorMessage name="firstName" component="div" className="text-red-500 text-sm my-1" />
                                    </div>
                                    <div>
                                        <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                                        <Field type="tel" disabled name="phoneNumber" className="p-2 w-full rounded-md bg-gray-200 border border-gray-300" maxLength={10} />
                                        <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
                                    </div>

                                    <div>
                                        <label htmlFor="source" className="text-sm font-medium text-gray-700">Source</label>
                                        <Field as="select" disabled name="source" className="p-2 w-full rounded-md border bg-gray-200 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
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
                                        <Field type="text" disabled name="zone" className="p-2 w-full rounded-md border bg-gray-200 border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50" />
                                    </div>
                                </div>
                            )}
                            {activeTab === 'feedback' && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-4">Feedback Details</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[900px] border bg-white py-3 text-sm">
                                            <thead className=" text-left bg-blue-600 text-white">
                                                <tr>
                                                    <th className="p-2 border">Trip ID</th>
                                                    <th className="p-2 border">End Date</th>
                                                    <th className="p-2 border">End Time</th>
                                                    <th className="p-2 border">Driver Name</th>
                                                    <th className="p-2 border">Rating</th>
                                                    <th className="p-2 border">Comment</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {driverVal?.Bookings?.length > 0 ? (
                                                    driverVal.Bookings.map((trip) => {
                                                        const rating = trip?.CustomerFeedbacks?.[0]?.rating ?? null;
                                                        const comment = trip?.CustomerFeedbacks?.[0]?.comments ?? '-';
                                                        const driverName = trip?.Driver?.firstName ?? 'N/A';

                                                        return (
                                                            <tr key={trip.id}>
                                                                <td className="p-2 border">{trip.id}</td>
                                                                <td className="p-2 border">{trip.endDate}</td>
                                                                <td className="p-2 border">{trip.endTime}</td>
                                                                <td className="p-2 border">{driverName}</td>
                                                                <td className="p-2 border flex">
                                                                    {rating !== null ? rating : '0'}
                                                                    <StarIcon className="w-5 h-5 text-yellow-500" />
                                                                </td>
                                                                <td className="p-2 border">
                                                                    {comment}
                                                                </td>

                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="p-2 border text-gray-500 text-center">
                                                            No trips available.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                </div>
                            )}
                            {activeTab === 'history' && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h2 className="text-2xl font-bold">Booking History</h2>
                                        {bookingHistoryPagination && (
                                            <p className="text-sm text-gray-600">
                                                Page {bookingHistoryPagination.currentPage} / {bookingHistoryPagination.totalPages} | Total: {bookingHistoryPagination.totalItems}
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-full overflow-x-scroll pb-2">
                                        <table className="w-full min-w-[1800px] border py-3 text-sm whitespace-nowrap">
                                            <thead className="text-left bg-blue-600 text-white">
                                                <tr>
                                                    <th className="p-2 border">Booking No</th>
                                                    {/* <th className="p-2 border">Service Type</th> */}
                                                    {/* <th className="p-2 border">Package</th> */}
                                                    <th className="p-2 border">Booking Type</th>
                                                    {/* <th className="p-2 border">Bookings</th> */}
                                                    <th className="p-2 border">Trip Date & Time</th>
                                                    <th className="p-2 border whitespace-normal">pickup Location</th>
                                                    <th className="p-2 border whitespace-normal">Drop Location</th>
                                                    <th className="p-2 border">Status</th>
                                                    <th className="p-2 border">Total Distance Kilometer</th>
                                                    <th className="p-2 border">Payment</th>
                                                    <th className="p-2 border">Driver</th>
                                                    <th className="p-2 border">Zone</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bookingHistory.length > 0 ? (
                                                    bookingHistory.map((trip) => {
                                                        const statusMeta = getBookingStatusMeta(trip);
                                                        const paymentMeta = getPaymentStatusMeta(trip.paymentStatus);
                                                        return (
                                                            <tr key={trip.bookingId}>
                                                                <td className="p-2 border">{trip.bookingNumber || '-'}</td>
                                                                {/* <td className="p-2 border">{trip.serviceType || '-'}</td> */}
                                                                {/* <td className="p-2 border">{trip.packageType || '-'}</td> */}
                                                                {/* <td className="p-2 border">{trip.bookingType || '-'}</td> */}
                                                                <td className="p-2 border font-semibold">{
                                                                    trip.serviceType === 'RENTAL' && trip.packageType === 'Local' ? 'Hourly Package'
                                                                        : trip.serviceType === 'RENTAL' && trip.packageType === 'Outstation' && trip.bookingType === 'ROUND TRIP' ? 'Outstation'
                                                                            : trip.serviceType === 'RENTAL' && trip.packageType === 'Outstation' && trip.bookingType === 'DROP ONLY' ? 'Drop Taxi'
                                                                                : trip.serviceType === 'RIDES' ? 'Local Ride'
                                                                                    : trip.serviceType
                                                                                    || '-'}</td>
                                                                <td className="p-2 border">
                                                                    {trip.tripDateTime ? moment(trip.tripDateTime).format('DD-MM-YYYY hh:mm A') : '-'}
                                                                </td>
                                                                <td className="p-2 border whitespace-normal">{trip.pickupLocation?.name || '-'}</td>
                                                                <td className="p-2 border whitespace-normal">{trip.dropLocation?.name || '-'}</td>
                                                                <td className="p-2 border">
                                                                    <span
                                                                        className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${statusMeta.className}`}
                                                                    >
                                                                        {statusMeta.label}
                                                                    </span>
                                                                </td>
                                                                <td className="p-2 border">{trip.totalDistanceKilometer ? trip.totalDistanceKilometer + ' Kms' : '-'}</td>
                                                                <td className="p-2 border">
                                                                    <span
                                                                        className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${paymentMeta.className}`}
                                                                    >
                                                                        {paymentMeta.label}
                                                                    </span>
                                                                </td>
                                                                <td className="p-2 border">{trip?.driver?.firstName || '-'}</td>

                                                                <td className="p-2 border">{trip.zone || '-'}</td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={12} className="p-2 border text-gray-500 text-center">
                                                            No booking history available.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {bookingHistoryPagination.totalPages > 1 && (
                                        <div className="flex items-center justify-center mt-4">
                                            <Button
                                                size="sm"
                                                variant="outlined"
                                                className={`mr-2 ${ColorStyles.bgColor} text-white`}
                                                disabled={bookingHistoryPagination.currentPage === 1}
                                                onClick={() =>
                                                    handleBookingHistoryPageChange(
                                                        bookingHistoryPagination.currentPage - 1
                                                    )
                                                }
                                            >
                                                {'<'}
                                            </Button>
                                            {renderBookingHistoryPageButtons()}
                                            <Button
                                                size="sm"
                                                variant="outlined"
                                                className={`ml-2 ${ColorStyles.bgColor} text-white`}
                                                disabled={
                                                    bookingHistoryPagination.currentPage ===
                                                    bookingHistoryPagination.totalPages
                                                }
                                                onClick={() =>
                                                    handleBookingHistoryPageChange(
                                                        bookingHistoryPagination.currentPage + 1
                                                    )
                                                }
                                            >
                                                {'>'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'activity' && (
                                <>
                                    <CustomerCallsLog customerId={id} />
                                    <CustomerWalletLog customerId={id} />
                                </>
                            )}
                            {activeTab === 'notes' && (
                                <div className='py-3'>
                                    <CustomerBookingNotes
                                        customerId={id}
                                        onNoteAdded={() => fetchItem(id, bookingHistoryPagination.currentPage)}
                                    />
                                    <div className="mt-6">
                                        <h2 className="text-xl font-bold mb-4">Existing Notes</h2>
                                        <div className="flex-1">
                                            {notes.length === 0 ? (
                                                <p className="text-center text-gray-500 text-base mt-5">No notes available.</p>
                                            ) : (
                                                <ul className="space-y-3">
                                                    {notes.map((note) => (
                                                        <li
                                                            key={note?.id}
                                                            className="bg-white rounded-lg p-3 shadow-sm border"
                                                        >
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="inline-block px-2 py-0.5 text-xs text-white bg-primary rounded">
                                                                    {note?.User?.name || '-'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="inline-block px-2 py-0.5 text-xs text-white bg-primary rounded">
                                                                    {note?.noteType || 'Note'}
                                                                </span>
                                                                <span className="text-sm text-gray-500">
                                                                    {moment(note?.created_at).format('DD-MM-YYYY / hh:mm A')}
                                                                </span>
                                                            </div>
                                                            <p className="text-base text-gray-700">{note?.notes}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Formik>
            </div>

            <div className='flex justify-center w-full'>
                <Button
                    onClick={() => { navigate('/dashboard/customers'); }}
                    className={`my-6 px-8 ${ColorStyles.backButton}`}
                >
                    Back
                </Button>
            </div>
        </>
    );
};

export default CustomerDetails;
