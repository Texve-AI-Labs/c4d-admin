import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Button, Switch } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { isSuperUserRole } from "@/utils/roleUtils";
import { MasterSubscriptionLogTable } from "./MasterSubscriptionLogTable";

const MasterSubscriptionDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const canViewLogs = isSuperUserRole();
    const [activeTab, setActiveTab] = useState("details");
    const [logRows, setLogRows] = useState([]);
    const [logLoading, setLogLoading] = useState(false);
    const [logError, setLogError] = useState("");
    const [expandedLogRows, setExpandedLogRows] = useState({});
    const [logPagination, setLogPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });
    const normalizeApplicableEntity = (value) => {
        if (Array.isArray(value)) return value[0] || "";
        return value || "";
    };
    const [initialValues, setInitialValues] = useState({
        // plan group level (match Add page)
        name: "",
        description: "",
        serviceType: "",
        applicableEntity: "",
        assignmentType: "",
        assignmentValue: "",
        priority: "",
        status: "",
        effectiveFrom: "",
        effectiveTo: "",
        isDefault: false,
        zone: "",
        // plans list
        plans: [],
        assignments: [],
    });

    useEffect(() => {
        const fetchData = async (groupId) => {
            try {
                const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_MASTER_SUBSCRIPTION_DETAIL, { plans: groupId, includePlans: true, includeAssignments: true });
                // API may return { result } or { data: [group, ...] }
                const numericId = Number(groupId);
                let group = response?.result;
                if (!group && Array.isArray(response?.data)) {
                    group =
                        response.data.find(
                            (g) =>
                                g.id === numericId ||
                                g.planGroupId === numericId ||
                                g.PlanGroupId === numericId
                        ) || response.data[0];
                }

                if (group) {
                    const toInputDateTime = (iso) => {
                        if (!iso) return "";
                        const d = new Date(iso);
                        if (Number.isNaN(d.getTime())) return "";
                        return d.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
                    };

                    setInitialValues({
                        name: group.name || "",
                        zone: group.zone || "",
                        description: group.description || "",
                        serviceType: group.serviceType || "",
                        applicableEntity: normalizeApplicableEntity(group.applicableEntity),
                        assignmentType: group.assignments?.[0]?.assignmentType || "",
                        assignmentValue: group.assignments?.[0]?.assignmentValue || "",
                        priority: group.priority ?? "",
                        status: group.status || "",
                        effectiveFrom: toInputDateTime(group.effectiveFrom),
                        effectiveTo: toInputDateTime(group.effectiveTo),
                        isDefault: Boolean(group.metadata?.isDefault),
                        plans: Array.isArray(group.plans) ? group.plans : [],
                        assignments: Array.isArray(group.assignments) ? group.assignments : [],
                    });
                }
            } catch (error) {
                console.error("Error fetching subscription data:", error);
            }
        };

        if (id) {
            fetchData(id);
        }
    }, [id]);

    const fetchLogData = async () => {
        if (!id) return;
        setLogLoading(true);
        setLogError("");
        try {
            const Log = `${API_ROUTES.MASTER_SUB_PLAN_GROUP}/${id}`;
            const response = await ApiRequestUtils.getWithQueryParam(Log, {
                page: logPagination.page,
                limit: logPagination.limit,
            });
            const payload = response?.result ?? response?.data ?? response;
            const rows = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload?.rows)
                        ? payload.rows
                        : Array.isArray(payload?.items)
                            ? payload.items
                            : Array.isArray(payload?.logs)
                                ? payload.logs
                                : payload
                                    ? [payload]
                                    : [];
            const pagination = response?.pagination || payload?.pagination || {};
            const resolvedPage = Number(pagination.page || pagination.currentPage || logPagination.page || 1);
            const resolvedLimit = Number(pagination.limit || pagination.itemsPerPage || logPagination.limit || 20);
            const resolvedTotal = Number(pagination.total || pagination.totalItems || rows.length || 0);
            const resolvedTotalPages = Number(
                pagination.totalPages ||
                payload?.totalPages ||
                Math.ceil(resolvedTotal / resolvedLimit) ||
                0
            );

            setLogRows(rows);
            setExpandedLogRows({});
            setLogPagination({
                page: resolvedPage,
                limit: resolvedLimit,
                total: resolvedTotal,
                totalPages: resolvedTotalPages,
            });
        } catch (error) {
            console.error("Error fetching subscription log:", error);
            setLogError("Unable to load log data.");
        } finally {
            setLogLoading(false);
        }
    };

    const handleLogPageChange = (page) => {
        if (logPagination.totalPages < 1 || page < 1 || page > logPagination.totalPages || logLoading) return;
        setLogPagination((prev) => ({ ...prev, page }));
    };

    const toggleLogRow = (rowKey) => {
        setExpandedLogRows((prev) => ({
            ...prev,
            [rowKey]: !prev[rowKey],
        }));
    };

    useEffect(() => {
        if (canViewLogs && activeTab === "log") {
            fetchLogData();
        }
    }, [activeTab, logPagination.page, logPagination.limit, canViewLogs]);

    return (
        <div className="p-4 bg-white">
            <h2 className="text-2xl font-bold mb-4">Master Subscription Details</h2>
            <Formik
                enableReinitialize
                initialValues={initialValues}
            >
                {({ values }) => (
                    <Form>
                        <div className="mb-6 flex gap-3 border-b border-gray-200">
                            <button
                                type="button"
                                onClick={() => setActiveTab("details")}
                                className={`px-4 py-2 text-sm font-semibold border-b-2 ${activeTab === "details" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
                            >
                                Details
                            </button>
                            {canViewLogs && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab("log");
                                    }}
                                    className={`px-4 py-2 text-sm font-semibold border-b-2 ${activeTab === "log" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
                                >
                                    Log
                                </button>
                            )}
                        </div>

                        {activeTab === "details" && (
                            <>
                        {/* Plan Group (same fields as Add page) */}
                        <div className="p-4 border-2 rounded-lg mb-6">
                            {/* <h3 className="text-lg font-semibold mb-4">Plan Group</h3> */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Assignment Type</label>
                                    <Field as="select" name="assignmentType" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                                        <option value="">Select Assignment Type</option>
                                        <option value="TIER">Tier</option>
                                        <option value="DRIVER_ID">Driver ID</option>
                                        <option value="CAB_ID">Cab ID</option>
                                        <option value="AUTO_ID">Auto ID</option>
                                        <option value="BIKE_ID">Bike ID</option>
                                    </Field>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Assignment Value</label>
                                    {values.assignmentType === "TIER" ? (
                                        <Field as="select" name="assignmentValue" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                                            <option value="">Select Tier</option>
                                            <option value="SILVER">Silver</option>
                                            <option value="GOLD">Gold</option>
                                            <option value="ELITE">Elite</option>
                                        </Field>
                                    ) : (
                                        <Field type="text" name="assignmentValue" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Priority</label>
                                    <Field as="select" name="priority" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                                        <option value="">Select Priority</option>
                                        <option value="100">High</option>
                                        <option value="75">Medium</option>
                                        <option value="50">Low</option>
                                    </Field>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Name</label>
                                    <Field type="text" name="name" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Service Type</label>
                                    <Field as="select" name="serviceType" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                                        <option value="">Select Service Type</option>
                                        <option value="ACTING_DRIVER">Driver</option>
                                        <option value="RIDES_RENTAL_CABS">Rides/Rental Cabs</option>
                                        <option value="AUTO">Autos</option>
                                        <option value="BIKE">Bikes</option>
                                    </Field>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Applicable Entity</label>
                                    <Field type="text" name="applicableEntity" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <Field as="select" name="status" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                                        <option value="">Select status</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">In Active</option>
                                        <option value="SCHEDULED">Scheduled</option>
                                    </Field>

                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">zone</label>
                                    <Field type="text" name="zone" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Effective From</label>
                                    <Field type="datetime-local" name="effectiveFrom" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Effective To</label>
                                    <Field type="datetime-local" name="effectiveTo" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Description</label>
                                    <Field as="textarea" name="description" rows="3" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                </div>
                                <div className="flex items-center">
                                    <Field type="checkbox" name="isDefault" disabled className="mr-2 h-4 w-4 text-primary-600 border-gray-300 rounded" />
                                    <span className="text-sm font-medium text-gray-700">Is default</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-white border-2 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Plans</h3>
                            {Array.isArray(values.plans) && values.plans.length > 0 ? (
                                <div className="space-y-4">
                                    {values.plans.map((plan, index) => (
                                        <div
                                            key={plan.id || index}
                                            className="grid grid-cols-9 gap-4  rounded-lg p-3 bg-white"
                                        >
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Plan Name</label>
                                                <Field type="text" name={`plans[${index}].name`} disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                            </div>
                                            <div className="hidden">
                                                <label className="text-sm font-medium text-gray-700">Service Type</label>
                                                <Field as="select" name={`plans[${index}].serviceType`} disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                                                    <option value="">Select Service Type</option>
                                                    <option value="ACTING_DRIVER">Driver</option>
                                                    <option value="RIDES_RENTAL_CABS">Rides/Rental Cabs</option>
                                                    <option value="AUTO">Autos</option>
                                                    <option value="BIKE">Bikes</option>
                                                </Field>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Type</label>
                                                <Field as="select" name={`plans[${index}].type`} disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                                                    <option value="">Select Type</option>
                                                    <option value="FREE">Free</option>
                                                    <option value="PAID">Paid</option>
                                                </Field>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Price</label>
                                                <Field type="number" name={`plans[${index}].packagePrice`} disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Base Credits</label>
                                                <Field type="number" name={`plans[${index}].price`} disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Bonus Credits</label>
                                                <Field type="number" name={`plans[${index}].bonusPrice`} disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Total Credits</label>
                                                <Field type="number" name={`plans[${index}].totalPrice`} disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                            </div>
                                            {/* <div>
                                                <label className="text-sm font-medium text-gray-700">Validity (Months)</label>
                                                <Field type="number" name={`plans[${index}].validityDays`} disabled className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm" />
                                            </div> */}
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Earning Strategy</label>
                                                <Field as="select" name={`plans[${index}].earningStrategy`} disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                                                    <option value="">Select Strategy</option>
                                                    <option value="CREDIT">Credit</option>
                                                    <option value="UNLIMITED">Unlimited</option>
                                                </Field>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Earning Window Days</label>
                                                <Field type="number" name={`plans[${index}].earningWindowDays`} disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" />
                                            </div>
                                            <div className="min-w-0 flex items-center justify-between rounded-md border-2 border-gray-200 bg-gray-50 px-3 py-2">
                                            <div>
                                                <div className="block max-w-[96px] whitespace-normal text-sm font-medium leading-tight text-gray-700 break-words">Status</div>
                                                <div className="text-xs text-gray-500">{plan.status === "ACTIVE" ? "Active" : "Inactive"}</div>
                                            </div>
                                            <Switch checked={(plan.status || "ACTIVE") === "ACTIVE"} disabled />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    No plans available for this group.
                                </p>
                            )}
                        </div>
                        <div className="flex flex-row">
                            <Button
                                fullWidth
                                onClick={() => navigate('/dashboard/finance/master-subscription')}
                                className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button fullWidth className={`my-6 mx-2 border-2 border-gray-400 rounded-xl ${ColorStyles.editButton
                                }`} onClick={() => navigate(`/dashboard/finance/master-subscription/edit/${id}`)}>
                                Edit
                            </Button>
                        </div>
                            </>
                        )}
                        {canViewLogs && activeTab === "log" && (
                            <MasterSubscriptionLogTable
                                rows={logRows}
                                loading={logLoading}
                                error={logError}
                                pagination={logPagination}
                                expandedRows={expandedLogRows}
                                onToggleRow={toggleLogRow}
                                onPageChange={handleLogPageChange}
                            />
                        )}
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default MasterSubscriptionDetails;