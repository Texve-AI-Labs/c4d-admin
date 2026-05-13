import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { ColorStyles } from '@/utils/constants';

const ParcelSearch = ({ onSearch, hideAddNewButton = false }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="relative flex-grow max-w-[500px]">
          <input
            type="text"
            className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search  Account"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div> 
        <button 
          onClick={() => navigate(`/dashboard/vendors/account/owner-onboarding-bike/add`)}
          className={`ml-4 px-4 py-2  rounded-2xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            ColorStyles.addButtonColor
          }`}
        >
          Add New
        </button>
      </div>
    </div>
  );
};

export default ParcelSearch;