import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from "react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import {
    Card,
    CardBody,
    CardHeader,
    Typography,
    Popover,
    PopoverHandler,
    PopoverContent,
    Checkbox,
    Button,
    Spinner,
} from "@material-tailwind/react";
import { Link, useNavigate } from 'react-router-dom';
import { FaFilter } from 'react-icons/fa';
import moment from 'moment';

export function InvoiceList() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [invoiceList, setInvoiceList] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [invoiceTypeFilter, setInvoiceTypeFilter] = useState(
        () => sessionStorage.getItem('invoiceTypeFilter') || 'ALL'
    );
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(
        () => sessionStorage.getItem('paymentStatusFilter') || 'ALL'
    );
    const [loading, setLoading] = useState(false);
    const inFlightRequestRef = useRef(null);

    const [pagination, setPagination] = useState({
        currentPage: Number(sessionStorage.getItem('invoiceCurrentPage')) || 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
         search: searchQuery.trim(),
        //   forSearch:false
    });

    const fetchInvoices = async (page = 1, showLoader = false, invoiceType = invoiceTypeFilter) => {
        const requestKey = JSON.stringify({
            page,
            limit: pagination.itemsPerPage,
            search: searchQuery.trim(),
            invoiceType,
            paymentStatus: paymentStatusFilter,
        });

        if (inFlightRequestRef.current === requestKey) return;
        inFlightRequestRef.current = requestKey;
        if (showLoader) setLoading(true);
        try {
            const params = {
                page: page,
                limit: pagination.itemsPerPage,
                search: searchQuery.trim(),
                ...(invoiceType !== 'ALL' && { invoiceType }),
                ...(paymentStatusFilter !== 'ALL' && { status: paymentStatusFilter }),
            };
            const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_INVOICE_LIST, params);

            if (data) {
                setInvoiceList(data?.data || []);
                setAllAccounts(data?.data || []);
                setPagination((prev) => ({
                    ...prev,
                    currentPage: page,
                    totalPages: data?.pagination?.totalPages || 1,
                    totalItems: data?.pagination?.totalItems || 0,
                    itemsPerPage: data?.pagination?.itemsPerPage || 15,
                    search: searchQuery.trim()
                }));
            }
        } catch (error) {
            console.error("Error fetching invoice data:", error);
        } finally {
            if (inFlightRequestRef.current === requestKey) {
                inFlightRequestRef.current = null;
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        sessionStorage.setItem('invoiceTypeFilter', invoiceTypeFilter);
    }, [invoiceTypeFilter]);

    useEffect(() => {
        sessionStorage.setItem('paymentStatusFilter', paymentStatusFilter);
    }, [paymentStatusFilter]);

    useEffect(() => {
        sessionStorage.setItem('invoiceCurrentPage', String(pagination.currentPage));
    }, [pagination.currentPage]);
    
    useEffect(() => {
        const requestTimer = setTimeout(() => {
            fetchInvoices(pagination.currentPage, true);
        }, searchQuery.trim() ? 500 : 0);

        return () => clearTimeout(requestTimer);
    }, [pagination.currentPage, invoiceTypeFilter, paymentStatusFilter, searchQuery]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setPagination((prev) => ({ ...prev, currentPage: page }));
        }
    };

    const generatePageButtons = () => {
        const buttons = [];
        const maxVisible = 5;
        let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
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

    const handleFilterChange = (filterType, value) => {
        if (filterType === 'status') {
            setPaymentStatusFilter(value);
            setPagination((prev) => ({ ...prev, currentPage: 1 }));
        } else if (filterType === 'Subscription') {
            setInvoiceTypeFilter(value);
            setPagination((prev) => ({ ...prev, currentPage: 1 }));
        }
    };

    const handleRefresh = () => {
        sessionStorage.removeItem('invoiceTypeFilter');
        sessionStorage.removeItem('paymentStatusFilter');
        sessionStorage.removeItem('invoiceCurrentPage');
        setSearchQuery('');
        setInvoiceTypeFilter('ALL');
        setPaymentStatusFilter('ALL');
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const FilterPopover = ({ title, options, selectedFilters, onFilterChange }) => (
        <Popover placement="bottom-start">
            <PopoverHandler>
                <div className="flex items-center cursor-pointer">
                    <Typography variant="small" className={`text-[11px] font-bold uppercase mr-1 ${ColorStyles.PopoverHandlerText}`}>
                        {title}
                    </Typography>
                    <FaFilter className="text-black text-xs" />
                </div>
            </PopoverHandler>
            <PopoverContent className="p-2">
                {options.map((option) => (
                    <div key={option.value} className="flex items-center mb-2">
                        <Checkbox
                            color="blue"
                            checked={selectedFilters.includes(option.value)}
                            onChange={() => onFilterChange(option.value)}
                        />
                        <Typography color="blue-gray" className="font-medium ml-2">
                            {option.label}
                        </Typography>
                    </div>
                ))}
            </PopoverContent>
        </Popover>
    );

    

    return (
        <div className="mb-8 flex flex-col gap-12">
            <div className="p-4 border border-gray-300 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="relative flex-grow max-w-[500px]">
                        <input
                            type="text"
                            className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Search Invoice Number"
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPagination((prev) => ({ ...prev, currentPage: 1 }));
                            }}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>

            <Card>
                    <>
                        <CardHeader variant="gradient" className={`mb-8 p-6 flex justify-between items-center ${ColorStyles.bgColor}`}>
                            <Typography variant="h6" color="white">
                                Invoice List
                            </Typography>
                            <button
                                type="button"
                                onClick={handleRefresh}
                                aria-label="Refresh invoices and clear filters"
                                title="Refresh invoices and clear filters"
                                className="text-white hover:text-gray-200"
                            >
                                <ArrowPathIcon className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                            <table className="w-full min-w-[640px] table-auto">
                                <thead>
                                    <tr>
                                        {["Invoice Number", "Created Date", "Invoice Type", "Amount (₹)",, "Status"].map((el) => (
                                            <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                                {el === "Status" ? (
                                                    <FilterPopover
                                                        title={el}
                                                        options={[
                                                            { value: "ALL", label: "ALL" },
                                                            { value: "PAYMENT_PENDING", label: "Payment Pending" },
                                                            { value: "PAYMENT_COMPLETED", label: "Payment Completed" },
                                                            { value: "PAYMENT_CANCELLED", label: "Payment Cancelled" }
                                                        ]}
                                                        selectedFilters={[paymentStatusFilter]}
                                                        onFilterChange={(value) => handleFilterChange("status", value)}
                                                    />
                                                ) : el === "Invoice Type" ? (
                                                    <FilterPopover
                                                        title={el}
                                                        options={[
                                                            { value: "ALL", label: "ALL" },
                                                            { value: "Free Plan", label: "Free Plan" },
                                                            { value: "Premium", label: "Premium" },
                                                            { value: "Standard", label: "Standard" },
                                                            { value: "Regular", label: "Regular" }
                                                        ]}
                                                        selectedFilters={[invoiceTypeFilter]}
                                                        onFilterChange={(value) => handleFilterChange("Subscription", value)}
                                                    />
                                                ) : (
                                                    <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                                                        {el}
                                                    </Typography>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                              <td colSpan={6} className="py-3 px-3">
                                                                   <div className="flex justify-center items-center">
                                                                     <Spinner className="h-12 w-12" />
                                                                   </div>
                                                                 </td>
                                        </tr>
                                    ) : (
                                        invoiceList.length > 0 ? invoiceList.map((invoice, index) => (
                                                <tr key={index} className="text-sm">
                                                    <td className='border-b border-blue-gray-50 py-3 px-5'>
                                                        <Link
                                                            to={`/dashboard/finance/invoice/details/${invoice?.invoiceNumber}`}
                                                            className="font-semibold underline cursor-pointer text-primary-600"
                                                        >
                                                            {invoice?.invoiceNumber}
                                                        </Link>
                                                    </td>
                                                    <td className="border-b border-blue-gray-50 text-black py-3 px-5">{moment(invoice?.created_at).format('DD-MM-YYYY')}</td>
                                                    <td className="border-b border-blue-gray-50 text-black py-3 px-5">{invoice?.Subscription?.Plan?.name}</td>
                                                    <td className="border-b border-blue-gray-50 text-black py-3 px-5">₹ {invoice?.amount}</td>
                                                    <td className="border-b border-blue-gray-50 text-black py-3 px-5">{invoice?.status}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="py-6 text-center text-gray-500">
                                                        No Invoices
                                                    </td>
                                                </tr>
                                            )
                                    )}
                                </tbody>
                            </table>

                        
                            <div className="flex items-center justify-center mt-4">
                                <Button
                                    size="sm"
                                    variant="text"
                                    disabled={pagination.currentPage === 1}
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    className="mx-1"
                                >
                                    {'<'}
                                </Button>
                                {generatePageButtons()}
                                <Button
                                    size="sm"
                                    variant="text"
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    className="mx-1"
                                >
                                    {'>'}
                                </Button>
                            </div>
                        </CardBody>
                    </>
            </Card>
        </div>
    );
}

export default InvoiceList;
