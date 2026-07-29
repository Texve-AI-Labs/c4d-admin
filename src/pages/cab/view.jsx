import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Button,
  Alert
} from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CabSearch from '@/components/CabSearch';
import { safeText } from "@/utils/text";

export function CabView() {
  const [cabs, setCabs] = useState([]);
  const [allCabs, setAllCabs] = useState([]);
  const [alert, setAlert] = useState(false);

  const location = useLocation();
  const paramsPassed = location.state;

  const navigate = useNavigate();

    const fetchCabs = async () => {
      const data = await ApiRequestUtils.get(API_ROUTES.GET_ALL_CABS);
      if(data?.success) {
        setCabs(data?.data);
        setAllCabs(data?.data);
      }
    };
    useEffect(() => {
      fetchCabs();
    
  },[]);

  const getCabs = async (searchQuery) => {
    //console.log("searchQuery",searchQuery);
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();

      const filteredCabs = allCabs.filter((cab) => {
        const name = (cab.name || "").toLowerCase();
        const phone = (cab.phoneNumber || "").toLowerCase();

        const phoneNumberWithoutCountryCode = phone.startsWith("+91") ? phone.slice(3) : phone;

        return name.startsWith(query) ||
          phoneNumberWithoutCountryCode.startsWith(query);
      });
      setCabs(filteredCabs);
      // const data = await ApiRequestUtils.get(API_ROUTES.GET_ALL_CUSTOMERS+`?phoneNumber=${searchQuery}`);
      // if (data?.success) {
      //   setDrivers(data?.data);
      // }
    } else {
      setCabs(allCabs);
    }
  };
  const updateCabs = async (cabId, status) => {
    let cabData = {
      cabId,
      status: status == "ACTIVE" ? "NOT_ACTIVE" : "ACTIVE"
    };
    const data = await ApiRequestUtils.update(API_ROUTES.UPDATE_CAB_STATUS, cabData);
    fetchCabs();
  };
  useEffect(() => {
    getCabs('');
    if (paramsPassed?.cabAdded || paramsPassed?.cabUpdated) {
      setAlert(true);
      setTimeout(() => {
        setAlert(false);
      }, 2000);
    }
  }, []);

  function formatPhoneNumber(phoneNumber) {
    if(phoneNumber){if (phoneNumber.startsWith("+91")) {
      return phoneNumber;
    }
    return `+91${phoneNumber}`;}
  }

  return (
    <div className="mb-8 flex flex-col gap-12">
      {alert && <div className='mb-2'>
        <Alert
          color='blue'
          className='py-3 px-6 rounded-xl'
        >
          {safeText(paramsPassed?.cabName, "Cab")} {paramsPassed?.cabAdded ? 'added' : 'updated'} successfully!
        </Alert>
      </div>}
      <CabSearch onSearch={getCabs} />
      <Card>
        {cabs.length > 0 ? (
          <>
            <CardHeader variant="gradient" color="gray" className="mb-8 p-6 flex-1 justify-between items-center">
              <Typography variant="h6" color="white">
                Cabs List
              </Typography>
            </CardHeader>
            <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    {["Name", "Phone Number", "Type", "Intercity", "Outstation", "Status", ""].map((el) => (
                      <th
                        key={el}
                        className="border-b border-blue-gray-50 py-3 px-5 text-left"
                      >
                        <Typography
                          variant="small"
                          className="text-[11px] font-bold uppercase text-blue-gray-400"
                        >
                          {el}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cabs.map(
                    ({ id, name, phoneNumber, carType, status, intercityCount, outstationCount }, key) => {
                      const className = `py-3 px-5 ${key === cabs.length - 1
                        ? ""
                        : "border-b border-blue-gray-50"
                        }`;

                      return (
                        <tr key={id}>
                          <td className={className}>
                            <div className="flex items-center gap-4">
                              <Link to={`/dashboard/vendors/account/allVehicles/details/${id}`}>
                                <Typography
                                  variant="small"
                                  color="blue"
                                  className="font-semibold underline"
                                >
                                  {safeText(name)}
                                </Typography>
                              </Link>
                            </div>
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-600">
                              {safeText(formatPhoneNumber(phoneNumber))}
                            </Typography>
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-600">
                              {safeText(carType)}
                            </Typography>
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-600 ">
                              {safeText(intercityCount)}
                            </Typography>
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-600">
                              {safeText(outstationCount)}
                            </Typography>
                          </td>
                          <td className={className}>
                            <Chip
                              variant="gradient"
                              color={status == "ACTIVE" ? "green" : "blue-gray"}
                              value={status == "ACTIVE" ? "online" : "offline"}
                              className="py-0.5 px-2 text-[11px] font-medium w-fit"
                            />
                          </td>
                          <div>
                            {/* <td className={className}>
                              <Button
                                as="a"
                                onClick={() => navigate(`/dashboard/cabs/details/${id}`)}
                                className="text-xs font-semibold text-white"
                              >
                                View
                              </Button>
                            </td> */}

                            <td className={className}>
                              <Link to={`/dashboard/vendors/account/allVehicles/edit/${id}`}>
                              <Button
                                className="text-xs font-semibold text-white"
                              >
                                Edit
                              </Button>
                              </Link>
                            </td>
                            <td className={className}>
                              <Button
                                as="a"
                                onClick={() => { updateCabs(id, status) }}
                                className="text-xs font-semibold text-white"
                              >
                                {status == "ACTIVE" ? "Mark Offline" : "Mark Online"}
                              </Button>
                            </td>
                          </div>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </CardBody>

          </>) : (
          <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
            <Typography variant="h6" color="white">
              No Cabs
            </Typography>
          </CardHeader>
        )}
      </Card>
    </div >
  );
}

export default CabView;
