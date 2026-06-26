import { Fragment } from "react";
import { Button, Card, CardBody, CardHeader, Typography } from "@material-tailwind/react";
import { ColorStyles } from "@/utils/constants";

const formatValue = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return "[Object]";
    return String(value);
};

const getSummaryEntries = (value) => {
    if (!value || typeof value !== "object") return [];
    return Object.entries(value).filter(([key, entryValue]) => {
        if (key === "planGroupId") return false;
        if (entryValue === null || entryValue === undefined || entryValue === "") return false;
        if (Array.isArray(entryValue) && entryValue.length === 0) return false;
        if (typeof entryValue === "object" && !Array.isArray(entryValue)) {
            return Object.keys(entryValue).length > 0;
        }
        return true;
    });
};

const renderSummaryValue = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (Array.isArray(value)) {
        if (!value.length) return "-";
        if (value.every((item) => item === null || item === undefined || typeof item !== "object")) {
            return value.map((item) => formatValue(item)).join(", ");
        }
        return `Items: ${value.length}`;
    }
    if (typeof value === "object") {
        const entries = getSummaryEntries(value);
        if (!entries.length) return "-";
        return `Fields: ${entries.length}`;
    }
    return formatValue(value);
};

const renderPill = (label, value, tone = "bg-gray-100 text-gray-700 ring-gray-200") => (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${tone}`}>
        <span className="uppercase tracking-wide text-[10px] opacity-70">{label}</span>
        <span>{value}</span>
    </div>
);

const getStatusTone = (value) => {
    const normalized = String(value || "").toUpperCase();
    if (normalized === "ACTIVE" || normalized === "UPDATE" || normalized === "CREATED") {
        return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    }
    if (normalized === "INACTIVE" || normalized === "DELETE" || normalized === "DELETED") {
        return "bg-rose-50 text-rose-700 ring-rose-200";
    }
    return "bg-slate-100 text-slate-700 ring-slate-200";
};

const renderBadge = (value, tone) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${tone}`}>
        {formatValue(value)}
    </span>
);

const getPlanRows = (data) => {
    if (!Array.isArray(data?.plans)) return [];
    return data.plans.map((plan) => ({
        id: plan?.id ?? "-",
        price: plan?.price ?? "-",
        bonusPrice: plan?.bonusPrice ?? "-",
        totalPrice: plan?.totalPrice ?? "-",
        packagePrice: plan?.packagePrice ?? "-",
        status: plan?.status ?? "-",
    }));
};

const getPlanGroupSummary = (data) => {
    const planGroup = data?.planGroup || {};
    return {
        id: planGroup?.id ?? "-",
        priority: planGroup?.priority ?? "-",
    };
};

const getAssignmentSections = (data) => {
    const assignments = data?.assignments || {};
    return {
        created: Array.isArray(assignments.created) ? assignments.created : [],
        updated: Array.isArray(assignments.updated) ? assignments.updated : [],
        inactivated: Array.isArray(assignments.inactivated) ? assignments.inactivated : [],
    };
};

