import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Avatar,
  Chip,
  Tooltip,
  Progress,
  Button,
  Alert
} from "@material-tailwind/react";
import { authorsTableData } from "@/data";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import UserSearch from "@/components/UserSearch";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { Link, useNavigate, useLocation } from 'react-router-dom';


export function UserView() {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [alert, setAlert] = useState(false);
  const [sortOrder, setSortOrder] = useState("ASC");
  const navigate = useNavigate();
  const location = useLocation();
 
  useEffect(() => {
    const fetchUsers = async () => {
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ALL_USERS, { sortOrder });
      if (data?.success) {
        setUsers(data?.data);
        setAllUsers(data?.data); // Store all users for local filtering
      }
    }; 
    fetchUsers();
  }, [sortOrder]);

  useEffect(() => {
    if (location.state?.userAdded || location.state?.userUpdated) {
      const action = location.state.userAdded ? 'added' : 'updated';
      setAlert({
        message: `${location.state.userName} ${action} successfully!`,
        color : 'blue',
      });
      setTimeout(() => {
        setAlert(null);
      }, 5000);
      // Clear the state to prevent showing the alert on page refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
    if(location.state?.userExist){
      setAlert({
        message: `user already exist!!`,
        color : 'red',
      });
      setTimeout(() => {
        setAlert(null);
      }, 3000);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  const handleNameSort = () => {
    setSortOrder((currentOrder) => currentOrder === "ASC" ? "DESC" : "ASC");
  };

  const getUsers = async (searchQuery) => {
    //console.log("searchQuery",searchQuery);
    if (searchQuery && searchQuery.trim() !== "") {
      
       const query = searchQuery.toLowerCase().trim();
      
       const filteredUsers = allUsers.filter((user) => {
         const name = (user.name || "").toLowerCase();
         const phone = (user.phoneNumber || "").toLowerCase();
         const email = (user.email || "").toLowerCase();
         
         return name.startsWith(query) || 
                phone.startsWith(query) || 
                email.startsWith(query);
    });
      setUsers(filteredUsers);
      // const data = await ApiRequestUtils.get(API_ROUTES.GET_ALL_CUSTOMERS+`?phoneNumber=${searchQuery}`);
      // if (data?.success) {
      //   setUsers(data?.data);
      // }
    } else {
      setUsers(allUsers);
    }
  };

  function formatPhoneNumber(phoneNumber) {
    if(phoneNumber){if (phoneNumber.startsWith("+91")) {
      return phoneNumber;
    }
    return `+91${phoneNumber}`;}
  }

  // useEffect(() => {
  //   getUsers('');
  //   if (paramsPassed?.userAdded || paramsPassed?.userUpdated) {
  //     setAlert(true);
  //     setTimeout(() => {
  //       setAlert(false);
  //     }, 2000);
  //   }
  // }, [])

  return (
    <div className="mb-8 flex flex-col gap-12">
      {alert && (
        <div className='mb-2'>
        <Alert
          color={alert.color}
          className='py-3 px-6 rounded-xl'
        >
          {alert.message}
        </Alert>
      </div>)}
      <UserSearch onSearch={getUsers} />
      <Card>
        {users.length > 0 ? (
          <>
            <CardHeader variant="gradient" className={`mb-8 p-6 ${ColorStyles.bgColor}`} >
              <Typography variant="h6" color="white">
                Users List
              </Typography>
            </CardHeader>
            <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <button
                        type="button"
                        onClick={handleNameSort}
                        className="flex items-center gap-1 text-[11px] font-bold uppercase text-blue-gray-900"
                      >
                        Name
                        {sortOrder === "ASC" ? (
                          <ArrowUpIcon className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownIcon className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </th>
                    {["Phone Number", "Email", "Status", ""].map((el) => (
                      <th
                        key={el}
                        className="border-b border-blue-gray-50 py-3 px-5 text-left"
                      >
                        <Typography
                          variant="small"
                          className="text-[11px] font-bold uppercase text-blue-gray-900"
                        >
                          {el}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(
                    ({ id, name, phoneNumber, email, status }, key) => {
                      const className = `py-3 px-5 ${key === users.length - 1
                        ? ""
                        : "border-b border-blue-gray-50"
                        }`;

                      return (
                        <tr key={id}>
                          <td className={className}>
                            <div className="flex items-center gap-4">
                              <Link to={`/dashboard/users/details/${id}`}>
                                <Typography
                                  variant="small"
                                  color="blue"
                                  className="font-semibold underline cursor-pointer"
                                >
                                  {name}
                                </Typography>
                              </Link>
                            </div>
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-900">
                              {formatPhoneNumber(phoneNumber)}
                            </Typography>
                          </td>
                          <td className={className}>
                            <Typography className="text-xs font-semibold text-blue-gray-900">
                              {email}
                            </Typography>
                          </td>
                          <td className={className}>
                            <Chip
                              variant="ghost"
                              color={status == "ACTIVE" ? "green" : "blue-gray"}
                              value={status == "ACTIVE" ? "Active" : "In-Active"}
                              className="py-0.5 px-2 text-[11px] font-medium w-fit"
                            />
                          </td>
                          <div>
                            {/* <td className={className}>
                              <Button
                                as="a"
                                onClick={() => navigate(`/dashboard/users/details/${id}`)}
                                className="text-xs font-semibold text-white"
                              >
                                View
                              </Button>
                            </td> */}
                            <td className={className}>
                              <Link to={`/dashboard/users/edit/${id}`}>
                              <Button
                                className="text-xs font-semibold text-white bg-primary"
                              >
                                Edit
                              </Button>
                              </Link>
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
          <CardHeader variant="gradient"  className={`mb-8 p-6 ${ColorStyles.bgColor}`}>
            <Typography variant="h6" color="white">
              No Users
            </Typography>
          </CardHeader>
        )}
      </Card>
    </div >
  );
}

export default UserView;
