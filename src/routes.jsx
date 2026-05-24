import {
  HomeIcon,
  ServerStackIcon,
  RectangleStackIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { Home } from "@/pages/dashboard";
import { SignIn, SignUp } from "@/pages/auth";
import { DeleteAccount } from "@/pages/public/DeleteAccount";
import { PriceList } from "@/pages/public/price";
import { RentalTariffRateCard } from "@/pages/public/rentalRateCard";

import { CustomerView } from "@/pages/customer";
import { AccountView } from "@/pages/account";
import { DriverView } from "@/pages/driver";
import { UserView } from "@/pages/users";
import DriverAdd from "./pages/driver/add";
import UserAdd from "./pages/users/add";
import CustomerAdd from "./pages/customer/add";

import { HomeModernIcon } from "@heroicons/react/24/outline";
import Booking from "./pages/booking/booking";
import ConfirmBooking from "./pages/booking/confirmBooking";
import SelectLocation from "./pages/booking/selectLocation";
import DriverDetails from "./pages/driver/details";
import AccountDetails from "./pages/account/details";
import AddPriceDetails from "./pages/driver/addPriceDetails";
import { BookingsList, SearchDrivers } from "./pages/booking";
import UserDetails from "./pages/users/details";
import CustomerDetails from "./pages/customer/details";
import Commission from "./pages/commission/add";
import DriverEdit from "./pages/driver/edit";
import { CabView } from "./pages/cab";
import CabAdd from "./pages/cab/add";
import CabDetails from "./pages/cab/details";
import CabEdit from "./pages/cab/edit";
import AccountAdd from "./pages/account/add";
import AccountEdit from "./pages/account/edit";
import { DocumentVerificationView } from "./pages/docVerification/view";
import DocumentsDetails from './pages/docVerification/details'
import { OnlineRegistrationView } from "./pages/onlineRegistration/view";
import { SubscriptionView } from './pages/subscription/view';
import SubscriptionAdd from "./pages/subscription/add";
import AllBookingsLists from "./pages/booking/allBookingLists";
import { PendingDocList } from "./pages/docVerification/pendingDocList";
import { BOOKING_FEATURES, BOOKING_SERVICE_TYPE } from "./utils/constants";
import { AllVehicles } from "./pages/vendor";
import { CabSubscriptionView } from "./pages/finance/subscription/cab-subscription-view";
import CabSubscriptionAdd from "./pages/finance/subscription/cab-subscription-add";
import ReassignDriver from "./components/ReassignDriver";
import PayableView from "./pages/finance/payable/view";
import PayableDetails from "./pages/finance/payable/details";
import UserEdit from "./pages/users/edit";
import CashBackList from "./pages/users/cashBack/list";
import CashBackAdd from "./pages/users/cashBack/add";
import CashBackEdit from "./pages/users/cashBack/edit";
import { MasterSubscriptionView } from "./pages/finance/masterSubscription/MasterSubscriptionView";
import MasterSubscriptionAdd from "./pages/finance/masterSubscription/MasterSubscriptionAdd";
import MasterSubscriptionDetails from "./pages/finance/masterSubscription/MasterSubscriptionDetails";
import MasterSubscriptionEdit from "./pages/finance/masterSubscription/MasterSubscriptionEdit";
import { MasterPriceView } from "./pages/finance/masterPrice/MasterPriceView";
import { MasterPriceAdd } from "./pages/finance/masterPrice/MasterPriceAdd";
import { ReceiptList } from "./pages/finance/receipt/ReceiptList";
import ReceiptDetails from "./pages/finance/receipt/ReceiptDetails";
import { InvoiceList } from "./pages/finance/invoice/InvoiceList";
import InvoiceDetails from "./pages/finance/invoice/InvoiceDetails";
import { MasterPriceDetailsAndEdit } from "./pages/finance/masterPrice/MasterPriceDetailsAndEdit";
import MasterPriceTableAdd from "./pages/finance/masterPriceTable/MasterPriceTableAdd";
import MasterPriceTableDetails from "./pages/finance/masterPriceTable/MasterPriceTableDetails";
import DriverMasterPriceTableEdit from "./pages/finance/masterPriceTable/DriverMasterPriceTableEdit";
import MasterPriceTableEdit from "./pages/finance/masterPriceTable/MasterPriceTableEdit";
import RentalsPriceMasterAdd from "./pages/finance/masterPriceTable/RentalsMasterPriceAdd";
import RentalsPriceMasterDetails from "./pages/finance/masterPriceTable/RentalsMasterPriceDetails";
import RentalsMasterPriceEdit from "./pages/finance/masterPriceTable/RentalsMasterPriceEdit";
import GeoMarkings from "./pages/geoMarkings/geoMarkings";
import NotificationList from "./pages/vendor/notificationList";
import NotificationListApp from "./pages/vendor/notificationadd";
import NotificationListEdit from "./pages/vendor/notificationEdit";
import DriverIncentiveList from "./pages/marketing/DriverIncentive/list";
import DriverIncentiveEdit from "./pages/marketing/DriverIncentive/edit";
import DriverIncentiveAdd from "./pages/marketing/DriverIncentive/add";
import SkipLogs from "./pages/marketing/skipLogs";
import InstantReward from "./pages/vendor/instantReward";
import { VehiclesList } from "./pages/vendor/vehiclesList";
import DriverNotificationList from "./pages/vendor/driverNotificationList";
import DriverNotificationListAdd from "./pages/vendor/driverNotificationAdd";
import DriverNotificationListEdit from "./pages/vendor/driverNotificationEdit";
import DriverReturnTripsList from "./pages/vendor/driverReturnTripsList";
import VersionControlList from "./pages/versionControl/VersionControlList";
import VersionControlEdit from "./pages/versionControl/VersionControlEdit";
import DiscountView from "./pages/discountModule/view";
import DiscountEdit from "./pages/discountModule/edit";
import DiscountAdd from "./pages/discountModule/add";
import GstView from "./pages/GST/view";
import GstAdd from "./pages/GST/add";
import GstEdit from "./pages/GST/edit";
import DriverFeedbackAdd from "./pages/GST/driverFeedbackAdd";
import DriverFeedbackEdit from "./pages/GST/driverFeedbackEdit";
import BannerView from "./pages/bannerImage/view ";
import AddBanner from "./pages/bannerImage/add";
import TestimoinalView from "./pages/testimoinal/view";
import TestimoinalAdd from "./pages/testimoinal/add";
import { OnlineVehiclesList } from "./pages/vendor/onlineVehiclesList";
import AutoView from "./pages/AutoService/AutoView";
import AutoAdd from "./pages/AutoService/autoAdd";
import AutoDetails from "./pages/AutoService/details";
import AutoForm from "./pages/AutoService/autoform";
import DetailsAuto from "./pages/AutoDetails/details";
import AutoDetailsList from "./pages/AutoDetails/list";
import EditAuto from "./pages/AutoDetails/edit";
import AutoMasterPriceEdit from "./pages/finance/masterPriceTable/AutoMasterPriceTableEdit";
import AutoEdit from "./pages/AutoService/edit";
import ParcelView from "./pages/parcel/view";
import ParcelAdd from "./pages/parcel/add";
import ParcelDetails from "./pages/parcel/deatils";
import ParcelEdit from "./pages/parcel/edit";
import ParcelDetailsList from "./pages/parcel/list";
import ParcelCabAdd from "./pages/cab/addParcelCab";
import ParcelCabDetails from "./pages/cab/parcelCabDetails";
import ParcelCabEdit from "./pages/cab/parcelCabEdit";
import CabAddNew from "./pages/cab/new/add";
import ParcelMasterPriceAdd from "./pages/finance/masterPriceTable/ParcelMasterPriceTableAdd";
import ParcelMasterPriceEdit from "./pages/finance/masterPriceTable/ParcelMasterPriceTableEdit";
import ParcelMasterPriceDetails from "./pages/finance/masterPriceTable/ParcelMasterPriceTableDetails";
import TripDetails from "./pages/TripDetails/tripDetails";
import Reports from "./pages/TripDetails/reports";
import AddTripDetails from "./pages/TripDetails/add";
import TripDetailsEdit from "./pages/TripDetails/edit";
import DetailsTrip from "./pages/TripDetails/details";
import CombineView from "./pages/CustomerNotification/view";
import Combineadd from "./pages/CustomerNotification/add";
import CombineEdit from "./pages/CustomerNotification/edit";
import ExotelCallsList from "./components/Exotel";
import { LeadsView } from "./pages/public/leads";
import CustomerDiscountAdd from "./pages/finance/customerDiscount/add";
import CustomerDiscountList from "./pages/finance/customerDiscount/list";
import DriverOfferList from "./pages/finance/driverOffer/DriverOfferList";
import DriverOfferAdd from "./pages/finance/driverOffer/add";
import DriverOfferAssign from "./pages/finance/driverOffer/DriverOfferAssign";
import DriverOpsView from "./pages/DriverOps/view";
import BookingInvoiceList from "./pages/finance/bookingInvoice/list";
import BookingInvoiceDetails from "./pages/finance/bookingInvoice/details";
import AutoMasterPriceTableAdd from "./pages/finance/masterPriceTable/AutoMasterPriceTableAdd";
import ParcelCommissionList from "./pages/finance/parcelCommission/list";
import TierDetailsList from "./pages/DriverEngagementModule/TierDetails/list";
import TierDetailsAdd from "./pages/DriverEngagementModule/TierDetails/add";
import TierDetailsEdit from "./pages/DriverEngagementModule/TierDetails/edit";
import DriverMonitoringList from "./pages/DriverEngagementModule/DriverMonitoring/list";
import IncentivePayoutList from "./pages/DriverEngagementModule/IncentivePayout/list";
import DriverEngagementAuditLogs from "./pages/DriverEngagementModule/AuditLogs/list";
import AccountList from "./pages/account/owner-onboarding-cab/list";
import AddAccountNew from "./pages/account/owner-onboarding-cab/add";
import AccountDocuments from "./pages/account/owner-onboarding-cab/documents";
import VehicleDocuments from "./pages/account/owner-onboarding-cab/vehicleDocuments";
import AccountOnboardingDetails from "./pages/account/owner-onboarding-cab/accountDetails";
import VehicleOnboardingDetails from "./pages/account/owner-onboarding-cab/vehicleDetails";
import CompletedOnboardingDetails from "./pages/account/owner-onboarding-cab/completedDetails";
import OwnerOnboardingAutoList from "./pages/account/owner-onboarding-auto/list";
import OwnerOnboardingAutoAdd from "./pages/account/owner-onboarding-auto/add";
import OwnerOnboardingAutoDocuments from "./pages/account/owner-onboarding-auto/documents";
import OwnerOnboardingAutoVehicleDocuments from "./pages/account/owner-onboarding-auto/vehicleDocuments";
import OwnerOnboardingAutoAccountDetails from "./pages/account/owner-onboarding-auto/accountDetails";
import OwnerOnboardingAutoVehicleDetails from "./pages/account/owner-onboarding-auto/vehicleDetails";
import OwnerOnboardingAutoCompletedDetails from "./pages/account/owner-onboarding-auto/completedDetails";
import OwnerOnboardingAutoCreation from "./pages/account/owner-onboarding-auto/autoCreation";
import OwnerOnboardingBikeList from "./pages/account/owner-onboarding-bike/list";
import OwnerOnboardingBikeAdd from "./pages/account/owner-onboarding-bike/add";
import OwnerOnboardingBikeDocuments from "./pages/account/owner-onboarding-bike/documents";
import OwnerOnboardingBikeVehicleDocuments from "./pages/account/owner-onboarding-bike/vehicleDocuments";
import OwnerOnboardingBikeAccountDetails from "./pages/account/owner-onboarding-bike/accountDetails";
import OwnerOnboardingBikeVehicleDetails from "./pages/account/owner-onboarding-bike/vehicleDetails";
import OwnerOnboardingBikeCompletedDetails from "./pages/account/owner-onboarding-bike/completedDetails";
import OwnerOnboardingBikeCreation from "./pages/account/owner-onboarding-bike/bikecreation";
import DriverCancellationHistoryList from "./pages/user/CancelltionHistory/list";
import AdminDiscountHistory from "./pages/support/adminDiscountHistory";
const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "dashboard",
        path: "/home",
        element: <Home />,
        display: false,
        permission: "Home",
      },
      {
        icon: <HomeModernIcon {...icon} />,
        name: "Booking",
        path: "/booking",
        element: <Booking />,
        display: true,
        permission: "Home",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "customers",
        path: "/customers",
        element: <CustomerView />,
        display: true,
        permission: "Customers",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "customers",
        path: "/customers/add",
        element: <CustomerAdd />,
        display: false,
        permission: "Customers",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "customers",
        path: "/customers/edit/:id",
        element: <CustomerAdd />,
        display: false,
        permission: "Customers",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "customers",
        path: "/customers/details/:id",
        element: <CustomerDetails />,
        display: false,
        permission: "Customers",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "vehicleList",
        path: "/vendors/vehicleList",
        element: <VehiclesList />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Online Vehicles List",
        path: "/vendors/onlineVehiclesList",
        element: <OnlineVehiclesList />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "drivers",
        path: "/vendors/account/drivers",
        element: <DriverView />,
        display: true,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "driver incentive",
        path: "/vendors/driver-incentive",
        element: <DriverIncentiveList />,
        display: true,
        permission: "Marketing",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "driver incentive add",
        path: "/vendors/driver-incentive/add",
        element: <DriverIncentiveAdd />,
        display: false,
        permission: "Marketing",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "driver incentive edit",
        path: "/vendors/driver-incentive/edit/:id",
        element: <DriverIncentiveEdit />,
        display: false,
        permission: "Marketing",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "marketing",
        path: "/vendors/notificationList",
        element: <NotificationList />,
        display: true,
        permission: "Marketing",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "driver notification",
        path: "/vendors/driverNotificationList",
        element: <DriverNotificationList />,
        display: true,
        permission: "Marketing",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "driver notification add",
        path: "/vendors/driverNotificationList/add",
        element: <DriverNotificationListAdd />,
        display: true,
        permission: "Marketing",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "driver notification edit",
        path: "/vendors/driverNotificationList/edit/:id",
        element: <DriverNotificationListEdit />,
        display: true,
        permission: "Marketing",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "marketing add",
        path: "/vendors/notification/add",
        element: <NotificationListApp />,
        display: true,
        permission: "Marketing",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "marketing edit",
        path: "/vendors/notification/edit/:id",
        element: <NotificationListEdit />,
        display: true,
        permission: "Marketing",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "customer notification",
        path: "/vendors/customerNotificationList",
        element: <CombineView />,
        display: true,
        permission: "Marketing",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "skip logs",
        path: "/vendors/skip-logs",
        element: <SkipLogs />,
        display: true,
        permission: "Marketing",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "customer notification add",
        path: "/vendors/customerNotificationList/add",
        element: <Combineadd />,
        display: true,
        permission: "Marketing",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Customer notification edit",
        path: "/vendors/customerNotificationList/edit/:id",
        element: <CombineEdit />,
        display: true,
        permission: "Marketing",
      },

      {
        icon: <UserIcon {...icon} />,
        name: "drivers",
        path: "/vendors/account/drivers/add",
        element: <DriverAdd />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "drivers",
        path: "/vendors/account/drivers/details/:id",
        element: <DriverDetails />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "accounts",
        path: "/vendors/account/details/:id",
        element: <AccountDetails />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "drivers",
        path: "/vendors/account/drivers/edit/:id",
        element: <DriverEdit />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "vehicles",
        path: "/vendors/account/allVehicles",
        element: <AllVehicles />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "accounts",
        path: "/vendors/account/edit/:id",
        element: <AccountEdit />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "cabs",
        path: "/cab",
        element: <CabView />,
        display: true,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "cab",
        path: "/vendors/account/allVehicles/add",
        element: <CabAdd />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Auto View",
        path: "/vendors/account/autoView/add",
        element: <AutoAdd />,
        display: true,
        permission: "Vendors"
      },
      {
        icon: <UserIcon {...icon} />,

        name: "Auto Add",
        path: "/vendors/account/autoview",
        element: <AutoView />,
        display: true,
        permission: "Vendors"
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Auto details",
        path: "/vendors/account/autoView/details/:id",
        element: <AutoDetails />,
        display: true,
        permission: "Vendors"
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Auto details",
        path: "/vendors/account/autoDetails/details/:id",
        element: <DetailsAuto />,
        display: true,
        permission: "Vendors"
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Auto details",
        path: "/vendors/account/autoDetails/details/edit/:id",
        element: <EditAuto />,
        display: true,
        permission: "Vendors"
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Auto Form",
        path: "/vendors/account/autoView/details/add",
        element: <AutoForm />,
        display: true,
        permission: "Vendors"
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Auto Form",
        path: "/vendors/account/autoList",
        element: <AutoDetailsList />,
        display: true,
        permission: "Vendors"
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Auto Edit",
        path: "/vendors/account/autoView/details/edit/:id",
        element: <AutoEdit />,
        display: true,
        permission: "Vendors"
      },
      {
        icon: <UserIcon {...icon} />,
        name: "cab",
        path: "/vendors/account/allVehicles/details/:id",
        element: <CabDetails />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "cab",
        path: "/vendors/account/allVehicles/edit/:id",
        element: <CabEdit />,
        display: false,
        permission: "Vendors",
      },

      {
        icon: <UserIcon {...icon} />,
        name: "GST List",
        path: "/finance/GSTList",
        element: <GstView />,
        display: true,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "GST add",
        path: "/finance/GST/add",
        element: <GstAdd />,
        display: true,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "GST edit",
        path: "/finance/GST/edit/:id",
        element: <GstEdit />,
        display: true,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Driver feedback add",
        path: "/finance/driver-feedback/add",
        element: <DriverFeedbackAdd />,
        display: true,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Driver feedback edit",
        path: "/finance/driver-feedback/edit/:id",
        element: <DriverFeedbackEdit />,
        display: true,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Banner image view",
        path: "/user/bannerimgView",
        element: <BannerView />,
        display: true,
        permission: "Marketing",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Banner image add",
        path: "/user/bannerimg/add",
        element: <AddBanner />,
        display: true,
        permission: "Marketing",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "drivers",
        path: "/drivers/addprice",
        element: <AddPriceDetails />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Admin User",
        path: "/users",
        element: <UserView />,
        display: true,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Driver Cancellation History",
        path: "/admin/driver-cancellation-history",
        element: <DriverCancellationHistoryList />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "users",
        path: "/users/add",
        element: <UserAdd />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "users",
        path: "/users/edit/:id",
        element: <UserEdit />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "users",
        path: "/users/details/:id",
        element: <UserDetails />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "accounts",
        path: "/vendors/account/add",
        element: <AccountAdd />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "accounts",
        path: "/admin/account/:accountId",
        element: <AccountEdit />,
        display: false,
        permission: "Users",
      },
      {
        name: "SelectLocation",
        path: "/select-location",
        element: <SelectLocation />,
        display: false,
        permission: "All bookings",
      },
      {
        name: "ConfirmBooking",
        path: "/confirm-booking",
        element: <ConfirmBooking />,
        display: false,
        permission: "All bookings",
      },
      {
        name: "SearchDriver",
        path: "/search-drivers",
        element: <SearchDrivers />,
        display: false,
        permission: "All bookings",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Commission",
        path: "/commission",
        element: <Commission />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Account",
        path: "/vendors/account",
        element: <AccountView />,
        display: true,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Add Account New",
        path: "/vendors/account/owner-onboarding-cab/add",
        element: <AddAccountNew />,
        display: true,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Account Documents",
        path: "/vendors/account/owner-onboarding-cab/documents/:id",
        element: <AccountDocuments />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Vehicle Documents",
        path: "/vendors/account/owner-onboarding-cab/vehicle-documents/:id",
        element: <VehicleDocuments />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Add New Cab",
        path: "/vendors/account/owner-onboarding-cab/cab/add/:id",
        element: <CabAddNew />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Account List",
        path: "/vendors/account/owner-onboarding-cab",
        element: <AccountList />,
        display: true,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Account Onboarding Details",
        path: "/vendors/account/owner-onboarding-cab/details/account/:id",
        element: <AccountOnboardingDetails />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Vehicle Onboarding Details",
        path: "/vendors/account/owner-onboarding-cab/details/vehicle/:id",
        element: <VehicleOnboardingDetails />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Completed Onboarding Details",
        path: "/vendors/account/owner-onboarding-cab/details/completed/:id",
        element: <CompletedOnboardingDetails />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Auto List",
        path: "/vendors/account/owner-onboarding-auto",
        element: <OwnerOnboardingAutoList />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Auto Add",
        path: "/vendors/account/owner-onboarding-auto/add",
        element: <OwnerOnboardingAutoAdd />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Auto Documents",
        path: "/vendors/account/owner-onboarding-auto/documents/:id",
        element: <OwnerOnboardingAutoDocuments />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Auto Vehicle Documents",
        path: "/vendors/account/owner-onboarding-auto/vehicle-documents/:id",
        element: <OwnerOnboardingAutoVehicleDocuments />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Auto Account Details",
        path: "/vendors/account/owner-onboarding-auto/details/account/:id",
        element: <OwnerOnboardingAutoAccountDetails />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Auto Vehicle Details",
        path: "/vendors/account/owner-onboarding-auto/details/vehicle/:id",
        element: <OwnerOnboardingAutoVehicleDetails />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Auto Completed Details",
        path: "/vendors/account/owner-onboarding-auto/details/completed/:id",
        element: <OwnerOnboardingAutoCompletedDetails />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Auto Vehicle Creation",
        path: "/vendors/account/owner-onboarding-auto/vehicle-creation/:id",
        element: <OwnerOnboardingAutoCreation />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Bike List",
        path: "/vendors/account/owner-onboarding-bike",
        element: <OwnerOnboardingBikeList />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Bike Add",
        path: "/vendors/account/owner-onboarding-bike/add",
        element: <OwnerOnboardingBikeAdd />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Bike Documents",
        path: "/vendors/account/owner-onboarding-bike/documents/:id",
        element: <OwnerOnboardingBikeDocuments />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Bike Vehicle Documents",
        path: "/vendors/account/owner-onboarding-bike/vehicle-documents/:id",
        element: <OwnerOnboardingBikeVehicleDocuments />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Bike Account Details",
        path: "/vendors/account/owner-onboarding-bike/details/account/:id",
        element: <OwnerOnboardingBikeAccountDetails />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Bike Vehicle Details",
        path: "/vendors/account/owner-onboarding-bike/details/vehicle/:id",
        element: <OwnerOnboardingBikeVehicleDetails />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Bike Completed Details",
        path: "/vendors/account/owner-onboarding-bike/details/completed/:id",
        element: <OwnerOnboardingBikeCompletedDetails />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Owner Onboarding Bike Vehicle Creation",
        path: "/vendors/account/owner-onboarding-bike/vehicle-creation/:id",
        element: <OwnerOnboardingBikeCreation />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Return Trip Driver Details",
        path: "/vendors/driver-return-trips",
        element: <DriverReturnTripsList />,
        display: true,
        permission: "Vendors",
      },

      {
        icon: <UserIcon {...icon} />,
        name: "Document Verification",
        path: "/doc-verification",
        element: <DocumentVerificationView />,
        display: true,
        permission: "Document verification",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Mobile user registration",
        path: "/online-registration",
        element: <OnlineRegistrationView />,
        display: true,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "subscription",
        path: "/subscription",
        element: <SubscriptionView />,
        display: true,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "subscription",
        path: "/subscription/add",
        element: <SubscriptionAdd />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Documents details",
        path: "/doc-verification/documents-details/:id",
        element: <DocumentsDetails />,
        display: false,
        permission: "Document verification",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "All bookings List",
        path: "/booking/list",
        element: <AllBookingsLists type={BOOKING_SERVICE_TYPE.ALL_CABS} />,
        display: false,
        permission: "All bookings",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Rides bookings",
        path: "/booking/list/rides",
        element: <AllBookingsLists type={BOOKING_SERVICE_TYPE.RIDES} />,
        display: false,
        permission: "All bookings",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Rentals bookings",
        path: "/booking/list/rentals",
        element: <AllBookingsLists type={BOOKING_SERVICE_TYPE.RENTAL} />,
        display: false,
        permission: "All bookings",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Cab bookings",
        path: "/booking/list/cabBooking",
        element: <AllBookingsLists type={BOOKING_SERVICE_TYPE.CAB_BOOKING} />,
        display: false,
        permission: "All bookings",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Car Wash Bookings",
        path: "/booking/list/carWash",
        element: <AllBookingsLists type={BOOKING_SERVICE_TYPE.CAR_WASH} />,
        display: false,
        permission: "All bookings",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Acting Driver Bookings",
        path: "/booking/list/actingDriver",
        element: <AllBookingsLists type={BOOKING_SERVICE_TYPE.DRIVER} />,
        display: false,
        permission: "All bookings",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Auto Bookings",
        path: "/Auto",
        element: <AllBookingsLists type={BOOKING_SERVICE_TYPE.AUTO} />,
        display: false,
        permission: "Autos",
      },
        {
          icon: <UserIcon {...icon} />,
          name: "Parcel Bookings",
          path: "/booking/list/Parcel",
          element: <AllBookingsLists type={BOOKING_SERVICE_TYPE.PARCEL} />,
          display: false,
          permission: "All bookings",
        },
        {
        icon: <UserIcon {...icon} />,
        name: "Return Trips Records",
        path: "/booking/list/returntrips",
        element: <AllBookingsLists type={BOOKING_SERVICE_TYPE.RETURN_TRIPS} />,
        display: false,
        permission: "All bookings",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Document Verification",
        path: "/doc-verification/pending",
        element: <PendingDocList />,
        display: false,
        permission: "Document verification",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Documents details",
        path: "/doc-verification/pending/documents-details/:id",
        element: <DocumentsDetails />,
        display: false,
        permission: "Document verification",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Cab Subscription",
        path: "/finance/cab-subscription",
        element: <CabSubscriptionView />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Add Subscription",
        path: "/finance/cab-subscription/add",
        element: <CabSubscriptionAdd />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Receipt",
        path: "/finance/master-subscription",
        element: <MasterSubscriptionView />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Master Subscription Add",
        path: "/finance/master-subscription/add",
        element: <MasterSubscriptionAdd />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Master Subscription Details",
        path: "/finance/master-subscription/details/:id",
        element: <MasterSubscriptionDetails />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Master Subscription Edit",
        path: "/finance/master-subscription/edit/:id",
        element: <MasterSubscriptionEdit />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Master Rides Price Table Add",
        path: "/finance/master-price/rides-add",
        element: <MasterPriceTableAdd />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Master Price View",
        path: "/finance/master-price",
        element: <MasterPriceView />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "instant reward",
        path: "/finance/instant-reward",
        element: <InstantReward />,
        display: true,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Cash Back List",
        path: "/finance/cash-back/list",
        element: <CashBackList />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Cash Back Add",
        path: "/finance/cash-back/add",
        element: <CashBackAdd />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Cash Back Edit",
        path: "/finance/cash-back/edit/:id",
        element: <CashBackEdit />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Master Price Add",
        path: "/finance/master-price/driver-add",
        element: <MasterPriceAdd />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Master Price Details & Edit",
        path: "/finance/master-price/details/:id",
        element: <MasterPriceDetailsAndEdit />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Driver Price Table Edit",
        path: "/finance/master-price/driver-edit/:id",
        element: <DriverMasterPriceTableEdit />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Rentals Master Price Add",
        path: "/finance/master-price/rentals-add",
        element: <RentalsPriceMasterAdd />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Rentals Master Price Details",
        path: "/finance/master-price/rentals-details/:id",
        element: <RentalsPriceMasterDetails />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Rentals Master Price Edit",
        path: "/finance/master-price/rentals-edit/:id",
        element: <RentalsMasterPriceEdit />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Auto Master Price Edit",
        path: "/finance/master-price/auto-edit/:id",
        element: <AutoMasterPriceEdit />,
        display: true,
        permission: "Users"
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Auto Master Price Add",
        path: "/finance/master-price/auto-add",
        element: <AutoMasterPriceTableAdd />,
        display: true,
        permission: "Users"
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Assign Driver",
        path: "/vendors/account/allVehicles/assignDriver/:id",
        element: <ReassignDriver />,
        display: false,
        permission: "Vendors",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Payable",
        path: "/finance/payable",
        element: <PayableView />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Payable Details",
        path: "/finance/payable/details/:id",
        element: <PayableDetails />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Parcel Commission",
        path: "/finance/parcel-commission",
        element: <ParcelCommissionList />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Receipt",
        path: "/finance/receipt",
        element: <ReceiptList />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Receipt Details",
        path: "/finance/receipt/details/:receiptNumber",
        element: <ReceiptDetails />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Receipt",
        path: "/finance/invoice",
        element: <InvoiceList />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Receipt Details",
        path: "/finance/invoice/details/:invoiceNumber",
        element: <InvoiceDetails />,
        display: false,
        permission: "Finance",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Master Table Rides Details",
        path: "/finance/master-price/rides-details/:id",
        element: <MasterPriceTableDetails />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Master Table Rides Edit",
        path: "/finance/master-price/rides-edit/:id",
        element: <MasterPriceTableEdit />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "geo-markings",
        path: "/admin/geo-markings",
        element: <GeoMarkings />,
        display: true,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "version control add",
        path: "/user/versionControlList",
        element: <VersionControlList />,
        display: true,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "version control edit",
        path: "/user/versionControl/edit",
        element: <VersionControlEdit />,
        display: true,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "discount module list",
        path: "/finance/discountModuleList",
        element: <DiscountView />,
        display: true,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "discount module edit",
        path: "/finance/discountModule/edit/:id",
        element: <DiscountEdit />,
        display: true,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "discount module add",
        path: "/finance/discountModule/add",
        element: <DiscountAdd />,
        display: true,
        permission: "Users",
      },
      // {
      //   icon: <UserIcon {...icon} />,
      //   name: "testimoinal view",
      //   path: "/user/testimonialView",
      //   element: <TestimoinalView />,
      //   display: true,
      //   permission: "Marketing",
      // },
      // {
      //   icon: <UserIcon {...icon} />,
      //   name: "testimoinal add",
      //   path: "/user/testimonial/add",
      //   element: <TestimoinalAdd />,
      //   display: true,
      //   permission: "Marketing",
      // },
      {
        icon: <UserIcon {...icon} />,
        name: "tripdetails list",
        path: "/tripDetails",
        element: <TripDetails />,
        display: true,
        permission: "Trip Master",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "tripdetails reports",
        path: "/reports/tripMasterReport",
        element: <Reports />,
        display: true,
        permission: "Trip Master",
        superUserOnly: true,
      },
      {
        icon: <UserIcon {...icon} />,
        name: "tripdetails reports",
        path: "/tripDetails/add",
        element: <AddTripDetails />,
        display: true,
        permission: "Trip Master",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "tripdetails reports",
        path: "/tripDetails/details/edit/:id",
        element: <TripDetailsEdit />,
        display: true,
        permission: "Trip Master",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "tripdetails reports",
        path: "/tripDetails/details/:id",
        element: <DetailsTrip />,
        display: true,
        permission: "Trip Master",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Custom Discount",
        path: "/finance/custom-discount/add",
        element: <CustomerDiscountAdd />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Custom Discount List",
        path: "/finance/custom-discount/list",
        element: <CustomerDiscountList />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Driver Bonus List",
        path: "/users/driver-offer/list",
        element: <DriverOfferList />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Driver Bonus Add",
        path: "/users/driver-offer/add",
        element: <DriverOfferAdd />,
        display: false,
        permission: "Users",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Driver Bonus Assign",
        path: "/users/driver-offer/assign",
        element: <DriverOfferAssign />,
        display: false,
        permission: "Users",
      },
        {
          icon: <UserIcon {...icon} />,
          name: "bike",
          path: "/vendors/account/parcel/allVehicles/add/old",
          element: <ParcelCabAdd />,
          display: true,
          permission: "Vendors"
        },
         {
          icon: <UserIcon {...icon} />,
          name: "bike",
          path: "/vendors/account/parcel/allVehicles/add",
          element: <OwnerOnboardingBikeCreation />,
          display: true,
          permission: "Vendors"
        },

        {
          icon: <UserIcon {...icon} />,
          name: "bike",
          path: "/vendors/account/parcel/allVehicles/details/:id",
          element: <ParcelCabDetails />,
          display: true,
          permission: "Vendors"
        },
        {
          icon: <UserIcon {...icon} />,
          name: "bike",
          path: "/vendors/account/parcel/allVehicles/details/edit/:id",
          element: <ParcelCabEdit />,
          display: true,
          permission: "Vendors"
        },
        {
          icon: <UserIcon {...icon} />,
          name: "Parcel",
          path: "/vendors/account/parcel",
          element: <ParcelView />,
          display: true,
          permission: "Vendors"
        },
        {
          icon: <UserIcon {...icon} />,
          name: "Parcel add",
          path: "/vendors/account/parcel/add",
          element: <ParcelAdd />,
          display: true,
          permission: "Vendors"
        },
        {
          icon: <UserIcon {...icon} />,
          name: "Parcel details",
          path: "/vendors/account/parcel/details/:id",
          element: <ParcelDetails />,
          display: true,
          permission: "Vendors"
        },
        {
          icon: <UserIcon {...icon} />,
          name: "Parcel list",
          path: "/vendors/account/parcel/list",
          element: <ParcelDetailsList />,
          display: true,
          permission: "Vendors"
        },
        {
          icon: <UserIcon {...icon} />,
          name: "Parcel edit",
          path: "/vendors/account/parcel/edit/:id",
          element: <ParcelEdit />,
          display: true,
          permission: "Vendors"
        },
        {
          icon: <UserIcon {...icon} />,
          name: "Parcel Master Price Add",
          path: "/finance/master-price/parcel-add",
          element: <ParcelMasterPriceAdd />,
          display: true,
          permission: "Users"
        },
        {
          icon: <UserIcon {...icon} />,
          name: "Parcel Master Price Details",
          path: "/finance/master-price/parcel-details/:id",
          element: <ParcelMasterPriceDetails />,
          display: false,
          permission: "Users"
        },
        {
          icon: <UserIcon {...icon} />,
          name: "Parcel Master Price Edit",
          path: "/finance/master-price/parcel-edit/:id",
          element: <ParcelMasterPriceEdit />,
          display: true,
          permission: "Users"
        },

      {
        icon: <UserIcon {...icon} />,
        name: "Rate Card",
        path: "/rental-rate-card",
        element: <RentalTariffRateCard />,
        display: true,
        permission: "Support"
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Leads",
        path: "/leads",
        element: <LeadsView/>,
        display: true,
        permission: "Support"
      },
      ...(BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW
        ? [{
            icon: <UserIcon {...icon} />,
            name: "Admin Discount History",
            path: "/support/admin-discount-history",
            element: <AdminDiscountHistory />,
            display: true,
            permission: "Support"
          }]
        : []),
      {
        icon: <UserIcon {...icon} />,
        name: "exotel calls",
        path: "/exotel-calls/list",
        element: <ExotelCallsList />,
        display: false,
        permission: "Calls",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Driver Ops",
        path: "/driver-ops",
        element: <DriverOpsView />,
        display: false,
        permission: "Driver Ops",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Driver Engagement Tier Details",
        path: "/driverengagement",
        element: <TierDetailsList />,
        display: false,
        permission: "Driver Engagement",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Driver Engagement Add Tier",
        path: "/driverengagement/tier/add",
        element: <TierDetailsAdd />,
        display: false,
        permission: "Driver Engagement",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Driver Engagement Edit Tier",
        path: "/driverengagement/tier/edit/:id",
        element: <TierDetailsEdit />,
        display: false,
        permission: "Driver Engagement",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Driver Engagement Driver Monitoring",
        path: "/driverengagement/driver-monitoring",
        element: <DriverMonitoringList />,
        display: false,
        permission: "Driver Engagement",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Driver Engagement Incentive Payout",
        path: "/driverengagement/incentive-payout",
        element: <IncentivePayoutList />,
        display: false,
        permission: "Driver Engagement",
      },
      {
        icon: <UserIcon {...icon} />,
        name: "Driver Engagement Audit Logs",
        path: "/driverengagement/audit-logs",
        element: <DriverEngagementAuditLogs />,
        display: false,
        permission: "Driver Engagement",
      },
       {
        icon: <UserIcon {...icon} />,
        name: "Booking Invoice List",
        path: "/finance/bookingInvoiceList",
        element: <BookingInvoiceList />,
        display: false,
        permission: "Finance",
      },
       {
        icon: <UserIcon {...icon} />,
        name: "Booking Invoice Details",
        path: "/finance/bookingInvoice/details/:id",
        element: <BookingInvoiceDetails />,
        display: false,
        permission: "Finance",
      },

    ],
  },
  {
    title: "auth pages",
    layout: "auth",
    pages: [
      {
        icon: <ServerStackIcon {...icon} />,
        name: "sign in",
        path: "/sign-in",
        element: <SignIn />,
        display: false
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "sign up",
        path: "/sign-up",
        element: <SignUp />,
        display: false
      },
    ],
  },
  {
    title: "public pages",
    layout: "public",
    pages: [
      {
        path: "/delete-my-account",
        element: <DeleteAccount />,
        display: false
      },
      {
        path: "/rate-card",
        element: <RentalTariffRateCard />,
        display: false
      },
    ],
  },
];

export default routes;
