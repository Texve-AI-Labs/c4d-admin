import React, { useEffect, useState } from 'react';
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
  const [selectedType, setSelectedType] = useState("GST");
  const tabs = [
    { key: "GST", label: "Gst" },
    { key: "DRIVER_FEEDBACK", label: "Driver Feedback" },
    { key: "LUGGAGE_POLICY", label: "Luggage Policy" },
  ];
  const isDriverFeedback = selectedType === "DRIVER_FEEDBACK";
  const isLuggagePolicy = selectedType === "LUGGAGE_POLICY";

  useEffect(() => {
    const fetchGstData = async () => {
      try {
        setLoading(true);
        const queryType = isLuggagePolicy ? "TERMS_AND_CONDITIONS" : selectedType;
        const res = await ApiRequestUtils.getWithQueryParam(`${API_ROUTES.GET_GST}?type=${queryType}`);
        let list = res?.data || [];

      
        const updated = location.state?.updatedGst;
        if (updated) {
          list = list.map((item) => (item.id === updated.id ? updated : item));
        }

        setGstList(list);
      } catch (error) {
        console.error('Failed to fetch GST list:', error);
        setGstList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGstData();
  }, [location.state, selectedType, isLuggagePolicy]);

  return (
    <div className="mb-8 flex flex-col gap-12">
      <div className="flex items-center justify-end">
        <button
          onClick={() =>
            navigate(
              isDriverFeedback
                ? "/dashboard/finance/driver-feedback/add"
                : isLuggagePolicy
                  ? "/dashboard/finance/luggage-policy/add"
                : "/dashboard/finance/GST/add"
            )
          }
          className="ml-4 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-700"
        >
          Add new
        </button>
      </div>

      <Card>
  <CardHeader className="mb-8 p-6 flex justify-between items-center bg-primary">
          <Typography variant="h6" color="white">Settings  List</Typography>
        </CardHeader>

        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          <div className="px-6 pb-4">
            <div className="flex w-full rounded-xl bg-gray-100 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                type="button"
                role="tab"
                aria-selected={selectedType === tab.key}
              onClick={() => setSelectedType(tab.key)}
                className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  selectedType === tab.key
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-200"
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
            <table className="w-full min-w-[1000px] table-auto">
              <thead>
                <tr>
                  <th className="py-3 px-5 text-left">Service Type</th>
                  <th className="py-3 px-5 text-left">Name</th>
                  {/* {!isDriverFeedback && !isLuggagePolicy && (
                  <th className='py-3 px-5 text-left'>Customer</th>
                  )}
                  {!isDriverFeedback && !isLuggagePolicy && (
                  <th className='py-3 px-5 text-left'>Driver</th>
                  )} */}
                  <th className="py-3 px-5 text-left">Description</th>
                  {!isDriverFeedback && !isLuggagePolicy && (
                  <th className="py-3 px-5 text-left">Total TAX (%)</th>
                  )}
                  {isLuggagePolicy && (
                  <th className="py-3 px-5 text-left">Mini</th>
                  )}
                  {isLuggagePolicy && (
                  <th className="py-3 px-5 text-left">Sedan</th>
                  )}
                  {isLuggagePolicy && (
                  <th className="py-3 px-5 text-left">SUV</th>
                  )}
                  {isLuggagePolicy && (
                  <th className="py-3 px-5 text-left">MUV</th>
                  )}
                  <th className="py-3 px-5 text-left">Status</th>
                  <th className="py-3 px-5 text-left">Actions</th>

                </tr>
              </thead>
              <tbody>
                {gstList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">No Settings Entries Found</td>
                  </tr>
                ) : (
                  gstList.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-5">{item.serviceType}</td>
                      <td className="py-3 px-5">{item.name}</td>
                      {/* {!isDriverFeedback && !isLuggagePolicy && (
                      <td className='py-3 px-5'>{item.customer||'-'}</td>
                      )}
                      {!isDriverFeedback && !isLuggagePolicy && (
                      <td className='py-3 px-5'>{item.driver||'-'}</td>
                      )} */}
                      <td className="py-3 px-5">{item?.config?.description || item?.description || '-'}</td>
                      {!isDriverFeedback && !isLuggagePolicy && (
                      <td className="py-3 px-5">{item.config?.totalGst}%</td>
                      )}
                      {isLuggagePolicy && (
                      <td className="py-3 px-5">{item?.config?.luggageCapacity?.mini ?? "-"}</td>
                      )}
                      {isLuggagePolicy && (
                      <td className="py-3 px-5">{item?.config?.luggageCapacity?.sedan ?? "-"}</td>
                      )}
                      {isLuggagePolicy && (
                      <td className="py-3 px-5">{item?.config?.luggageCapacity?.suv ?? "-"}</td>
                      )}
                      {isLuggagePolicy && (
                      <td className="py-3 px-5">{item?.config?.luggageCapacity?.muv ?? "-"}</td>
                      )}
                      <td className="py-3 px-5">
                        {item.isActive
                          ? <span className="text-green-600 font-semibold">Active</span>
                          : <span className="text-red-600 font-semibold">Inactive</span>}
                      </td>
                      <td className="py-3 px-5">
                        <Button
                          onClick={() =>
                            navigate(
                              isDriverFeedback
                                ? `/dashboard/finance/driver-feedback/edit/${item.id}`
                                : isLuggagePolicy
                                  ? `/dashboard/finance/luggage-policy/edit/${item.id}`
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