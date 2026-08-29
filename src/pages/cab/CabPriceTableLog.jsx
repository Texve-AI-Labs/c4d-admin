import { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import moment from "moment";
import { API_ROUTES } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";

const CabPriceTableLog = ({ id }) => {
    const [documentslogs, setDocumentLogs] = useState([]);

    const masterPriceTableLog = async (id)=> {
        try{
            const data = await ApiRequestUtils.get(API_ROUTES.CAB_PRICE_TABLE_LOG + id);
            setDocumentLogs(data?.data);
        }catch(error){
            console.log("Error in log",error);
        }
    }

    useEffect(() => {
        if (id) {
            masterPriceTableLog(id);
        }
    }, [id]);

    const fieldMappings = {
        "price": "Price",
        "price_m_v_p": "Price MVP",
        "waiting_mins": "Free Waiting Time",
        "base_fare": "Base Fare",
        "kilometer": "Kilometer",
        // "extra_km_price": "Extra Kilometer Price",
        "waiting_charge": "Waiting Charges",
        "drop_price": "Drop Only",
        "additional_mins": "Additional Mins",
        "extra_hours": "Extra Hours",
        "night_hours_from": "Night Hours From",
        "night_hours_to": "Night Hours To",
        "night_charge": "Night Charges",
        "cancel_mins": "Cancellation Time",
        "cancel_charge": "Cancellation Charges",
        "base_fare_m_v_p": "Base Fare(MVP)",
        "kilometer_price": "Rate Per Km(Mini, SUV, Sedan)",
        "kilometer_price_m_v_p": "Rate Per Km(MVP)",
        "min_charge": "Rate Per Min",
        "additional_min_charge": "Additional Min",
        "sur_charge_percentage": "Surcharge Percentage",
        "extra_km_price": "Additional KM Rate",
        "toll_charge": "Toll Charge",
        "driver_charge": "Driver Charge"
    };

    return (
        <>
            <div className="flex flex-row justify-between px-2 mb-2 mt-4">
                <h2 className="text-2xl font-bold mb-4">Log</h2>
            </div>
            <Card>
                {documentslogs && documentslogs.length > 0 ? (
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr>
                                    {["Log ID", "Log Created Date & Time", "Updated Fields", "Previous Value", "Updated Value", "User ID"].map((el, index) => (
                                        <th key={index} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                            <Typography
                                                variant="small"
                                                className="text-[11px] font-bold uppercase text-blue-gray-700"
                                            >
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {documentslogs.map(({ id, created_at, oldData, newData, UserId }, key) => {
                                    const className = `py-3 px-5 ${key === documentslogs.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                                    const updatedFields = Object.keys(oldData || {});

                                    return updatedFields.map((field, fieldIndex) => (
                                        <tr key={`${id}-${fieldIndex}`}>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {id}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {moment(created_at).format("DD-MM-YYYY HH:mm:ss")}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {fieldMappings[field] ? fieldMappings[field] : field}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {oldData[field] ? oldData[field] : '-' }
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {newData[field] ? newData[field] : '-' }
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {UserId}
                                                </Typography>
                                            </td>
                                        </tr>
                                    ));
                                })}
                            </tbody>
                        </table>
                    </CardBody>
                ) : (
                    <h2 className="text-lg font-medium p-4">No Logs</h2>
                )}
            </Card>
        </>
    );
};

export default CabPriceTableLog;
