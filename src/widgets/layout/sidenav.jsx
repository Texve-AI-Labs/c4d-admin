import PropTypes from "prop-types";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  Button,
  IconButton,
  Typography,
  Tooltip,
} from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav, setMiniSidenav } from "@/context";
import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/auth";
import { useRealtimeEvents } from "@/context/realtimeEvents";
import {
  HomeIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  UserGroupIcon,
  MegaphoneIcon,
  UsersIcon,
  UserIcon
} from '@heroicons/react/24/solid';
import { API_ROUTES, NAV_UI } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";

const menuItems = [
  { type: "item", name: "Home", path: "/dashboard/booking", permission: "Home", end: true },
  {
    type: "item",
    name: "Support",
    path: "/dashboard/rental-rate-card",
    permission: "Support",
    permissionsAny: ["Support"],
    landingRoutes: [
      { permission: "Support", path: "/dashboard/rental-rate-card" },
    ],
  },
  { type: "item", name: "Calls", path: "/dashboard/exotel-calls/list", permission: "Calls" },
  { type: "item", name: "All Inquiries", path: "/dashboard/booking/list", permission: "All bookings" },
  { type: "item", name: "Vendors", path: "/dashboard/vendors/account/owner-onboarding-cab", permission: "Vendors" },
  { type: "item", name: "Customers", path: "/dashboard/customers", permission: "Customers" },
  { type: "item", name: "Finance", path: "/dashboard/finance/invoice", permission: "Finance"},
  { type: "item", name: "Driver Engagement", path: "/dashboard/driverengagement", permission: "Driver Engagement" },
  { type: "item", name: "Marketing", path: "/dashboard/vendors/notificationList", permission: "Marketing" },
  { type: "item", name: "Reports", path: "/dashboard/driver-ops", permission: "Driver Ops" },
  {
    type: "item",
    name: "Admin",
    path: "/dashboard/users",
    permission: "Users",
    permissionsAny: ["Users", "Trip Master"],
    landingRoutes: [
      { permission: "Users", path: "/dashboard/users" },
      { permission: "Trip Master", path: "/dashboard/tripDetails" },
    ],
  },
];

