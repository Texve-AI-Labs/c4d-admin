import React from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ColorStyles } from "@/utils/constants";

export default function BillingListSearch({ value, onChange, onSearch, onClear, placeholder, canClear }) {
  return (
    <form className="flex flex-wrap items-center gap-3" onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
      <div className="relative w-full sm:flex-1 sm:max-w-[500px]">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input type="text" value={value} onChange={(event) => onChange(event.target.value)}
          aria-label={placeholder} placeholder={placeholder}
          className="w-full rounded-2xl border border-gray-300 py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        {canClear && (
          <button type="button" onClick={onClear} aria-label="Clear search" title="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900">
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      <button type="submit" className={`rounded-2xl px-4 py-2 ${ColorStyles.searchButtonColor}`}>Search</button>
    </form>
  );
}
