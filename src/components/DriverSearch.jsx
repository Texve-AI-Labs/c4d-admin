import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { ColorStyles } from '@/utils/constants';

const DriverSearch = ({ onSearch, initialValue = '', hideAddNewButton=false }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(initialValue);

  useEffect(() => {
    setSearchQuery(initialValue || '');
  }, [initialValue]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    const debounceTimer = setTimeout(() => {
      onSearch(trimmed);
    }, 600);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, onSearch]);
  return (
    <div className="p-4 border border-gray-300 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="relative flex-grow max-w-[500px]">
          <input
            type="text"
            className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Search Driver"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div> 
        {!hideAddNewButton && ( 
        <button 
          onClick={() => navigate(`/dashboard/vendors/account/drivers/add`)}
          className={`ml-4 px-4 py-2 rounded-xl hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
            ColorStyles.addButtonColor
          }`}
        >
          Add new
        </button>
        )}
      </div>
    </div>
  );
};

export default DriverSearch;
