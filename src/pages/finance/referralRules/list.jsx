import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardBody, Typography, Spinner, Button, Chip } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";

const REFERRAL_RULE_LABELS = {
  DRIVER_TO_DRIVER: "Driver to Driver",
  DRIVER_TO_CUSTOMER: "Driver to Customer",
  CUSTOMER_TO_CUSTOMER: "Customer to Customer",
};

const TRIGGER_EVENT_LABELS = {
  DRIVER_VERIFIED: "Driver Verified",
  CUSTOMER_FIRST_TRIP: "Customer First Trip",
};

const TYPE_LABELS = {
  DRIVER: "Driver",
  CUSTOMER: "Customer",
};

const ReferralRuleList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await ApiRequestUtils.get(API_ROUTES.GET_REFERRAL_RULE);
      const list = Array.isArray(response?.data) ? response.data : [];
      setItems(list);
    } catch (error) {
      console.error("Failed to fetch referral rules:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const rows = useMemo(
    () =>
      items.map((item) => ({
        id: item?.settingId || item?.id || item?._id,
        name: REFERRAL_RULE_LABELS[item?.name] || item?.name || "-",
        description: item?.description || "-",
        referrerAmount: item?.config?.referrerAmount ?? "-",
        referredAmount: item?.config?.referredAmount ?? "-",
        triggerEvent: TRIGGER_EVENT_LABELS[item?.config?.triggerEvent] || item?.config?.triggerEvent || "-",
        referrerType: TYPE_LABELS[item?.config?.referrerType] || item?.config?.referrerType || "-",
        referredType: TYPE_LABELS[item?.config?.referredType] || item?.config?.referredType || "-",
        enabled: Boolean(item?.config?.enabled),
        isActive: Boolean(item?.isActive),
        createdAt: item?.created_at || item?.createdAt,
        raw: item,
      })),
    [items]
  );

  return (
    <div className="mb-8 flex flex-col gap-6 mt-8 bg-white pb-2 rounded-xl">
      <div className="flex justify-end mb-8 mt-2">
        <Button
          size="sm"
          className={`rounded-xl p-4 ${ColorStyles.continueButtonColor}`}
          onClick={() => navigate("/dashboard/finance/referral-rules/add")}
        >
          Add Referral Rule
        </Button>
      </div>
      <Card>
        <CardHeader variant="gradient" className={`mb-4 p-6 rounded-xl ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">
            Referral Rules
          </Typography>
        </CardHeader>
        <CardBody className="pt-0 px-0">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Spinner className="h-12 w-12" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] table-auto">
                <thead>
                  <tr>
                    <th className="py-3 px-5 text-left whitespace-nowrap">Name</th>
                    <th className="py-3 px-5 text-left whitespace-nowrap">Description</th>
                    <th className="py-3 px-5 text-left whitespace-nowrap">Referrer Amount</th>
                    {/* <th className="py-3 px-5 text-left">Referred Amount</th> */}
                    {/* <th className="py-3 px-5 text-left whitespace-nowrap">Trigger Event</th>
                    <th className="py-3 px-5 text-left whitespace-nowrap">Referrer Type</th>
                    <th className="py-3 px-5 text-left whitespace-nowrap">Referred Type</th> */}
                    {/* <th className="py-3 px-5 text-left whitespace-nowrap">Enabled</th> */}
                    <th className="py-3 px-5 text-left whitespace-nowrap">Status</th>
                    <th className="py-3 px-5 text-left whitespace-nowrap">Created At</th>
                    <th className="py-3 px-5 text-left whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-4 px-5 text-center text-gray-600 whitespace-nowrap">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id || row.name} className="border-b">
                        <td className="py-3 px-5 whitespace-nowrap">{row.name}</td>
                        <td className="py-3 px-5 whitespace-nowrap">{row.description}</td>
                        <td className="py-3 px-5 whitespace-nowrap">₹ {row.referrerAmount}</td>
                        {/* <td className="py-3 px-5">{row.referredAmount}</td> */}
                        {/* <td className="py-3 px-5 whitespace-nowrap">{row.triggerEvent}</td>
                        <td className="py-3 px-5 whitespace-nowrap">{row.referrerType}</td>
                        <td className="py-3 px-5 whitespace-nowrap">{row.referredType}</td> */}
                        {/* <td className="py-3 px-5">
                          <Chip
                            variant="ghost"
                            color={row.enabled ? "green" : "blue-gray"}
                            value={row.enabled ? "Enabled" : "Disabled"}
                            className="w-fit"
                          />
                        </td> */}
                        <td className="py-3 px-5">
                          <Chip
                            variant="ghost"
                            color={row.isActive ? "green" : "blue-gray"}
                            value={row.isActive ? "Active" : "Inactive"}
                            className="w-fit"
                          />
                        </td>
                        <td className="py-3 px-5 whitespace-nowrap">
                          {row.createdAt ? moment(row.createdAt).format("DD-MM-YYYY / hh:mm A") : "-"}
                        </td>
                        <td className="py-3 px-5 whitespace-nowrap">
                          <Button
                            size="sm"
                            className={`rounded-xl ${ColorStyles.continueButtonColor}`}
                            onClick={() =>
                              navigate(`/dashboard/finance/referral-rules/edit/${row.id}`, {
                                state: { referralRule: row.raw },
                              })
                            }
                            disabled={!row.id}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default ReferralRuleList;
