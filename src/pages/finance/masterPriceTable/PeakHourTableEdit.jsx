import { useEffect, useState } from "react";
import { themeColors } from "@/theme/colors";
import {
  Button,
  Card,
  CardBody,
  Typography,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
} from "@material-tailwind/react";
import moment from "moment";
import Swal from "sweetalert2";

const PeakHourTableEdit = ({ title = "Edit Peak Hours Table", addLabel = "Add Peak Hour", initialPriceData = [], onUpdate }) => {
  const [priceData, setPriceData] = useState(initialPriceData);
  const [openModal, setOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [formData, setFormData] = useState({ start: "", end: "", kilometerPrice: "" });

  useEffect(() => {
    setPriceData(initialPriceData || []);
  }, [initialPriceData]);

  const notifyParent = (newData) => {
    setPriceData(newData);
    onUpdate?.(newData);
  };

  const handleOpenModal = (index = null) => {
    if (index !== null) {
      const entry = priceData[index];
      setIsEditMode(true);
      setSelectedIndex(index);
      setFormData({
        start: entry.start ? moment(entry.start, ["HH:mm", "YYYY-MM-DDTHH:mm:ssZ"]).format("HH:mm") : "",
        end: entry.end ? moment(entry.end, ["HH:mm", "YYYY-MM-DDTHH:mm:ssZ"]).format("HH:mm") : "",
        kilometerPrice: entry.kilometerPrice || "",
      });
    } else {
      setIsEditMode(false);
      setSelectedIndex(null);
      setFormData({ start: "", end: "", kilometerPrice: "" });
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
        Swal.fire({ title: "Error", text: "End time must be after Start time.", icon: "error", timer: 3000, showConfirmButton: false });
      }, 100);
      return;
    }

    if (isTimeRangeOverlapping(formData.start, formData.end, isEditMode ? selectedIndex : null)) {
      setOpenModal(false);
      setTimeout(() => {
        Swal.fire({ title: "Error", text: "This time range overlaps with an existing entry.", icon: "error", timer: 3000, showConfirmButton: false });
      }, 100);
      return;
    }

    const payload = {
      start: formData.start,
      end: formData.end,
      kilometerPrice: parseFloat(formData.kilometerPrice) || null,
    };

    const newData = isEditMode
      ? priceData.map((item, index) => (index === selectedIndex ? payload : item))
      : [...priceData, payload];

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
      cancelButtonText: "No, cancel",
    }).then((result) => {
      if (result.isConfirmed) notifyParent(priceData.filter((_, i) => i !== index));
    });
  };

  return (
    <>
      <div className="flex flex-row justify-between px-2 mb-2 mt-4">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <Button className="text-xs font-semibold text-white bg-black px-4 py-2" onClick={() => handleOpenModal()}>
          {addLabel}
        </Button>
      </div>
      <Card>
        {priceData && priceData.length > 0 ? (
          <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr className="bg-primary text-white">
                  {["Start Time", "End Time", "Kilometer Price", "Edit/Delete"].map((el, index) => (
                    <th key={index} className="border-b border border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-white">
                        {el}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {priceData.map(({ start, end, kilometerPrice }, index) => (
                  <tr key={index}>
                    <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs font-semibold text-blue-gray-600">{start ? moment(start, ["HH:mm", "YYYY-MM-DDTHH:mm:ssZ"]).format("HH:mm") : "-"}</Typography></td>
                    <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs font-semibold text-blue-gray-600">{end ? moment(end, ["HH:mm", "YYYY-MM-DDTHH:mm:ssZ"]).format("HH:mm") : "-"}</Typography></td>
                    <td className="py-3 px-5 border-b border-blue-gray-50"><Typography className="text-xs font-semibold text-blue-gray-600">{kilometerPrice ?? "-"}</Typography></td>
                    <td className="py-3 px-5 border-b border-blue-gray-50">
                      <Button size="sm" className="mr-2" onClick={() => handleOpenModal(index)}>Edit</Button>
                      <Button size="sm" color="red" onClick={() => handleDelete(index)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        ) : (
          <h2 className="text-lg font-medium p-4">No Price Data Available</h2>
        )}
      </Card>

      <Dialog open={openModal} handler={handleCloseModal} size="md">
        <DialogHeader>{isEditMode ? "Edit Peak Hour" : "Add Peak Hour"}</DialogHeader>
        <DialogBody className="space-y-4">
          <Input label="Start Time" type="time" name="start" value={formData.start} onChange={handleInputChange} />
          <Input label="End Time" type="time" name="end" value={formData.end} onChange={handleInputChange} />
          <Input label="Kilometer Price" type="number" name="kilometerPrice" value={formData.kilometerPrice} onChange={handleInputChange} />
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};

export default PeakHourTableEdit;