export function Sidenav({ brandImg, brandName, routes, permissions = [] }) {
  //const [loading, setLoading] = useState(false);
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav, miniSidenav } = controller;
  const sidenavTypes = {
    dark: "bg-gradient-to-br from-gray-800 to-gray-900",
    white: "bg-white shadow-sm",
    transparent: "bg-transparent",
  };

  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();
  const { logout } = useAuth();
  const [userName] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
      return user?.email || user?.name || "";
    } catch {
      return "";
    }
  });
  const { homeTotalPendings, inquiriesPendingsByType, isLive, isReconnecting } = useRealtimeEvents();
  const getInquiryTypeFromPath = (pathname = "") => {
    const path = String(pathname || "").toLowerCase();
    if (path.startsWith("/dashboard/booking/list/rides")) return "RIDES";
    if (path.startsWith("/dashboard/booking/list/rentals")) return "RENTAL";
    if (path.startsWith("/dashboard/booking/list/cabbooking")) return "CAB_BOOKING";
    if (path.startsWith("/dashboard/booking/list/carwash")) return "CAR_WASH";
    if (path.startsWith("/dashboard/booking/list/actingdriver")) return "DRIVER";
    if (path.startsWith("/dashboard/booking/list/parcel")) return "PARCEL";
    if (path.startsWith("/dashboard/booking/list/returntrips")) return "RETURN_TRIPS";
    if (path.startsWith("/dashboard/auto")) return "AUTO";
    if (path.startsWith("/dashboard/booking/list")) return "ALL_CABS";
    return "ALL_CABS";
  };

  const activeInquiryType = useMemo(() => getInquiryTypeFromPath(currentPath), [currentPath]);
  const inquiriesBadgeCount = Number(
    inquiriesPendingsByType?.[activeInquiryType] ?? inquiriesPendingsByType?.ALL_CABS ?? 0
  );

  const homeBadgeCount = Number(homeTotalPendings ?? inquiriesPendingsByType?.ALL_CABS ?? 0);
  const connectionStatus = isLive ? "live" : isReconnecting ? "reconnecting" : "offline";

  // useEffect(() => {
  //   const getInquiryTypeFromPath = (pathname = "") => {
  //     const path = String(pathname || "").toLowerCase();
  //     if (path.startsWith("/dashboard/auto")) return "AUTO";
  //     if (path.startsWith("/dashboard/booking/list/rides")) return "RIDES";
  //     if (path.startsWith("/dashboard/booking/list/rentals")) return "RENTAL";
  //     if (path.startsWith("/dashboard/booking/list/cabbooking")) return "CAB";
  //     if (path.startsWith("/dashboard/booking/list/cab-booking")) return "CAB";
  //     if (path.startsWith("/dashboard/booking/list/carwash")) return "CAR_WASH";
  //     if (path.startsWith("/dashboard/booking/list/car-wash")) return "CAR_WASH";
  //     if (path.startsWith("/dashboard/booking/list/actingdriver")) return "DRIVER";
  //     if (path.startsWith("/dashboard/booking/list/acting-driver")) return "DRIVER";
  //     if (path.startsWith("/dashboard/booking/list/parcel")) return "PARCEL";
  //     if (path.startsWith("/dashboard/booking/list")) return "ALL_CABS";
  //     return "ALL_CABS";
  //   };

  //   const readSidebarCounts = () => {
  //     try {
  //       const homeDirectCount = sessionStorage.getItem("totalPendings");
  //       const activeInquiryType = getInquiryTypeFromPath(currentPath);
  //       const inquiriesKey = `sidebar.inquiries.${activeInquiryType}.totalPendings`;
  //       const allInquiriesDirectCount = sessionStorage.getItem(inquiriesKey);
  //       setAllInquiriesCount(allInquiriesDirectCount !== null ? String(allInquiriesDirectCount) : "0");

  //       if (homeDirectCount !== null) {
  //         setHomeTotalBookingCount(String(homeDirectCount));
  //         return;
  //       }

  //       const bookingCounts = sessionStorage.getItem("bookingCounts");
  //       if (!bookingCounts) {
  //         setHomeTotalBookingCount("0");
  //         return;
  //       }

  //       const parsed = JSON.parse(bookingCounts);
  //       setHomeTotalBookingCount(String(parsed?.totalPendings ?? "0"));
  //     } catch {
  //       setHomeTotalBookingCount("0");
  //       setAllInquiriesCount("0");
  //     }
  //   };

  //   const handleBookingCountUpdated = (event) => {
  //     const value = event?.detail?.totalPendings;
  //     const scope = event?.detail?.scope;
  //     if (value !== undefined && value !== null && scope === "home") {
  //       setHomeTotalBookingCount(String(value));
  //       return;
  //     }
  //     if (value !== undefined && value !== null && scope === "all-inquiries") {
  //       const inquiryType = String(event?.detail?.inquiryType || "ALL_CABS");
  //       const activeInquiryType = getInquiryTypeFromPath(currentPath);
  //       if (inquiryType === activeInquiryType) {
  //         setAllInquiriesCount(String(value));
  //         return;
  //       }
  //       if (!currentPath.startsWith("/dashboard/booking/list") && inquiryType === "ALL_CABS") {
  //         setAllInquiriesCount(String(value));
  //         return;
  //       }
  //       readSidebarCounts();
  //       return;
  //     }
  //     readSidebarCounts();
  //   };

  //   readSidebarCounts();
  //   window.addEventListener("booking-count-updated", handleBookingCountUpdated);
  //   window.addEventListener("storage", readSidebarCounts);
  //   return () => {
  //     window.removeEventListener("booking-count-updated", handleBookingCountUpdated);
  //     window.removeEventListener("storage", readSidebarCounts);
  //   };
  // }, [location.pathname]);

  const handleSignOut = async (e) => {
    //setLoading(true);
    e.preventDefault();
    await ApiRequestUtils.post(API_ROUTES.USER_LOGOUT);
    await logout();
    //setLoading(false);
    navigate("/auth/sign-in");
  }

  const hasAnyPermission = (permissionList = []) => {
    if (!Array.isArray(permissionList) || permissionList.length === 0) return false;
    return permissionList.some((permission) => permissions.includes(permission));
  };

  const canAccessMenuItem = (item) => {
    if (Array.isArray(item.permissionsAny) && item.permissionsAny.length > 0) {
      return hasAnyPermission(item.permissionsAny);
    }
    return permissions.includes(item.permission);
  };

  const getMenuPath = (item) => {
    if (!Array.isArray(item.landingRoutes) || item.landingRoutes.length === 0) {
      return item.path;
    }

    const firstAllowed = item.landingRoutes.find(({ permission }) => permissions.includes(permission));
    return firstAllowed?.path || "/dashboard/unauthorized";
  };

  const isMenuSectionActive = (name, isActive) => {
    if (isActive) return true;

    switch (name) {
      case "Support":
        return (
          currentPath.startsWith("/dashboard/rental-rate-card") ||
          currentPath.startsWith("/dashboard/leads")
          // currentPath.startsWith("/dashboard/doc-verification") ||         
        );
      case "All Inquiries":
        return currentPath.startsWith("/dashboard/booking/list");
      case "Vendors":
        return (
          currentPath.startsWith("/dashboard/vendors/account/owner-onboarding-cab") ||
          currentPath.startsWith("/dashboard/vendors/vehiclelist") ||
          currentPath.startsWith("/dashboard/vendors/onlinevehicleslist") ||
          currentPath.startsWith("/dashboard/doc-verification") || 
          currentPath.startsWith("/dashboard/vendors/driver-return-trips")
        );
      case "Customers":
        return currentPath.startsWith("/dashboard/customers");
      case "Calls":
        return currentPath.startsWith("/dashboard/exotel-calls");
      case "Finance":
        return currentPath.startsWith("/dashboard/finance");
      case "Marketing":
        return (
          currentPath.startsWith("/dashboard/vendors/driver-incentive") ||
          currentPath.startsWith("/dashboard/vendors/notificationlist") ||
          currentPath.startsWith("/dashboard/vendors/customernotificationlist") ||
          currentPath.startsWith("/dashboard/vendors/drivernotificationlist") ||
          currentPath.startsWith("/dashboard/user/bannerimg")
          // currentPath.startsWith("/dashboard/user/testimonial")
        );
      case "Reports":
        return currentPath.startsWith("/dashboard/driver-ops");
      case "Driver Engagement":
        return currentPath.startsWith("/dashboard/driverengagement");
      case "Admin":
        return (
          currentPath.startsWith("/dashboard/users") ||
          currentPath.startsWith("/dashboard/admin/geo-markings") ||
          currentPath.startsWith("/dashboard/user/versioncontrol") ||
          currentPath.startsWith("/dashboard/admin/driver-cancellation-history") ||
          currentPath.startsWith("/dashboard/reports/tripmasterreport") ||
          currentPath.startsWith("/dashboard/tripdetails")
        );
      default:
        return false;
    }
  };

  return (
    <aside
      id="app-sidenav"
      className={`${sidenavTypes[sidenavType]} 
  ${openSidenav ? "translate-x-0" : "-translate-x-full"} 
  lg:translate-x-0 fixed inset-y-0 left-0 z-50 my-2 ml-1 h-[calc(100vh-16px)] ${miniSidenav ? 'w-[4.5rem]' : 'w-full max-w-[308px] lg:w-[18rem]'}
  ${NAV_UI.radius.item} border ${NAV_UI.colors.sidebarBorder} ${NAV_UI.colors.sidebarBg} p-2 shadow-sm transition-transform duration-300`}
    >
      <div className={`relative`}>
        <Link to="/" className={`py-5 ${miniSidenav ? 'px-0' : 'px-6'} text-center`}>
          <Typography
            variant="h6"
            color={sidenavType === "dark" ? "white" : "blue-gray"}
          >
            {miniSidenav ? (
              <div className="flex items-center justify-center pt-4">
                <img src="/img/app_icon.png" alt="ROOT CABS" className="h-8 w-8 rounded-full ring-2 ring-primary-200" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-4 pt-2">
                  <img src="/img/app_icon.png" alt="ROOT CABS" className="h-8 w-8 rounded-full ring-2 ring-primary-200" />
                  <div className="flex flex-col items-start">
                    <span className="text-base font-semibold tracking-wide">ROOT CABS</span>
                    <span className="text-xs text-blue-gray-500">{userName}</span>
                  </div>
                    <span
                      className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
                        connectionStatus === "live"
                          ? "bg-green-100 text-green-800"
                          : connectionStatus === "reconnecting"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {connectionStatus === "live"
                        ? "Live"
                        : connectionStatus === "reconnecting"
                        ? "Reconnecting..."
                        : "Offline"}
                  </span>
                </div>
              </>
            )}

          </Typography>
        </Link>
        {/* Collapse toggle (desktop) */}
        <div className="absolute -right-3 top-6 hidden lg:block">
          <IconButton
            size="sm"
            variant="text"
            color="blue-gray"
            className="rounded-full bg-white shadow-sm border border-blue-gray-100"
            onClick={() => setMiniSidenav(dispatch, !miniSidenav)}
            aria-label={miniSidenav ? "Expand sidebar" : "Collapse sidebar"}
          >
            {miniSidenav ? (
              <span className="inline-block rotate-180 text-lg">›</span>
            ) : (
              <span className="inline-block text-lg">›</span>
            )}
          </IconButton>
        </div>
        <IconButton
          variant="text"
          color="white"
          size="sm"
          ripple={false}
          className="absolute right-0 top-0 grid rounded-br-none rounded-tl-none lg:hidden"
          onClick={() => setOpenSidenav(dispatch, false)}
        >
          <XMarkIcon strokeWidth={2.5} className="h-5 w-5 text-white" />
        </IconButton>
      </div>
      <div className={`mt-1 h-[calc(100vh-150px)] overflow-y-auto pb-16 ${miniSidenav ? 'px-0' : 'px-1'} scrollbar-thin`}>
        <ul className="flex flex-col gap-1">
          {menuItems.map((item, index) => {
            if (item.type === "item") {
              if (!canAccessMenuItem(item)) return null;
              const { name, end } = item;
              const path = getMenuPath(item);
              return (
                <li key={`${name}-${index}`}>
                  <NavLink to={path} end={end}>
                    {({ isActive }) => {
                      const menuActive = isMenuSectionActive(name, isActive);
                      const menuTextColor = menuActive ? NAV_UI.colors.sidebarActiveText : NAV_UI.colors.sidebarInactiveText;
                      return (
                      <Button
                        variant="text"
                        className={`${NAV_UI.sidebar.itemBase} ${NAV_UI.spacing.sidebarButton} ${NAV_UI.radius.item} ${
                          miniSidenav ? "justify-center px-0" : "px-3 gap-3"
                        } ${menuTextColor} ${menuActive ? NAV_UI.colors.sidebarActiveBg : NAV_UI.sidebar.itemHover}`}
                        fullWidth
                      >
                        {name === "Home" ? (
                          <HomeIcon className={`${NAV_UI.iconSizes.sidebar} ${menuTextColor}`} />
                        ) : null}
                       {name === "Support" ? (
                          <UserGroupIcon
                            className={`${NAV_UI.iconSizes.sidebar} ${menuTextColor}`}
                          />
                        ) : null}

                        {name === "Reports" ? (
                          <ClipboardDocumentListIcon className={`${NAV_UI.iconSizes.sidebar} ${menuTextColor}`} />
                        ) : null}
                        {name === "Leads" ? (
                          <UsersIcon className={`${NAV_UI.iconSizes.sidebar} ${menuTextColor}`} />
                        ) : null}
                        {name === "Rate Card" ? (
                          <img src="/img/master_price.png" alt="Rate Card" className={NAV_UI.iconSizes.sidebar} />
                        ) : null}
                        {name === "Calls" ? (
                          <img src="/img/calls.png" alt="Calls" className={`${NAV_UI.iconSizes.sidebar} rounded-full`} />
                        ) : null}
                        {name === "All Inquiries" ? (
                          <DocumentTextIcon
                            className={`${NAV_UI.iconSizes.sidebar} ${menuTextColor}`}
                          />
                        ) : null}
                        {name === "Customers" ? (
                          <UserGroupIcon
                            className={`${NAV_UI.iconSizes.sidebar} ${menuTextColor}`}
                          />
                        ) : null}
                        {name === "Vendors" ? (
                          <BuildingStorefrontIcon
                            className={`${NAV_UI.iconSizes.sidebar} ${menuTextColor}`}
                          />
                        ) : null}
                        {name === "Trip Master" ? (
                          <BuildingStorefrontIcon
                            className={`${NAV_UI.iconSizes.sidebar} ${menuTextColor}`}
                          />
                        ) : null}
                        {name === "Finance" ? (
                          <ChartBarIcon
                            className={`${NAV_UI.iconSizes.sidebar} ${menuTextColor}`}
                          />
                        ) : null}
                        {name === "Document Verification" ? (
                          <DocumentCheckIcon
                            className={`${NAV_UI.iconSizes.sidebar} ${menuTextColor}`}
                          />
                        ) : null}
                        {name === "Marketing" ? (
                          <MegaphoneIcon
                            className={`${NAV_UI.iconSizes.sidebar} ${menuTextColor}`}
                          />
                        ) : null}
                        {name === "Admin" ? (
                          <UserCircleIcon
                            className={`${NAV_UI.iconSizes.sidebar} ${menuTextColor}`}
                          />
                        ) : null}
                        {name === "Driver Engagement" ? (
                          <UserIcon
                            className={`${NAV_UI.iconSizes.sidebar} ${menuTextColor}`}
                          />
                        ) : null}

                        {!miniSidenav && (
                          <>
                          <Typography color="inherit" className={NAV_UI.typography.sidebarLabel}>
                            {name}
                          </Typography>
                          {name === "Home" && homeBadgeCount > 0 && (
                        <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white leading-none">
                          {homeBadgeCount}
                        </span>
                      )}
                      {name === "All Inquiries" && inquiriesBadgeCount > 0 && (
                        <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white leading-none">
                          {inquiriesBadgeCount}
                        </span>
                      )}
                        </>
                        )}
                      </Button>
                      );
                    }}
                  </NavLink>
                </li>
              );
            }

            return null;
          })}
        </ul>
      </div>
      <Link
        to="/auth/sign-in"
        className={`absolute bottom-4 ${miniSidenav ? 'left-1/2 -translate-x-1/2' : 'ml-3'} `}
        onClick={handleSignOut}
      >
        {miniSidenav ? (
          <Tooltip content="Sign out" placement="right">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M3.75 4.5A2.25 2.25 0 016 2.25h6A2.25 2.25 0 0114.25 4.5v3a.75.75 0 01-1.5 0v-3a.75.75 0 00-.75-.75H6a.75.75 0 00-.75.75v15a.75.75 0 00.75.75h6a.75.75 0 00.75-.75v-3a.75.75 0 011.5 0v3A2.25 2.25 0 0112 21.75H6A2.25 2.25 0 013.75 19.5v-15z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M16.28 8.22a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h8.5l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </span>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 text-red-700 px-3 py-2 hover:bg-red-100 border border-red-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M3.75 4.5A2.25 2.25 0 016 2.25h6A2.25 2.25 0 0114.25 4.5v3a.75.75 0 01-1.5 0v-3a.75.75 0 00-.75-.75H6a.75.75 0 00-.75.75v15a.75.75 0 00.75.75h6a.75.75 0 00.75-.75v-3a.75.75 0 011.5 0v3A2.25 2.25 0 0112 21.75H6A2.25 2.25 0 013.75 19.5v-15z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M16.28 8.22a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h8.5l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Sign out</span>
          </div>
        )}
      </Link>
    </aside>
  );
}

Sidenav.defaultProps = {
  brandImg: "/img/logo-ct.png",
  brandName: "Material Tailwind React",
};

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  permissions: PropTypes.arrayOf(PropTypes.string),
};

Sidenav.displayName = "/src/widgets/layout/sidnave.jsx";

export default Sidenav;
