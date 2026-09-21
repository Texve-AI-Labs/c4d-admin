import { useState, useEffect } from "react";
import { themeColors } from '@/theme/colors';
import {
    Button,
    Card,
    CardBody,
    Typography,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Input
} from "@material-tailwind/react";
import moment from "moment";
import Swal from "sweetalert2";

const RidesPeakHourTableEdit = ({ initialPriceData, onUpdate, title = "Edit Peak Hours Table" }) => {
    const [priceData, setPriceData] = useState(initialPriceData);
    const [openModal, setOpenModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [formData, setFormData] = useState({
        start: "",
        end: "",
        kilometerPrice: ""
    });

    useEffect(() => {
        setPriceData(initialPriceData);
    }, [initialPriceData]);

    const notifyParent = (newData) => {
        setPriceData(newData);
        if (onUpdate) {
            onUpdate(newData);
        }
    };

    const handleOpenModal = (index = null) => {
        if (index !== null) {
            const entry = priceData[index];
            setIsEditMode(true);
            setSelectedIndex(index);
            setFormData({
                start: entry.start ? moment(entry.start, ["HH:mm", "YYYY-MM-DDTHH:mm:ssZ"]).format("HH:mm") : "",
                end: entry.end ? moment(entry.end, ["HH:mm", "YYYY-MM-DDTHH:mm:ssZ"]).format("HH:mm") : "",
                kilometerPrice: entry.kilometerPrice || ""
            });
        } else {
            setIsEditMode(false);
            setSelectedIndex(null);
            setFormData({
                start: "",
                end: "",
                kilometerPrice: ""
            });
        }
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setIsEditMode(false);
        setSelectedIndex(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const isTimeRangeOverlapping = (newStart, newEnd, excludeIndex = null) => {
        const newStartMoment = moment(newStart, "HH:mm");
        const newEndMoment = moment(newEnd, "HH:mm");

        return priceData.some((item, index) => {
            if (excludeIndex !== null && index === excludeIndex) return false;
            const existingStart = moment(item.start, ["HH:mm", "YYYY-MM-DDTHH:mm:ssZ"]);
            const existingEnd = moment(item.end, ["HH:mm", "YYYY-MM-DDTHH:mm:ssZ"]);
            return (
                newStartMoment.isBetween(existingStart, existingEnd, undefined, "[]") ||
                newEndMoment.isBetween(existingStart, existingEnd, undefined, "[]") ||
                existingStart.isBetween(newStartMoment, newEndMoment, undefined, "[]") ||
                existingEnd.isBetween(newStartMoment, newEndMoment, undefined, "[]")
            );
        });
    };

    const handleSubmit = () => {
        const newStart = moment(formData.start, "HH:mm");
        const newEnd = moment(formData.end, "HH:mm");

        if (newEnd.isSameOrBefore(newStart)) {
            setOpenModal(false);
            setTimeout(() => {
                Swal.fire({
                    title: "Error",
                    text: "End time must be after Start time.",
                    icon: "error",
                    timer: 3000,
                    showConfirmButton: false
                });
            }, 100);
            return;
        }

        if (isTimeRangeOverlapping(formData.start, formData.end, isEditMode ? selectedIndex : null)) {
            setOpenModal(false);
            setTimeout(() => {
                Swal.fire({
                    title: "Error",
                    text: "This time range overlaps with an existing entry.",
                    icon: "error",
                    timer: 3000,
                    showConfirmButton: false
                });
            }, 100);
            return;
        }

        const payload = {
            start: formData.start,
            end: formData.end,
            kilometerPrice: parseFloat(formData.kilometerPrice) || null
        };

        let newData;
        if (isEditMode) {
            newData = priceData.map((item, index) =>
                index === selectedIndex ? payload : item
            );
        } else {
            newData = [...priceData, payload];
        }
        notifyParent(newData);
        handleCloseModal();
    };

    const handleDelete = (index) => {
        Swal.fire({
            title: "Are you sure?",
            text: "Do you want to delete this peak hour entry?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: themeColors.danger,
            cancelButtonColor: themeColors.info,
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "No, cancel"
        }).then((result) => {
            if (result.isConfirmed) {
                const newData = priceData.filter((_, i) => i !== index);
                notifyParent(newData);
            }
        });
    };

    return (
        <>
            <div className="flex flex-row justify-between px-2 mb-2 mt-4">
                <h2 className="text-2xl font-bold mb-4">{title}</h2>
                <Button
                    className="text-xs font-semibold text-white bg-black px-4 py-2"
                    onClick={() => handleOpenModal()}
                >
                    Add Peak Hour
                </Button>
            </div>
            <Card>
                {priceData && priceData.length > 0 ? (
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                                <tr className="bg-primary text-white">
                                    {[
                                        "Start Time",
                                        "End Time",
                                        "Kilometer Price",
                                        "Edit/Delete"
                                    ].map((el, index) => (
                                        <th
                                            key={index}
                                            className="border-b border border-blue-gray-50 py-3 px-5 text-left"
                                        >
                                            <Typography
                                                variant="small"
                                                className="text-[11px]  font-bold uppercase text-white"
                                            >
                                                {el}
                                            </Typography>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {priceData.map(
                                    (
                                        {
                                            start,
                                            end,
                                            kilometerPrice
                                        },
                                        index
                                    ) => {
                                        const className = `py-3 px-5 border ${
                                            index === priceData.length - 1
                                                ? ""
                                                : "border-b border-blue-gray-50"
                                        }`;

                                        return (
                                            <tr key={index}>
                                                <td className={className}>
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {start
                                                            ? moment(start, ["HH:mm", "YYYY-MM-DDTHH:mm:ssZ"]).format("HH:mm")
                                                            : "-"}
                                                    </Typography>
                                                </td>
                                                <td className={className}>
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {end
                                                            ? moment(end, ["HH:mm", "YYYY-MM-DDTHH:mm:ssZ"]).format("HH:mm")
                                                            : "-"}
                                                    </Typography>
                                                </td>
                                                <td className={className}>
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {kilometerPrice || "-"}
                                                    </Typography>
                                                </td>
                                                <td className={`${className} space-x-2`}>
                                                    <Button
                                                        className="bg-primary-400 hover:bg-primary-500"
                                                        onClick={() => handleOpenModal(index)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        className="bg-red-400"
                                                        onClick={() => handleDelete(index)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </CardBody>
                ) : (
                    <h2 className="text-lg font-medium p-4">No Price Data Available</h2>
                )}
            </Card>

            <Dialog open={openModal} handler={handleCloseModal}>
                <DialogHeader>{isEditMode ? "Edit Peak Hour" : "Add Peak Hour"}</DialogHeader>
                <DialogBody divider>
                    <div className="grid gap-4">
                        <Input
                            type="time"
                            label="Start Time"
                            name="start"
                            value={formData.start}
                            onChange={handleInputChange}
                        />
                        <Input
                            type="time"
                            label="End Time"
                            name="end"
                            value={formData.end}
                            onChange={handleInputChange}
                        />
                        <Input
                            type="number"
                            label="Kilometer Price"
                            name="kilometerPrice"
                            value={formData.kilometerPrice}
                            onChange={handleInputChange}
                        />
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="red"
                        onClick={handleCloseModal}
                        className="mr-1"
                    >
                        Cancel
                    </Button>
                    <Button variant="gradient" color="green" onClick={handleSubmit} disabled={!formData.start || !formData.end || !formData.kilometerPrice}>
                        {isEditMode ? "Update" : "Add"}
                    </Button>
                </DialogFooter>
            </Dialog>
        </>
    );
};

export default RidesPeakHourTableEdit;