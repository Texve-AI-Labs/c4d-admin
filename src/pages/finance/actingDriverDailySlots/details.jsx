import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Chip, Spinner, Typography } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import {
  formatDate,
  formatDateTime,
  formatDisplayTime,
  getBookingEntityValue,
  getBookingPhoneNumber,
  getBookingStatusChip,
  getSlotStateChip,
} from "./utils";

const ActingDriverDailySlotsDetails = () => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [slot, setSlot] = useState(location.state?.slot || null);

  const initial = useMemo(() => slot || { id: params.id }, [slot, params.id]);

  useEffect(() => {
    if (slot || !params.id) return;

    const loadSlot = async () => {
      setLoading(true);
      try {
        const response = await ApiRequestUtils.get(`${API_ROUTES.GET_ADMIN_ACTING_DRIVER_DAILY_SLOTS}/${params.id}`);
        const data = response?.data?.data || response?.data || null;
        setSlot(data);
      } catch (error) {
        console.error("Failed to load acting driver daily slot details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSlot();
  }, [params.id, slot]);

  const displaySlot = slot || initial;
  const stateChip = getSlotStateChip(displaySlot);

  if (loading && !slot) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  const bookings = Array.isArray(displaySlot?.bookings) ? displaySlot.bookings : [];

  return (
    <div className="flex flex-col gap-6 bg-white p-4 rounded-xl">
      <div className="flex items-center justify-between gap-3">
        <Typography variant="h5" className="font-semibold">
          Acting Driver Daily Slot Details
        </Typography>
      </div>

      <Card className="overflow-hidden rounded-2xl border shadow-sm">
        <CardBody className="space-y-6 px-5 md:px-6">
          <div>
            <Typography variant="h6" color="black" className="leading-tight">
              Acting Driver Daily Slot Summary
            </Typography>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Field label="Slot ID" value={displaySlot?.id || "-"} />
            <Field label="Slot Date" value={formatDate(displaySlot?.date)} />
            <Field label="Zone" value={displaySlot?.zone || "-"} />
            <Field label="Day Of Week" value={displaySlot?.dayOfWeek || "-"} />
            <Field label="Time" value={formatDisplayTime(displaySlot)} />
            <Field label="Capacity" value={displaySlot?.capacity ?? "-"} />
            <Field label="Booked Drivers" value={displaySlot?.bookedDrivers ?? "-"} />
            <Field label="Remaining Capacity" value={displaySlot?.remainingCapacity ?? "-"} />
            <Field label="State" value={<Chip value={stateChip.label} className={stateChip.className} />} />
          </div>
        </CardBody>
      </Card>

      <Card className="overflow-hidden rounded-2xl border shadow-sm">
        <Typography variant="h6" color="black" className="p-2">
          Bookings
        </Typography>
        <CardBody className="pl-2 pr-2 border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] table-auto">
              <thead className="border bg-primary text-white font-medium whitespace-nowrap text-left">
                <tr>
                  <th className="px-3 py-3">Booking Id</th>
                  <th className="px-3 py-3">Driver Id</th>
                  <th className="px-3 py-3">Driver Name</th>
                  <th className="px-3 py-3">Phone Number</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Booked At</th>
                  <th className="px-3 py-3">Unselected At</th>
                  <th className="px-3 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-4 text-center text-gray-600 whitespace-nowrap">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id || booking.bookingId} className="border-b">
                      <td className="px-5 py-3 whitespace-nowrap">{booking.bookingId || booking.id || "-"}</td>
                      <td className="px-5 py-3 whitespace-nowrap">{booking.driverId || "-"}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-blue-gray-600">{getBookingEntityValue(booking)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">{getBookingPhoneNumber(booking)}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Chip
                          value={getBookingStatusChip(booking.status).label}
                          className={getBookingStatusChip(booking.status).className}
                        />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">{formatDateTime(booking.bookedAt)}</td>
                      <td className="px-5 py-3 whitespace-nowrap">{formatDateTime(booking.unselectedAt)}</td>
                      <td className="px-5 py-3 whitespace-nowrap">{booking.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      <div className="flex justify-center">
        <Button className={ColorStyles.backButton} onClick={() => navigate("/dashboard/finance/acting-driver-daily-slots")}>
          Back
        </Button>
      </div>
    </div>
  );
};

const Field = ({ label, value }) => (
  <div className="rounded-lg border border-blue-gray-100 bg-white p-3">
    <Typography variant="small" className="font-semibold text-blue-gray-700">
      {label}
    </Typography>
    <div className="mt-1 text-sm text-blue-gray-800">{value}</div>
  </div>
);

export default ActingDriverDailySlotsDetails;
