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

export function Dashboard() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavType, sidenavColor, openSidenav, miniSidenav } = controller;
  const location = useLocation();
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getPermissions = async () => {
    try{
      const user = localStorage.getItem('loggedInUser');
      const userId = JSON.parse(user)?.id;
      const perm = await ApiRequestUtils.get(API_ROUTES.GET_USER_BY_ID + userId);
      if(perm?.success){
        setPermissions(perm?.data?.permission || []);
      } else {
        console.error("Failed to fetch permissions:", perm?.message);
      }
    }catch(err){
      console.log("ERROR IN GET PERMISIIONS", err);
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!localStorage.getItem("token")) {
    return <Navigate to="/auth/sign-in" replace />;
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
  return <h1>403 - Unauthorized: You do not have permission to access this page.</h1>;
}

export default Dashboard;
