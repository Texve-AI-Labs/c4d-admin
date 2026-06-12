import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Button } from "@material-tailwind/react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import { SUBSCRIPTION_EDIT_SCHEME } from "@/utils/validations";

const PRIORITY_OPTIONS = [
  { label: "High", value: 100 },
  { label: "Medium", value: 75 },
  { label: "Low", value: 50 },
];

const initialValuesTemplate = {
  groupName: "",
  description: "",
  serviceType: "",
  assignmentType: "",
  assignmentValue: "",
  zone: "",
  status: "",
  effectiveFrom: "",
  effectiveTo: "",
  isDefault: false,
  primaryPlanId: null,
  packagePrice: "",
  price: 0,
  name: "",
  bonusPrice: 0,
  priority: "",
  totalPrice: 0,
  type: "",
  validityDays: 0,
  earningStrategy: "",
  earningWindowDays: "",
  plans: [],
  assignments: [],
};

function MasterSubscriptionEditForm({ values, setFieldValue, handleSubmit, dirty, isValid, geoData, navigate }) {
  useEffect(() => {
    setFieldValue("totalPrice", (Number(values.price) || 0) + (Number(values.bonusPrice) || 0));
  }, [values.price, values.bonusPrice, setFieldValue]);

  useEffect(() => {
    if (!Array.isArray(values.plans)) return;
    values.plans.forEach((plan, index) => {
      const total = (Number(plan.price) || 0) + (Number(plan.bonusPrice) || 0);
      if (total !== Number(plan.totalPrice || 0)) {
        setFieldValue(`plans[${index}].totalPrice`, total);
      }
    });
  }, [values.plans, setFieldValue]);

  return (
    <Form>
      <div className="p-4 bg-blue-gray-100 grid grid-cols-1 gap-4">
        <div className="p-4 bg-blue-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignmentType" className="text-sm font-medium text-gray-700">Assignment Type</label>
              <Field as="select" name="assignmentType" className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" disabled>
                <option value="">Select Assignment Type</option>
                <option value="TIER">Tier</option>
                <option value="DRIVER_ID">Driver ID</option>
                <option value="CAB_ID">Cab ID</option>
                <option value="AUTO_ID">Auto ID</option>
              </Field>
            </div>

            <div>
              <label htmlFor="assignmentValue" className="text-sm font-medium text-gray-700">Assignment Value</label>
              {values.assignmentType === "TIER" ? (
                <Field as="select" name="assignmentValue" className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" disabled>
                  <option value="">Select Tier</option>
                  <option value="SILVER">Silver</option>
                  <option value="GOLD">Gold</option>
                  <option value="ELITE">Elite</option>
                </Field>
              ) :
                <Field type="text" name="assignmentValue" className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" disabled placeholder={`Enter ${values.assignmentType === "DRIVER_ID" ? "Driver ID" : values.assignmentType === "CAB_ID" ? "Cab ID" : "Auto ID"}`} />
              }

            </div>
            <div>
              <label htmlFor="priority" className="mb-1 block text-sm">Priority</label>
              <Field as="select" name="priority" className="w-full rounded-md border border-gray-300 p-2">
                <option value="">Select Priority</option>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.label} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="priority" component="div" className="text-red-500 text-sm my-1" />
            </div>
            <div className="mt-4 hidden">
              <label htmlFor="status" className="text-sm font-medium text-gray-700">Status</label>
              <Field as="select" name="status" className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                <option value="">Select status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">In Active</option>
              </Field>
            </div>
            <div>
              <label htmlFor="groupName" className="text-sm font-medium text-gray-700">Name</label>
              <Field type="text" name="groupName" className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm" placeholder="Eg. New Year Group" />
              <ErrorMessage name="groupName" component="div" className="text-red-500 text-sm my-1" />
            </div>
            <div>
              <label htmlFor="serviceType" className="text-sm font-medium text-gray-700">Service Type</label>
              <Field as="select" name="serviceType" className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm" disabled>
                <option value="">Select Service Type</option>
                <option value="ACTING_DRIVER">Driver</option>
                <option value="RIDES_RENTAL_CABS">Rides/Rental Cabs</option>
                <option value="AUTO">Autos</option>
              </Field>
              <ErrorMessage name="serviceType" component="div" className="text-red-500 text-sm my-1" />
            </div>
            <div>
              <label htmlFor="zone" className="text-sm font-medium text-gray-700">Zone</label>
              <Field as="select" name="zone" disabled className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm bg-gray-100">
                <option value="">Select Zone</option>
                {geoData.serviceAreas.map((area) => (
                  <option key={area?.id || area?.name} value={area?.name || ""}>
                    {area?.name || ""}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="zone" component="div" className="text-red-500 text-sm my-1" />
            </div>
            <div>
              <label htmlFor="status" className="text-sm font-medium text-gray-700">Status</label>
              <Field as="select" name="status" className="mt-1 p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                <option value="">Select status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">In Active</option>
                {/* <option value="SCHEDULED">Scheduled</option> */}
              </Field>
            </div>
            <div>
              <label htmlFor="effectiveFrom" className="text-sm font-medium text-gray-700">Effective From</label>
              <Field type="datetime-local" name="effectiveFrom" className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label htmlFor="effectiveTo" className="text-sm font-medium text-gray-700">Effective To</label>
              <Field type="datetime-local" name="effectiveTo" className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div className="col-span-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">Description</label>
              <Field as="textarea" name="description" rows="3" className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm" placeholder="Description for this plan group" />
            </div>
            <div className="flex items-center">
              <Field type="checkbox" name="isDefault" className="mr-2 h-4 w-4 text-primary-600 border-gray-300 rounded" />
              <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">Is default</label>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Plan</h3>
            <Button
              type="button"
              color="blue"
              className="px-4 py-2"
              onClick={() =>
                setFieldValue("plans", [
                  ...(values.plans || []),
                  {
                    id: null,
                    serviceType: values.serviceType || "",
                    name: "",
                    type: "",
                    packagePrice: "",
                    price: "",
                    bonusPrice: "",
                    totalPrice: "",
                    validityDays: "",
                    earningStrategy: "",
                    earningWindowDays: "",
                  },
                ])
              }
            >
              + Add Plan
            </Button>
          </div>

          <div className="grid grid-cols-8 gap-2">
            <div className="hidden">
              <label htmlFor="serviceType" className="text-sm font-medium text-gray-700">Service Type</label>
              <Field as="select" name="serviceType" disabled className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm bg-gray-100">
                <option value="">Select Service Type</option>
                <option value="ACTING_DRIVER">Driver</option>
                <option value="RIDES_RENTAL_CABS">Rides/Rental Cabs</option>
                <option value="AUTO">Autos</option>
              </Field>
            </div>
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-700">Plan Name</label>
              <Field as="select" name="name" className="p-2 w-full rounded-md border-gray-300 shadow-sm">
                <option value="">Select Plan Name</option>
                <option value="Premium">Premium</option>
                <option value="Standard">Standard</option>
                <option value="Regular">Regular</option>
              </Field>
              <ErrorMessage name="name" component="div" className="text-red-500 text-sm my-1" />
            </div>
            <div>
              <label htmlFor="type" className="text-sm font-medium text-gray-700">Type</label>
              <Field as="select" name="type" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                <option value="">Select Type</option>
                <option value="FREE">Free</option>
                <option value="PAID">Paid</option>
              </Field>
              <ErrorMessage name="type" component="div" className="text-red-500 text-sm my-1" />
            </div>
            <div>
              <label htmlFor="packagePrice" className="text-sm font-medium text-gray-700">Price</label>
              <Field type="number" name="packagePrice" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
              <ErrorMessage name="packagePrice" component="div" className="text-red-500 text-sm my-1" />
            </div>
            <div>
              <label htmlFor="price" className="text-sm font-medium text-gray-700">Base Credits</label>
              <Field type="number" name="price" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
              <ErrorMessage name="price" component="div" className="text-red-500 text-sm my-1" />
            </div>
            <div>
              <label htmlFor="bonusPrice" className="text-sm font-medium text-gray-700">Bonus Credits</label>
              <Field type="number" name="bonusPrice" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
              <ErrorMessage name="bonusPrice" component="div" className="text-red-500 text-sm my-1" />
            </div>
            <div>
              <label htmlFor="totalPrice" className="text-sm font-medium text-gray-700">Total Credits</label>
              <Field type="number" name="totalPrice" readOnly className="p-2 w-full rounded-md border-gray-300 shadow-sm bg-gray-100" />
              <ErrorMessage name="totalPrice" component="div" className="text-red-500 text-sm my-1" />
            </div>
            {values.type !== "PAID" && (
              <div>
                <label htmlFor="validityDays" className="text-sm font-medium text-gray-700">Validity (Months)</label>
                <Field type="number" name="validityDays" className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                <ErrorMessage name="validityDays" component="div" className="text-red-500 text-sm my-1" />
              </div>
            )}
            {values.type === "PAID" && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700">Earning Strategy</label>
                  <Field as="select" name="earningStrategy" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                    <option value="">Select Strategy</option>
                    <option value="CREDIT">Credit</option>
                    <option value="UNLIMITED">Unlimited</option>
                  </Field>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Earning Window Days</label>
                  <Field type="number" name="earningWindowDays" className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled={values.earningStrategy !== "UNLIMITED"} placeholder={values.earningStrategy === "UNLIMITED" ? "Enter days" : "Only for Unlimited"} />
                </div>
              </>
            )}
          </div>

          {values.plans && values.plans.length > 0 && (
            <div className="mt-6 space-y-4">
              {values.plans.map((plan, index) => (
                <div key={index} className="grid grid-cols-8 gap-2 border border-gray-200 rounded-lg p-3 bg-blue-gray-50">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Plan Name</label>
                    <Field as="select" name={`plans[${index}].name`} className="p-2 w-full rounded-md border-gray-300 shadow-sm">
                      <option value="">Select Plan Name</option>
                      <option value="Premium">Premium</option>
                      <option value="Standard">Standard</option>
                      <option value="Regular">Regular</option>
                    </Field>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <Field as="select" name={`plans[${index}].type`} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                      <option value="">Select Type</option>
                      <option value="FREE">Free</option>
                      <option value="PAID">Paid</option>
                    </Field>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Price</label>
                    <Field type="number" name={`plans[${index}].packagePrice`} className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Base Credits</label>
                    <Field type="number" name={`plans[${index}].price`} className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bonus Credits</label>
                    <Field type="number" name={`plans[${index}].bonusPrice`} className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Total Credits</label>
                    <Field type="number" name={`plans[${index}].totalPrice`} readOnly className="p-2 w-full rounded-md border-gray-300 bg-gray-100 shadow-sm" />
                  </div>
                  {plan.type !== "PAID" && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Validity (Months)</label>
                      <Field type="number" name={`plans[${index}].validityDays`} className="p-2 w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                  )}
                  {plan.type === "PAID" && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Earning Strategy</label>
                        <Field as="select" name={`plans[${index}].earningStrategy`} className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm">
                          <option value="">Select Strategy</option>
                          <option value="CREDIT">Credit</option>
                          <option value="UNLIMITED">Unlimited</option>
                        </Field>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Earning Window Days</label>
                        <Field type="number" name={`plans[${index}].earningWindowDays`} className="p-2 w-full rounded-md border-gray-300 shadow-sm" disabled={plan.earningStrategy !== "UNLIMITED"} placeholder={plan.earningStrategy === "UNLIMITED" ? "Enter days" : "Only for Unlimited"} />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-row">
        <Button fullWidth onClick={() => navigate("/dashboard/finance/master-subscription")} className="my-6 mx-2 text-black border-2 border-gray-400 bg-white rounded-xl">
          Cancel
        </Button>
        <Button fullWidth color="blue" onClick={handleSubmit} disabled={!dirty || !isValid} className="my-6 mx-2">
          Update
        </Button>
      </div>
    </Form>
  );
}

const MasterSubscriptionEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [geoData, setGeoData] = useState({ serviceAreas: [] });
  const [initialValues, setInitialValues] = useState(initialValuesTemplate);
  const [existingAssignments, setExistingAssignments] = useState([]);

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const serviceAreaResponse = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS, {
          type: "Service Area",
        });
        setGeoData({
          serviceAreas: Array.isArray(serviceAreaResponse?.data) ? serviceAreaResponse.data : [],
        });
      } catch (error) {
        console.error("Error fetching geo data:", error);
      }
    };

    fetchGeoData();
  }, []);

  useEffect(() => {
    const fetchData = async (groupId) => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_MASTER_SUBSCRIPTION_DETAIL, {
          plans: groupId,
          includePlans: true,
          includeAssignments: true
        });

        const numericId = Number(groupId);
        let group = response?.result;
        if (!group && Array.isArray(response?.data)) {
          group = response.data.find((g) => g.id === numericId || g.planGroupId === numericId || g.PlanGroupId === numericId) || response.data[0];
        }

        if (group) {
          const toInputDateTime = (iso) => {
            if (!iso) return "";
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return "";
            return d.toISOString().slice(0, 16);
          };

          const plans = Array.isArray(group.plans) ? group.plans : [];
          const primaryPlan = plans[0] || {};
          const extraPlans = plans.slice(1);
          const assignments = Array.isArray(group.assignments) ? group.assignments : [];

          setInitialValues({
            groupName: group.name || "",
            description: group.description || "",
            serviceType: group.serviceType || "",
            assignmentType: group.assignments?.[0]?.assignmentType || "",
            assignmentValue: group.assignments?.[0]?.assignmentValue || "",
            priority: group.priority ?? "",
            zone: group.zone || group.metadata?.zone || "",
            status: group.status || "",
            effectiveFrom: toInputDateTime(group.effectiveFrom),
            effectiveTo: toInputDateTime(group.effectiveTo),
            isDefault: Boolean(group.metadata?.isDefault),
            primaryPlanId: primaryPlan.id ?? null,
            packagePrice: primaryPlan.packagePrice || 0,
            price: primaryPlan.price || 0,
            name: primaryPlan.name || "",
            bonusPrice: primaryPlan.bonusPrice || 0,
            totalPrice: primaryPlan.totalPrice || 0,
            type: primaryPlan.type || "",
            validityDays: primaryPlan.type === "PAID" ? "" : primaryPlan.validityDays ?? "",
            earningStrategy: primaryPlan.type === "PAID" ? primaryPlan.earningStrategy || "" : "",
            earningWindowDays: primaryPlan.type === "PAID" && primaryPlan.earningStrategy === "UNLIMITED" ? primaryPlan.earningWindowDays ?? "" : "",
            plans: extraPlans.map((p) => ({
              id: p.id,
              serviceType: p.serviceType || group.serviceType || "",
              name: p.name || "",
              type: p.type || "",
              packagePrice: p.packagePrice || 0,
              price: p.price || 0,
              bonusPrice: p.bonusPrice || 0,
              totalPrice: p.totalPrice || 0,
              validityDays: p.type === "PAID" ? "" : p.validityDays ?? "",
              earningStrategy: p.type === "PAID" ? p.earningStrategy || "" : "",
              earningWindowDays: p.type === "PAID" && p.earningStrategy === "UNLIMITED" ? p.earningWindowDays ?? "" : "",
            })),
          });
          setExistingAssignments(assignments);
        }
      } catch (error) {
        console.error("Error fetching subscription details:", error);
      }
    };

    if (id) {
      fetchData(id);
    }
  }, [id]);

  const onSubmit = async (values) => {
    try {
      const primaryPlan = {
        planId: values.primaryPlanId || id,
        price: Number(values.price) || 0,
        packagePrice: Number(values.packagePrice) || 0,
        serviceType: values.serviceType || "",
        zone: values.zone || "",
        name: values.name || "",
        bonusPrice: Number(values.bonusPrice) || 0,
        totalPrice: Number(values.totalPrice) || 0,
        validityDays: values.type === "PAID" ? null : Number(values.validityDays || 0),
        type: values.type,
        earningStrategy: values.type === "FREE" ? "CREDIT" : values.earningStrategy || null,
        earningWindowDays: values.type !== "FREE" && values.earningStrategy === "UNLIMITED" ? Number(values.earningWindowDays || 0) : null,
      };

      const extraPlans = Array.isArray(values.plans)
        ? values.plans
          .filter((plan) =>
            plan.serviceType ||
            plan.name ||
            plan.type ||
            plan.packagePrice ||
            plan.price ||
            plan.bonusPrice ||
            plan.totalPrice ||
            plan.validityDays ||
            plan.earningStrategy
          )
          .map((plan) => ({
            planId: plan.id || undefined,
            price: Number(plan.price || 0),
            packagePrice: Number(plan.packagePrice || 0),
            serviceType: plan.serviceType || "",
            zone: values.zone || "",
            name: plan.name || "",
            bonusPrice: Number(plan.bonusPrice || 0),
            totalPrice: Number(plan.totalPrice || 0),
            validityDays: plan.type === "PAID" ? null : Number(plan.validityDays || 0),
            type: plan.type || "",
            earningStrategy: plan.type === "FREE" ? "CREDIT" : plan.earningStrategy || null,
            earningWindowDays: plan.type !== "FREE" && plan.earningStrategy === "UNLIMITED" ? Number(plan.earningWindowDays || 0) : null,
          }))
        : [];

      const preservedAssignments = existingAssignments.slice(1);
      const reqBody = {
        planGroupId: Number(id),
        planGroup: {
          name: values.groupName || "",
          description: values.description || "",
          serviceType: values.serviceType || "",
          zone: values.zone || "",
          status: values.status || "ACTIVE",
          metadata: { isDefault: values.isDefault || false },
          effectiveFrom: values.effectiveFrom || "",
          effectiveTo: values.effectiveTo || "",
          priority: Number(values.priority) || 0,
        },
        plans: [primaryPlan, ...extraPlans],
        assignments: [
          {
            assignmentType: values.assignmentType || "TIER",
            assignmentValue: values.assignmentValue || "",
            status: values.status || "ACTIVE",
            // priority: Number(values.priority) || 0,
          },
          ...preservedAssignments,
        ],
      };

      const response = await ApiRequestUtils.update(API_ROUTES.MASTER_SUBSCRIPTION_EDIT, reqBody);
      if (response?.success) {
        navigate("/dashboard/finance/master-subscription");
      }
    } catch (error) {
      console.error("Error updating master subscription:", error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Master Subscription Edit</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={SUBSCRIPTION_EDIT_SCHEME}
        onSubmit={onSubmit}
        enableReinitialize={true}
      >
        {(formikProps) => (
          <MasterSubscriptionEditForm
            {...formikProps}
            geoData={geoData}
            navigate={navigate}
          />
        )}
      </Formik>
    </div>
  );
};

export default MasterSubscriptionEdit;