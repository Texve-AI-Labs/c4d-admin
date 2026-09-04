import React, { useState } from "react";
import { Button, Card, CardBody, Input, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const ActingDriverDailySlotsAdd = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!date) {
      setError("Date is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await ApiRequestUtils.post(API_ROUTES.POST_ADMIN_ACTING_DRIVER_DAILY_SLOTS, { date });

      if (!response?.success) {
        throw new Error(response?.message || "Unable to add acting driver daily slot");
      }

      navigate("/dashboard/finance/acting-driver-daily-slots");
    } catch (submitError) {
      console.error("Failed to add acting driver daily slot:", submitError);
      setError(submitError?.message || "Failed to add acting driver daily slot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 mt-8 flex flex-col gap-6">
      <Card className="overflow-hidden rounded-2xl border shadow-sm">
        <Typography variant="h6" color="black" className="px-4 py-4 md:px-6 md:py-6">
          Add Acting Driver Daily Slot
        </Typography>
        <CardBody className="px-4 pb-4 pt-2 md:px-6 md:pb-6">
          <form className="grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Input
                type="date"
                label="Date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                disabled={loading}
              />
              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            </div>

            <div className="flex flex-col-reverse gap-3 md:col-span-2 md:flex-row md:justify-center">
              <Button
                type="button"
                className={`w-full md:w-auto ${ColorStyles.backButton}`}
                onClick={() => navigate("/dashboard/finance/acting-driver-daily-slots")}
                disabled={loading}
              >
                Back
              </Button>
              <Button type="submit" className={`w-full md:w-auto ${ColorStyles.editButton}`} disabled={loading}>
                {loading ? "Adding..." : "Add Slot"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default ActingDriverDailySlotsAdd;
