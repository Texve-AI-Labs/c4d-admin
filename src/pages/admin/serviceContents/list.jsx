import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const SERVICE_TYPES = ["DRIVER", "Individual", "AUTO", "BIKE", "Parcel"];

const formatLabel = (value) => {
  const str = String(value || "").trim();
  if (!str) return "-";
  if (str.toUpperCase() === "DRIVER") return "Driver";
  if (str.toUpperCase() === "AUTO") return "Auto";
  if (str.toUpperCase() === "BIKE") return "Bike";
  if (str.toUpperCase() === "PARCEL") return "Parcel";
  if (str.toUpperCase() === "INDIVIDUAL") return "Individual";
  if (str.toUpperCase() === "ONBOARDING") return "Onboarding";
  if (str.toUpperCase() === "CURRENT") return "Current";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const pad = (num) => String(num).padStart(2, "0");
  const day = pad(date.getUTCDate());
  const month = pad(date.getUTCMonth() + 1);
  const year = date.getUTCFullYear();
  const hours24 = date.getUTCHours();
  const minutes = pad(date.getUTCMinutes());
  const hours12 = hours24 % 12 || 12;
  const ampm = hours24 >= 12 ? "PM" : "AM";

  return `${day}-${month}-${year} / ${pad(hours12)}:${minutes} ${ampm}`;
};

const badgeClass = (active) =>
  active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";

