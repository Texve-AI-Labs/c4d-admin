import React, { useEffect, useMemo, useState } from "react";
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
      { label: "Joining Bonus", path: "/dashboard/finance/joining-bonus" },
      { label: "Driver Radius & Bonus Configuration", path: "/dashboard/finance/driver-radius-bonus" },
      { label: "Return Trip Driver Master Subscription Table", path: "/dashboard/finance/master-subscription/return-trip-driver" },
      { label: "Master Price Table", path: "/dashboard/finance/master-price", requiredPermission: "Users" },
    ],
  },
  {
    title: "Rewards",
    items: [
      { label: "Instant Reward", path: "/dashboard/finance/instant-reward", requiredPermission: "Users" },
      { label: "Referral Rules", path: "/dashboard/finance/referral-rules/list", requiredPermission: "Users" },
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
      { label: "Acting Driver Slot Config", path: "/dashboard/finance/acting-driver-slot-config", requiredPermission: "Users" },
      { label: "Acting Driver Daily Slots", path: "/dashboard/finance/acting-driver-daily-slots", requiredPermission: "Users" },
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

const ROUTE_MATCHERS = {
  "Subscription Invoice": ["/finance/invoice"],
  "Booking Receipt": ["/finance/receipt"],
  "Booking Invoice": ["/finance/bookinginvoicelist", "/finance/bookinginvoice/details"],
  "Master Subscription Table": [
    "/finance/master-subscription",
    "/finance/master-subscription/add",
    "/finance/master-subscription/edit",
    "/finance/master-subscription/details",
    "/finance/master-subscription/log",
  ],
  "Joining Bonus": ["/dashboard/finance/joining-bonus"],
  "Driver Radius & Bonus Configuration": [
    "/dashboard/finance/driver-radius-bonus",
    "/dashboard/finance/driver-radius-bonus/add",
    "/dashboard/finance/driver-radius-bonus/edit",
    "/dashboard/finance/driver-radius-bonus/details",
  ],
  "Master Price Table": ["/finance/master-price"],
  "Instant Reward": ["/finance/instant-reward"],
  "Referral Rules": ["/finance/referral-rules"],
  "Cash Back": ["/finance/cash-back"],
  "Driver KM Bonus": ["/finance/driver-bonus"],
  "Discount Module": ["/finance/discountmodulelist", "/finance/discountmodule/add", "/finance/discountmodule/edit"],
  "Custom Discount": ["/finance/custom-discount", "/finance/custom-discount/add", "/finance/custom-discount/edit"],
  "Settings": ["/finance/gstlist", "/finance/gst/add", "/finance/gst/edit"],
  "Parcel Commission": ["/finance/parcel-commission"],
  "Parcel Slot Config": ["/finance/parcel-slot-config", "/finance/parcel-slot-config/add", "/finance/parcel-slot-config/edit", "/finance/parcel-slot-config/details"],
  "Parcel Daily Slots": ["/finance/parcel-daily-slots", "/finance/parcel-daily-slots/details"],
  "Acting Driver Slot Config": ["/finance/acting-driver-slot-config", "/finance/acting-driver-slot-config/add", "/finance/acting-driver-slot-config/edit", "/finance/acting-driver-slot-config/details"],
  "Acting Driver Daily Slots": ["/finance/acting-driver-daily-slots", "/finance/acting-driver-daily-slots/add", "/finance/acting-driver-daily-slots/details"],
  "Withdrawal Rules": ["/finance/withdrawal-rules", "/finance/withdrawal-rules/add", "/finance/withdrawal-rules/edit"],
  "Withdrawal Transaction": ["/finance/wallet-transaction"],
  "Return Trip Driver Master Subscription Table": ["/finance/master-subscription/return-trip-driver", "/finance/master-subscription/return-trip-driver/add", "/finance/master-subscription/return-trip-driver/edit", "/finance/master-subscription/return-trip-driver/details"],
};

const normalizePath = (value) => String(value || "").toLowerCase().replace("/dashboard", "");

const matchesRouteFamily = (pathname, label, path) => {
  const normalizedPath = normalizePath(path);
  const families = ROUTE_MATCHERS[label] || [normalizedPath];
  return families.some((familyPath) => pathname.startsWith(normalizePath(familyPath)));
};

const matchesFinanceGroup = (pathname, group) =>
  group.items.some(({ label, path }) => {
    const normalizedPathname = normalizePath(pathname);
    const normalizedItemPath = normalizePath(path);
    return (
      normalizedPathname.startsWith(normalizedItemPath) ||
      matchesRouteFamily(normalizedPathname, label, path)
    );
  });

const getFinanceGroupForPath = (groups, pathname) =>
  groups.find((group) => matchesFinanceGroup(pathname, group));

function FinanceSubmenu({ permissions = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname.toLowerCase();

  const isMainItemActive = (label, path, navActive) => navActive || matchesRouteFamily(pathname, label, path);

  const getItemClasses = (isActive) =>
    `${NAV_UI.topnav.buttonBase} ${NAV_UI.spacing.topnavButton} ${NAV_UI.typography.topnavLabel} ${
      isActive
        ? "bg-primary text-white hover:bg-primary hover:text-white"
        : `${NAV_UI.colors.topnavInactiveText} hover:bg-transparent hover:text-slate-600`
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
    const matchedGroup = getFinanceGroupForPath(visibleGroups, pathname);
    return matchedGroup?.title || visibleGroups[0]?.title || "Billing";
  }, [pathname, visibleGroups]);

  const [openGroup, setOpenGroup] = useState(routeGroupTitle);

  useEffect(() => {
    setOpenGroup(routeGroupTitle);
  }, [routeGroupTitle]);

  const renderItems = (menuItems) =>
    menuItems.map(({ label, path }) => (
        <li key={label}>
          <NavLink to={path} end={false}>
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
            className={`${NAV_UI.topnav.buttonBase} ${NAV_UI.spacing.topnavButton} ${NAV_UI.typography.topnavLabel} inline-flex flex-1 basis-0 justify-center rounded-xl px-4 py-2 ${
              openGroup === group.title
                ? "bg-primary text-white hover:bg-primary hover:text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-100 hover:text-slate-700"
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
