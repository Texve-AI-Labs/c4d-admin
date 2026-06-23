// src/components/SearchableDropdown.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchableDropdown = ({ searchVal, addVal, selected, options, onSelect, setSearchBookingId }) => {
    const [searchText, setSearchText] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState();
    const [selectedValue, setSelectedValue] = useState(selected);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    function findRecordById(records, field, id) {
        return records.find(record => record[field] == id);
    }

    useEffect(() => { 
        setFilteredOptions(options);
        if (selectedValue) {
            let val = findRecordById(options, 'id', selectedValue);
            if (val) {
                setSearchText(`${val.firstName} - ${val.phoneNumber}`);
                onSelect(val);
            }  
        } else if (addVal) {
            let val = findRecordById(options, 'phoneNumber', addVal);
            if (val) {
                setSearchText(`${val?.firstName} - ${val?.phoneNumber}`);
                onSelect(val);
            }
        }
    }, [options, selectedValue, addVal])
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchText(value);
        if (value.startsWith('C4D') && value.length > 3 && typeof setSearchBookingId === 'function') {
            setSearchBookingId(value);
        }
        onSelect("");
        setSelectedValue(null);
        const isNumeric = /^\d+$/.test(value);

        // Form a regex pattern based on the input
        const pattern = isNumeric ? `^\\+91${value}` : value;

        // Create a regex for filtering
        const regex = new RegExp(pattern, 'i'); // 'i' for case-insensitive

        // Filter options based on input type
        const newFilteredOptions = options.filter((option) => {
            if (isNumeric) {
                searchVal(value);
                return regex.test(option.phoneNumber);
            } else {
                searchVal('');
                return regex.test(option.firstName);
            }
        });
        setFilteredOptions(newFilteredOptions);
        setIsOpen(true);
    }

    const handleClear = (e) => {
        e.stopPropagation();
        setSearchText('');
        if (typeof setSearchBookingId === 'function') {
            setSearchBookingId('');
        }
        setSelectedValue(null);
        onSelect(options);
        setIsOpen(false);
    };

    const handleOptionClick = (option) => {
        setSearchText(`${option.firstName} - ${option.phoneNumber}`); // Update the input with the selected option's details
        onSelect(option); // Notify the parent component of the selection
        setSelectedValue(option.id);
        setIsOpen(false); // Close the dropdown menu
    };
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    return (
        <div className="w-full" ref={dropdownRef} onClick={() => setIsOpen(!isOpen)}>
            <div className="relative">
                <input
                    type="text"
                    value={searchText}
                    onChange={handleSearchChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search customers"
                    className="p-2 border rounded-xl w-full pr-10"
                />
                {searchText && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute inset-y-0 right-2 flex items-center text-black hover:text-black"
                    >
                        ✕
                    </button>
                )}
            </div>
            {isOpen && (
                <div className="absolute z-10 max-w-max max-h-64 mt-1 overflow-y-auto bg-white border border-gray-300 rounded shadow-lg">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option.id} // Assuming each option has a unique 'id'
                                onClick={() => handleOptionClick(option)}
                                className="p-2 hover:bg-gray-200 cursor-pointer"
                            >
                                {option.firstName} - {option.phoneNumber}
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="p-2 text-gray-500">No options found</div>
                            {/* <div className="p-2 text-primary-700" onClick={() => {
                                navigate('/dashboard/customers/add');
                            }}>+ Add new customer</div> */}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;
