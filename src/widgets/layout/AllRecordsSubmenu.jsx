import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";
import { NAV_UI } from "@/utils/constants";

function AllRecordsSubmenu({ miniSidenav }) {
  const location = useLocation();
  const pathname = location.pathname.toLowerCase();

  const isMainItemActive = (label, path) => {
    const target = path.toLowerCase();

    switch (label) {
      case "All Cab Records":
        return pathname === "/dashboard/booking/list";
      case "Auto Records":
        return pathname.startsWith("/dashboard/auto");
      case "Acting Drivers Records":
        return pathname.startsWith("/dashboard/booking/list/actingdriver");
      case "Local Records":
        return pathname.startsWith("/dashboard/booking/list/rides");
      case "Rentals Records":
        return pathname.startsWith("/dashboard/booking/list/rentals");
      case "Parcel Records":
        return pathname.startsWith("/dashboard/booking/list/parcel");
      default:
        return pathname.startsWith(target);
    }
  };

  const items = [
    { label: "All Cab Records", path: "/dashboard/booking/list", icon: "/img/all.png" },
    { label: "Auto Records", path:"/dashboard/auto", icon:"/img/auto.png"},
    { label: "Acting Drivers Records", path: "/dashboard/booking/list/actingDriver", icon: "/img/driver.png" },
    { label: "Local Records", path: "/dashboard/booking/list/rides", icon: "/img/rides.png" },
    { label: "Rentals Records", path: "/dashboard/booking/list/rentals", icon: "/img/rental.png" },
    { label: "Parcel Records", path: "/dashboard/booking/list/Parcel", icon: "/img/Parcel_driver.png" },
    { label: "Return Trips Records", path: "/dashboard/booking/list/returntrips", icon: "/img/rides.png" },
    { label: "Return Trip Driver Details", path: "/dashboard/vendors/driver-return-trips", icon: "/img/driver.png" },
  ];

  return (
    <ul className={NAV_UI.topnav.list}>
      {items.map(({ label, path, icon }) => (
        <li key={label}>
          <NavLink to={path} end={false}>
            <Button
              variant="text"
              className={`${NAV_UI.topnav.buttonBase} ${NAV_UI.spacing.topnavButton} ${NAV_UI.typography.topnavLabel} ${
                isMainItemActive(label, path)
                  ? `${NAV_UI.colors.topnavActiveBg} ${NAV_UI.colors.topnavActiveText}`
                  : `${NAV_UI.colors.topnavInactiveText} ${NAV_UI.topnav.buttonHover}`
              }`}
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
      ))}
    </ul>
  );
}

export default AllRecordsSubmenu;
