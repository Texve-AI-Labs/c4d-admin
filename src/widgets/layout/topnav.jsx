import React from "react";
import { useLocation } from "react-router-dom";
import CustomersSubmenu from "./CustomersSubmenu";
import VendorsSubmenu from "./VendorsSubmenu";
import MarketingSubmenu from "./MarketingSubmenu";
import AdminSubmenu from "./AdminSubmenu";
import AllRecordsSubmenu from "./AllRecordsSubmenu";
import SupportSubmenu from "./SupportSubmenu";
import FinanceSubmenu from "./FinanceSubmenu";
import DriverEngagementSubmenu from "./DriverEngagementSubmenu";
import { BOOKING_FEATURES, NAV_UI } from "@/utils/constants";
export function Topnav({ permissions = [] }) {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const isCashBackRoute = path.startsWith("/dashboard/finance/cash-back");
  const isMasterPriceRoute = path.startsWith("/dashboard/finance/master-price");
  const isInstantRewardRoute = path.startsWith("/dashboard/finance/instant-reward");
  const isDiscountModuleRoute = path.startsWith("/dashboard/finance/discountmodule");
  const isCustomDiscountRoute = path.startsWith("/dashboard/finance/custom-discount");
  const isTaxRoute = path.startsWith("/dashboard/finance/gst");

  const isAllRecordsSection =
    path.startsWith("/dashboard/booking/list") ||
    path.startsWith("/dashboard/auto") ||
    path.startsWith("/dashboard/vendors/driver-return-trips");

  const isCustomersSection =
    path.startsWith("/dashboard/customers");

  const isSupportSection =
    path.startsWith("/dashboard/rental-rate-card") ||
    path.startsWith("/dashboard/leads") ||
    path.startsWith("/dashboard/support") ||
    (BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && path.startsWith("/dashboard/support/admin-discount-history"));

  const isVendorsSection =
    path.startsWith("/dashboard/vendors/account/owner-onboarding-cab") ||
    path.startsWith("/dashboard/vendors/account") ||
    path.startsWith("/dashboard/vendors/account/drivers") ||
    path.startsWith("/dashboard/vendors/vehiclelist") ||
    path.startsWith("/dashboard/vendors/onlinevehicleslist") ||
    path.startsWith("/dashboard/vendors/account/allvehicles") ||
    path.startsWith("/dashboard/vendors/account/autoview") ||
    path.startsWith("/dashboard/vendors/account/autolist") ||
    path.startsWith("/dashboard/vendors/account/owner-onboarding-bike-taxi") ||
    path.startsWith("/dashboard/vendors/account/biketaxilists") ||
    path.startsWith("/dashboard/doc-verification") ||
    path.startsWith("/dashboard/doc-verification/pending");
  
  const isMarketingSection = 
    path.startsWith("/dashboard/vendors/driver-incentive") ||
    path.startsWith("/dashboard/vendors/notificationlist") ||
    path.startsWith("/dashboard/vendors/notification/add") ||
    path.startsWith("/dashboard/vendors/notification/edit") ||
    path.startsWith("/dashboard/vendors/customerNotificationList") ||
    path.startsWith("/dashboard/vendors/customerNotification/add") ||
    path.startsWith("/dashboard/vendors/customerNotification/edit") ||
    path.startsWith("/dashboard/vendors/customernotificationlist") ||
    path.startsWith("/dashboard/vendors/skip-logs") ||
    path.startsWith("/dashboard/vendors/drivernotificationlist") ||
    path.startsWith("/dashboard/user/bannerimgview") ||
    path.startsWith("/dashboard/user/bannerimg/add")
    // path.startsWith("/dashboard/user/testimonialview") ||
    // path.startsWith("/dashboard/user/testimonial/add");

  const isFinanceSection =
    path.startsWith("/dashboard/finance") ||
    isCashBackRoute ||
    isMasterPriceRoute ||
    isInstantRewardRoute ||
    isDiscountModuleRoute ||
    isCustomDiscountRoute ||
    isTaxRoute;
  const isDriverEngagementSection =
    path.startsWith("/dashboard/driverengagement");
  const isAdminSection =
    (path.startsWith("/dashboard/users") &&
      !isCashBackRoute &&
      !isMasterPriceRoute &&
      !isInstantRewardRoute &&
      !isCustomDiscountRoute) ||
    path.startsWith("/dashboard/admin/geo-markings") ||
    path.startsWith("/dashboard/admin/driver-cancellation-history") ||
    path.startsWith("/dashboard/user/versioncontrol") ||
    // path.startsWith("/dashboard/driverengagement") ||
    // Also show admin top bar on Trip Master and Calls
    path.startsWith("/dashboard/tripdetails") ||
    path.startsWith("/dashboard/reports/tripmasterreport");


  // If we are not in any section that has a top nav, render nothing
  if (
    !isAllRecordsSection &&
    !isSupportSection &&
    !isCustomersSection &&
    !isVendorsSection &&
    // !isDocVerifiction &&
    !isMarketingSection &&
    !isFinanceSection &&
    !isDriverEngagementSection &&
    !isAdminSection
  ) {
    return null;
  }

// topnav.jsx
return (
  <div className="mt-3 px-3 sm:mt-4 sm:px-6">
    <div className={`rounded-xl border-t ${NAV_UI.colors.sidebarBorder} ${NAV_UI.colors.topnavContainerBg} p-2 shadow-sm`}>
    {/* First row: high-level Support tabs */}
    {isSupportSection && (
      <div className="mb-2 overflow-x-auto whitespace-nowrap">
        <SupportSubmenu permissions={permissions} />
      </div>
    )}

 

    {/* Main row: other section-specific submenus */}
    <div className="overflow-x-auto whitespace-nowrap">
      {isAllRecordsSection && <AllRecordsSubmenu />}
      {isCustomersSection && <CustomersSubmenu />}
      {isVendorsSection && <VendorsSubmenu />}
      {isMarketingSection && <MarketingSubmenu />}
      {isFinanceSection && <FinanceSubmenu permissions={permissions} />}
      {isDriverEngagementSection && <DriverEngagementSubmenu permissions={permissions} />}
      {isAdminSection && <AdminSubmenu permissions={permissions} />}
    </div>
    </div>
  </div>
);

}

Topnav.displayName = "/src/widgets/layout/topnav.jsx";

export default Topnav;
