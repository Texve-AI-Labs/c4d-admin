import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const getStatusClass = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
      return "bg-green-100 text-green-700 border-green-200";
    case "INACTIVE":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-blue-gray-100 text-blue-gray-700 border-blue-gray-200";
  }
};

const formatOptionLabel = (value) => {
  if (!value) return "-";

  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export default function DriverSubscriptionList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRows = async () => {
      try {
        setLoading(true);
        const response = await ApiRequestUtils.get(API_ROUTES.GET_DRIVER_SUBSCRIPTIONS_FEEDBACK);
        const data = Array.isArray(response?.data) ? response.data : Array.isArray(response?.result) ? response.result : [];
        setRows(data);
      } catch (error) {
        console.error("Failed to fetch driver subscriptions:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRows();
  }, []);

  const tableRows = useMemo(() => rows || [], [rows]);

  return (
    <div className="mt-8 flex flex-col gap-6">
      <Card>
        <CardHeader variant="gradient" className={`mb-4 rounded-xl p-6 ${ColorStyles.bgColor}`}>
          <div className="flex items-center justify-between gap-4">
            <Typography variant="h6" color="white">
              Driver Subscription List
            </Typography>
            <Button className="rounded-xl bg-white px-4 py-2 text-black shadow-none hover:shadow-none" onClick={() => navigate("/dashboard/finance/driver-subscription-feedback/add")}>
              Add New
            </Button>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner className="h-10 w-10" />
            </div>
          ) : (
            <table className="w-full min-w-[1000px] table-auto">
              <thead>
                <tr>
                  {["Service Type", "Placement", "Overall Label", "First Label", "Star", "Sort Order", "Status"].map((heading) => (
                    <th key={heading} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                        {heading}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.length > 0 ? (
                  tableRows.map((row) => (
                    <tr key={row?.id} className="text-sm">
                      <td className="border-b border-blue-gray-50 py-3 px-5">
                        <span
                          className="cursor-pointer text-blue-600 underline decoration-blue-600 underline-offset-2 hover:text-blue-800"
                          onClick={() => navigate(`/dashboard/finance/driver-subscription-feedback/details/${row?.id}`)}
                        >
                          {formatOptionLabel(row?.serviceType)}
                        </span>
                      </td>
                      <td className="border-b border-blue-gray-50 py-3 px-5">{formatOptionLabel(row?.placement)}</td>
                      <td className="border-b border-blue-gray-50 py-3 px-5">{row?.overallLabel || "-"}</td>
                      <td className="border-b border-blue-gray-50 py-3 px-5">{row?.firstLabel || "-"}</td>
                      <td className="border-b border-blue-gray-50 py-3 px-5">{row?.star ?? "-"}</td>
                      <td className="border-b border-blue-gray-50 py-3 px-5">{row?.sortOrder ?? "-"}</td>
                      <td className="border-b border-blue-gray-50 py-3 px-5">
                        <Chip
                          variant="ghost"
                          value={formatOptionLabel(row?.status)}
                          className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(row?.status)}`}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-gray-500">
                      No Driver Subscription data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
