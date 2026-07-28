import React from 'react';

const TYPE_OPTIONS = [
  { label: 'All types', value: '' },
  { label: 'Text', value: 'Text' },
  // { label: 'Image', value: 'IMAGE' },
];

const STATUS_OPTIONS = [
  { label: 'All status', value: '' },
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

const APP_SCOPE_OPTIONS = [
  { label: 'All app scopes', value: '' },
  { label: 'Customer', value: 'CUSTOMER' },
  { label: 'Driver', value: 'DRIVER' }
];

const DynamicTextFilters = ({ filters, onChange }) => {
  return (
    <div className="mb-4 grid gap-3 px-6 md:grid-cols-4">
      <select
        className="rounded-lg border p-2"
        value={filters.appScope}
        onChange={(e) => onChange('appScope', e.target.value)}
      >
        {APP_SCOPE_OPTIONS.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* <input
        className="rounded-lg border p-2"
        placeholder="Screen"
        value={filters.screen}
        onChange={(e) => onChange('screen', e.target.value)}
      /> */}
      <select
        className="rounded-lg border p-2"
        value={filters.type}
        onChange={(e) => onChange('type', e.target.value)}
      >
        {TYPE_OPTIONS.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        className="rounded-lg border p-2"
        value={filters.isActive}
        onChange={(e) => onChange('isActive', e.target.value)}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DynamicTextFilters;