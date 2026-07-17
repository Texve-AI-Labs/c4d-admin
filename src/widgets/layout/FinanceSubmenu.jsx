import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";
import { NAV_UI } from "@/utils/constants";

function FinanceSubmenu({ permissions = [] }) {
  const location = useLocation();
  const pathname = location.pathname.toLowerCase();

  const getItemClasses = (isActive) =>
    `${NAV_UI.topnav.buttonBase} ${NAV_UI.spacing.topnavButton} ${NAV_UI.typography.topnavLabel} ${
      isActive
        ? `${NAV_UI.colors.topnavActiveBg} ${NAV_UI.colors.topnavActiveText}`
        : `${NAV_UI.colors.topnavInactiveText} ${NAV_UI.topnav.buttonHover}`
    }`;

  const items = [
    { label: "Subscription Invoice", path: "/dashboard/finance/invoice" },
    { label: "Booking Receipt", path: "/dashboard/finance/receipt" },
    { label: "Parcel Commission", path: "/dashboard/finance/parcel-commission" },
    { label: "Master Subscription Table", path: "/dashboard/finance/master-subscription" },
    { label: "Return Trip Driver Master Subscription Table", path: "/dashboard/finance/master-subscription/return-trip-driver" },
    { label: "Booking Invoice", path: "/dashboard/finance/bookingInvoiceList" },
    { label: "Withdrawal Rules", path: "/dashboard/finance/withdrawal-rules" },
    { label: "Master Price Table", path: "/dashboard/finance/master-price", requiredPermission: "Users" },
    { label: "Instant Reward", path: "/dashboard/finance/instant-reward", requiredPermission: "Users" },
    { label: "Discount Module", path: "/dashboard/finance/discountModuleList", requiredPermission: "Users" },
    { label: "Custom Discount", path: "/dashboard/finance/custom-discount/list", requiredPermission: "Users" },
    { label: "Settings", path: "/dashboard/finance/GSTList", requiredPermission: "Users" },
    { label: "Cash Back", path: "/dashboard/finance/cash-back/list", requiredPermission: "Users" },
    { label: "Driver KM Bonus", path: "/dashboard/finance/driver-bonus/list", requiredPermission: "Users" },
  ];
  const filteredItems = items.filter(({ requiredPermission }) => {
    if (!requiredPermission) return true;
    return permissions.includes(requiredPermission);
  });
  const firstRowItems = filteredItems.slice(0, 5);
  const secondRowItems = filteredItems.slice(5);
  const isMainItemActive = (label, path, navActive) => {
    if (navActive) return true;

    if (label === "Booking Invoice") {
      return pathname.startsWith("/dashboard/finance/bookinginvoice");
    }
    if (label === "Cash Back") {
      return pathname.startsWith("/dashboard/finance/cash-back");
    }
    if (label === "Driver KM Bonus") {
      return pathname.startsWith("/dashboard/finance/driver-bonus");
    }
    if (label === "Discount Module") {
      return pathname.startsWith("/dashboard/finance/discountmodule");
    }
    if (label === "Custom Discount") {
      return pathname.startsWith("/dashboard/finance/custom-discount");
    }
    if (label === "Settings") {
      return pathname.startsWith("/dashboard/finance/gst");
    }
    if(label === "Parcel Commission") {
      return pathname.startsWith("/dashboard/finance/parcel-commission");
    }
    if (label === "Master Subscription Table") {
      return pathname === "/dashboard/finance/master-subscription";
    }
    if (label === "Withdrawal Rules") {
      return pathname.startsWith("/dashboard/finance/withdrawal-rules");
    }
    if (label === "Return Trip Driver Master Subscription Table") {
      return pathname.startsWith("/dashboard/finance/master-subscription/return-trip-driver");
    }

    return pathname.startsWith(path.toLowerCase());
  };

  const renderItems = (menuItems) =>
    menuItems.map(({ label, path }) => (
        <li key={label}>
          <NavLink to={path} end={label === "Master Subscription Table"}>
            {({ isActive }) => (
              <Button
                variant="text"
                className={getItemClasses(isMainItemActive(label, path, isActive))}
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
    ));

  return (
    <div>
      <ul className={NAV_UI.topnav.list}>{renderItems(firstRowItems)}</ul>
      {secondRowItems.length > 0 ? (
        <ul className={NAV_UI.topnav.secondaryList}>{renderItems(secondRowItems)}</ul>
      ) : null}
    </div>
  );
}

export default FinanceSubmenu;
