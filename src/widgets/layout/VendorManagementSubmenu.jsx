import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";
import { NAV_UI } from "@/utils/constants";

function VendorManagementSubmenu() {
  const location = useLocation();
  const pathname = location.pathname.toLowerCase();

  const items = [
    { label: "Vendors", path: "/dashboard/vendor-management/vendors" },
    { label: "Categories", path: "/dashboard/vendor-management/categories" },
    { label: "Products", path: "/dashboard/vendor-management/products" },
    { label: "Catalog Mapping", path: "/dashboard/vendor-management/catalog-mapping" },
    { label: "Inventory", path: "/dashboard/vendor-management/inventory" },
    { label: "Pricing", path: "/dashboard/vendor-management/pricing" },
  ];

  const getItemClasses = (isActive) =>
    `${NAV_UI.topnav.buttonBase} ${NAV_UI.spacing.topnavButton} ${NAV_UI.typography.topnavLabel} ${
      isActive
        ? `${NAV_UI.colors.topnavActiveBg} ${NAV_UI.colors.topnavActiveText}`
        : `${NAV_UI.colors.topnavInactiveText} ${NAV_UI.topnav.buttonHover}`
    }`;

  return (
    <ul className={NAV_UI.topnav.list}>
      {items.map(({ label, path }) => (
        <li key={label}>
          <NavLink
            to={path}
            end={false}
          >
            <Button variant="text" className={getItemClasses(pathname.startsWith(path))}>
              <Typography color="inherit" className={NAV_UI.typography.topnavLabel}>
                {label}
              </Typography>
            </Button>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export default VendorManagementSubmenu;
