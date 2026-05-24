import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";
import { NAV_UI } from "@/utils/constants";

function MarketingSubmenu({ miniSidenav }) {
  const getItemClasses = (isActive) =>
    `${NAV_UI.topnav.buttonBase} ${NAV_UI.spacing.topnavButton} ${NAV_UI.typography.topnavLabel} ${
      isActive
        ? `${NAV_UI.colors.topnavActiveBg} ${NAV_UI.colors.topnavActiveText}`
        : `${NAV_UI.colors.topnavInactiveText} ${NAV_UI.topnav.buttonHover}`
    }`;

  const submenuToggleClasses = `${NAV_UI.topnav.buttonBase} ${NAV_UI.spacing.topnavButton} ${NAV_UI.typography.topnavLabel} ${NAV_UI.colors.topnavInactiveText} ${NAV_UI.topnav.buttonHover}`;

  const [openNotificationSubMenu, setOpenNotificationSubMenu] = useState("");
  const location = useLocation();
  const pathname = location.pathname.toLowerCase();

  const isMainItemActive = (label, path) => {
    const target = path.toLowerCase();

    if (label === "Banner Image") {
      return (
        pathname.startsWith("/dashboard/user/bannerimgview") ||
        pathname.startsWith("/dashboard/user/bannerimg/add")
      );
    }

    // if (label === "Testimonial") {
    //   return (
    //     pathname.startsWith("/dashboard/user/testimonialview") ||
    //     pathname.startsWith("/dashboard/user/testimonial/add")
    //   );
    // }

    return pathname.startsWith(target);
  };

  const items = [
        { label: "Driver Incentive", path: "/dashboard/vendors/driver-incentive", icon: "/img/driver_app_notification.png" },
        { label: "Daily push notification", path: "/dashboard/vendors/notificationList", icon: "/img/push_notification.png" },
        { label: "Batch notification for Customer App", path: "/dashboard/vendors/customerNotificationList", icon: "/img/customerNotification.png" },
        { label: "In-app notification for Driver App", path: "/dashboard/vendors/driverNotificationList", icon: "/img/driver_app_notification.png" },
        { label: "Skip Logs", path: "/dashboard/vendors/skip-logs", icon: "/img/driver_app_notification.png" },
  
    { label: "Banner Image", path: "/dashboard/user/bannerimgView", icon: "/img/banner_img.png" },
    // { label: "Testimonial", path: "/dashboard/user/testimonialView", icon: "/img/testimonial.png" },
  ];

  return (
    <ul className={NAV_UI.topnav.list}>
      {items.map(({ label, path, isSubMenu, subItems, icon }) => (
        <li key={label}>
          {isSubMenu ? (
            <>
              <Button
                variant="text"
                className={submenuToggleClasses}
                onClick={() =>
                  setOpenNotificationSubMenu(
                    openNotificationSubMenu === label ? "" : label
                  )
                }
              >
                <Typography
                  color="inherit"
                  className={NAV_UI.typography.topnavLabel}
                >
                  {label}
                </Typography>
              </Button>
              {openNotificationSubMenu === label && (
                <ul className={NAV_UI.topnav.nestedList}>
                  {subItems.map(({ label: subLabel, path: subPath, icon: subIcon }) => (
                    <li key={subLabel}>
                      <NavLink to={subPath} end={false}>
                        {({ isActive }) => (
                          <Button
                            variant="text"
                            className={getItemClasses(isActive)}
                          >
                            <Typography
                              color="inherit"
                              className={NAV_UI.typography.topnavLabel}
                            >
                              {subLabel}
                            </Typography>
                          </Button>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
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
          )}
        </li>
      ))}
    </ul>
  );
}

export default MarketingSubmenu;
