import React, { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Typography, Spinner, Select, Option, Chip, Button } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { Link } from "react-router-dom";
import { KYC_STATUS_OPTIONS } from "@/pages/common/kycStatusOptions";
import KycStatusCards from "@/pages/common/KycStatusCards";
import { EMPTY_KYC_STATUS_COUNTS, extractKycStatusCounts } from "@/pages/common/kycStatusCounts";
import AccountSearch from "@/components/AccountSearch";

export function AccountListNew() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("ALL");
  const [serviceType, setServiceType] = useState("Company");
  const [error, setError] = useState("");
  const [kycStatusCounts, setKycStatusCounts] = useState(EMPTY_KYC_STATUS_COUNTS);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
  });

  const fetchAccounts = async (
    page = 1,
    searchValue = "",
    stageValue = "ALL",
    serviceTypeValue = "Company"
  ) => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit: pagination.itemsPerPage,
        search: searchValue.trim(),
        serviceType: serviceTypeValue,
      };

      if (stageValue && stageValue !== "ALL") {
        params.stage = stageValue;
      }

      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.DRIVER_NEW_ONBOARDING, {
        ...params,
      });

      if (!response?.success) {
        setRows([]);
        setKycStatusCounts(EMPTY_KYC_STATUS_COUNTS);
        setError(response?.message || "Unable to fetch accounts");
        return;
      }

      const list =
        (Array.isArray(response?.data) && response.data) ||
        (Array.isArray(response?.data?.data) && response.data.data) ||
        (Array.isArray(response?.data?.rows) && response.data.rows) ||
        (Array.isArray(response?.rows) && response.rows) ||
        [];

      setRows(list);
      setKycStatusCounts(extractKycStatusCounts(response));

      const pg = response?.pagination || response?.data?.pagination || {};
      setPagination((prev) => ({
        ...prev,
        currentPage: page,
        totalPages: pg?.totalPages || 1,
        totalItems: pg?.totalItems || list.length || 0,
        itemsPerPage: pg?.itemsPerPage || prev.itemsPerPage,
      }));
    } catch (err) {
      console.error("Failed to fetch account list", err);
      setRows([]);
      setKycStatusCounts(EMPTY_KYC_STATUS_COUNTS);
      setError("Failed to fetch account list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAccounts(pagination.currentPage, search, stage, serviceType);
    }, 350);

    return () => clearTimeout(timer);
  }, [pagination.currentPage, search, stage, serviceType]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [search, stage, serviceType]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  const generatePageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          size="sm"
          variant={i === pagination.currentPage ? "filled" : "outlined"}
          className={`mx-1 ${ColorStyles.bgColor} text-white`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }

    return buttons;
  };

  const getAccounts = (searchQuery) => {
    setSearch(searchQuery || "");
  };

  return (
    <div className="mb-8 flex flex-col gap-12 mt-6">
      <AccountSearch onSearch={getAccounts} initialValue={search} />
      <KycStatusCards options={KYC_STATUS_OPTIONS} counts={kycStatusCounts} />
      <Card>
        <CardHeader
          variant="gradient"
          className={`mb-8 p-6 flex-1 justify-between items-center rounded-xl ${ColorStyles.bgColor}`}
        >
          <Typography variant="h6" color="white">
            Account List (New)
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <div className="px-6 pb-4 flex flex-wrap items-start gap-6">
            <div className="min-w-[220px]">
              <Typography variant="small" className="text-sm font-semibold text-blue-gray-800 mb-2">
                Service Type
              </Typography>
              <Select value={serviceType} onChange={(value) => setServiceType(value || "Company")}>
                <Option value="Company">Company</Option>
                <Option value="Individual">Individual</Option>
              </Select>
            </div>
            <div className="min-w-[220px]">
              <Typography variant="small" className="text-sm font-semibold text-blue-gray-800 mb-2">
                Stage
              </Typography>
              <Select value={stage} onChange={(value) => setStage(value || "ALL")}>
                <Option value="ALL">All</Option>
                <Option value="ACCOUNT">ACCOUNT</Option>
                <Option value="VEHICLE">VEHICLE</Option>
                <Option value="COMPLETED">COMPLETED</Option>
              </Select>
            </div>
          </div>

          {error ? (
            <Typography className="px-6 pb-4 text-red-500 text-sm">{error}</Typography>
          ) : null}

          {loading ? (
            <table className="w-full min-w-[880px] table-auto">
              <tbody>
                <tr>
                  <td colSpan={7} className="py-3 px-5">
                    <div className="flex justify-center items-center">
                      <Spinner className="h-12 w-12" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[880px] table-auto">
              <thead>
                <tr>
                  {["Created Date", "ID", "Account Name", "Email", "Phone Number", "Account Docs", "Stage"].map((head) => (
                    <th key={head} className="border-b border-blue-gray-50 py-3 px-6 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                        {head}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 px-5 text-center">
                      <Typography variant="small" className="font-semibold text-blue-gray-700">
                        No Accounts
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  rows.map((item, key) => {
                    const className = `py-3 px-6 ${key === rows.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                    return (
                      <tr key={item?.id || key}>
                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            {item?.created_at ? new Date(item.created_at).toLocaleDateString("en-GB") : "-"}
                          </Typography>
                        </td>
                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            {item?.id || "-"}
                          </Typography>
                        </td>
                        <td className={className}>
                          {item?.id ? (
                            <Link to={`/dashboard/vendors/account/details/${item.id}`}>
                              <Typography
                                variant="small"
                                color="blue"
                                className="font-semibold underline cursor-pointer"
                              >
                                {item?.name || "-"}
                              </Typography>
                            </Link>
                          ) : (
                            <Typography className="text-xs font-semibold text-blue-gray-900">
                              {item?.name || "-"}
                            </Typography>
                          )}
                        </td>
                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            {item?.email || "-"}
                          </Typography>
                        </td>
                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            {item?.phoneNumber || "-"}
                          </Typography>
                        </td>
                        <td className={className}>
                          <Chip
                            variant="ghost"
                            color={item?.accountDocumentStatus?.status === "VERIFIED" ? "green" : "black"}
                            value={item?.accountDocumentStatus?.status || "PENDING"}
                            className="py-0.5 px-2 text-[11px] font-medium w-fit"
                          />
                        </td>
                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            {item?.stage || "-"}
                          </Typography>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {rows.length > 0 && (
            <div className="flex items-center justify-center mt-4 mb-2">
              <Button
                size="sm"
                variant="text"
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                className="mx-1"
              >
                {"<"}
              </Button>
              {generatePageButtons()}
              <Button
                size="sm"
                variant="text"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                className="mx-1"
              >
                {">"}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default AccountListNew;
