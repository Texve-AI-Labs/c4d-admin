import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";
import { NAV_UI } from "@/utils/constants";

function DriverListSubmenu() {
  const location = useLocation();
  const pathname = location.pathname.toLowerCase();

  const getItemClasses = (isActive) =>
    `${NAV_UI.topnav.buttonBase} ${NAV_UI.spacing.topnavButton} ${NAV_UI.typography.topnavLabel} ${
      isActive
        ? `${NAV_UI.colors.topnavActiveBg} ${NAV_UI.colors.topnavActiveText}`
        : `${NAV_UI.colors.topnavInactiveText} ${NAV_UI.topnav.buttonHover}`
    }`;

  const isItemActive = (label, path) => {
    switch (label) {
      case "All Cab List":
        return (
          pathname.startsWith("/dashboard/vendors/vehiclelist") ||
          pathname.startsWith("/dashboard/vendors/account/allvehicles")
        );
      case "All Auto List":
        return pathname.startsWith("/dashboard/vendors/account/autolist");
      case "All Bike List":
        return (
          pathname.startsWith("/dashboard/vendors/account/parcel") &&
          !pathname.startsWith("/dashboard/vendors/account/parcel/list")
        );
      case "All Bike-Taxi List":
        return pathname.startsWith("/dashboard/vendors/account/biketaxilist");
      default:
        return pathname.startsWith(path.toLowerCase());
    }
  };

  const items = [
    { label: "All Cab List", path: "/dashboard/vendors/vehicleList" },
    { label: "All Auto List", path: "/dashboard/vendors/account/autoList" },
    { label: "All Bike List", path: "/dashboard/vendors/account/parcel" },
    { label: "All Bike-Taxi List", path: "/dashboard/vendors/account/bikeTaxiList" },
  ];

  return (
    <ul className={NAV_UI.topnav.list}>
      {items.map(({ label, path }) => (
        <li key={label}>
          <NavLink to={path} end={false}>
            <Button variant="text" className={getItemClasses(isItemActive(label, path))}>
              <Typography color="inherit" className={NAV_UI.typography.topnavLabel}>
                {label}
              </Typography>
            </Button>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export default DriverListSubmenu;