function ServiceContentList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  const [filters, setFilters] = useState({
    serviceType: "",
    usageType: "",
    contentMode: "",
    isActive: "",
  });

  const queryParams = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "" && value !== null && value !== undefined)
      ),
    [filters]
  );

  const fetchRows = async () => {
    setLoading(true);
    try {
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_SERVICE_CONTENTS, queryParams);
      setRows(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load service contents:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [queryParams.serviceType, queryParams.usageType, queryParams.contentMode, queryParams.isActive]);

  const toggleRowExpand = (rowKey) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }));
  };

  const formatJson = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "object") return null;
    return value;
  };

  return (
    <div className="mb-2 mt-2">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium">Service Type</label>
            <select
              value={filters.serviceType}
              onChange={(e) => setFilters((prev) => ({ ...prev, serviceType: e.target.value }))}
              className="mt-1 w-full rounded-md border p-2"
            >
              <option value="">All</option>
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Active Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters((prev) => ({ ...prev, isActive: e.target.value }))}
              className="mt-1 w-full rounded-md border p-2"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        <Button className="bg-primary" onClick={() => navigate("/dashboard/admin/service-contents/add")}>
          Add Service Content
        </Button>
      </div>

      <Card className="mt-8">
        <CardHeader variant="gradient" className={`mb-4 p-6 rounded-xl ${ColorStyles.bgColor}`}>
          <Typography variant="h6" color="white">
            Service Content List
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          {loading ? (
            <div className="px-6 py-4">Loading...</div>
          ) : (
            <table className="w-full min-w-[980px] table-auto">
              <thead>
                <tr>
                  {["Service Type", "Usage Type", "Content Mode", "Sort Order", "Status", "Created At", "Actions"].map((heading) => (
                    <th key={heading} className="border-b py-3 px-5 text-left text-sm">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-sm text-gray-600" colSpan={7}>
                      No service content found.
                    </td>
                  </tr>
                ) : (
                  rows.map((item) => {
                    const rowKey = item.id ?? `${item.serviceType}-${item.usageType}-${item.contentMode}`;
                    const isExpanded = Boolean(expandedRows[rowKey]);
                    return (
                      <React.Fragment key={rowKey}>
                        <tr className="border-b">
                          <td className="px-5 py-3 text-sm">{formatLabel(item.serviceType)}</td>
                          <td className="px-5 py-3 text-sm">{formatLabel(item.usageType)}</td>
                          <td className="px-5 py-3 text-sm">{formatLabel(item.contentMode)}</td>
                          <td className="px-5 py-3 text-sm">{item.sortOrder ?? "-"}</td>
                          <td className="px-5 py-3 text-sm">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(Boolean(item.isActive))}`}>
                              {item.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm">
                            {formatDateTime(item.created_at || item.createdAt)}
                          </td>
                          <td className="px-5 py-3 text-sm">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outlined" onClick={() => toggleRowExpand(rowKey)}>
                                {isExpanded ? "Hide" : "View"}
                              </Button>
                              <Button size="sm" className='bg-primary' onClick={() => navigate(`/dashboard/admin/service-contents/edit/${item.id}`)}>
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr className="bg-slate-50">
                            <td className="px-5 py-4" colSpan={7}>
                              <div className="rounded-xl border border-slate-200 bg-white">
                                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">Expanded Details</div>
                                    <div className="text-xs text-slate-500">Content, images, and metadata for this service content.</div>
                                  </div>
                                  <Button size="sm" variant="outlined" onClick={() => toggleRowExpand(rowKey)}>
                                    Close
                                  </Button>
                                </div>

                                <div className="space-y-4 p-4">
                                  <div className="rounded-lg border border-slate-200 bg-slate-50">
                                    <div className="border-b border-slate-200 px-4 py-3">
                                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Main Content</div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-3">
                                      <div>
                                        <div className="text-xs uppercase tracking-wide text-slate-400">Title</div>
                                        <div className="text-sm font-semibold text-slate-900">{item?.content?.title || "-"}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs uppercase tracking-wide text-slate-400">Clari Text</div>
                                        <div className="text-sm text-slate-700">
                                          {item?.content?.clariText || "No description available."}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Terms</div>
                                        <div className="flex flex-wrap gap-2">
                                          {(Array.isArray(item?.content?.terms) ? item.content.terms : [])
                                            .filter((term) => String(term || "").trim())
                                            .length > 0 ? (
                                            item.content.terms
                                              .filter((term) => String(term || "").trim())
                                              .map((term, index) => (
                                                <span
                                                  key={`${term}-${index}`}
                                                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                                                >
                                                  {term}
                                                </span>
                                              ))
                                          ) : (
                                            <div className="text-sm text-slate-500">No terms listed.</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="rounded-lg border border-slate-200 bg-slate-50">
                                    <div className="border-b border-slate-200 px-4 py-3">
                                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Images</div>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full table-auto">
                                        <thead className="bg-slate-100">
                                          <tr>
                                            {["Thumb", "Title", "URL", "Alt", "Sort Order"].map((heading) => (
                                              <th
                                                key={heading}
                                                className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                              >
                                                {heading}
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(Array.isArray(item?.images) ? item.images : [])
                                            .filter((image) => String(image?.url || "").trim())
                                            .length > 0 ? (
                                            item.images
                                              .filter((image) => String(image?.url || "").trim())
                                              .map((image, index) => (
                                                <tr key={`${image.url}-${index}`} className="align-top">
                                                  <td className="border-b border-slate-100 px-4 py-3">
                                                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-xs font-semibold text-slate-400">
                                                      IMG
                                                    </div>
                                                  </td>
                                                  <td className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
                                                    {image.title || "-"}
                                                  </td>
                                                  <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                                                    <div className="break-all">{image.url}</div>
                                                  </td>
                                                  <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                                                    {image.alt || "-"}
                                                  </td>
                                                  <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                                                    {image.sortOrder ?? 0}
                                                  </td>
                                                </tr>
                                              ))
                                          ) : (
                                            <tr>
                                              <td className="px-4 py-4 text-sm text-slate-500" colSpan={5}>
                                                No images available.
                                              </td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  <div className="rounded-lg border border-slate-200 bg-slate-50 hidden">
                                    <div className="border-b border-slate-200 px-4 py-3">
                                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Advanced Metadata</div>
                                    </div>
                                    <div className="px-4 py-4">
                                      {item.metadata && typeof item.metadata === "object" ? (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                          <div>
                                            <div className="text-xs uppercase tracking-wide text-slate-400">Type</div>
                                            <div className="text-sm text-slate-700">{Array.isArray(item.metadata) ? "Array" : "Object"}</div>
                                          </div>
                                          <div>
                                            <div className="text-xs uppercase tracking-wide text-slate-400">Keys</div>
                                            <div className="text-sm text-slate-700">
                                              {Object.keys(item.metadata || {}).length > 0
                                                ? Object.keys(item.metadata).join(", ")
                                                : "No metadata keys"}
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-sm text-slate-500">No metadata provided.</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default ServiceContentList;