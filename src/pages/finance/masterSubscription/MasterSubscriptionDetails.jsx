import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Button } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const MasterSubscriptionDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [initialValues, setInitialValues] = useState({
        // plan group level (match Add page)
        name: "",
        description: "",
        serviceType: "",
        status: "",
        effectiveFrom: "",
        effectiveTo: "",
        isDefault: false,
        zone:"",
        // plans list
        plans: [],
    });

    useEffect(() => {
        const fetchData = async (groupId) => {
            try {
                const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_MASTER_SUBSCRIPTION_DETAIL,{ plans: groupId, includePlans: true });
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
                        status: group.status || "",
                        effectiveFrom: toInputDateTime(group.effectiveFrom),
                        effectiveTo: toInputDateTime(group.effectiveTo),
                        isDefault: Boolean(group.metadata?.isDefault),
                        plans: Array.isArray(group.plans) ? group.plans : [],
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

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Master Subscription Details</h2>
            <Formik
                enableReinitialize
                initialValues={initialValues}
            >
                {({ values }) => (
                    <Form>
                        {/* Plan Group (same fields as Add page) */}
                        <div className="p-4 bg-blue-gray-100 rounded-lg mb-6">
                            {/* <h3 className="text-lg font-semibold mb-4">Plan Group</h3> */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Name</label>
                                    <Field type="text" name="name" disabled className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-100" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Service Type</label>
                                    <Field as="select" name="serviceType" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm bg-gray-100">
                                        <option value="">Select Service Type</option>
                                        <option value="ACTING_DRIVER">Driver</option>
                                        <option value="RIDES_RENTAL_CABS">Rides/Rental Cabs</option>
                                        <option value="AUTO">Autos</option>
                                    </Field>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <Field as="select" name="status" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm bg-gray-100">
                                        <option value="">Select status</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">In Active</option>
                                        <option value="SCHEDULED">Scheduled</option>
                                    </Field>
                                   
                                </div>
                                 <div>
                                    <label className="text-sm font-medium text-gray-700">zone</label>
                                    <Field type="text" name="zone" disabled className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-100" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Effective From</label>
                                    <Field type="datetime-local" name="effectiveFrom" disabled className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-100" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Effective To</label>
                                    <Field type="datetime-local" name="effectiveTo" disabled className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-100" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Description</label>
                                    <Field as="textarea" name="description" rows="3" disabled className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-100" />
                                </div>
                                <div className="flex items-center">
                                    <Field type="checkbox" name="isDefault" disabled className="mr-2 h-4 w-4 text-primary-600 border-gray-300 rounded" />
                                    <span className="text-sm font-medium text-gray-700">Is default</span>
                                </div>
                            </div>
                        </div>

                        {/* Plans – only key fields */}
                        <div className="mt-6 p-4 bg-blue-gray-50 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Plans</h3>
                            {Array.isArray(values.plans) && values.plans.length > 0 ? (
                                <div className="space-y-4">
                                    {values.plans.map((plan, index) => (
                                        <div
                                            key={plan.id || index}
                                            className="grid grid-cols-9 gap-4 border border-gray-200 rounded-lg p-3 bg-white"
                                        >
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Plan Name</label>
                                                <Field type="text" name={`plans[${index}].name`} disabled className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-100" />
                                            </div>
                                            <div className="hidden">
                                                <label className="text-sm font-medium text-gray-700">Service Type</label>
                                                <Field as="select" name={`plans[${index}].serviceType`} disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm bg-gray-100">
                                                    <option value="">Select Service Type</option>
                                                    <option value="ACTING_DRIVER">Driver</option>
                                                    <option value="RIDES_RENTAL_CABS">Rides/Rental Cabs</option>
                                                    <option value="AUTO">Autos</option>
                                                </Field>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Type</label>
                                                <Field as="select" name={`plans[${index}].type`} disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm bg-gray-100">
                                                    <option value="">Select Type</option>
                                                    <option value="FREE">Free</option>
                                                    <option value="PAID">Paid</option>
                                                </Field>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Price</label>
                                                <Field type="number" name={`plans[${index}].packagePrice`} disabled className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-100" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Base Credits</label>
                                                <Field type="number" name={`plans[${index}].price`} disabled className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-100" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Bonus Credits</label>
                                                <Field type="number" name={`plans[${index}].bonusPrice`} disabled className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-100" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Total Credits</label>
                                                <Field type="number" name={`plans[${index}].totalPrice`} disabled className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-100" />
                                </div>
                                <div>
                                                <label className="text-sm font-medium text-gray-700">Validity (Months)</label>
                                                <Field type="number" name={`plans[${index}].validityDays`} disabled className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-100" />
                                </div>
                                <div>
                                                <label className="text-sm font-medium text-gray-700">Earning Strategy</label>
                                                <Field as="select" name={`plans[${index}].earningStrategy`} disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm bg-gray-100">
                                                    <option value="">Select Strategy</option>
                                                    <option value="CREDIT">Credit</option>
                                                    <option value="UNLIMITED">Unlimited</option>
                                                </Field>
                                </div>
                                <div>
                                                <label className="text-sm font-medium text-gray-700">Earning Window Days</label>
                                                <Field type="number" name={`plans[${index}].earningWindowDays`} disabled className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-100" />
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
                                <Button fullWidth className={`my-6 mx-2 border-2 border-gray-400 rounded-xl ${
                                    ColorStyles.editButton
                                }`} onClick={() => navigate(`/dashboard/finance/master-subscription/edit/${id}`)}>
                                    Edit
                                </Button>
                            </div>
                        </Form>
                )}
            </Formik>
        </div>
    );
};

export default MasterSubscriptionDetails;
