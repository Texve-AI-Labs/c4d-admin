import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from "react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import {
    Card,
    CardBody,
    CardHeader,
    Typography,
} from "@material-tailwind/react";
import { Link, useNavigate } from 'react-router-dom';

export function MasterSubscriptionView() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [masterSubscriptionList, setMasterSubscriptionList] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [serviceFilter, setServiceFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = { includePlans: true };
                if (serviceFilter) {
                    params.serviceType = serviceFilter;
                }
                if (statusFilter) {
                    params.status = statusFilter;
                }

                const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_MASTER_SUBSCRIPTION_LIST,params);
                if (Array.isArray(data?.data)) {
                    setMasterSubscriptionList(data.data);
                    setAllAccounts(data.data);
                }
            } catch (error) {
                console.error("Error fetching subscription data:", error);
            }
        };
        fetchData();
    }, [serviceFilter, statusFilter]);

    useEffect(() => {
        getDetails(searchQuery.trim());
    }, [searchQuery]);

    const getDetails = (searchQuery) => {
        if (searchQuery && searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            const filteredAccounts = allAccounts.filter((acc) => {
                const name = (acc?.name || "").toLowerCase(); // group name
                const code = (acc?.code || "").toLowerCase();
                const serviceType = (acc?.serviceType || "").toLowerCase();

                return (
                    name.includes(query) ||
                    code.includes(query) ||
                    serviceType.includes(query)
                );
            });
            setMasterSubscriptionList(filteredAccounts);
        } else {
            setMasterSubscriptionList(allAccounts);
        }
    };

    function formatDate(isoDateString) {
        const date = new Date(isoDateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    const toggleExpand = (groupId) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    return (
        <div className="mb-8 flex flex-col gap-12">
            <div className="p-4 border border-gray-300 rounded-lg shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-grow">
                    <div className="relative flex-grow max-w-[320px]">
                        <input
                            type="text"
                            className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Search Subscription"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        </div>
                        <select
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">All Service Types</option>
                            <option value="ACTING_DRIVER">Driver</option>
                            <option value="RIDES_RENTAL_CABS">Rides/Rental Cabs</option>
                            <option value="AUTO">Autos</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">In Active</option>
                            <option value="SCHEDULED">Scheduled</option>
                        </select>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/finance/master-subscription/add')}
                        className={`ml-4 px-4 py-2 rounded-xl hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${ColorStyles.addButtonColor
                            }`}
                    >
                        Add new
                    </button>
                </div>
            </div>
            <Card>
                {masterSubscriptionList.length > 0 ? (
                    <>
                        <CardHeader variant="gradient" className={`mb-8 p-6 flex-1 justify-between items-center ${ColorStyles.bgColor}`}>
                            <Typography variant="h6" color="white">
                                Master Subscription List
                            </Typography>
                        </CardHeader>
                        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                            <table className="w-full min-w-[640px] table-auto">
                                <thead>
                                    <tr>
                                        {[
                                            "Service Type",
                                            "Plan Group",
                                            // "Group Code",
                                            "Zone",
                                            "Group Status",
                                            "Is Default",
                                            "Plans",
                                        ].map((el) => (
                                            <th
                                                key={el}
                                                className="border-b border-blue-gray-50 py-3 px-5 text-left"
                                            >
                                                <Typography
                                                    variant="small"
                                                    className="text-[11px] font-bold uppercase text-black"
                                                >
                                                    {el}
                                                </Typography>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {masterSubscriptionList.map((group, index) => (
                                        <>
                                            <tr key={group.id || index} className="text-sm">
                                                <td className="border-b border-blue-gray-50 py-3 px-5 text-blue-600 underline cursor-pointer">
                                                    <Link to={`/dashboard/finance/master-subscription/details/${group.id}`}>
                                                    {group.serviceType === 'RIDES_RENTAL_CABS'
                                                        ? <div>Rides/Rental Cabs</div>
                                                        : group.serviceType === "AUTO"
                                                            ? <div>Autos</div>
                                                            : "Acting_Driver"}
                                                    </Link>
                                                </td>
                                                <td className="border-b border-blue-gray-50 py-3 px-5 text-black">
                                                    {group.name || '-'}
                                                </td>
                                                <td className="border-b border-blue-gray-50 py-3 px-5 text-black">
                                                    {group.zone || '-'}
                                                </td>
                                                <td className="border-b border-blue-gray-50 py-3 px-5 text-black">
                                                    {group.status || '-'}
                                                </td>
                                                <td className="border-b border-blue-gray-50 py-3 px-5 text-black">
                                                    {group.metadata?.isDefault ? 'Yes' : 'No'}
                                                </td>
                                                <td className="border-b border-blue-gray-50 py-3 px-5 text-black">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleExpand(group.id)}
                                                        className="px-3 py-1 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                                                    >
                                                        {expandedGroups[group.id] ? 'Hide Plans' : 'Show Plans'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedGroups[group.id] && (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="bg-blue-gray-50 border-b border-blue-gray-50 px-5 py-3"
                                                    >
                                                        {Array.isArray(group.plans) && group.plans.length > 0 ? (
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr>
                                                                        {[
                                                                            "Plan Name",
                                                                            "Price",
                                                                            "Base Credits",
                                                                            "Bonus Credits",
                                                                            "Total Credits",
                                                                            "Type",
                                                                            "Validity (Months)",
                                                                            "Earning Strategy",
                                                                        ].map((el) => (
                                                                            <th
                                                                                key={el}
                                                                                className="border-b border-blue-gray-100 py-2 px-3 text-left"
                                                                            >
                                                                                <Typography
                                                                                    variant="small"
                                                                                    className="text-[10px] font-bold uppercase text-black"
                                                                                >
                                                                                    {el}
                                                                                </Typography>
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {group.plans.map((plan) => (
                                                                        <tr key={plan.id} className="hover:bg-blue-gray-100">
                                                                            <td className="border-b border-blue-gray-50 py-2 px-3 text-black">
                                                                                {plan.name || '-'}
                                                                            </td>
                                                                            <td className="border-b border-blue-gray-50 py-2 px-3 text-blue-600 underline cursor-pointer">
                                                                                <Link to={`/dashboard/finance/master-subscription/details/${group.id}`}>
                                                                                {Number(plan.packagePrice || 0) === 0
                                                                                    ? 'Free'
                                                                                    : plan.packagePrice}
                                                                                </Link>
                                                                            </td>
                                                                            <td className="border-b border-blue-gray-50 py-2 px-3 text-black">
                                                                                {Number(plan.price || 0) === 0 ? 'Free' : plan.price}
                                                                            </td>
                                                                            <td className="border-b border-blue-gray-50 py-2 px-3 text-black">
                                                                                {plan.bonusPrice || '-'}
                                                                            </td>
                                                                            <td className="border-b border-blue-gray-50 py-2 px-3 text-black">
                                                                                {plan.totalPrice || '-'}
                                                                            </td>
                                                                            <td className="border-b border-blue-gray-50 py-2 px-3 text-black">
                                                                                {plan.type || '-'}
                                                                            </td>
                                                                            <td className="border-b border-blue-gray-50 py-2 px-3 text-black">
                                                                                {plan.validityDays || '-'}
                                                                            </td>
                                                                            <td className="border-b border-blue-gray-50 py-2 px-3 text-black">
                                                                                {plan.earningStrategy || '-'}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        ) : (
                                                            <Typography
                                                                variant="small"
                                                                className="text-xs text-gray-500"
                                                            >
                                                                No plans available for this group.
                                                            </Typography>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </CardBody>
                    </>
                ) : (
                    <CardHeader variant="gradient" className={`mb-8 p-6 ${ColorStyles.bgColor}`}>
                        <Typography variant="h6" color="white">
                            No Master Subscriptions
                        </Typography>
                    </CardHeader>
                )}
            </Card>
        </div>
    );
}
