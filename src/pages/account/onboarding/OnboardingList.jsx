import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Input,
  Select,
  Option,
  Spinner,
} from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import OnboardingStatusBadge from "./OnboardingStatusBadge";
import OnboardingActions from "./OnboardingActions";
import { normalizeOnboardingRows } from "./onboardingMapper";

export default function OnboardingList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("ALL");
  const [serviceType, setServiceType] = useState("Company");
  const [error, setError] = useState("");

  const fetchRows = async (searchValue = "", stageValue = "ALL", serviceTypeValue = "Company") => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page: 1,
        limit: 20,
        search: searchValue.trim(),
        serviceType: serviceTypeValue,
      };

      if (stageValue !== "ALL") {
        params.stage = stageValue;
      }

      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.DRIVER_NEW_ONBOARDING, params);
      if (!response?.success) {
        setRows([]);
        setError(response?.message || "Unable to fetch onboarding list");
        return;
      }

      setRows(normalizeOnboardingRows(response));
    } catch (err) {
      console.error("Failed to fetch onboarding list", err);
      setRows([]);
      setError("Failed to fetch onboarding list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRows(search, stage, serviceType);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, stage, serviceType]);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-8">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-6 p-6">
          <Typography variant="h6" color="white">
            Account Onboarding
          </Typography>
        </CardHeader>

        <CardBody className="px-0 pt-0 pb-2">
          <div className="grid grid-cols-1 gap-4 px-6 pb-4 md:grid-cols-3">
            <Input
              label="Search by name / phone / email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select label="Service Type" value={serviceType} onChange={(v) => setServiceType(v || "Company")}>
              <Option value="Company">Company</Option>
              <Option value="Individual">Individual</Option>
            </Select>
            <Select label="Stage" value={stage} onChange={(v) => setStage(v || "ALL")}>
              <Option value="ALL">ALL</Option>
              <Option value="ACCOUNT">ACCOUNT</Option>
              <Option value="VEHICLE">VEHICLE</Option>
              <Option value="COMPLETED">COMPLETED</Option>
            </Select>
          </div>

          {error ? <Typography className="px-6 pb-4 text-red-500 text-sm">{error}</Typography> : null}

          {loading ? (
            <div className="w-full flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <table className="w-full min-w-[1080px] table-auto">
              <thead>
                <tr>
                  {["S.No", "Account", "Phone", "Account Docs", "Pending Types", "Stage", "Vehicle Docs", "Created At", "Actions"].map((head) => (
                    <th key={head} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-700">
                        {head}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-sm text-blue-gray-500">
                      No onboarding accounts found
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const className = `py-3 px-5 ${index === rows.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                    return (
                    <tr key={row.id || index}>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">{index + 1}</Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-700">{row.name}</Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-medium text-blue-gray-600">{row.phoneNumber}</Typography>
                      </td>
                      <td className={className}>
                        <OnboardingStatusBadge value={row.accountDocStatus} />
                      </td>
                      <td className={className}>
                        <Typography className="text-xs text-blue-gray-600">
                          {row.accountPendingTypes.length ? row.accountPendingTypes.join(", ") : "-"}
                        </Typography>
                      </td>
                      <td className={className}>
                        <OnboardingStatusBadge value={row.stage} />
                      </td>
                      <td className={className}>
                        <OnboardingStatusBadge value={row.vehicleDocStatus} />
                      </td>
                      <td className={className}>
                        <Typography className="text-xs text-blue-gray-600">
                          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
                        </Typography>
                      </td>
                      <td className={className}>
                        <OnboardingActions row={row} />
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
