import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate} from "react-router-dom";
import { Bars3Icon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from "@heroicons/react/24/solid";
import { IconButton, Button, Tooltip } from "@material-tailwind/react";
import {
  Sidenav,
  Topnav,
  DashboardNavbar,
  Configurator,
  Footer,
} from "@/widgets/layout";
import routes from "@/routes";
import { useMaterialTailwindController, setOpenConfigurator, setOpenSidenav, setMiniSidenav } from "@/context";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import ProtectedRoute from "../../src/pages/auth/ProtectedRoute";
import {
  clearCachedPermissions,
  getCachedPermissions,
  getLoggedInUserId,
  saveCachedPermissions,
} from "./dashboard/permissionCache";

export function Dashboard() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavType, sidenavColor, openSidenav, miniSidenav } = controller;
  const location = useLocation();
  const [permissions, setPermissions] = useState(() => getCachedPermissions());
  const [isLoading, setIsLoading] = useState(true);
  const [permissionLoadError, setPermissionLoadError] = useState("");

  const getPermissions = async () => {
    try{
      const token = localStorage.getItem("token");
      if (!token) {
        setPermissions([]);
        return;
      }

      const userId = getLoggedInUserId();
      if (!userId) {
        setPermissions([]);
        setPermissionLoadError("Unable to identify the logged-in user. Please sign in again.");
        return;
      }

      const perm = await ApiRequestUtils.get(API_ROUTES.GET_USER_BY_ID + userId);
      if(perm?.success){
        const nextPermissions = perm?.data?.permission || [];
        setPermissions(nextPermissions);
        saveCachedPermissions(nextPermissions);
        setPermissionLoadError("");
      } else {
        console.error("Failed to fetch permissions:", perm?.message);
        const responseCode = Number(perm?.code);
        if (responseCode && responseCode < 500) {
          clearCachedPermissions();
          setPermissions([]);
          setPermissionLoadError("");
        } else if (permissions.length === 0) {
          setPermissionLoadError("Unable to load permissions. Please check your connection and retry.");
        }
      }
    }catch(err){
      console.log("ERROR IN GET PERMISIIONS", err);
      if (permissions.length === 0) {
        setPermissionLoadError("Unable to load permissions. Please check your connection and retry.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(()=> {
    getPermissions();
  },[])

  // Auto-close drawer on route change (mobile)
  React.useEffect(() => {
    setOpenSidenav(dispatch, false);
  }, [location.pathname]);

  if (!localStorage.getItem("token")) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (permissionLoadError && permissions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Unable to load permissions</h1>
        <p className="max-w-md text-sm text-gray-700">{permissionLoadError}</p>
        <Button className="bg-red-600" onClick={getPermissions}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        {/* Sidebar column (desktop persistent, mobile off-canvas handled in component) */}
        <aside className={`hidden lg:block ${miniSidenav ? 'w-[4.5rem]' : 'w-72'} h-full bg-[#F8FAFC]`}></aside>

        {/* Main column */}
        <div className="relative flex min-w-0 flex-col bg-white sm:bg-[#F8FAFC]">
          {/* Mobile header: left hamburger, centered app icon */}
          <div className="grid grid-cols-3 items-center px-3 py-2 lg:hidden">
            <div className="flex justify-start">
              <IconButton
                variant="text"
                color="blue-gray"
                className="rounded-full"
                onClick={() => setOpenSidenav(dispatch, true)}
                aria-label="Open menu"
                aria-expanded={openSidenav}
                aria-controls="app-sidenav"
              >
                <Bars3Icon className="h-6 w-6" />
              </IconButton>
            </div>
            <div className="flex justify-center">
              <img src="/img/app_icon.png" alt="App" className="h-7 w-7 rounded-full ring-2 ring-primary-200" />
            </div>
            <div className="flex justify-end">
              <span className="inline-block w-10" aria-hidden="true"></span>
            </div>
          </div>

          {/* Actual sidenav (positioned fixed by the component itself) */}
          <div className="fixed top-0 left-0 z-40">
            <Sidenav routes={routes} brandImg={"/img/logo-ct.png"} permissions={permissions} />
          </div>

          {/* Collapser moved inside Sidenav header for better aesthetics */}

          {/* Existing Topnav */}
          <Topnav sidenavColor={sidenavColor} sidenavType={sidenavType} permissions={permissions} />

          {/* Content area */}
          <div className="flex-1 min-w-0 px-4 lg:px-7 pt-4 overflow-y-auto bg-[#F8FAFC]">
            <Routes>
              {routes.map(
                ({ layout, pages }) =>
                  layout === "dashboard" &&
                  pages.map(({ path, element, permission, permissionsAny, superUserOnly }) => (
                    <Route
                      key={path}
                      exact
                      path={path}
                      element={
                        <ProtectedRoute
                          element={element}
                          permission={permission}
                          permissionsAny={permissionsAny}
                          permissions={permissions}
                          superUserOnly={superUserOnly}
                          requirePermission={true}
                        />
                      }
                    />
                  ))
              )}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
            <div className="text-blue-gray-600">
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-red-100 bg-white p-6 text-center shadow-lg">
        <h1 className="text-xl font-semibold text-red-700">403 Unauthorized</h1>
        <p className="mt-3 text-sm text-gray-700">
          You do not have permission to access this page.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
