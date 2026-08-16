import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Option, Select, Spinner, Switch, Typography } from "@material-tailwind/react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { isSuperUserRole } from "@/utils/roleUtils";

const initialFilters = {
  status: "ACTIVE",
};

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
};

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("DD-MM-YYYY hh:mm A") : "-";
};

function ExternalPromotionsList() {
  const navigate = useNavigate();
  const isSuperUser = isSuperUserRole();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
  });

  const buildQuery = (page = 1, activeFilters = filters) => {
    const query = {
      page,
      limit: pagination.itemsPerPage,
    };

    if (activeFilters.status !== "ALL") {
      query.status = activeFilters.status === "ACTIVE";
    }

    return query;
  };

  const fetchRows = async (page = 1, activeFilters = filters) => {
    setLoading(true);
    try {
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_EXTERNAL_PROMOTIONS, buildQuery(page, activeFilters));
      if (response?.success) {
        setRows(Array.isArray(response?.data) ? response.data : []);
        setPagination((prev) => ({
          ...prev,
          currentPage: response?.pagination?.currentPage || page,
          totalPages: response?.pagination?.totalPages || 1,
          totalItems: response?.pagination?.totalItems || 0,
          itemsPerPage: response?.pagination?.itemsPerPage || prev.itemsPerPage,
        }));
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error("Failed to fetch external promotions:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows(1);
  }, []);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || loading) return;
    fetchRows(nextPage);
  };

  const generatePageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i += 1) {
      buttons.push(
        <Button
          key={i}
          size="sm"
          variant={i === pagination.currentPage ? "filled" : "outlined"}
          className={`mx-1 ${ColorStyles.bgColor} text-white`}
          onClick={() => handlePageChange(i)}
          disabled={loading}
        >
          {i}
        </Button>
      );
    }

    return buttons;
  };

  const handleRefresh = () => {
    fetchRows(pagination.currentPage);
  };

  const handleDelete = async (id) => {
    if (!id) return;

    const result = await Swal.fire({
      title: "Delete external promotion?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      didOpen: () => {
        const confirmButton = Swal.getConfirmButton();
        const cancelButton = Swal.getCancelButton();
        if (confirmButton) {
          confirmButton.style.backgroundColor = "#dc2626";
          confirmButton.style.color = "#ffffff";
          confirmButton.style.borderRadius = "0.5rem";
          confirmButton.style.padding = "0.5rem 1rem";
        }
        if (cancelButton) {
          cancelButton.style.backgroundColor = "#2563eb";
          cancelButton.style.color = "#ffffff";
          cancelButton.style.borderRadius = "0.5rem";
          cancelButton.style.padding = "0.5rem 1rem";
          cancelButton.style.marginRight = "0.5rem";
        }
      },
    });

    if (!result.isConfirmed) return;

    try {
      const deleteRoute = API_ROUTES.DELETE_EXTERNAL_PROMOTIONS.replace(":id", encodeURIComponent(String(id)));
      const response = await ApiRequestUtils.delete(deleteRoute);
      if (response?.success) {
        await fetchRows(pagination.currentPage);
      } else {
        await Swal.fire({
          icon: "error",
          title: "Delete failed",
          text: response?.message || response?.error || "Unable to delete external promotion.",
        });
      }
    } catch (error) {
      console.error("Failed to delete external promotion:", error);
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error?.response?.data?.message || error?.response?.data?.error || error?.message || "Unable to delete external promotion.",
      });
    }
  };

  const handleStatusChange = (checked) => {
    setFilters((prev) => ({
      ...prev,
      status: checked ? "ACTIVE" : "INACTIVE",
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchRows(1, {
      ...filters,
      status: checked ? "ACTIVE" : "INACTIVE",
    });
  };

  const statusLabel = (value) => {
    const normalized = normalizeBoolean(value);
    if (normalized === true) return "Active";
    if (normalized === false) return "Inactive";
    return "-";
  };

  const statusBadgeClass = (value) => {
    const normalized = normalizeBoolean(value);
    if (normalized === true) return "bg-green-100 text-green-700";
    if (normalized === false) return "bg-red-100 text-red-700";
    return "bg-blue-gray-100 text-blue-gray-700";
  };

  return (
    <div className="mb-8 flex flex-col gap-6 mt-5">
      <Card>
        <CardHeader variant="gradient" className="mb-4 bg-primary p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">           
              <div className="flex items-center gap-3 rounded-lg">
          <Typography variant="h6" color="white">
              External Promotions List
            </Typography>
                <Switch
                  checked={filters.status === "ACTIVE"}
                  onChange={(event) => handleStatusChange(event.target.checked)}
                  color="green"
                />
                <Typography variant="small" color="white" className="font-medium">
                  {filters.status === "ACTIVE" ? "Active" : "Inactive"}
                </Typography>
              </div>

              <div className="flex gap-2">
              <Button onClick={handleRefresh} disabled={loading} className='bg-red-600'>
                  Refresh
                </Button>
                <Button onClick={() => navigate("/dashboard/vendors/external-promotions/add")} className='bg-white text-black'>
                  Add New
                </Button>
              </div>
            </div>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-12 w-12" />
            </div>
          ) : (
            <>
              <table className="w-full min-w-[1200px] table-auto whitespace-nowrap">
                <thead>
                  <tr>
                    <th className="border-b py-3 px-5 text-left">ID</th>
                    <th className="border-b py-3 px-5 text-left">Title</th>
                    <th className="border-b py-3 px-5 text-left">Image</th>
                    <th className="border-b py-3 px-5 text-left">Secondary Image</th>
                    <th className="border-b py-3 px-5 text-left">Redirect URL</th>
                    <th className="border-b py-3 px-5 text-left">Position</th>
                    <th className="border-b py-3 px-5 text-left">Status</th>
                    <th className="border-b py-3 px-5 text-left">Created At</th>
                    <th className="border-b py-3 px-5 text-left">Updated At</th>
                    <th className="border-b py-3 px-5 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-2 px-2 text-center text-gray-600">
                        No external promotions found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((item, index) => (
                      <tr key={item?.id || item?._id || `external-promotion-${index}`} className="border-b">
                        <td className="py-3 px-5">{item?.id || item?._id || "-"}</td>
                        <td className="py-3 px-5">{item?.title || item?.name || "-"}</td>
                        <td className="py-3 px-5">
                          {item?.imageUrl ? (
                            <a href={item.imageUrl} target="_blank" rel="noreferrer" className="inline-block">
                              <img
                                src={item.imageUrl}
                                alt={item?.title || "External promotion image"}
                                className="h-16 w-24 rounded-md border border-gray-200 object-cover"
                              />
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3 px-5">
                          {item?.secondaryImageUrl ? (
                            <a href={item.secondaryImageUrl} target="_blank" rel="noreferrer" className="inline-block">
                              <img
                                src={item.secondaryImageUrl}
                                alt={`${item?.title || "External promotion"} secondary`}
                                className="h-16 w-24 rounded-md border border-gray-200 object-cover"
                              />
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3 px-5 break-all">{item?.redirectUrl || "-"}</td>
                        <td className="py-3 px-5">{item?.position ?? "-"}</td>
                        <td className="py-3 px-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(item?.isActive ?? item?.status)}`}
                          >
                            {statusLabel(item?.isActive ?? item?.status)}
                          </span>
                        </td>
                        <td className="py-3 px-5">{formatDate(item?.created_at || item?.createdAt)}</td>
                        <td className="py-3 px-5">{formatDate(item?.updated_at || item?.updatedAt)}</td>
                        <td className="py-3 px-5">
                          <Button
                            size="sm"
                            className="bg-blue-600"
                            onClick={() =>
                              navigate(`/dashboard/vendors/external-promotions/edit/${item?.id || item?._id}`, {
                                state: { row: item },
                              })
                            }
                          >
                            Edit
                          </Button>
                          {isSuperUser ? (
                            <Button
                              size="sm"
                              color="red"
                              className="ml-2"
                              onClick={() => handleDelete(item?.id || item?._id)}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="mt-2">
                <div className="flex flex-wrap items-center justify-center">
                  <Button
                    size="sm"
                    variant="text"
                    disabled={pagination.currentPage === 1 || loading}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                  >
                   {'<'}
                  </Button>
                  {generatePageButtons()}
                  <Button
                    size="sm"
                    variant="text"
                    disabled={pagination.currentPage === pagination.totalPages || loading}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                  >
                    {'>'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default ExternalPromotionsList;