import { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import moment from "moment";
import { API_ROUTES } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { Utils } from "@/utils/utils";

const MasterPriceLog = ({ id }) => {
    const [documentslogs, setDocumentLogs] = useState([]);

    const masterPriceTableLog = async (id)=> {
        try{
            const data = await ApiRequestUtils.get(API_ROUTES.MASTERPRICETABLE_LOG + id);
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
        "price_m_v_p": "Price MUV",
        "waiting_mins": "Free Waiting Time",
        "base_fare": "Base Fare",
        "kilometer": "Kilometer",
        "extra_km_price": "Extra Kilometer Price",
        "waiting_charge": "Waiting Charges",
        "drop_price": "Drop Only",
        "additional_mins": "Additional Mins",
        "extra_hours": "Extra Hours",
        "night_hours_from": "Night Hours From",
        "night_hours_to": "Night Hours To",
        "night_charge": "Night Charges",
        "cancel_mins": "Cancellation Time",
        "cancel_charge": "Cancellation Charges",
        "base_fare_m_v_p": "Base Fare(MUV)",
        "kilometer_price": "Rate Per Km(Mini, SUV, Sedan)",
        "kilometer_price_m_v_p": "Rate Per Km (MUV)",
        "min_charge": "Rate Per Min",
        "additional_min_charge": "Additional Min",
        "sur_charge_percentage": "Surcharge Percentage",
        "extra_km_price": "Additional KM Rate",
        "toll_charge": "Toll Charge",
        "driver_charge": "Driver Charge",
        "driver_cancel_mins": "Driver Cancel Mins",
        "driver_free_cancellations_per_day": "Driver Free Cancellations / Day",
        "driver_cancellation_charge": "Driver Cancellation Charge",
        "driverCancelMins": "Driver Cancel Mins",
        "driverFreeCancellationsPerDay": "Driver Free Cancellations / Day",
        "driverCancellationCharge": "Driver Cancellation Charge",
        "demandRules": "Demand Rules",
        "demand_rules": "Demand Rules",
    };

    const formatPeakHours = (peakHours) => {
        let hoursArray = Array.isArray(peakHours) ? peakHours : [];
                if (hoursArray.length > 0 && Array.isArray(hoursArray[0])) {
            hoursArray = hoursArray[0];
        }
        if (!hoursArray || hoursArray.length === 0) {
            return "-";
        }
        return hoursArray
            .map((hour) => {
                const { start, end, kilometerPrice, kilometerPriceMVP, kilometerPriceSuv, kilometerPriceSedan } = hour;
                return `${start}-${end} (Mini: ${kilometerPrice || "-"}, MUV: ${kilometerPriceMVP || "-"}, SUV: ${kilometerPriceSuv || "-"}, Sedan: ${kilometerPriceSedan || "-"})`;
            })
            .join(", ");
    };

    const formatDemandRules = (rulesRaw) => {
        const rules = Array.isArray(rulesRaw) ? rulesRaw : [];
        if (!rules.length) return "-";
        return rules
            .map((rule) => {
                const name = rule?.name || "Rule";
                const mode = rule?.pricingMode || "-";
                const value = rule?.value ?? "-";
                const priority = rule?.priority ?? "-";
                const active = rule?.isActive ? "Active" : "Inactive";
                return `${name} (${mode}: ${value}, priority: ${priority}, ${active})`;
            })
            .join(" | ");
    };


    const formatValue = (field, value) => {
        if (value === null || value === undefined || value === "") {
            return "-";
        }

        const normalizedField = typeof field === "string" ? field.toLowerCase() : field;

        if (normalizedField === "peak_hours") {
            return formatPeakHours(value);
        }

        if (normalizedField === "demandrules" || normalizedField === "demand_rules") {
            return formatDemandRules(value);
        }

        if (
            normalizedField === "cancel_mins" ||
            normalizedField === "driver_cancel_mins" ||
            normalizedField === "drivercancelmins"
        ) {
            return Utils.convertTimeFormatToMinutes(value);
        }


        if (Array.isArray(value)) {
            return value.length ? value.join(", ") : "-";
        }

        if (typeof value === "object") {
            try {
                return JSON.stringify(value);
            } catch (stringifyError) {
                return "[object]";
            }
        }

        return value;
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
                                {documentslogs.map(({ id, created_at, oldData, newData, UserId,User }, key) => {
                                    const className = `py-3 px-5 ${key === documentslogs.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                                    const updatedFields = Array.from(new Set([
                                        ...Object.keys(oldData || {}),
                                        ...Object.keys(newData || {}),
                                    ])).filter((field) => {
                                        const oldVal = oldData?.[field];
                                        const newVal = newData?.[field];
                                        return JSON.stringify(oldVal ?? null) !== JSON.stringify(newVal ?? null);
                                    });
                                    const fieldsToRender = updatedFields.length ? updatedFields : ["-"];

                                    return fieldsToRender.map((field, fieldIndex) => {
                                        const isPlaceholder = field === "-";

                                        return (
                                        <tr key={`${id}-${field}-${fieldIndex}`}>
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
                                                    {isPlaceholder ? "-" : fieldMappings[field] ? fieldMappings[field] : field}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {isPlaceholder ? "-" : formatValue(field, oldData?.[field])}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {isPlaceholder ? "-" : formatValue(field, newData?.[field])}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {User?.name || UserId}
                                                </Typography>
                                            </td>
                                        </tr>
                                        );
                                    });
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

export default MasterPriceLog;
