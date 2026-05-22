import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";
import { NAV_UI } from "@/utils/constants";
import { isSuperUserRole } from "@/utils/roleUtils";

function AdminSubmenu({ permissions = [] }) {
  const getItemClasses = (isActive) =>
    `${NAV_UI.topnav.buttonBase} ${NAV_UI.spacing.topnavButton} ${NAV_UI.typography.topnavLabel} ${
      isActive
        ? `${NAV_UI.colors.topnavActiveBg} ${NAV_UI.colors.topnavActiveText}`
        : `${NAV_UI.colors.topnavInactiveText} ${NAV_UI.topnav.buttonHover}`
    }`;

  const location = useLocation();
  const pathname = location.pathname.toLowerCase();
  const isSuperUser = isSuperUserRole();

  const isMainItemActive = (label, path) => {
    const target = path.toLowerCase();

    if (label === "Version Control") {
      return (
        pathname.startsWith("/dashboard/user/versioncontrollist") ||
        pathname.startsWith("/dashboard/user/versioncontrol/")
      );
    }

    return pathname.startsWith(target);
  };

  const primaryItems = [
    { label: "Users", path: "/dashboard/users", requiredPermission: "Users" },
    { label: "GeoMarkings", path: "/dashboard/admin/geo-markings", requiredPermission: "Users" },
    { label: "Version Control", path: "/dashboard/user/versionControlList", requiredPermission: "Users" },
  ];

  // Secondary/shortcut items that can live on a second row
  const secondaryItems = [
    { label: "Driver Cancellation History", path: "/dashboard/admin/driver-cancellation-history", requiredPermission: "Users" },
    { label: "Driver Bonus", path: "/dashboard/users/driver-offer/list", requiredPermission: "Users" },
    { label: "Trip Master Details", path: "/dashboard/tripDetails", requiredPermission: "Trip Master" },
    { label: "Trip Master Report", path: "/dashboard/reports/tripMasterReport", requiredPermission: "Trip Master" },
  ];
  const filteredPrimaryItems = primaryItems.filter(({ requiredPermission }) => permissions.includes(requiredPermission));
  const filteredSecondaryItems = secondaryItems.filter(({ requiredPermission, label }) => {
    if (label === "Trip Master Report" && !isSuperUser) return false;
    return permissions.includes(requiredPermission);
  });
  const allAdminItems = [...filteredPrimaryItems, ...filteredSecondaryItems];

  if (!allAdminItems.length) {
    return null;
  }

  const firstRowItems = allAdminItems.slice(0, 7);
  const secondRowItems = allAdminItems.slice(7);

  const renderItems = (items) =>
    items.map(({ label, path }) => (
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
      <ul className={NAV_UI.topnav.list}>{renderItems(firstRowItems)}</ul>
      {secondRowItems.length > 0 ? (
        <ul className={NAV_UI.topnav.secondaryList}>{renderItems(secondRowItems)}</ul>
      ) : null}
    </div>
  );
}

export default AdminSubmenu;
