import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES, ColorStyles } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';

const CustomerSearch = ({ onSearch, initialSearch = '' }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    salutation: '',
    firstName: '',
    phoneNumber: ''
  });
  const [newCar, setNewCar] = useState({
    carNumber: '',
    nickName: '',
    carType: '',
    fuelType: '',
    transmissionType: ''
  });
  const [searchQuery, setSearchQuery] = useState(initialSearch);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prevUser => ({
      ...prevUser,
      [name]: value
    }));
  };
  const handleCarChange = (e) => {
    const { name, value } = e.target;
    setNewCar(prevUser => ({
      ...prevUser,
      [name]: value
    }));
  };
  function isNewCarValid(newCar) {
    return Object.values(newCar).every(value => value.trim() !== '');
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      newUser.phoneNumber = "+91" + newUser.phoneNumber;
      const response = await ApiRequestUtils.post(API_ROUTES.REGISTER_CUSTOMER, newUser);
      console.log('User created:', response.data);
      if (isNewCarValid(newCar) && response.data) {
        newCar.customerId = response.data.id;
        const carResponse = await ApiRequestUtils.post(API_ROUTES.ADD_CAR_DETAILS, newCar);
        console.log('Form is valid', newCar);
      }
      setIsModalOpen(false);
      setNewUser({
        salutation: '',
        firstName: '',
        phoneNumber: ''
      });
      setNewCar({
        carNumber: '',
        nickName: '',
        carType: '',
        fuelType: '',
        transmissionType: ''
      })

    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleSearch = () => {
    onSearch(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className="p-0">
      <div className="flex items-center justify-between">
        <div className="flex w-full max-w-[620px] items-center gap-2">
          <div className="relative flex-grow">
          <input
            type="text"
            className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-transparent"
            placeholder="Search Customer"
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            value={searchQuery}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className={`px-4 py-2 font-normal rounded-2xl ${ColorStyles.searchButtonColor} text-white`}
          >
            Search
          </button>
        </div>
        <button
          onClick={() => navigate(`/dashboard/customers/add`)}
          className={`ml-4 px-4 py-2 font-normal rounded-3xl ${ColorStyles.addButtonColor}`}
        >
          Add new
        </button>
      </div>

      {isModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md h-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New User</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Salutation</label>
                <select
                  name="salutation"
                  value={newUser.salutation}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 px-4 py-2"
                >
                  <option value="">Select salutation</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Miss">Miss</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={newUser.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 px-4 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={newUser.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  required
                  pattern="[0-9]{10}"
                  maxLength={10}
                  title="Please enter a valid 10-digit phone number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50  px-4 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Car Number</label>
                <input
                  type="text"
                  name="carNumber"
                  value={newCar.carNumber}
                  onChange={handleCarChange}
                  placeholder="Enter car number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 px-4 py-2 uppercase"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Car Name</label>
                <input
                  type="text"
                  name="nickName"
                  value={newCar.nickName}
                  onChange={handleCarChange}
                  placeholder="Enter first name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 px-4 py-2"
                />
              </div>
              <div className="space-y-3">
                <p className="block text-sm font-medium text-gray-700 mb-1">Car Type</p>
                <div className="flex items-center space-x-4 ">
                  <div className='mb-4'>
                    <input
                      type="radio"
                      id="carTypeSeda n"
                      name="carType"
                      value="Sedan"
                      checked={newCar.carType === 'Sedan'}
                      onChange={handleCarChange}
                      className="form-radio h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="carTypeSeda n" className="ml-2 text-base font-medium text-gray-700">
                      Sedan
                    </label>
                  </div>
                  <div className='mb-4'>
                    <input
                      type="radio"
                      id="carTypeSUV"
                      name="carType"
                      value="SUV"
                      checked={newCar.carType === 'SUV'}
                      onChange={handleCarChange}
                      className="form-radio h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="carTypeSUV" className="ml-2 text-base font-medium text-gray-700">
                      SUV
                    </label>
                  </div>
                  <div className='mb-4'>
                    <input
                      type="radio"
                      id="carTypeHatchback"
                      name="carType"
                      value="Hatchback"
                      checked={newCar.carType === 'Hatchback'}
                      onChange={handleCarChange}
                      className="form-radio h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="carTypeHatchback" className="ml-2 text-base font-medium text-gray-700">
                      Hatchback
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</p>
                <div className="flex items-center space-x-4">
                  <div className='mb-4'>
                    <input
                      type="radio"
                      id="fuelTypePetrol"
                      name="fuelType"
                      value="Petrol"
                      checked={newCar.fuelType === 'Petrol'}
                      onChange={handleCarChange}
                      className="form-radio h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="fuelTypePetrol" className="ml-2 text-base font-medium text-gray-700">
                      Petrol
                    </label>
                  </div>
                  <div className='mb-4'>
                    <input
                      type="radio"
                      id="fuelTypeDiesel"
                      name="fuelType"
                      value="Diesel"
                      checked={newCar.fuelType === 'Diesel'}
                      onChange={handleCarChange}
                      className="form-radio h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="fuelTypeDiesel" className="ml-2 text-base font-medium text-gray-700">
                      Diesel
                    </label>
                  </div>
                  <div className='mb-4'>
                    <input
                      type="radio"
                      id="fuelTypeElectric"
                      name="fuelType"
                      value="Electric"
                      checked={newCar.fuelType === 'Electric'}
                      onChange={handleCarChange}
                      className="form-radio h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="fuelTypeElectric" className="ml-2 text-base font-medium text-gray-700">
                      Electric
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="block text-sm font-medium text-gray-700 mb-1">Transmission Type</p>
                <div className="flex items-center space-x-4">
                  <div>
                    <input
                      type="radio"
                      id="transmissionTypeAutomatic"
                      name="transmissionType"
                      value="Automatic"
                      checked={newCar.transmissionType === 'Automatic'}
                      onChange={handleCarChange}
                      className="form-radio h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="transmissionTypeAutomatic" className="ml-2 text-base font-medium text-gray-700">
                      Automatic
                    </label>
                  </div>
                  <div>
                    <input
                      type="radio"
                      id="transmissionTypeManual"
                      name="transmissionType"
                      value="Manual"
                      checked={newCar.transmissionType === 'Manual'}
                      onChange={handleCarChange}
                      className="form-radio h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="transmissionTypeManual" className="ml-2 text-base font-medium text-gray-700">
                      Manual
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-black-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CustomerSearch;
