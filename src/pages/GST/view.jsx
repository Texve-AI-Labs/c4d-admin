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

  useEffect(() => {
    const fetchGstData = async () => {
      try {
        setLoading(true);
        const res = await ApiRequestUtils.getWithQueryParam(`${API_ROUTES.GET_GST}?type=${selectedType}`);
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
  }, [location.state, selectedType]);

  return (
    <div className="mb-8 flex flex-col gap-12">
      <div className="flex items-center justify-end">
        <button
          onClick={() =>
            navigate(
              selectedType === "DRIVER_FEEDBACK"
                ? "/dashboard/finance/driver-feedback/add"
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
            <div className="inline-flex rounded-xl bg-gray-100 p-1">
            <button
                type="button"
                role="tab"
                aria-selected={selectedType === "GST"}
              onClick={() => setSelectedType("GST")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  selectedType === "GST"
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
            >
              Gst
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={selectedType === "DRIVER_FEEDBACK"}
              onClick={() => setSelectedType("DRIVER_FEEDBACK")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  selectedType === "DRIVER_FEEDBACK"
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
            >
              Driver Feedback
            </button>
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
                  {selectedType !== "DRIVER_FEEDBACK" && (
                  <th className='py-3 px-5 text-left'>Customer</th>
                  )}
                  {selectedType !== "DRIVER_FEEDBACK" && (
                  <th className='py-3 px-5 text-left'>Driver</th>
                  )}
                  {selectedType !== "DRIVER_FEEDBACK" && (
                  <th className="py-3 px-5 text-left">Description</th>
                  )}
                  {selectedType !== "DRIVER_FEEDBACK" && (
                  <th className="py-3 px-5 text-left">Total TAX (%)</th>
                  )}
                  <th className="py-3 px-5 text-left">Status</th>
                  <th className="py-3 px-5 text-left">Actions</th>

                </tr>
              </thead>
              <tbody>
                {gstList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">No TAX Entries Found</td>
                  </tr>
                ) : (
                  gstList.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-5">{item.serviceType}</td>
                      <td className="py-3 px-5">{item.name}</td>
                      {selectedType !== "DRIVER_FEEDBACK" && (
                      <td className='py-3 px-5'>{item.customer||'-'}</td>
                      )}
                      {selectedType !== "DRIVER_FEEDBACK" && (
                      <td className='py-3 px-5'>{item.driver||'-'}</td>
                      )}
                      <td className="py-3 px-5">{item.description||'-'}</td>
                      {selectedType !== "DRIVER_FEEDBACK" && (
                      <td className="py-3 px-5">{item.config?.totalGst}%</td>
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
                              selectedType === "DRIVER_FEEDBACK"
                                ? `/dashboard/finance/driver-feedback/edit/${item.id}`
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
