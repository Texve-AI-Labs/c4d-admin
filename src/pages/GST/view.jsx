import { ACCEPT_WINDOW_TYPE, ACCEPT_WINDOW_PATH, SERVICE_TYPES, ACCEPT_WINDOW_LABELS } from "./futureBookingAcceptWindowConfig.js";
import { POLICY_CATEGORIES } from "./luggagePolicyConfig.js";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Card, CardHeader, CardBody, Typography, Button,
  Spinner,
} from '@material-tailwind/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';

const GstView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [gstList, setGstList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [selectedType, setSelectedType] = useState(location.state?.selectedType || "GST");
  const latestRequestRef = useRef(0);
  const tabs = [
    { key: "GST", label: "Gst" },
    { key: "DRIVER_FEEDBACK", label: "Driver Feedback" },
    { key: "LUGGAGE_POLICY", label: "Luggage Policy" },
    { key: "DISTANCE_RULE", label: "Distance Rule"},
    { key: ACCEPT_WINDOW_TYPE, label: "Future Booking Accept Window" },
  ];
  const isAcceptWindow = selectedType === ACCEPT_WINDOW_TYPE;
  const isDriverFeedback = selectedType === "DRIVER_FEEDBACK";
  const isLuggagePolicy = selectedType === "LUGGAGE_POLICY";
  const isDistanceRule = selectedType === "DISTANCE_RULE";
  const activeTab = useMemo(
    () => tabs.find((tab) => tab.key === selectedType) || tabs[0],
    [selectedType]
  );

  const formatLabel = (value) => {
    const text = String(value || "").trim();
    if (!text) return "-";
    if (!text.includes("_")) return text.toLowerCase();

    return text
      .split("_")
      .filter(Boolean)
      .map((word) => {
        const lowerWord = word.toLowerCase();
        if (lowerWord === "feedback") return "FeedBack";
        return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
      })
      .join(" ");
  };

  useEffect(() => {
    const fetchGstData = async () => {
      const requestId = latestRequestRef.current + 1;
      latestRequestRef.current = requestId;
      try {
        setLoading(true);
        setListError("");
        const queryType = activeTab?.key === "LUGGAGE_POLICY" ? "TERMS_AND_CONDITIONS" : activeTab?.key;
        const res = await ApiRequestUtils.getWithQueryParam(`${API_ROUTES.GET_GST}?type=${queryType}`);
        if (latestRequestRef.current !== requestId) {
          return;
        }

        if (activeTab?.key === ACCEPT_WINDOW_TYPE && (!res?.success || !Array.isArray(res.data))) throw new Error(res?.message || "Unable to load configuration");
        let list = Array.isArray(res?.data) ? res.data : [];
        if (activeTab?.key === ACCEPT_WINDOW_TYPE) list = list.filter((item) => item.type === ACCEPT_WINDOW_TYPE);

        if (activeTab?.key === "GST") {
          list = list.filter((item) => item?.type === "GST");
        } else if (activeTab?.key === "DRIVER_FEEDBACK") {
          list = list.filter((item) => item?.type === "DRIVER_FEEDBACK");
        } else if (activeTab?.key === "LUGGAGE_POLICY") {
          list = list.filter((item) => item?.type === "TERMS_AND_CONDITIONS");
        } else if (activeTab?.key === "DISTANCE_RULE") {
          list = list.filter ((item) => item?.type === "DISTANCE_RULE");
        }

      
        const updated = location.state?.updatedGst;
        if (updated) {
          list = list.map((item) => (item.id === updated.id ? updated : item));
        }

        setGstList(list);
      } catch (error) {
        if (latestRequestRef.current !== requestId) {
          return;
        }
        console.error('Failed to fetch GST list:', error);
        setListError("Unable to load settings. Please refresh to try again.");
        setGstList([]);
      } finally {
        if (latestRequestRef.current === requestId) {
          setLoading(false);
        }
      }
    };

    fetchGstData();
  }, [location.state, activeTab]);

  return (
    <div className="mt-8 flex flex-col gap-12">
      <Card>
        <CardHeader className="mb-8 p-6 flex justify-between items-center bg-primary">
          <Typography variant="h6" color="white">Settings List</Typography>
        {!isLuggagePolicy && (!isDistanceRule || gstList.length === 0) && (!isAcceptWindow || (!loading && !listError && activeTab.key === ACCEPT_WINDOW_TYPE && gstList.length === 0)) && (
        <button
          onClick={() =>
            navigate(
              isAcceptWindow
                ? `${ACCEPT_WINDOW_PATH}/add`
                : isDriverFeedback
                ? "/dashboard/finance/driver-feedback/add"
                : isDistanceRule
                  ? "/dashboard/finance/distance-rule/add"
                : "/dashboard/finance/GST/add"
            )
          }
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100"
        >
          Add new
        </button>
        )}
        </CardHeader>

        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          <div className="px-6 pb-4">
            <div
              role="tablist"
              aria-label="Settings type tabs"
              className="flex w-full gap-2 overflow-x-auto rounded-2xl border border-blue-gray-100 bg-white p-2 shadow-sm"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={selectedType === tab.key}
                  onClick={() => { if (selectedType !== tab.key) { setLoading(true); setSelectedType(tab.key); } }}
                  className={`min-w-max flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                    selectedType === tab.key
                      ? "border-primary bg-primary text-white shadow"
                      : "border-transparent bg-blue-gray-50 text-blue-gray-700 hover:border-blue-gray-200 hover:bg-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {listError && <div role="alert" className="px-6 pb-4 text-red-600">{listError}</div>}
          {loading ? (
             <div className="flex flex-col items-center justify-center py-10">
    <Spinner className="h-10 w-10 mb-2" />
    
  </div>
          ) : (
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="py-3 px-3 text-left align-top whitespace-nowrap">Service Type</th>
                  <th className="py-3 px-3 text-left align-top whitespace-nowrap">Name</th>
                  {/* {!isDriverFeedback && !isLuggagePolicy && !isAcceptWindow && (
                  <th className='py-3 px-3 align-top text-left'>Customer</th>
                  )}
                  {!isDriverFeedback && !isLuggagePolicy && !isAcceptWindow && (
                  <th className='py-3 px-3 align-top text-left'>Driver</th>
                  )} */}
                  {!isDistanceRule && (
                  <th className="py-3 px-3 text-left align-top whitespace-nowrap">Description</th>
                  )}
                  {isDistanceRule ? (
                  <th className="py-3 px-3 text-left align-top whitespace-nowrap">Default Threshold</th>
                  ) : !isDriverFeedback && !isLuggagePolicy && !isAcceptWindow && (
                  <th className="py-3 px-3 text-left align-top whitespace-normal">Total TAX (%)</th>
                  )}
                  {isDistanceRule && (
                  <th className="py-3 px-3 text-left align-top whitespace-nowrap">Service Area Rules</th>
                  )}
                  {isLuggagePolicy && POLICY_CATEGORIES.map(({ category }) => (
                    <th key={category} className="py-3 px-3 text-left align-top whitespace-nowrap">{category}<span className="block text-xs font-normal">Seats / Luggage</span></th>
                  ))}
                  {isAcceptWindow && ["Default Minutes", "Service Type Minutes"].map((label) => (
                    <th key={label} className="py-3 px-3 text-left align-top whitespace-nowrap">{label}</th>
                  ))}
                  <th className="py-3 px-3 text-left align-top whitespace-nowrap">Status</th>
                  <th className="py-3 px-3 text-left align-top whitespace-nowrap">Actions</th>

                </tr>
              </thead>
              <tbody>
                {gstList.length === 0 ? (
                  <tr>
                    <td colSpan={isLuggagePolicy ? 9 : isAcceptWindow ? 7 : isDriverFeedback ? 5 : 6} className="text-center py-4 whitespace-nowrap">No Settings Entries Found</td>
                  </tr>
                ) : (
                  gstList.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-3 align-top whitespace-normal break-words">{(item.serviceType)}</td>
                      <td className="max-w-[220px] py-3 px-3 align-top whitespace-normal break-words">{formatLabel(item.name)}</td>
                      {/* {!isDriverFeedback && !isLuggagePolicy && !isAcceptWindow && (
                      <td className='py-3 px-3 align-top'>{item.customer||'-'}</td>
                      )}
                      {!isDriverFeedback && !isLuggagePolicy && !isAcceptWindow && (
                      <td className='py-3 px-3 align-top'>{item.driver||'-'}</td>
                      )} */}
                      {!isDistanceRule && (
                      <td className="max-w-xs py-3 px-3 align-top whitespace-normal break-words">{item?.config?.description || item?.description || '-'}</td>
                      )}
                      {isDistanceRule ? (
                      <td className="py-3 px-3 align-top whitespace-normal break-words">{item.config?.thresholdKm ? `${item.config.thresholdKm} KM` : '-'}</td>
                      ) : !isDriverFeedback && !isLuggagePolicy && !isAcceptWindow && (
                      <td className="py-3 px-3 align-top whitespace-normal break-words">{item.config?.totalGst}%</td>
                      )}
                      {isDistanceRule && (
                      <td className="py-3 px-3 align-top whitespace-normal break-words">
                        {Array.isArray(item.config?.serviceAreaRules) && item.config.serviceAreaRules.length
                          ? item.config.serviceAreaRules.map((rule) => `${rule.serviceAreaName}: ${rule.thresholdKm} KM`).join(', ')
                          : '-'}
                      </td>
                      )}
                      {isLuggagePolicy && POLICY_CATEGORIES.map(({ category }) => (
                        <td key={category} className="py-3 px-3 align-top whitespace-normal break-words">
                          {item.config?.seaterCapacity?.categories?.[category] ?? "-"} / {item.config?.luggageCapacity?.categories?.[category] ?? "-"}
                        </td>
                      ))}
                      {isAcceptWindow && <>
                        <td className="py-3 px-3 align-top">{item.config?.defaultMinutes ?? "-"}</td>
                        <td className="py-3 px-3 align-top">
                          {["byBookingType", "byServiceType"].map((group) => (
                            <React.Fragment key={group}>
                              {Object.entries(item.config?.[group] || {}).filter(([key]) => group !== "byServiceType" || SERVICE_TYPES.includes(key)).map(([key, minutes]) => <div key={key}>{ACCEPT_WINDOW_LABELS[key] || key}: {minutes}</div>)}
                            </React.Fragment>
                          ))}
                        </td>
                      </>}
                      <td className="py-3 px-3 align-top whitespace-normal break-words">
                        {item.isActive
                          ? <span className="text-green-600 font-semibold">Active</span>
                          : <span className="text-red-600 font-semibold">Inactive</span>}
                      </td>
                      <td className="py-3 px-3 align-top whitespace-normal break-words">
                        <Button
                          onClick={() =>
                            navigate(
                              isAcceptWindow
                                ? `${ACCEPT_WINDOW_PATH}/edit/${item.id}`
                                : isDriverFeedback
                                ? `/dashboard/finance/driver-feedback/edit/${item.id}`
                                : isLuggagePolicy
                                  ? `/dashboard/finance/luggage-policy/edit/${item.id}`
                                  : isDistanceRule
                                    ? `/dashboard/finance/distance-rule/edit/${item.id}`
                                : `/dashboard/finance/GST/edit/${item.id}`,
                              {
                              state: { gst: item },
                              }
                            )
                          }
                          size="sm"
                          className="bg-primary-500 text-white px-3 py-1 rounded hover:bg-primary-600"
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default GstView;