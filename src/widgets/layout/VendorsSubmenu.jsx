import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";
import { FUTURE_FLAG, NAV_UI } from "@/utils/constants";

function VendorsSubmenu({ miniSidenav }) {
  const getItemClasses = (isActive) =>
    `${NAV_UI.topnav.buttonBase} ${NAV_UI.spacing.topnavButton} ${NAV_UI.typography.topnavLabel} ${
      isActive
        ? `${NAV_UI.colors.topnavActiveBg} ${NAV_UI.colors.topnavActiveText}`
        : `${NAV_UI.colors.topnavInactiveText} ${NAV_UI.topnav.buttonHover}`
    }`;

  const location = useLocation();
  const pathname = location.pathname.toLowerCase();

  const isMainItemActive = (label, path) => {
    const target = path.toLowerCase();

    switch (label) {
      case "All Cab Owners":
        // Only highlight Owners on the main owners page
        return pathname === "/dashboard/vendors/account/owner-onboarding-cab";
      case "All Acting Driver":
        return pathname.startsWith("/dashboard/vendors/account/drivers");
      case "All Cab List":
        // Treat vehicles list + allVehicles (+ details/edit) as Vehicles tab
        return (
          pathname.startsWith("/dashboard/vendors/vehiclelist") ||
          pathname.startsWith("/dashboard/vendors/account/allvehicles")
        );
      case "Online Vehicles List":
        return pathname.startsWith("/dashboard/vendors/onlinevehicleslist");
      case "All Auto Owner":
        return pathname.startsWith("/dashboard/vendors/account/owner-onboarding-auto");
      case "All Auto List":
        return pathname.startsWith("/dashboard/vendors/account/autolist");
      case "All Parcel-Bike Owner":
        return (pathname.startsWith("/dashboard/vendors/account/owner-onboarding-bike") &&
          !pathname.startsWith("/dashboard/vendors/account/owner-onboarding-bike-taxi")
        );
      case "All Parcel-Bike List":
        return (
          pathname.startsWith("/dashboard/vendors/account/parcel") &&
          !pathname.startsWith("/dashboard/vendors/account/parcel/list")
        );
      case "All Bike-Taxi Owner":
        return pathname.startsWith("/dashboard/vendors/account/owner-onboarding-bike-taxi");
      case "All Document Verification":
        return pathname.startsWith("/dashboard/doc-verification");
      case "All Pending Documents":
        return pathname.startsWith("/dashboard/doc-verification/pending");
      case "Return Trip Created Details":
      default:
        return pathname.startsWith(target);
    }
  };

  const items = [
    { label: "All Cab Owners", path: "/dashboard/vendors/account/owner-onboarding-cab", icon: "/img/owners.png" },
    { label: "All Acting Driver", path: "/dashboard/vendors/account/drivers", icon: "/img/acting_driver.png" },
    { label: "All Auto Owner", path: "/dashboard/vendors/account/owner-onboarding-auto", icon: "/img/parcel_list.png" },
    { label: "All Parcel-Bike Owner", path: "/dashboard/vendors/account/owner-onboarding-bike", icon: "/img/parcel_list.png" },
    { label: "All Bike-Taxi Owner", path: "/dashboard/vendors/account/owner-onboarding-bike-taxi", icon: "/img/parcel_list.png" },
    { label: "Online Vehicles List", path: "/dashboard/vendors/onlineVehiclesList", icon: "/img/vehicleslist.png" },
    { label: "All Cab List", path: "/dashboard/vendors/vehicleList", icon: "/img/vehicles.png" },
    { label: "All Auto List", path: "/dashboard/vendors/account/autoList", icon: "/img/auto.png" },
    { label: "All Bike List", path: "/dashboard/vendors/account/parcel", icon: "/img/Parcel_driver.png" },
    ...(FUTURE_FLAG.DOCUMENT_DETAILS_LIST
      ? [{ label: "All Document Verification", path: "/dashboard/doc-verification", icon: "/img/all.png" }]
      : []),
    ...(FUTURE_FLAG.PENDING_DOCUMENTS_LIST
      ? [{ label: "All Pending Documents", path: "/dashboard/doc-verification/pending", icon: "/img/pending_doc.png" }]
      : []),
  ];
  const rowSize = 5;
  const rows = [];
  for (let i = 0; i < items.length; i += rowSize) {
    rows.push(items.slice(i, i + rowSize));
  }

  const renderItems = (menuItems) =>
    menuItems.map(({ label, path }) => (
        <li key={label}>
            <NavLink to={path} end={false}>
              <Button
                variant="text"
                className={getItemClasses(isMainItemActive(label, path))}
              >
                  <Typography
                    color="inherit"
                    className={NAV_UI.typography.topnavLabel}
                  >
                    {label}
                  </Typography>
              </Button>
            </NavLink>
        </li>
    ));

  return (
    <div>
      {rows.map((row, index) => (
        <ul
          key={`vendors-row-${index}`}
          className={index === 0 ? NAV_UI.topnav.list : NAV_UI.topnav.secondaryList}
        >
          {renderItems(row)}
        </ul>
      ))}
    </div>
  );
}

export default VendorsSubmenu;
