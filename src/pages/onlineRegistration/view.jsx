import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Typography,
    Button,
    Alert
  } from "@material-tailwind/react";

export function OnlineRegistrationView(){
    const [accounts, setAccounts] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [alert, setAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(()=>{
        const fetchData = async ()=> {
            const data = await ApiRequestUtils.get(API_ROUTES.GET_ONLINE_REGISTER_DETAILS);
            if(data?.success){
                setAccounts(data?.document);
                setAllAccounts(data?.document);
            }
        }
        fetchData();
    },[])

    useEffect(() => {
        getDeatils(searchQuery.trim());
    }, [searchQuery]);

    const getDeatils = async (searchQuery) => {
        if (searchQuery && searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase().trim();
            const filteredAccounts = allAccounts.filter((acc) => {
            const name = (acc.firstName || "").toLowerCase();
            const phone = (acc.phoneNumber || "").toLowerCase();
            const phoneNumberWithoutCountryCode = phone.startsWith("+91") ? phone.slice(3) : phone;
            return (
                name.startsWith(query) || 
                phone.startsWith(query) || 
                phoneNumberWithoutCountryCode.startsWith(query)
            );
          });
          setAccounts(filteredAccounts);
        } else {
          setAccounts(allAccounts);
        }
    };

    const getCreateDriver= async(registerId, firstName)=>{
        const data = await ApiRequestUtils.get(API_ROUTES.GET_CREATE_DRIVER+`${registerId}`)
        if (data?.success) {
            setAlertMessage(`${firstName} - Driver account has been created successfully!`)
            setAlert(true);
            setTimeout(() => {
                setAlert(false);
            }, 5000);
        } else {
            setAlertMessage(`Failed to create ${firstName} - Driver account`)
            setAlert(true);
            setTimeout(() => {
                setAlert(false);
            }, 5000);
        }
        // setAlertMessage(data?.message)
        // setAlert(true);
        // setTimeout(() => {
        //     setAlert(false);
        // }, 5000);
    }

    const getCreateOwner = async (registerId, firstName, type)=>{
        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_CREATE_OWNER, {
            registerId: registerId,
            type: type
        })
        if (data?.success) {
            setAlertMessage(`${firstName} - Owner account has been created successfully!`)
            setAlert(true);
            setTimeout(() => {
                setAlert(false);
            }, 5000);
        } else {
            setAlertMessage(`Failed to create ${firstName} - Owner account`)
            setAlert(true);
            setTimeout(() => {
                setAlert(false);
            }, 5000);
        }
        // setAlertMessage(data?.message)
        // setAlert(true);
        // setTimeout(() => {
        //     setAlert(false);
        // }, 5000);
    }

    return (    
        <div className="mb-8 flex flex-col gap-12">
            {alert && 
            <div className='mb-2'>
                <Alert
                color='blue'
                className='py-3 px-6 rounded-xl'
                >
                {alertMessage}
                </Alert>
            </div>}
            <div className="p-4 border border-gray-300 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="relative flex-grow max-w-[500px]">
                        <input
                            type="text"
                            className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Search Registration"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>
            <Card>
                {accounts.length > 0  ? (
                <>
                    <CardHeader variant="gradient" color="gray" className="mb-8 p-6 flex-1 justify-between items-center">
                    <Typography variant="h6" color="white">
                        Registration List
                    </Typography>
                    </CardHeader>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                    <table className="w-full min-w-[640px] table-auto">
                        <thead>
                            <tr>
                            {["Name", "Phone Number", "KYC Documents", ""].map((el) => (
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
                            {accounts.map(({ id, firstName, phoneNumber, documents, accountId, driverId }, key) => {
                            const className = `py-3 px-5 ${
                                key === accounts.length - 1 ? "" : "border-b border-blue-gray-50"
                            }`;

                            return (
                                <tr key={id}>
                                <td className={className}>
                                    <div className="flex items-center gap-4">
                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                        {firstName}
                                    </Typography>
                                    </div>
                                </td>
                                <td className={className}>
                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                    {phoneNumber}
                                    </Typography>
                                </td>
                                <td className={className}>
                                    <div className="flex flex-col space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Typography className="text-xs font-semibold text-blue-gray-600">
                                        LICENSE
                                        </Typography>
                                        <Typography
                                        className={`text-xs font-semibold ${
                                            documents.LICENSE === "APPROVED"
                                            ? "text-green-500"
                                            : documents.LICENSE === "PENDING"
                                            ? "text-yellow-500"
                                            : documents.LICENSE === "DECLINED"
                                            ? "text-red-500"
                                            : "text-gray-500"
                                        }`}
                                        >
                                        {documents.LICENSE}
                                        </Typography>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Typography className="text-xs font-semibold text-blue-gray-600">
                                        AADHAAR
                                        </Typography>
                                        <Typography
                                        className={`text-xs font-semibold ${
                                            documents.AADHAAR === "APPROVED"
                                            ? "text-green-500"
                                            : documents.AADHAAR === "PENDING"
                                            ? "text-yellow-500"
                                            : documents.AADHAAR === "DECLINED"
                                            ? "text-red-500"
                                            : "text-gray-500"
                                        }`}
                                        >
                                        {documents.AADHAAR}
                                        </Typography>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Typography className="text-xs font-semibold text-blue-gray-600">
                                        RC COPY
                                        </Typography>
                                        <Typography
                                        className={`text-xs font-semibold ${
                                            documents.RC_COPY === "APPROVED"
                                            ? "text-green-500"
                                            : documents.RC_COPY === "PENDING"
                                            ? "text-yellow-500"
                                            : documents.RC_COPY === "DECLINED"
                                            ? "text-red-500"
                                            : "text-gray-500"
                                        }`}
                                        >
                                        {documents.RC_COPY}
                                        </Typography>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Typography className="text-xs font-semibold text-blue-gray-600">
                                        VEHICLE PHOTO
                                        </Typography>
                                        <Typography
                                        className={`text-xs font-semibold ${
                                            documents.VEHICLE_PHOTO === "APPROVED"
                                            ? "text-green-500"
                                            : documents.VEHICLE_PHOTO === "PENDING"
                                            ? "text-yellow-500"
                                            : documents.VEHICLE_PHOTO === "DECLINED"
                                            ? "text-red-500"
                                            : "text-gray-500"
                                        }`}
                                        >
                                        {documents.VEHICLE_PHOTO}
                                        </Typography>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Typography className="text-xs font-semibold text-blue-gray-600">
                                        INSURANCE
                                        </Typography>
                                        <Typography
                                        className={`text-xs font-semibold ${
                                            documents.INSURANCE === "APPROVED"
                                            ? "text-green-500"
                                            : documents.INSURANCE === "PENDING"
                                            ? "text-yellow-500"
                                            : documents.INSURANCE === "DECLINED"
                                            ? "text-red-500"
                                            : "text-gray-500"
                                        }`}
                                        >
                                        {documents.INSURANCE}
                                        </Typography>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Typography className="text-xs font-semibold text-blue-gray-600">
                                        PERMIT
                                        </Typography>
                                        <Typography
                                        className={`text-xs font-semibold ${
                                            documents.PERMIT === "APPROVED"
                                            ? "text-green-500"
                                            : documents.PERMIT === "PENDING"
                                            ? "text-yellow-500"
                                            : documents.PERMIT === "DECLINED"
                                            ? "text-red-500"
                                            : "text-gray-500"
                                        }`}
                                        >
                                        {documents.PERMIT}
                                        </Typography>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Typography className="text-xs font-semibold text-blue-gray-600">
                                        PHOTO
                                        </Typography>
                                        <Typography
                                        className={`text-xs font-semibold ${
                                            documents.PHOTO === "APPROVED"
                                            ? "text-green-500"
                                            : documents.PHOTO === "PENDING"
                                            ? "text-yellow-500"
                                            : documents.PHOTO === "DECLINED"
                                            ? "text-red-500"
                                            : "text-gray-500"
                                        }`}
                                        >
                                        {documents.PHOTO}
                                        </Typography>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Typography className="text-xs font-semibold text-blue-gray-600">
                                        PAN
                                        </Typography>
                                        <Typography
                                        className={`text-xs font-semibold ${
                                            documents.PAN === "APPROVED"
                                            ? "text-green-500"
                                            : documents.PAN === "PENDING"
                                            ? "text-yellow-500"
                                            : documents.PAN === "DECLINED"
                                            ? "text-red-500"
                                            : "text-gray-500"
                                        }`}
                                        >
                                        {documents.PAN}
                                        </Typography>
                                    </div>
                                    </div>
                                </td>
                                <td className={className}>
                                    {(() => {
                                        if (accountId) {
                                            return (
                                                <Typography className="text-xs font-semibold text-primary-600">
                                                    Account Created
                                                </Typography>
                                            );
                                        } else if (driverId) {
                                            return (
                                                <Typography className="text-xs font-semibold text-primary-600">
                                                    Driver Created
                                                </Typography>
                                            );
                                        } else if (
                                            documents.PAN === "APPROVED" &&
                                            documents.PHOTO === "APPROVED" &&
                                            documents.AADHAAR === "APPROVED" &&
                                            (documents.LICENSE === "APPROVED" || documents.RC_COPY === "APPROVED") &&
                                            documents.VEHICLE_PHOTO === "APPROVED" &&
                                            documents.INSURANCE === "APPROVED" &&
                                            documents.PERMIT === "APPROVED"
                                        ) {
                                            return (
                                                <>
                                                    <Button
                                                        as="a"
                                                        className="mx-2 text-xs font-semibold text-black bg-white border border-black"
                                                        onClick={() => getCreateDriver(id, firstName)}
                                                    >
                                                        Create Driver
                                                    </Button>
                                                    <Button
                                                        as="a"
                                                        className="mx-2 text-xs font-semibold text-white"
                                                        onClick={() => getCreateOwner(id, firstName, 'Company')}
                                                    >
                                                        Create Owner
                                                    </Button>
                                                    <Button
                                                        as="a"
                                                        className="mx-2 text-xs font-semibold text-white"
                                                        onClick={() => getCreateOwner(id, firstName, 'Individual')}
                                                    >
                                                        Create Individual Owner
                                                    </Button>
                                                </>
                                            );
                                        }
                                    })()}
                                    </td>  
                                </tr>
                            );
                            })}
                        </tbody>
                        </table>
                    </CardBody>
                </>) : (
                <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
                    <Typography variant="h6" color="white">
                    No Registration
                    </Typography>
                </CardHeader>
                )}
            </Card>
        </div>        
    )
}