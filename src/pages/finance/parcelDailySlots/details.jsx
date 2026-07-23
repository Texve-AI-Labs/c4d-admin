import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, Spinner, Typography } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import {
  formatDate,
  formatDateTime,
  formatTime,
  getBookingEntityLabel,
  getBookingEntityValue,
  getBookingStatusChip,
  getSlotStateChip,
  getVehicleTypeChip,
} from "./utils";

const ParcelDailySlotsDetails = () => {
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
        const response = await ApiRequestUtils.get(`${API_ROUTES.GET_ADMIN_PARCEL_DALIY_SLOTS}/${params.id}`);
        const data = response?.data?.data || response?.data || null;
        setSlot(data);
      } catch (error) {
        console.error("Failed to load parcel daily slot details:", error);
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
      <div className="flex items-center justify-between">
        <Typography variant="h5" className="font-semibold">
          Parcel Daily Slot Details
        </Typography>
      </div>

      <Card className="overflow-hidden rounded-2xl border shadow-sm">
        <CardBody className="space-y-6 px-5 md:px-6">
          <div>
            <Typography variant="h6" color="black" className="leading-tight">
              Parcel Daily Slot Summary
            </Typography>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Field label="Slot Date" value={formatDate(displaySlot?.slotDate)} />
            <Field label="Zone" value={displaySlot?.zone || "-"} />
            <Field label="Sub Zone" value={displaySlot?.subZone?.name || displaySlot?.subZone?.label || displaySlot?.subZoneId || "-"} />
            <Field label="Day Of Week" value={displaySlot?.dayOfWeek || "-"} />
            <Field label="Source Rule Type" value={displaySlot?.sourceRuleType || "-"} />
            <Field label="Start Time" value={formatTime(displaySlot?.startTime)} />
            <Field label="End Time" value={formatTime(displaySlot?.endTime)} />
            <Field label="Max Bookings" value={displaySlot?.maxBookings ?? "-"} />
            <Field label="Booked Count" value={displaySlot?.bookingCount ?? displaySlot?.bookedCount ?? "-"} />
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
                  <th className="px-3 py-3">Driver Name</th>
                  <th className="px-3 py-3">Vehicle Type</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Booked At</th>
                  <th className="px-3 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-4 text-center text-gray-600 whitespace-nowrap">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id || booking.bookingId} className="border-b">
                      <td className="px-5 py-3 whitespace-nowrap">{booking.bookingId || booking.id || "-"}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          {/* <span className="font-semibold">{getBookingEntityLabel(booking)}</span> */}
                          <span className="text-sm text-blue-gray-600">{getBookingEntityValue(booking)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Chip
                          value={getVehicleTypeChip(booking.vehicleType || booking.vehicle?.vehicleType || booking.bike?.vehicleType || booking.auto?.vehicleType || booking.parcel?.vehicleType).label}
                          className={getVehicleTypeChip(booking.vehicleType || booking.vehicle?.vehicleType || booking.bike?.vehicleType || booking.auto?.vehicleType || booking.parcel?.vehicleType).className}
                        />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Chip
                          value={getBookingStatusChip(booking.status || booking.vehicle?.status || booking.bike?.status || booking.auto?.status || booking.parcel?.status).label}
                          className={getBookingStatusChip(booking.status || booking.vehicle?.status || booking.bike?.status || booking.auto?.status || booking.parcel?.status).className}
                        />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">{formatDateTime(booking.bookedAt)}</td>
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
        <Button className={ColorStyles.backButton} onClick={() => navigate("/dashboard/finance/parcel-daily-slots")}>
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

export default ParcelDailySlotsDetails;