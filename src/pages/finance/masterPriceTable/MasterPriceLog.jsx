import { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import moment from "moment";
import { API_ROUTES } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { Utils } from "@/utils/utils";

const MasterPriceLog = ({ id }) => {
    const [documentslogs, setDocumentLogs] = useState([]);
    const sortedLogs = [...documentslogs].sort((a, b) => {
        const aTime = new Date(a?.created_at || 0).getTime();
        const bTime = new Date(b?.created_at || 0).getTime();
        if (aTime !== bTime) return bTime - aTime;
        return Number(b?.id || 0) - Number(a?.id || 0);
    });

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
        "zone": "Zone",
        "serviceType": "Service Type",
        "type": "Type",
        "period": "Period",
        "price": "Price",
        "price_m_v_p": "Price MUV",
        "waiting_mins": "Free Waiting Time",
        "base_fare": "Base Fare (Mini)",
        "baseFare": "Base Fare (Mini)",
        "kilometer": "Kilometer",
        "extraKmPrice": "Extra Kilometer Price",
        "waiting_charge": "Waiting Charges Apply After",
        "waitingCharge": "Waiting Charges Apply After",
        "drop_price": "Drop Only",
        "additional_mins": "Additional Mins",
        "additionalMinCharge": "Additional Min Charge",
        "extra_hours": "Extra Hours",
        "night_hours_from": "Night Hours From",
        "night_hours_to": "Night Hours To",
        "night_charge": "Night Charges",
        "nightCharge": "Night Charges",
        "cancel_mins": "Cancellation Time",
        "cancel_charge": "Cancellation Charges",
        "cancelCharge": "Cancellation Charges",
        "base_fare_m_v_p": "Base Fare(MUV)",
        "kilometer_price": "Rate Per Km(Mini, SUV, Sedan)",
        "kilometer_price_m_v_p": "Rate Per Km (MUV)",
        "min_charge": "Rate Per Min",
        "minCharge": "Rate Per Min",
        "additional_min_charge": "Additional Min",
        "sur_charge_percentage": "Surcharge Percentage",
        "surChargePercentage": "Surcharge Percentage",
        // "toll_charge": "Toll Charge",
        "driver_charge": "Driver Charge",
        "driverCharge": "Driver Charge",
        "driver_cancel_mins": "Driver Cancel Mins",
        "driver_free_cancellations_per_day": "Driver Free Cancellations / Day",
        "driver_cancellation_charge": "Driver Cancellation Charge",
        "driverCancelMins": "Driver Cancel Mins",
        "driverFreeCancellationsPerDay": "Driver Free Cancellations / Day",
        "driverCancellationCharge": "Driver Cancellation Charge",
        "peakHours": "Peak Hours",
        "peak_hours": "Peak Hours",
        "premiumConfig": "Premium Config",
        "premium_config": "Premium Config",
        "demandRules": "Demand Rules",
        "demand_rules": "Demand Rules",
    };

    const canonicalField = (field) => {
        const key = String(field || "");
        const lower = key.toLowerCase();
        const aliasMap = {
            service_type: "serviceType",
            servicetype: "serviceType",
            base_fare: "baseFare",
            basefare: "baseFare",
            extra_km_price: "extraKmPrice",
            extrakmprice: "extraKmPrice",
            waiting_charge: "waitingCharge",
            waitingcharge: "waitingCharge",
            cancel_charge: "cancelCharge",
            cancelcharge: "cancelCharge",
            night_charge: "nightCharge",
            nightcharge: "nightCharge",
            min_charge: "minCharge",
            mincharge: "minCharge",
            sur_charge_percentage: "surChargePercentage",
            surchargepercentage: "surChargePercentage",
            driver_cancel_mins: "driverCancelMins",
            drivercancelmins: "driverCancelMins",
            driver_free_cancellations_per_day: "driverFreeCancellationsPerDay",
            driverfreecancellationsperday: "driverFreeCancellationsPerDay",
            driver_cancellation_charge: "driverCancellationCharge",
            drivercancellationcharge: "driverCancellationCharge",
            peak_hours: "peakHours",
            peakhours: "peakHours",
            premium_config: "premiumConfig",
            premiumconfig: "premiumConfig",
            demand_rules: "demandRules",
            demandrules: "demandRules",
        };
        return aliasMap[lower] || key;
    };

    const prettyFieldLabel = (field) => {
        const key = String(field || "");
        return key
            .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
            .replace(/_/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const formatCarTypeLabel = (field, baseLabel) => {
        const key = String(field || "");
        const match = key.match(/^(baseFare|kilometerPrice|price)(MVP|Suv|Sedan)$/);
        if (!match) return baseLabel;

        const [, prefix, carTypeRaw] = match;
        const carType = carTypeRaw === "MVP" ? "MUV" : carTypeRaw.toUpperCase();
        const labelMap = {
            baseFare: "Base Fare",
            kilometerPrice: "Rate Per Km",
            price: "Price",
        };
        return `${labelMap[prefix] || baseLabel} (${carType})`;
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

        const normalizedField = canonicalField(field);
        const lowerField = normalizedField.toLowerCase();

        if (lowerField === "peakhours") {
            return formatPeakHours(value);
        }

        if (lowerField === "demandrules") {
            return formatDemandRules(value);
        }

        if (lowerField === "premiumconfig") {
            if (!value || typeof value !== "object") return "-";
            try {
                return JSON.stringify(value);
            } catch {
                return "[object]";
            }
        }

        if (
            lowerField === "cancelmins" ||
            lowerField === "drivercancelmins"
        ) {
            return Utils.convertTimeFormatToMinutes(value);
        }

        if (typeof value === "string" && (lowerField.includes("hoursfrom") || lowerField.includes("hoursto"))) {
            return value.slice(0, 5);
        }

        if (typeof value === "object" && value && ("start" in value || "end" in value || "kilometerPrice" in value)) {
            const peak = Array.isArray(value) ? value : [value];
            return formatPeakHours(peak);
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
                                {sortedLogs.map(({ id, created_at, oldData, newData, UserId, userId, user_id, User }, key) => {
                                    const className = `py-3 px-5 ${key === sortedLogs.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                                        const fieldSet = new Set([
                                        ...Object.keys(oldData || {}),
                                        ...Object.keys(newData || {}),
                                    ]);
                                        const updatedFields = Array.from(fieldSet).filter((field) => {
                                        const canonical = canonicalField(field);
                                        const oldVal = oldData?.[field];
                                        const newVal = newData?.[field];
                                        const oldCanonical = oldData?.[canonical];
                                        const newCanonical = newData?.[canonical];
                                        const left = oldVal ?? oldCanonical ?? null;
                                        const right = newVal ?? newCanonical ?? null;
                                        return JSON.stringify(left) !== JSON.stringify(right);
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
                                                    {isPlaceholder ? "-" : formatCarTypeLabel(field, fieldMappings[field] ? fieldMappings[field] : fieldMappings[canonicalField(field)] || prettyFieldLabel(canonicalField(field)))}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {isPlaceholder ? "-" : formatValue(field, oldData?.[field] ?? oldData?.[canonicalField(field)])}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {isPlaceholder ? "-" : formatValue(field, newData?.[field] ?? newData?.[canonicalField(field)])}
                                                </Typography>
                                            </td>
                                            <td className={className}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {User?.name || UserId || userId || user_id || "-"}
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
