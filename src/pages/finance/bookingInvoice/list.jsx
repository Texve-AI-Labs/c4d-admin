import useBillingListSearch from "../components/useBillingListSearch.js";
import BillingListSearch from "../components/BillingListSearch.jsx";
import { useState, useEffect } from "react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles, BOOKING_STATUS } from "@/utils/constants";
import {
    Card,
    CardBody,
    CardHeader,
    Typography,
    Checkbox,
    Popover,
    PopoverHandler,
    PopoverContent,
    Button,
    Spinner,
} from "@material-tailwind/react";
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import { FaFilter } from 'react-icons/fa';

export function BookingInvoiceList() {
    const navigate = useNavigate();
    const { searchQuery, setSearchQuery, pagination, setPagination, requestVersion, runSearch, clearSearch } = useBillingListSearch('bookingInvoiceBillingSearch', { pageSize: 15 });
    const [invoicesList, setInvoicesList] = useState([]);
    const [loading, setLoading] = useState(false);



    useEffect(() => {
        let active = true;
        setLoading(true);
        const fetchBookings = async () => {
            try {
                const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_BOOKINGS, {
                    page: pagination.currentPage,
                    limit: pagination.itemsPerPage,
                    bookingNumber: pagination.search,
                    filterType: JSON.stringify({ status: [BOOKING_STATUS.ENDED] }),
                });
                if (!active) return;
                const rows = response?.success ? (response.data || []).filter((booking) => booking.status === BOOKING_STATUS.ENDED || booking.status === 'COMPLETED') : [];
                setInvoicesList(rows);
                setPagination((previous) => ({
                    ...previous,
                    totalPages: response?.pagination?.totalPages || 1,
                    totalItems: response?.pagination?.totalItems || 0,
                    itemsPerPage: response?.pagination?.itemsPerPage || previous.itemsPerPage,
                }));
            } catch (error) {
                if (active) {
                    console.error("Error fetching bookings for invoice:", error);
                    setInvoicesList([]);
                }
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchBookings();
        return () => { active = false; };
    }, [pagination.currentPage, pagination.search, requestVersion]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: page }));
        }
    };

    const generatePageButtons = () => {
        const buttons = [];
        const maxVisible = 5;
        let start = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(pagination.totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            buttons.push(
                <Button
                    key={i}
                    size="sm"
                    variant={i === pagination.currentPage ? 'filled' : 'outlined'}
                    className={`mx-1 ${ColorStyles.bgColor} text-white`}
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </Button>
            );
        }
        return buttons;
    };

    return (
        <div className="mb-8 mt-2 flex flex-col gap-12">
            <div className="p-4 border border-gray-300 rounded-lg shadow-sm">
                <BillingListSearch
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSearch={runSearch}
                    onClear={clearSearch}
                    canClear={Boolean(searchQuery || pagination.search)}
                    placeholder="Search Booking Number"
                />
            </div>

            <Card>
                <CardHeader variant="gradient" className={`mb-8 p-6 flex justify-between items-center ${ColorStyles.bgColor}`}>
                    <Typography variant="h6" color="white">
                        Completed Trip Invoices
                    </Typography>
                </CardHeader>

                <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Spinner className="h-12 w-12" />
                        </div>
                    ) : invoicesList.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No completed trips with invoices found
                        </div>
                    ) : (
                        <>
                            <table className="w-full min-w-[640px] table-auto">
                                <thead>
                                    <tr>
                                        {["Booking No", "Trip Date", "Customer", "Driver", "Amount", "Payment"].map((el) => (
                                            <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                                <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                                                    {el}
                                                </Typography>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoicesList.map((booking, id) => (
                                        <tr key={booking.id} className="hover:bg-gray-50 text-sm">
                                            <td className=" py-3 px-5">
                                                <Link
                                                    to={`/dashboard/finance/bookingInvoice/details/${booking.id}?customerId=${encodeURIComponent(booking.customerId || 0)}`}
                                                    state={{ customerId: booking.customerId }}
                                                    className="text-primary-600 font-semibold underline cursor-pointer"
                                                >
                                                    {booking.bookingNumber}
                                                </Link>
                                            </td>

                                           
                                            <td className=" py-3 px-5">
                                                {moment(booking.fromDate || booking.created_at).format("DD-MM-YYYY hh:mm A")}
                                            </td>
                                            <td className=" py-3 px-5">
                                                {booking.Customer?.firstName || '-'}
                                            </td>
                                            <td className=" py-3 px-5">
                                                {booking.Driver?.firstName || '-'}
                                            </td>
                                            <td className=" py-3 px-5 font-medium">
                                                {booking.paymentDetails?.details?.amountAfterGst  || '-'}
                                            </td>
                                            <td className=" py-3 px-5">
                                                {booking.paymentType || booking.paymentMethod || '-'}
                                            </td>
                                           
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex items-center justify-center mt-6 gap-2">
                                <Button
                                    size="sm"
                                    variant="text"
                                    disabled={pagination.currentPage === 1}
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                >
                                     {"<"}
                                </Button>
                                {generatePageButtons()}
                                <Button
                                    size="sm"
                                    variant="text"
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                >
                                    {">"}
                                </Button>
                            </div>
                        </>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}

export default BookingInvoiceList;
