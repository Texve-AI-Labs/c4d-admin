import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { ColorStyles } from '@/utils/constants';


const AutoSearch = ({ onSearch, initialValue = '', hideAddNewButton=false }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(initialValue);

  useEffect(() => {
    setSearchQuery(initialValue || '');
  }, [initialValue]);

  const handleSearch = () => onSearch(searchQuery.trim());
  const handleClear = () => { setSearchQuery(""); onSearch(""); };
  return (
    <div className="p-4 border border-gray-300 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="relative flex-grow max-w-[500px]">
          <input
            type="text"
            className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search Auto Owner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          </div>
          {searchQuery && <button type="button" onClick={handleClear} className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-800" aria-label="Clear search"><XMarkIcon className="w-5 h-5" /></button>}
        </div>  
        <button type="button" onClick={handleSearch} className={`ml-4 px-4 py-2 rounded-xl ${ColorStyles.searchButtonColor}`}>Search</button>
        {!hideAddNewButton && ( 
        <button 
          onClick={() => navigate('/dashboard/vendors/account/owner-onboarding-auto/add')}
          className={`ml-4 px-4 py-2 rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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

export default AutoSearch
