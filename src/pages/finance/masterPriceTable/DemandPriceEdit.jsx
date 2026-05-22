import { useEffect, useState } from "react";
import {
    Button,
    Card,
    CardBody,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Input,
    Switch,
    Typography,
} from "@material-tailwind/react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PRIORITY_OPTIONS = [
    { label: "Critical", value: 10 },
    { label: "High", value: 30 },
    { label: "Medium", value: 60 },
    { label: "Low", value: 90 },
];

const EMPTY_RULE = {
    name: "",
    ruleType: "PEAK",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    daysOfWeek: [],
    pricingMode: "DELTA_AMOUNT",
    value: "",
    priority: 60,
    isActive: true,
};

const formatDays = (days = []) => {
    const sorted = [...new Set(days)].sort((a, b) => a - b);
    return sorted.map((day) => DAY_LABELS[day]).join(", ") || "-";
};

const formatPricing = (pricingMode, value) => {
    if (pricingMode === "DELTA_AMOUNT") return `${value >= 0 ? "+" : ""}${value}`;
    return String(value ?? "-");
};




const DemandPriceEdit = ({ demandRules = [], setDemandRules }) => {
    const [rules, setRules] = useState(demandRules);
    const [openModal, setOpenModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [formData, setFormData] = useState(EMPTY_RULE);
    const [formError, setFormError] = useState("");

    useEffect(() => {
        setRules(demandRules || []);
    }, [demandRules]);

    const notifyParent = (newRules) => {
        setRules(newRules);
        if (setDemandRules) setDemandRules(newRules);
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setSelectedIndex(null);
        setFormData(EMPTY_RULE);
        setFormError("");
        setOpenModal(true);
    };

    const openEditModal = (index) => {
        const rule = rules[index];
        setIsEditMode(true);
        setSelectedIndex(index);
        setFormData({
            ...EMPTY_RULE,
            ...rule,
            daysOfWeek: Array.isArray(rule?.daysOfWeek) ? rule.daysOfWeek : [],
            value: rule?.value ?? "",
            priority: rule?.priority ?? "",
        });
        setFormError("");
        setOpenModal(true);
    };

    const closeModal = () => {
        setOpenModal(false);
        setIsEditMode(false);
        setSelectedIndex(null);
        setFormError("");
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === "checkbox" && name === "isActive") {
            setFormData((prev) => ({ ...prev, isActive: checked }));
            return;
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const toggleDay = (day) => {
        setFormData((prev) => {
            const exists = prev.daysOfWeek.includes(day);
            const nextDays = exists
                ? prev.daysOfWeek.filter((d) => d !== day)
                : [...prev.daysOfWeek, day].sort((a, b) => a - b);
            return { ...prev, daysOfWeek: nextDays };
        });
    };

    const handleSave = () => {
        if (!formData.name || !formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime) {
            setFormError("Please fill required fields.");
            return;
        }
        const priorityValue = Number(formData.priority);
        const isAllowedPriority = PRIORITY_OPTIONS.some((option) => option.value === priorityValue);
        if (!isAllowedPriority) {
            setFormError("Priority must be one of: Critical(10), High(30), Medium(60), Low(90).");
            return;
        }
        setFormError("");

        const payload = {
            name: formData.name,
            ruleType: formData.ruleType,
            startDate: formData.startDate,
            endDate: formData.endDate,
            startTime: formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime,
            endTime: formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime,
            daysOfWeek: formData.daysOfWeek,
            pricingMode: formData.pricingMode,
            value: Number(formData.value),
            priority: priorityValue,
            isActive: formData.isActive,
        };

        if (payload.isActive) {
            const hasAnotherActiveRule = rules.some((rule, index) => {
                if (!rule?.isActive) return false;
                if (isEditMode && index === selectedIndex) return false;
                return true;
            });
            if (hasAnotherActiveRule) {
                setFormError("Only one active demand rule is allowed. Deactivate the current active rule first.");
                return;
            }
        }

        const newRules = isEditMode
            ? rules.map((rule, index) => (index === selectedIndex ? payload : rule))
            : [...rules, payload];

        notifyParent(newRules);
        closeModal();
    };

    const handleDelete = (index) => {
        notifyParent(rules.filter((_, i) => i !== index));
    };

    const handleToggleActive = (index) => {
        if (!rules[index]?.isActive) {
            const hasAnotherActiveRule = rules.some((rule, i) => i !== index && rule?.isActive);
            if (hasAnotherActiveRule) {
                setFormError("Only one active demand rule is allowed. Deactivate the current active rule first.");
                return;
            }
        }
        setFormError("");
        const newRules = rules.map((rule, i) =>
            i === index ? { ...rule, isActive: !rule.isActive } : rule
        );
        notifyParent(newRules);
    };

    const sortedRules = rules
        .map((rule, originalIndex) => ({ rule, originalIndex }))
        .sort(
            (a, b) =>
                (a?.rule?.priority ?? Number.MAX_SAFE_INTEGER) - (b?.rule?.priority ?? Number.MAX_SAFE_INTEGER)
        );

    return (
        <>
            <div className="flex flex-row justify-between px-2 mb-2 mt-8">
                <h2 className="text-2xl font-bold mb-4">Edit Demand Price Rules</h2>
                <Button className="text-xs font-semibold text-white bg-black px-4 py-2" onClick={openCreateModal}>
                    Add Rule
                </Button>
            </div>
            {formError ? (
                <Typography className="px-2 mb-2 text-sm text-red-500">{formError}</Typography>
            ) : null}
            <Card>
                {sortedRules.length > 0 ? (
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                        <table className="w-full min-w-[1200px] table-auto">
                            <thead>
                                <tr className="bg-primary text-white">
                                    {["Rule", "Date", "Time", "Days", "Pricing", "Priority", "Active", "Actions"].map((el) => (
                                        <th key={el} className="border-b border py-3 px-5 text-left">
                                            <Typography variant="small" className="text-[11px] font-bold uppercase text-white">
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRules.map(({ rule, originalIndex }) => (
                                    <tr key={`${rule?.name || "rule"}-${originalIndex}`}>
                                        <td className="border py-3 px-5"><Typography className="text-xs font-semibold text-blue-gray-600">{rule.name}</Typography></td>
                                        <td className="border py-3 px-5"><Typography className="text-xs font-semibold text-blue-gray-600">{rule.startDate} to {rule.endDate}</Typography></td>
                                        <td className="border py-3 px-5"><Typography className="text-xs font-semibold text-blue-gray-600">{rule.startTime} to {rule.endTime}</Typography></td>
                                        <td className="border py-3 px-5"><Typography className="text-xs font-semibold text-blue-gray-600">{formatDays(rule.daysOfWeek)}</Typography></td>
                                        <td className="border py-3 px-5"><Typography className="text-xs font-semibold text-blue-gray-600">{formatPricing(rule.pricingMode, rule.value)}</Typography></td>
                                        <td className="border py-3 px-5">
                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                {rule.priority}
                                            </Typography>
                                            {/* <Typography className="text-[10px] text-blue-gray-500">
                                                Lower priority value wins
                                            </Typography> */}
                                        </td>
                                        <td className="border py-3 px-5">
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={Boolean(rule.isActive)}
                                                    onChange={() => handleToggleActive(originalIndex)}
                                                    color="green"
                                                />
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {rule.isActive ? "Active" : "Inactive"}
                                                </Typography>
                                            </div>
                                        </td>
                                        <td className="border py-3 px-5">
                                            <div className="flex gap-2">
                                                <Button size="sm" color="blue" onClick={() => openEditModal(originalIndex)}>Edit</Button>
                                                <Button size="sm" color="red" onClick={() => handleDelete(originalIndex)}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardBody>
                ) : (
                    <CardBody>
                        <Typography>No demand rules added.</Typography>
                    </CardBody>
                )}
            </Card>

            <Dialog open={openModal} handler={closeModal} size="lg">
                <DialogHeader className="flex items-center justify-between">
                    <span>{isEditMode ? "Edit Demand Rule" : "Add Demand Rule"}</span>
                    <div className="flex items-center gap-3">
                        <Typography className="text-sm text-blue-gray-700">
                            {formData.isActive ? "Active" : "Inactive"}
                        </Typography>
                        <Switch name="isActive" checked={formData.isActive} onChange={handleInputChange} color="green" />
                    </div>
                </DialogHeader>
                <DialogBody className="grid grid-cols-2 gap-4">
                    {formError ? (
                        <Typography className="col-span-2 text-sm text-red-500">{formError}</Typography>
                    ) : null}
                    <Input label="Rule Name" name="name" value={formData.name} onChange={handleInputChange} />
                    <select name="ruleType" value={formData.ruleType} onChange={handleInputChange} className="border rounded-md p-2 hidden" disabled>
                        <option value="PEAK">Peak</option>
                    </select>
                    <Input type="date" label="Start Date" name="startDate" value={formData.startDate} onChange={handleInputChange} />
                    <Input type="date" label="End Date" name="endDate" value={formData.endDate} onChange={handleInputChange} />
                    <Input type="time" label="Start Time" name="startTime" value={formData.startTime?.slice(0, 5)} onChange={handleInputChange} />
                    <Input type="time" label="End Time" name="endTime" value={formData.endTime?.slice(0, 5)} onChange={handleInputChange} />
                    <select name="pricingMode" value={formData.pricingMode} onChange={handleInputChange} className="border rounded-md p-2 hidden" disabled>
                        <option value="DELTA_AMOUNT">Delta Amount</option>
                    </select>
                    <Input type="number" label="Value" name="value" value={formData.value} onChange={handleInputChange} />
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Priority</label>
                        <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleInputChange}
                            className="border rounded-md px-2 py-1 h-8 text-sm w-full"
                        >
                            {PRIORITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        
                    </div>
                    <div>
                        <Typography variant="small" className="mb-2 font-semibold text-blue-gray-600">Days Of Week</Typography>
                        <div className="flex flex-wrap gap-3">
                            {DAY_LABELS.map((label, dayIndex) => (
                                <label key={label} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.daysOfWeek.includes(dayIndex)}
                                        onChange={() => toggleDay(dayIndex)}
                                    />
                                    <span className="text-sm">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="text" color="blue-gray" onClick={closeModal} className="mr-1">Cancel</Button>
                    <Button color="blue" onClick={handleSave}>{isEditMode ? "Update" : "Add"}</Button>
                </DialogFooter>
            </Dialog>
        </>
    );
};

export default DemandPriceEdit;