const renderSimpleTable = (rows, columns, emptyLabel = "No records found.") => {
    if (!rows.length) {
        return <div className="text-xs text-gray-500">{emptyLabel}</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] table-auto">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className="border-b border-gray-200 py-2 px-3 text-left text-[11px] font-bold uppercase text-gray-700 whitespace-nowrap"
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={row.id || index} className="align-top">
                            {columns.map((column) => (
                                <td key={column.key} className="border-b border-gray-100 py-2 px-3 text-xs text-gray-700 whitespace-nowrap">
                                    {column.render ? column.render(row[column.key], row) : formatValue(row[column.key])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const renderFriendlyData = (data, variant) => {
    const planGroup = getPlanGroupSummary(data);
    const assignmentSections = getAssignmentSections(data);
    const plans = getPlanRows(data);
    const borderTone = variant === "before" ? "border-rose-100" : "border-emerald-100";
    const titleTone = variant === "before" ? "text-rose-700" : "text-emerald-700";

    return (
        <div className="space-y-4">
            <div className={`rounded-2xl border bg-white p-4 shadow-sm ${borderTone}`}>
                <div className="mb-3">
                    <h4 className={`text-sm font-semibold ${titleTone}`}>Plan Group</h4>
                    <p className="text-xs text-gray-500">Only the changed group values.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <div className="text-[11px] font-bold uppercase text-gray-500">ID</div>
                        <div className="mt-1 text-sm font-semibold text-gray-800">{planGroup.id}</div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <div className="text-[11px] font-bold uppercase text-gray-500">Priority</div>
                        <div className="mt-1 text-sm font-semibold text-gray-800">{planGroup.priority}</div>
                    </div>
                </div>
            </div>

            <div className={`rounded-2xl border bg-white p-4 shadow-sm ${borderTone}`}>
                <div className="mb-3">
                    <h4 className={`text-sm font-semibold ${titleTone}`}>Plans</h4>
                    <p className="text-xs text-gray-500">Current plan values only.</p>
                </div>
                {renderSimpleTable(
                    plans,
                    [
                        { key: "id", label: "ID" },
                        { key: "price", label: "Price" },
                        { key: "bonusPrice", label: "Bonus Price" },
                        { key: "totalPrice", label: "Total Price" },
                        { key: "packagePrice", label: "Package Price" },
                        {
                            key: "status",
                            label: "Status",
                            render: (value) => renderBadge(value, getStatusTone(value)),
                        },
                    ],
                    "No plan changes."
                )}
            </div>

            <div className={`rounded-2xl border bg-white p-4 shadow-sm ${borderTone}`}>
                <div className="mb-3">
                    <h4 className={`text-sm font-semibold ${titleTone}`}>Assignments</h4>
                    <p className="text-xs text-gray-500">Created, updated, and inactivated items.</p>
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">Created</div>
                        {renderSimpleTable(
                            assignmentSections.created,
                            [
                                { key: "id", label: "ID" },
                                { key: "assignmentType", label: "Type" },
                                { key: "assignmentValue", label: "Value" },
                                {
                                    key: "status",
                                    label: "Status",
                                    render: (value) => renderBadge(value, getStatusTone(value)),
                                },
                            ],
                            "No created assignments."
                        )}
                    </div>
                    <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">Updated</div>
                        {renderSimpleTable(
                            assignmentSections.updated,
                            [
                                { key: "id", label: "ID" },
                                { key: "assignmentType", label: "Type" },
                                { key: "assignmentValue", label: "Value" },
                                {
                                    key: "status",
                                    label: "Status",
                                    render: (value) => renderBadge(value, getStatusTone(value)),
                                },
                            ],
                            "No updated assignments."
                        )}
                    </div>
                    <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">Inactivated</div>
                        {renderSimpleTable(
                            assignmentSections.inactivated,
                            [
                                { key: "id", label: "ID" },
                                { key: "assignmentType", label: "Type" },
                                { key: "assignmentValue", label: "Value" },
                                {
                                    key: "status",
                                    label: "Status",
                                    render: (value) => renderBadge(value, getStatusTone(value)),
                                },
                            ],
                            "No inactivated assignments."
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const renderArrayTable = (items) => {
    if (!items.length) {
        return <div className="text-xs text-gray-500">No items available.</div>;
    }

    const isObjectArray = items.some((item) => item && typeof item === "object" && !Array.isArray(item));

    if (!isObjectArray) {
        return (
            <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] table-auto">
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={`${item}-${index}`}>
                                <td className="border-b border-gray-100 py-2 px-3 text-xs text-gray-700 whitespace-nowrap">
                                    {formatValue(item)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    const columns = Array.from(
        new Set(items.flatMap((item) => Object.keys(item || {})))
    );

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] table-auto">
                <thead>
                    <tr>
                        <th className="border-b border-gray-200 py-2 px-3 text-left text-[11px] font-bold uppercase text-gray-700 whitespace-nowrap">
                            #
                        </th>
                        {columns.map((column) => (
                            <th key={column} className="border-b border-gray-200 py-2 px-3 text-left text-[11px] font-bold uppercase text-gray-700 whitespace-nowrap">
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="border-b border-gray-100 py-2 px-3 text-xs font-semibold text-gray-800 whitespace-nowrap">
                                {index + 1}
                            </td>
                            {columns.map((column) => (
                                <td key={column} className="border-b border-gray-100 py-2 px-3 text-xs text-gray-700">
                                    {column === "status" ? (
                                        renderBadge(item?.[column], getStatusTone(item?.[column]))
                                    ) : column === "action" ? (
                                        renderBadge(item?.[column], "bg-blue-50 text-blue-700 ring-blue-200")
                                    ) : typeof item?.[column] === "object" && item?.[column] !== null ? (
                                        JSON.stringify(item[column])
                                    ) : (
                                        formatValue(item?.[column])
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const renderObjectTable = (value) => {
    const entries = getSummaryEntries(value);

    if (!entries.length) {
        return <div className="text-xs text-gray-500">No fields available.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] table-auto">
                <tbody>
                    {entries.map(([key, entryValue]) => (
                        <tr key={key}>
                            <td className="border-b border-gray-100 py-2 px-3 text-xs font-semibold text-gray-800 whitespace-nowrap">
                                {key}
                            </td>
                            <td className="border-b border-gray-100 py-2 px-3 text-xs text-gray-700">
                                {Array.isArray(entryValue) ? (
                                    renderArrayTable(entryValue)
                                ) : typeof entryValue === "object" ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[360px] table-auto">
                                            <thead>
                                                <tr>
                                                    {getSummaryEntries(entryValue).map(([itemKey]) => (
                                                        <th
                                                            key={itemKey}
                                                            className="border-b border-gray-200 py-2 px-3 text-left text-[11px] font-bold uppercase text-gray-700 whitespace-nowrap"
                                                        >
                                                            {itemKey}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    {getSummaryEntries(entryValue).map(([itemKey, itemValue]) => (
                                                        <td key={itemKey} className="border-b border-gray-100 py-1.5 px-3 text-[11px] text-gray-700">
                                                            {itemKey === "status" ? (
                                                                renderBadge(itemValue, getStatusTone(itemValue))
                                                            ) : itemKey === "action" ? (
                                                                renderBadge(itemValue, "bg-blue-50 text-blue-700 ring-blue-200")
                                                            ) : (
                                                                renderSummaryValue(itemValue)
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-700">{renderSummaryValue(entryValue)}</div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const generatePageButtons = ({ currentPage, totalPages, onPageChange }) => {
    if (!totalPages || totalPages < 1) return null;

    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        buttons.push(
            <Button
                key={i}
                size="sm"
                variant={i === currentPage ? "filled" : "outlined"}
                className={`mx-1 ${ColorStyles.bgColor} text-white`}
                onClick={() => onPageChange(i)}
            >
                {i}
            </Button>
        );
    }

    return buttons;
};

export function MasterSubscriptionLogTable({
    rows = [],
    loading = false,
    error = "",
    pagination,
    expandedRows = {},
    onToggleRow,
    onPageChange,
}) {
    return (
        <Card className="shadow-sm py-5">
            <CardHeader variant="gradient" className={`mb-0 p-4 ${ColorStyles.bgColor}`}>
                <Typography variant="h6" color="white">
                    Log
                </Typography>
            </CardHeader>
            <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                {loading ? (
                    <p className="px-4 py-3 text-sm text-gray-500">Loading log data...</p>
                ) : error ? (
                    <p className="px-4 py-3 text-sm text-red-500">{error}</p>
                ) : (
                    <>
                        <table className="w-full min-w-[1280px] table-auto">
                            <thead>
                                <tr>
                                    {["", "Table Name", "Action", "Plan Group ID", "User", "Created At", "Updated At"].map((label) => (
                                        <th
                                            key={label || "expand"}
                                            className="border-b border-blue-gray-50 py-3 px-5 text-left whitespace-nowrap"
                                        >
                                            <Typography
                                                variant="small"
                                                className="text-[11px] font-bold uppercase text-black"
                                            >
                                                {label || ""}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length > 0 ? (
                                    rows.map((row, index) => {
                                        const rowKey = row?.id || row?._id || index;
                                        const isExpanded = Boolean(expandedRows[rowKey]);

                                        return (
                                            <Fragment key={rowKey}>
                                                <tr>
                                                    <td className="border-b border-blue-gray-50 py-3 px-5 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => onToggleRow(rowKey)}
                                                            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700"
                                                        >
                                                            {isExpanded ? "-" : "+"}
                                                        </button>
                                                    </td>                                                    
                                                    <td className="border-b border-blue-gray-50 py-3 px-5 text-black whitespace-nowrap">
                                                        {row?.tableName || "-"}
                                                    </td>
                                                    <td className="border-b border-blue-gray-50 py-3 px-5 text-black whitespace-nowrap">
                                                        {renderBadge(row?.action || "-", "bg-blue-50 text-blue-700 ring-blue-200")}
                                                    </td>
                                                    <td className="border-b border-blue-gray-50 py-3 px-5 text-black whitespace-nowrap">
                                                        {row?.planGroupId ?? "-"}
                                                    </td>
                                                    <td className="border-b border-blue-gray-50 py-3 px-5 text-black whitespace-nowrap">
                                                        {row?.User?.name || row?.userId || "-"}
                                                    </td>
                                                    <td className="border-b border-blue-gray-50 py-3 px-5 text-black whitespace-nowrap">
                                                        {(row?.created_at)}
                                                    </td>
                                                    <td className="border-b border-blue-gray-50 py-3 px-5 text-black whitespace-nowrap">
                                                        {(row?.updated_at)}
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={8} className="border-b border-blue-gray-50 bg-gradient-to-br from-slate-50 to-white px-4 py-4">
                                                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                                                <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
                                                                    <div className="mb-3 flex items-center justify-between">
                                                                        <div>
                                                                            <h4 className="text-sm font-semibold text-rose-700">Before</h4>
                                                                            <p className="text-xs text-gray-500">Previous state captured in the log entry.</p>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {renderPill("Type", row?.tableName || "-", "bg-rose-50 text-rose-700 ring-rose-200")}
                                                                            {renderPill("Plan Group ID", row?.planGroupId ?? "-", "bg-rose-50 text-rose-700 ring-rose-200")}
                                                                        </div>
                                                                    </div>
                                                                    {renderFriendlyData(row?.oldData || {}, "before")}
                                                                </div>

                                                                <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                                                                    <div className="mb-3 flex items-center justify-between">
                                                                        <div>
                                                                            <h4 className="text-sm font-semibold text-emerald-700">After</h4>
                                                                            <p className="text-xs text-gray-500">Updated state from the current log entry.</p>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {renderPill("Action", row?.action || "-", "bg-blue-50 text-blue-700 ring-blue-200")}
                                                                            {renderPill("Plan Group ID", row?.planGroupId ?? "-", "bg-emerald-50 text-emerald-700 ring-emerald-200")}
                                                                        </div>
                                                                    </div>
                                                                    {renderFriendlyData(row?.newData || {}, "after")}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-5 py-6 text-center text-sm text-gray-500"
                                        >
                                            No log records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="flex items-center justify-center mt-4">
                            <Button
                                size="sm"
                                variant="text"
                                disabled={pagination.totalPages < 1 || pagination.page === 1 || loading}
                                onClick={() => onPageChange(pagination.page - 1)}
                                className="mx-1"
                            >
                                {"<"}
                            </Button>
                            {generatePageButtons({
                                currentPage: pagination.page,
                                totalPages: pagination.totalPages,
                                onPageChange,
                            })}
                            <Button
                                size="sm"
                                variant="text"
                                disabled={pagination.totalPages < 1 || pagination.page === pagination.totalPages || loading}
                                onClick={() => onPageChange(pagination.page + 1)}
                                className="mx-1"
                            >
                                {">"}
                            </Button>
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
}
