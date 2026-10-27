import { useEffect, useState } from "react";

const readSession = (key) => {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "null") || {};
  } catch {
    return {};
  }
};

export default function useBillingListSearch(storageKey, { page = 1, pageSize = 15 } = {}) {
  const [saved] = useState(() => readSession(storageKey));
  const [searchQuery, setSearchQuery] = useState(() => typeof saved.draft === "string" ? saved.draft : saved.search || "");
  const [pagination, setPagination] = useState(() => ({
    currentPage: Number.isInteger(saved.page) && saved.page > 0 ? saved.page : page,
    itemsPerPage: Number.isInteger(saved.pageSize) && saved.pageSize > 0 ? saved.pageSize : pageSize,
    totalPages: 1,
    totalItems: 0,
    search: typeof saved.search === "string" ? saved.search : "",
  }));
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        draft: searchQuery,
        search: pagination.search,
        page: pagination.currentPage,
        pageSize: pagination.itemsPerPage,
      }));
    } catch {
      // Search still works when browser storage is unavailable.
    }
  }, [storageKey, searchQuery, pagination.search, pagination.currentPage, pagination.itemsPerPage]);

  const applySearch = (value) => {
    setSearchQuery(value);
    setPagination((previous) => ({ ...previous, currentPage: 1, search: value.trim() }));
    setRequestVersion((previous) => previous + 1);
  };

  return {
    searchQuery,
    setSearchQuery,
    pagination,
    setPagination,
    requestVersion,
    runSearch: () => applySearch(searchQuery),
    clearSearch: () => applySearch(""),
  };
}
