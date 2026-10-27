import useBillingListSearch from "../components/useBillingListSearch.js";
import BillingListSearch from "../components/BillingListSearch.jsx";
import { useState, useEffect } from "react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import {
    Card,
    CardBody,
    CardHeader,
    Typography,
    Button,
    Spinner,
} from "@material-tailwind/react";
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';

export function ReceiptList() {
    const navigate = useNavigate();
    const { searchQuery, setSearchQuery, pagination, setPagination, requestVersion, runSearch, clearSearch } = useBillingListSearch('receiptBillingSearch', { pageSize: 15 });
    const [receiptsList, setReceiptsList] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        let active = true;
        setLoading(true);
        const fetchReceipts = async () => {
            try {
                const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_RECEIPT_LIST, {
                    page: pagination.currentPage,
                    limit: pagination.itemsPerPage,
                    search: pagination.search,
                });
                if (!active) return;
                setReceiptsList(data?.success ? data.result || [] : []);
                setAllAccounts(data?.success ? data.result || [] : []);
                setPagination((previous) => ({
                    ...previous,
                    totalPages: data?.pagination?.totalPages || 1,
                    totalItems: data?.pagination?.totalItems || 0,
                    itemsPerPage: data?.pagination?.itemsPerPage || previous.itemsPerPage,
                }));
            } catch (error) {
                if (active) {
                    console.error("Error fetching receipt data:", error);
                    setReceiptsList([]);
                }
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchReceipts();
        return () => { active = false; };
    }, [pagination.currentPage, pagination.search, requestVersion]);

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

    return (
        <div className="mb-8 flex flex-col gap-12">
            <div className="p-4 border border-gray-300 rounded-lg shadow-sm">
                <BillingListSearch
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSearch={runSearch}
                    onClear={clearSearch}
                    canClear={Boolean(searchQuery || pagination.search)}
                    placeholder="Search Receipt Number"
                />
            </div>

            <Card>
                {receiptsList.length > 0 ? (
                    <>
                        <CardHeader variant="gradient" className={`mb-8 p-6 flex-1 justify-between items-center ${ColorStyles.bgColor}`}>
                            <Typography variant="h6" color="white">
                                Receipts List
                            </Typography>
                        </CardHeader>
                        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                            <table className="w-full min-w-[640px] table-auto">
                                <thead>
                                    <tr>
                                        {["Receipt Number", "Created Date", "Type", "Driver Name", "Payment Method", "Amount"].map((el) => (
                                            <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                                <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                                                    {el}
                                                </Typography>
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
                                        receiptsList
                                            .map((receipt, index) => (
                                                <tr key={index} className="text-sm">
                                                    <td className='border-b border-blue-gray-50 py-3 px-5'>
                                                        <Link
                                                            to={`/dashboard/finance/receipt/details/${receipt?.receiptNumber}`}
                                                            className="text-primary-600 font-semibold underline cursor-pointer"
                                                        >
                                                            {receipt?.receiptNumber}
                                                        </Link>
                                                    </td>
                                                    <td className="border-b border-blue-gray-50 text-black py-3 px-5">{moment(receipt?.created_at).format("DD-MM-YYYY")}</td>
                                                    <td className="border-b border-blue-gray-50 text-black py-3 px-5">{receipt?.receiptType}</td>
                                                    <td className="border-b border-blue-gray-50 text-black py-3 px-5">{receipt?.Driver?.firstName || '-'}</td>
                                                    <td className="border-b border-blue-gray-50 text-black py-3 px-5">{receipt?.paymentType}</td>
                                                    <td className="border-b border-blue-gray-50 text-black py-3 px-5">{receipt?.amount}</td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            <div className="flex items-center justify-center mt-4">
                                <Button
                                    size="sm"
                                    variant="text"
                                    disabled={pagination.currentPage === 1 }
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    className="mx-1"
                                >
                                    {'<'}
                                </Button>
                                {generatePageButtons()}
                                <Button
                                    size="sm"
                                    variant="text"
                                    disabled={pagination.currentPage === pagination.totalPages }
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    className="mx-1"
                                >
                                    {'>'}
                                </Button>
                            </div>
                        </CardBody>
                    </>
                ) : (
                    <CardHeader variant="gradient" className={`mb-8 p-6 ${ColorStyles.bgColor}`}>
                        <Typography variant="h6" color="white">
                            No Receipts
                        </Typography>
                    </CardHeader>
                )}
            </Card>
        </div>
    );
}

export default ReceiptList;
