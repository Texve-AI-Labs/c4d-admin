import React from "react";
import { NavLink } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";
import { BOOKING_FEATURES, NAV_UI } from "@/utils/constants";

function SupportSubmenu({ permissions = [] }) {
  const getItemClasses = (isActive) =>
    `${NAV_UI.topnav.buttonBase} ${NAV_UI.spacing.topnavButton} ${NAV_UI.typography.topnavLabel} ${
      isActive
        ? `${NAV_UI.colors.topnavActiveBg} ${NAV_UI.colors.topnavActiveText}`
        : `${NAV_UI.colors.topnavInactiveText} ${NAV_UI.topnav.buttonHover}`
    }`;

  const items = [
    { label: "Rate Card", path: "/dashboard/rental-rate-card", requiredPermission: "Support" },
    { label: "Leads", path: "/dashboard/leads", requiredPermission: "Support" },
    { label: "Payment Failed Records", path: "/dashboard/support/payment-failed-records", requiredPermission: "Support" },
    ...(BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW
      ? [{ label: "Admin Discount History", path: "/dashboard/support/admin-discount-history", requiredPermission: "Users" }]
      : []),
    { label: "Driver Ads", path: "/dashboard/support/driver-ads", requiredPermission: "Support" },
    { label: "Driver Ads Reg", path: "/dashboard/support/driver-ads-reg", requiredPermission: "Support" },    
    { label: "Support Review & Reward Management", path: "/dashboard/support/review-reward-management", requiredPermission: "Support" },
    { label: "Customer Cancellation Charge Logs", path: "/dashboard/support/customer-cancellation-charge-logs", requiredPermission: "Users" },
  ];
  const filteredItems = items.filter(({ requiredPermission }) => permissions.includes(requiredPermission));

  if (!filteredItems.length) {
    return null;
  }

  return (
    <ul className={NAV_UI.topnav.list}>
      {filteredItems.map(({ label, path }) => (
        <li key={label}>
          <NavLink to={path} end={false}>
            {({ isActive }) => (
              <Button
                variant="text"
                className={getItemClasses(isActive)}
              >
                <Typography
                  color="inherit"
                  className={NAV_UI.typography.topnavLabel}
                >
                  {label}
                </Typography>
              </Button>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export default SupportSubmenu;
