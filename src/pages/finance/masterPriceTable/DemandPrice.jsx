import { Card, CardBody, Typography } from "@material-tailwind/react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getDaysLabel = (days = []) => {
    if (!Array.isArray(days) || days.length === 0) return "All days";

    const sortedDays = [...new Set(days)]
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        .sort((a, b) => a - b);

    if (sortedDays.length === 7) return "All days";

    return sortedDays.map((day) => DAY_LABELS[day]).join(", ");
};

const getPricingLabel = (mode, value) => {
    const numericValue = Number(value);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

    if (mode === "DELTA_AMOUNT") {
        return `${safeValue >= 0 ? "+" : ""}${safeValue} fixed amount`;
    }

    return "-";
};

const getPriorityBand = (priority) => {
    const value = Number(priority);
    if (!Number.isFinite(value)) return "Unknown";
    if (value >= 0 && value <= 10) return "High Precedence (0-10)";
    if (value >= 11 && value <= 50) return "Medium Precedence (11-50)";
    if (value >= 51 && value <= 100) return "Low Precedence (51-100)";
    return "Out of Range";
};

const DemandPriceTable = ({ demandRules = [] }) => {
    const sortedRules = [...demandRules].sort(
        (a, b) => (a?.priority ?? Number.MAX_SAFE_INTEGER) - (b?.priority ?? Number.MAX_SAFE_INTEGER)
    );

    return (
        <>
            <h2 className="text-2xl font-bold mb-4">Demand Price Rules</h2>
            <Card>
                {sortedRules.length > 0 ? (
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                        <table className="w-full min-w-[1200px] table-auto">
                            <thead>
                                <tr className="bg-primary text-white">
                                    {[
                                        "Rule Name",
                                        "Type",
                                        "Date Range",
                                        "Time Range",
                                        "Days",
                                        "Pricing",
                                        "Priority",
                                        "Active",
                                    ].map((title) => (
                                        <th key={title} className="border-b border py-3 px-5 text-left">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-white">
                                                {title}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRules.map((rule, index) => {
                                    const rowClass = `border py-3 px-5 ${
                                        index === sortedRules.length - 1 ? "" : "border-b border-blue-gray-50"
                                    }`;

                                    return (
                                        <tr key={`${rule?.name || "rule"}-${index}`}>
                                            <td className={rowClass}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {rule?.name || "-"}
                                                </Typography>
                                            </td>
                                            <td className={rowClass}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {rule?.ruleType || "-"}
                                                </Typography>
                                            </td>
                                            <td className={rowClass}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {rule?.startDate || "-"} to {rule?.endDate || "-"}
                                                </Typography>
                                            </td>
                                            <td className={rowClass}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {rule?.startTime || "-"} to {rule?.endTime || "-"}
                                                </Typography>
                                            </td>
                                            <td className={rowClass}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {getDaysLabel(rule?.daysOfWeek)}
                                                </Typography>
                                            </td>
                                            <td className={rowClass}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {getPricingLabel(rule?.pricingMode, rule?.value)}
                                                </Typography>
                                            </td>
                                            <td className={rowClass}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {rule?.priority ?? "-"} - {getPriorityBand(rule?.priority)}
                                                </Typography>
                                                <Typography className="text-[10px] text-blue-gray-500">
                                                    Lower priority value wins
                                                </Typography>
                                            </td>
                                            <td className={rowClass}>
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {rule?.isActive ? "Yes" : "No"}
                                                </Typography>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardBody>
                ) : (
                    <CardBody className="px-0 pt-0 pb-2">
                        <Typography variant="small" color="blue-gray" className="font-normal px-6 py-4">
                            No demand pricing rules available
                        </Typography>
                    </CardBody>
                )}
            </Card>
        </>
    );
};

export default DemandPriceTable;
