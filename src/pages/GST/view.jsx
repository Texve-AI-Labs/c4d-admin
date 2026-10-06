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
  const [selectedType, setSelectedType] = useState(location.state?.selectedType || "GST");
  const latestRequestRef = useRef(0);
  const tabs = [
    { key: "GST", label: "Gst" },
    { key: "DRIVER_FEEDBACK", label: "Driver Feedback" },
    { key: "LUGGAGE_POLICY", label: "Luggage Policy" },
    { key: "DISTANCE_RULE", label: "Distance Rule"},
  ];
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
        const queryType = activeTab?.key === "LUGGAGE_POLICY" ? "TERMS_AND_CONDITIONS" : activeTab?.key;
        const res = await ApiRequestUtils.getWithQueryParam(`${API_ROUTES.GET_GST}?type=${queryType}`);
        if (latestRequestRef.current !== requestId) {
          return;
        }

        let list = Array.isArray(res?.data) ? res.data : [];

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
    <div className="mb-8 flex flex-col gap-12">
      <div className="flex items-center justify-end">
        {!isLuggagePolicy && (!isDistanceRule || gstList.length === 0) && (
        <button
          onClick={() =>
            navigate(
              isDriverFeedback
                ? "/dashboard/finance/driver-feedback/add"
                : isDistanceRule
                  ? "/dashboard/finance/distance-rule/add"
                // : isLuggagePolicy
                //   ? "/dashboard/finance/luggage-policy/add"
                : "/dashboard/finance/GST/add"
            )
          }
          className="ml-4 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-700"
        >
          Add new
        </button>
        )}
      </div>

      <Card>
  <CardHeader className="mb-8 p-6 flex justify-between items-center bg-primary">
          <Typography variant="h6" color="white">Settings  List</Typography>
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
                  onClick={() => setSelectedType(tab.key)}
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
          {loading ? (
             <div className="flex flex-col items-center justify-center py-10">
    <Spinner className="h-10 w-10 mb-2" />
    
  </div>
          ) : (
            <table className="w-full min-w-[1000px] table-auto whitespace-nowrap">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="py-3 px-5 text-left whitespace-nowrap">Service Type</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Name</th>
                  {/* {!isDriverFeedback && !isLuggagePolicy && (
                  <th className='py-3 px-5 text-left'>Customer</th>
                  )}
                  {!isDriverFeedback && !isLuggagePolicy && (
                  <th className='py-3 px-5 text-left'>Driver</th>
                  )} */}
                  {!isDistanceRule && (
                  <th className="py-3 px-5 text-left whitespace-nowrap">Description</th>
                  )}
                  {isDistanceRule ? (
                  <th className="py-3 px-5 text-left whitespace-nowrap">Default Threshold</th>
                  ) : !isDriverFeedback && !isLuggagePolicy && (
                  <th className="py-3 px-5 text-left whitespace-nowrap">Total TAX (%)</th>
                  )}
                  {isDistanceRule && (
                  <th className="py-3 px-5 text-left whitespace-nowrap">Service Area Rules</th>
                  )}
                  {isLuggagePolicy && (
                  <th className="py-3 px-5 text-left whitespace-nowrap">Mini</th>
                  )}
                  {isLuggagePolicy && (
                  <th className="py-3 px-5 text-left whitespace-nowrap">Sedan</th>
                  )}
                  {isLuggagePolicy && (
                  <th className="py-3 px-5 text-left whitespace-nowrap">SUV</th>
                  )}
                  {isLuggagePolicy && (
                  <th className="py-3 px-5 text-left whitespace-nowrap">MUV</th>
                  )}
                  <th className="py-3 px-5 text-left whitespace-nowrap">Status</th>
                  <th className="py-3 px-5 text-left whitespace-nowrap">Actions</th>

                </tr>
              </thead>
              <tbody>
                {gstList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 whitespace-nowrap">No Settings Entries Found</td>
                  </tr>
                ) : (
                  gstList.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-5 whitespace-nowrap">{formatLabel(item.serviceType)}</td>
                      <td className="py-3 px-5 whitespace-nowrap">{formatLabel(item.name)}</td>
                      {/* {!isDriverFeedback && !isLuggagePolicy && (
                      <td className='py-3 px-5'>{item.customer||'-'}</td>
                      )}
                      {!isDriverFeedback && !isLuggagePolicy && (
                      <td className='py-3 px-5'>{item.driver||'-'}</td>
                      )} */}
                      {!isDistanceRule && (
                      <td className="py-3 px-5 whitespace-nowrap">{item?.config?.description || item?.description || '-'}</td>
                      )}
                      {isDistanceRule ? (
                      <td className="py-3 px-5 whitespace-nowrap">{item.config?.thresholdKm ? `${item.config.thresholdKm} KM` : '-'}</td>
                      ) : !isDriverFeedback && !isLuggagePolicy && (
                      <td className="py-3 px-5 whitespace-nowrap">{item.config?.totalGst}%</td>
                      )}
                      {isDistanceRule && (
                      <td className="py-3 px-5 whitespace-nowrap">
                        {Array.isArray(item.config?.serviceAreaRules) && item.config.serviceAreaRules.length
                          ? item.config.serviceAreaRules.map((rule) => `${rule.serviceAreaName}: ${rule.thresholdKm} KM`).join(', ')
                          : '-'}
                      </td>
                      )}
                      {isLuggagePolicy && (
                      <td className="py-3 px-5 whitespace-nowrap">{item?.config?.luggageCapacity?.mini ?? "-"}</td>
                      )}
                      {isLuggagePolicy && (
                      <td className="py-3 px-5 whitespace-nowrap">{item?.config?.luggageCapacity?.sedan ?? "-"}</td>
                      )}
                      {isLuggagePolicy && (
                      <td className="py-3 px-5 whitespace-nowrap">{item?.config?.luggageCapacity?.suv ?? "-"}</td>
                      )}
                      {isLuggagePolicy && (
                      <td className="py-3 px-5 whitespace-nowrap">{item?.config?.luggageCapacity?.muv ?? "-"}</td>
                      )}
                      <td className="py-3 px-5 whitespace-nowrap">
                        {item.isActive
                          ? <span className="text-green-600 font-semibold">Active</span>
                          : <span className="text-red-600 font-semibold">Inactive</span>}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        <Button
                          onClick={() =>
                            navigate(
                              isDriverFeedback
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