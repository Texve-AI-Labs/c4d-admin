import React from "react";
import { Button, Typography, Tooltip } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { canCreateVehicle } from "./onboardingMapper";

export default function OnboardingActions({ row }) {
  const navigate = useNavigate();
  const allowVehicle = canCreateVehicle(row);
  const pendingLabel = row?.accountPendingTypes?.length
    ? `Pending: ${row.accountPendingTypes.join(", ")}`
    : "Complete account KYC before vehicle creation";

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        size="sm"
        variant="text"
        className="p-0 text-xs font-semibold normal-case text-primary-900 underline"
        onClick={() => navigate(`/dashboard/vendors/account/details/${row.id}`)}
      >
        View Account
      </Button>

      {allowVehicle ? (
        <Button
          size="sm"
          className="rounded-md bg-green-600 px-3 py-2 text-xs"
          onClick={() =>
            navigate("/dashboard/vendors/account/allVehicles/add", {
              state: {
                accountId: row.id,
                ownerName: row.name,
              },
            })
          }
        >
          Create Vehicle
        </Button>
      ) : (
        <Tooltip content={pendingLabel}>
          <span className="inline-block">
            <Button size="sm" disabled className="rounded-md bg-blue-gray-300 px-3 py-2 text-xs">
              Create Vehicle
            </Button>
          </span>
        </Tooltip>
      )}
      {!allowVehicle ? (
        <Typography className="text-[11px] text-amber-700">
          Complete account docs to unlock
        </Typography>
      ) : null}
    </div>
  );
}
