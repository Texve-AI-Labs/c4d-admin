import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";
import { NAV_UI } from "@/utils/constants";

const FINANCE_GROUPS = [
  {
    title: "Billing",
    items: [
      { label: "Subscription Invoice", path: "/dashboard/finance/invoice" },
      { label: "Booking Receipt", path: "/dashboard/finance/receipt" },
      { label: "Booking Invoice", path: "/dashboard/finance/bookingInvoiceList" },
    ],
  },
  {
    title: "Pricing",
    items: [
      { label: "Master Subscription Table", path: "/dashboard/finance/master-subscription" },
      { label: "Return Trip Driver Master Subscription Table", path: "/dashboard/finance/master-subscription/return-trip-driver" },
      { label: "Master Price Table", path: "/dashboard/finance/master-price", requiredPermission: "Users" },
    ],
  },
  {
    title: "Rewards",
    items: [
      { label: "Instant Reward", path: "/dashboard/finance/instant-reward", requiredPermission: "Users" },
      { label: "Cash Back", path: "/dashboard/finance/cash-back/list", requiredPermission: "Users" },
      { label: "Driver KM Bonus", path: "/dashboard/finance/driver-bonus/list", requiredPermission: "Users" },
      { label: "Discount Module", path: "/dashboard/finance/discountModuleList", requiredPermission: "Users" },
      { label: "Custom Discount", path: "/dashboard/finance/custom-discount/list", requiredPermission: "Users" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Parcel Commission", path: "/dashboard/finance/parcel-commission" },
      { label: "Parcel Slot Config", path: "/dashboard/finance/parcel-slot-config", requiredPermission: "Users" },
      { label: "Parcel Daily Slots", path: "/dashboard/finance/parcel-daily-slots", requiredPermission: "Users" },
      { label: "Withdrawal Transaction", path: "/dashboard/finance/wallet-transaction", requiredPermission: "Users" },
      { label: "Withdrawal Rules", path: "/dashboard/finance/withdrawal-rules", requiredPermission: "Users" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Settings", path: "/dashboard/finance/GSTList", requiredPermission: "Users" },
    ],
  },
];

const getFinanceGroupForPath = (groups, pathname, isMainItemActive) =>
  groups.find((group) =>
    group.items.some(({ label, path }) => isMainItemActive(label, path, pathname === path.toLowerCase()))
  );

function FinanceSubmenu({ permissions = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname.toLowerCase();
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
    if (label === "Parcel Slot Config") {
      return pathname.startsWith("/dashboard/finance/parcel-slot-config");
    }
    if (label === "Parcel Daily Slots") {
      return pathname.startsWith("/dashboard/finance/parcel-daily-slots");
    }
    if (label === "Master Subscription Table") {
      return pathname === "/dashboard/finance/master-subscription";
    }
    if (label === "Withdrawal Rules") {
      return pathname.startsWith("/dashboard/finance/withdrawal-rules");
    }
    if (label === "Withdrawal Transaction") {
      return pathname.startsWith("/dashboard/finance/wallet-transaction");
    }
    if (label === "Return Trip Driver Master Subscription Table") {
      return pathname.startsWith("/dashboard/finance/master-subscription/return-trip-driver");
    }

    return pathname.startsWith(path.toLowerCase());
  };

  const getItemClasses = (isActive) =>
    `${NAV_UI.topnav.buttonBase} ${NAV_UI.spacing.topnavButton} ${NAV_UI.typography.topnavLabel} ${
      isActive
        ? `${NAV_UI.colors.topnavActiveBg} ${NAV_UI.colors.topnavActiveText}`
        : `${NAV_UI.colors.topnavInactiveText} ${NAV_UI.topnav.buttonHover}`
    }`;

  const visibleGroups = useMemo(
    () =>
      FINANCE_GROUPS
        .map((group) => ({
          ...group,
          items: group.items.filter(({ requiredPermission }) => {
            if (!requiredPermission) return true;
            return permissions.includes(requiredPermission);
          }),
        }))
        .filter((group) => group.items.length > 0),
    [permissions]
  );

  const getGroupDefaultPath = (groupTitle) => {
    const group = visibleGroups.find((item) => item.title === groupTitle);
    return group?.items?.[0]?.path || "/dashboard/finance/invoice";
  };

  const routeGroupTitle = useMemo(() => {
    const matchedGroup = getFinanceGroupForPath(visibleGroups, pathname, isMainItemActive);
    return matchedGroup?.title || visibleGroups[0]?.title || "Billing";
  }, [pathname, visibleGroups]);

  const [openGroup, setOpenGroup] = useState(routeGroupTitle);
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      setOpenGroup(routeGroupTitle);
      previousPathRef.current = pathname;
    }
  }, [pathname, routeGroupTitle]);

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
    <div className="w-full">
      <div className="flex w-full flex-nowrap gap-2 overflow-x-auto pb-1 bg-blue-gray-50 rounded-md">
        {visibleGroups.map((group) => (
          <Button
            key={group.title}
            variant="text"
            type="button"
            className={`${NAV_UI.topnav.buttonBase} ${NAV_UI.spacing.topnavButton} ${NAV_UI.typography.topnavLabel} inline-flex flex-1 basis-0 justify-center rounded-xl px-4 py-2 transition-colors duration-150 ${
              openGroup === group.title
                ? "bg-primary text-white"
              : "bg-slate-100 text-slate-700"
            }`}
            onClick={() => {
              setOpenGroup(group.title);
              navigate(getGroupDefaultPath(group.title));
            }}
          >
            {group.title}
          </Button>
        ))}
      </div>
      <div className="mt-2 w-full overflow-x-auto whitespace-nowrap">
        {visibleGroups
          .filter((group) => group.title === openGroup)
          .map((group) => (
            <ul key={group.title} className={`${NAV_UI.topnav.list} w-max flex-nowrap`}>
              {renderItems(group.items)}
            </ul>
          ))}
      </div>
    </div>
  );
}

export default FinanceSubmenu;
