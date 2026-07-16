import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";

export default function ReturnTripDriverSubscriptionDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [row, setRow] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await ApiRequestUtils.get(API_ROUTES.GET_RETURN_TRIP_ELIGIBILITY);
      const rows = Array.isArray(response?.data) ? response.data : Array.isArray(response?.result) ? response.result : [];
      setRow(rows.find((item) => String(item.id) === String(id)) || null);
    };
    fetchData().catch((error) => console.error("Error loading return trip details:", error));
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-4 shadow-md sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Return Trip Driver Subscription Details</h2>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldRow label="Tier" value={row?.tier} />
          <FieldRow label="Plan Name" value={row?.planName} />
          <FieldRow label="Service Type" value={row?.serviceType} />
          <FieldRow label="Zone" value={row?.zone} />
          <div className="rounded-md border p-3">
            <div className="text-xs font-semibold uppercase text-gray-500">Eligible For Return Trip</div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-sm text-gray-600">No</span>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full ${row?.eligibleForReturnTrip ? "bg-green-500" : "bg-gray-300"}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${row?.eligibleForReturnTrip ? "translate-x-5" : "translate-x-1"}`} />
              </div>
              <span className="text-sm text-gray-600">Yes</span>
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs font-semibold uppercase text-gray-500">Status</div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-sm text-gray-600">Inactive</span>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full ${(row?.status || "").toUpperCase() === "ACTIVE" ? "bg-green-500" : "bg-gray-300"}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${(row?.status || "").toUpperCase() === "ACTIVE" ? "translate-x-5" : "translate-x-1"}`} />
              </div>
              <span className="text-sm text-gray-600">Active</span>
            </div>
          </div>
          <FieldRow label="Notes" value={row?.notes} />
          <div className="col-span-1 flex justify-center gap-3 pt-2 sm:col-span-2">
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-100"
              onClick={() => navigate("/dashboard/finance/master-subscription/return-trip-driver")}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded-md border border-blue-700 bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={() => navigate(`/dashboard/finance/master-subscription/return-trip-driver/edit/${id}`)}
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, value, className = "" }) {
  return (
    <div className={`rounded-md border bg-white p-3 shadow-sm ${className}`}>
      <div className="text-xs font-semibold uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{value || "-"}</div>
    </div>
  );
}