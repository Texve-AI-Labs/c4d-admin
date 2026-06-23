import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Button, Card, CardHeader, Typography, Spinner } from '@material-tailwind/react';
import { ColorStyles } from '@/utils/constants';
import { saveAs } from 'file-saver';

const tabs = ['Daily', 'Weekly', 'Monthly'];

const Reports = ({ accountId }) => {
  const [activeTab, setActiveTab] = useState('Weekly');
  const [fromDate, setFromDate] = useState(new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0]);
  const [updatedStartDate, setUpdatedStartDate] = useState('');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [updatedEndDate, setUpdatedEndDate] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('All Vehicles');
  const [driverFilter, setDriverFilter] = useState('All Drivers');
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [error, setError] = useState(null);
  const [vehiclesError, setVehiclesError] = useState(null);
  const [driversError, setDriversError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [permsLoaded, setPermsLoaded] = useState(false);

  const isUpdateDateRangeInvalid = Boolean(updatedStartDate && updatedEndDate && updatedStartDate > updatedEndDate);

  const [summary, setSummary] = useState({
    totalTrips: 0,
    totalKm: 0,
    fuelUsed: 0,
    fuelCost: 0,
    totalFare: 0,
    profitLoss: 0,
    totalTollCost: 0,
    totalPermitCost: 0,
  });

  const getPermissions = () => {
  const userData = localStorage.getItem('loggedInUser');
  if (userData) {
    const { role } = JSON.parse(userData);
    if (role) {
      setUserRole(role.trim().toUpperCase());
      // console.log('User role set to:', role.trim().toUpperCase());
    }
  }
  setPermsLoaded(true);
};

useEffect(() => {
  getPermissions();
}, []);

  useEffect(() => {
    const fetchVehiclesAndDrivers = async () => {
      setLoadingVehicles(true);
      setLoadingDrivers(true);
      setVehiclesError(null);
      setDriversError(null);

      try {
        const vehicleData = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ACCOUNT_CABS, { accountId });
        const vehiclesList = vehicleData.data || [];
         if (vehiclesList.length > 0) {
          setVehicles(vehiclesList);
        } else {
          console.warn('No vehicles from GET_ACCOUNT_CABS, falling back to trips data');
        }
        setVehicles(vehiclesList);
      } catch (err) {
        setVehiclesError('Failed to fetch vehicles: ' + err.message);
        console.error('Vehicles fetch error:', err);
      } finally {
        setLoadingVehicles(false);
      }

      try {
        const driverData = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ACCOUNT_RELATED_DRIVERS + accountId);
        const driversList = driverData.data || [];
      if (driversList.length > 0) {
          setDrivers(driversList);
        } else {
          console.warn('No drivers from GET_ACCOUNT_RELATED_DRIVERS, falling back to trips data');
        }
        setDrivers(driversList);
      } catch (err) {
        setDriversError('Failed to fetch drivers: ' + err.message);
        console.error('Drivers fetch error:', err);
      } finally {
        setLoadingDrivers(false);
      }
    };

    if (accountId) {
      fetchVehiclesAndDrivers();
    }
  }, [accountId]);

  useEffect(() => {
    const fetchTrips = async () => {
      if (isUpdateDateRangeInvalid) {
        setTrips([]);
        setSummary({
          totalTrips: 0,
          totalKm: 0,
          fuelUsed: 0,
          fuelCost: 0,
          totalFare: 0,
          profitLoss: 0,
          totalTollCost: 0,
          totalPermitCost: 0,
        });
        setError('Update From Date must be less than or equal to Update Trip To Date.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const params = {
          page: currentPage,
          limit: 15,
          fromDate,
          toDate,
          cabId: vehicleFilter === 'All Vehicles' ? '' : vehicleFilter,
          driverId: driverFilter === 'All Drivers' ? '' : driverFilter,
        };
        if (updatedStartDate) params.updatedStartDate = updatedStartDate;
        if (updatedEndDate) params.updatedEndDate = updatedEndDate;
        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_TRIP_REPORTS, params);
        // console.log("Fetched trip data:", data);

        
        if (data.summary) {
          setSummary(data.summary);
        }

        
        const transformedTrips = data.data.map(trip => {
          // console.log("Mapping trip:", trip);
          const km = parseFloat(trip.totalKm) || 0;
          const endKm = parseFloat(trip.endKm) || 0;
          const startKm = parseFloat(trip.startKm) || 0;
          const calculatedKm = km > 0 ? km : Math.max(endKm - startKm, 0);
          return {
            date: trip.tripDate,
            createDate: trip.created_at || trip.createdAt || '',
            bookingId:trip.bookingId,
            tripType:trip.tripType,
            vehicle: trip.Cab?.carNumber || '-',
            driver: trip.Driver?.firstName || '-',
            startPoint: trip.startAddress?.address || trip.startAddress || '-',
            endPoint: trip.endAddress?.address || trip.endAddress || '-',
            totalKm: isNaN(calculatedKm) ? 0 : calculatedKm,
            toll: parseFloat(trip.toll) || 0,
            permit: parseFloat(trip.permit) || 0,
            cost: parseFloat(trip.fuelCost) || 0,
            fare: parseFloat(trip.tripFare) || 0,
          };
        });

         const uniqueVehicles = Array.from(new Map([...vehicles, ...data.data.map(trip => trip.Cab)].filter(cab => cab).map(cab => [cab.id, cab])).values());
        const uniqueDrivers = Array.from(new Map([...drivers, ...data.data.map(trip => trip.Driver)].filter(driver => driver).map(driver => [driver.id, driver])).values());

        setVehicles(prevVehicles => prevVehicles.length === 0 ? uniqueVehicles : [...prevVehicles, ...uniqueVehicles.filter(v => !prevVehicles.some(pv => pv.id === v.id))]);
        setDrivers(prevDrivers => prevDrivers.length === 0 ? uniqueDrivers : [...prevDrivers, ...uniqueDrivers.filter(d => !prevDrivers.some(pd => pd.id === d.id))]);


        setTrips(transformedTrips);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        setError('Failed to fetch trips: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [fromDate, toDate, vehicleFilter, driverFilter, activeTab, currentPage, updatedStartDate, updatedEndDate, isUpdateDateRangeInvalid]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const generatePageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          size="sm"
          variant={i === currentPage ? 'filled' : 'outlined'}
          className={`mx-1 ${ColorStyles.bgColor} ${i === currentPage ? 'text-white' : 'text-white'}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    return buttons;
  };

  const handleExportExcel = async () => {
    if (isUpdateDateRangeInvalid) {
      setError('Update From Date must be less than or equal to Update Trip To Date.');
      return;
    }

    try {
      setExportLoading(true);
    const exportParams = {
      fromDate,
      toDate,
      cabId: vehicleFilter === 'All Vehicles' ? '' : vehicleFilter,
      driverId: driverFilter === 'All Drivers' ? '' : driverFilter,
    };
    if (updatedStartDate) exportParams.updatedStartDate = updatedStartDate;
    if (updatedEndDate) exportParams.updatedEndDate = updatedEndDate;

    const response = await ApiRequestUtils.fetchExcelDownload(
      API_ROUTES.EXPORT_EXCEL_TRIP_DETAILS,
      0, // custID if needed, else 0
      exportParams
    );

      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      let filename = `Report_${fromDate}_to_${toDate}.xlsx`;
      if (response.headers['content-disposition']) {
        const match = response.headers['content-disposition'].match(/filename="(.+)"/);
        if (match && match[1]) filename = match[1];
      }

      saveAs(blob, filename);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export report: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Card className="bg-white p-6 rounded shadow">
          <div className="flex items-center justify-between w-full">
            <Typography variant="h6" color="black">
              Trip Reports
            </Typography>
            {permsLoaded && userRole === 'SUPER_USER' && (
            <Button
              size="sm"
              className="bg-green-500 text-white"
              onClick={handleExportExcel}
              disabled={exportLoading}
            >
              {exportLoading ? 'Exporting...' : 'Export to Excel'}
            </Button>
            )}
          </div>
        <div className="border-b border-gray-200 mb-6">
          <div className="px-6 py-2">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === 'Daily') {
                      setFromDate(new Date().toISOString().split('T')[0]);
                      setToDate(new Date().toISOString().split('T')[0]);
                    } else if (tab === 'Weekly') {
                      setFromDate(new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0]);
                      setToDate(new Date().toISOString().split('T')[0]);
                    } else if (tab === 'Monthly') {
                      setFromDate(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
                      setToDate(new Date(new Date().setMonth(new Date().getMonth() + 1, 0)).toISOString().split('T')[0]);
                    }
                    setCurrentPage(1);
                  }}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Trip From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Trip To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md"
            />
          </div>
          <div>
            <Button
              size="sm"
              className="bg-orange-500 px-3 py-1 text-xs text-white shadow-none"
              onClick={() => {
                setFromDate('');
                setToDate('');
                setCurrentPage(1);
              }}
            >
              Clear 
              {/* Trip Dates */}
            </Button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Updated Start Date</label>
            <input
              type="date"
              value={updatedStartDate}
              onChange={(e) => setUpdatedStartDate(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Updated End Date</label>
            <input
              type="date"
              value={updatedEndDate}
              onChange={(e) => setUpdatedEndDate(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md"
            />
          </div>
          <div>
            <Button
              size="sm"
              className="bg-indigo-500 px-3 py-1 text-xs text-white shadow-none"
              onClick={() => {
                setUpdatedStartDate('');
                setUpdatedEndDate('');
                setCurrentPage(1);
                setError(null);
              }}
            >
              Clear 
              {/* Updated Dates */}
            </Button>
          </div>
          
          
        </div>
        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
            {loadingVehicles ? (
              <div className="text-gray-500">Loading vehicles...</div>
            ) : vehiclesError ? (
              <div className="text-red-500">{vehiclesError}</div>
            ) : (
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md"
              >
                <option value="All Vehicles">All Vehicles</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.Cab?.carNumber || vehicle.carNumber}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Driver</label>
            {loadingDrivers ? (
              <div className="text-gray-500">Loading drivers...</div>
            ) : driversError ? (
              <div className="text-red-500">{driversError}</div>
            ) : (
              <select
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md"
              >
                <option value="All Drivers">All Drivers</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.firstName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[
              { label: 'Trips', value: summary.totalTrips, prefix: '' },
              { label: 'Total KM', value: Number(Number(summary?.totalKm ?? 0).toFixed(2)), prefix: '' },
              { label: 'Fuel Cost', value: summary.fuelCost, prefix: '₹ ' },
              { label: 'Toll Cost', value: summary.tollCost, prefix: '₹ ' },
              { label: 'Permit Cost', value: summary.permitCost, prefix: '₹ ' },
              { label: 'Total Fare', value: summary.totalFare, prefix: '₹ ' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-blue-gray-100 bg-white px-4 py-3 shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-blue-gray-500">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-bold text-blue-gray-900">
                  {item.prefix}{item.value ?? 0}
                </p>
              </div>
            ))}
        </div>
        <div className="weekly-report">
          <h3 className="text-lg font-semibold mb-4 text-center bg-primary-900 text-white p-2 rounded" style={{ width: '100%' }}>
            Root Cabs Report - {fromDate} to {toDate}
          </h3>
          {loading ? (
            <div className="flex justify-center items-center">
              <Spinner className="h-12 w-12" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <>
            <div className="overflow-x-scroll px-0 pt-0 pb-2">
              <table className="w-full table-auto min-w-[1300px]">
                <thead>
                  <tr className="bg-primary-900 text-white font-semibold">
                    <th className="px-3 py-3 text-left text-sm whitespace-nowrap lg:sticky lg:left-0 lg:z-20 bg-primary-900 min-w-[140px] lg:border-r lg:border-primary-900">Booking Date</th>
                    <th className="px-3 py-3 text-left text-sm whitespace-nowrap lg:sticky lg:left-[140px] lg:z-20 bg-primary-900 min-w-[180px] lg:border-r lg:border-primary-900">Booking Id</th>
                    <th className="px-3 py-3 text-left text-sm whitespace-nowrap">Trip Type</th>
                    <th className="px-3 py-3 text-left text-sm whitespace-nowrap">Created Date</th>
                    <th className="px-3 py-3 text-left text-sm whitespace-nowrap">Vehicle Number</th>
                    <th className="px-3 py-3 text-left text-sm whitespace-nowrap">Driver</th>
                    <th className="px-3 py-3 text-left text-sm whitespace-nowrap">Start Point</th>
                    <th className="px-3 py-3 text-left text-sm whitespace-nowrap">End Point</th>
                    <th className="px-3 py-3 text-left text-sm whitespace-nowrap">KM</th>
                    <th className="px-3 py-3 text-left text-sm whitespace-nowrap">Toll</th>
                    <th className="px-3 py-3 text-left text-sm whitespace-nowrap">Permit</th>
                    <th className="px-3 py-3 text-left text-sm whitespace-nowrap">Cost</th>
                    <th className="px-3 py-3 text-left text-sm whitespace-nowrap">Fare</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.length === 0 ? (
                    <tr>
                      <td colSpan="13" className="px-3 py-4 text-center text-gray-500">
                        No trips found for the selected criteria
                      </td>
                    </tr>
                  ) : (
                    trips.map((trip, index) => (
                      <tr key={index} className="border-b border-blue-gray-50">
                        <td className="px-3 py-3 text-sm text-blue-gray-900 lg:sticky lg:left-0 lg:z-10 bg-white min-w-[140px]">{trip.date ? moment(trip.date).format('DD-MM-YYYY') : '-'}</td>
                        <td className="px-3 py-3 text-sm text-black font-semibold lg:sticky lg:left-[140px] lg:z-10 bg-white min-w-[180px]">{trip.bookingId || '-'}</td>
                        <td className="px-3 py-3 text-sm text-blue-gray-900">{trip.tripType || '-'}</td>
                        <td className="px-3 py-3 text-sm text-blue-gray-900">{trip.createDate ? moment(trip.createDate).format('DD-MM-YYYY') : '-'}</td>
                        <td className="px-3 py-3 text-sm text-blue-gray-900">{trip.vehicle || '-'}</td>
                        <td className="px-3 py-3 text-sm text-blue-gray-900">{trip.driver || '-'}</td>
                        <td className="px-3 py-3 text-sm text-blue-gray-900">
                          <textarea
                            rows={3}
                            readOnly
                            value={trip.startPoint || '-'}
                            className="w-56 min-w-[300px] resize-none rounded-md border border-blue-gray-100 bg-blue-gray-50/30 p-2 text-sm text-blue-gray-900"
                          />
                        </td>
                        <td className="px-3 py-3 text-sm text-blue-gray-900">
                          <textarea
                            rows={3}
                            readOnly
                            value={trip.endPoint || '-'}
                            className="w-56 min-w-[300px] resize-none rounded-md border border-blue-gray-100 bg-blue-gray-50/30 p-2 text-sm text-blue-gray-900"
                          />
                        </td>
                        <td className="px-3 py-3 text-sm text-blue-gray-900">{Number(trip?.totalKm ?? 0).toFixed(1)}</td>
                        <td className="px-3 py-3 text-sm text-blue-gray-900">{Number(trip?.toll ?? 0).toFixed(2)}</td>
                        <td className="px-3 py-3 text-sm text-blue-gray-900">{Number(trip?.permit ?? 0).toFixed(2)}</td>
                        <td className="px-3 py-3 text-sm text-blue-gray-900">{Number(trip?.cost ?? 0).toFixed(2)}</td>
                        <td className="px-3 py-3 text-sm text-blue-gray-900">{Number(trip?.fare ?? 0).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
              {trips.length > 0 && (
                <div className="flex items-center justify-center mt-4">
                  <Button
                    size="sm"
                    variant="text"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="mx-1 text-gray-700"
                  >
                    {'<'}
                  </Button>
                  {generatePageButtons()}
                  <Button
                    size="sm"
                    variant="text"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="mx-1 text-gray-700"
                  >
                    {'>'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Reports;
