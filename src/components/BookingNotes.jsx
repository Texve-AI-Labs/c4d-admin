import React, { useState, useEffect } from 'react';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';
import { UserIcon } from '@heroicons/react/24/solid';
import moment from "moment";
import { Typography } from '@material-tailwind/react';

const TextBoxWithList = ({addNotes, notesData, bookingId }) => {
  const [text, setText] = useState('');
  const [noteType, setNoteType] = useState('')
  const [items, setItems] = useState([]);
  const [bookingLogs, setBookingLogs] = useState([]);
  const [bookingFollowupLogs,setBookingFollowupLogs] = useState([]);
     const [quotationLogs, setQuotationLogs] = useState([]);
  const [bookingExtraCharges, setBookingExtraCharges] = useState([]); 
  const [errorMessage, setErrorMessage] = useState('');
  const [tripDetailsLogs, setTripDetailsLogs] = useState([]);
  const [tripFare, setTripFare] = useState(0);
  const [fuelCost, setFuelCost] = useState(0);
  const [tollCost, setTollCost] = useState(0);
  const [permitCost, setPermitCost] = useState(0);
  const [activeTab, setActiveTab] = useState('notes');

  useEffect(() => {
    const fetchNotes = async () => {
      const fallbackNotes = Array.isArray(notesData) ? notesData : [];

      if (!bookingId) {
        console.warn('No bookingId provided, falling back to notesData');
        setItems(fallbackNotes);
        setBookingLogs([]);
        setQuotationLogs([]);
        setBookingFollowupLogs([]);
        return;
      }

      try {
        // console.log('bookingId:', bookingId);
        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_NOTES_BOOKING, { bookingId });
        // console.log('API response:', data);
        if (data?.success) {
          // Set notes, ensuring it's an array
          setItems(Array.isArray(data?.data?.notes) ? data.data.notes : []);
          // Set bookingLogs, ensuring it's an array
          setBookingLogs(Array.isArray(data?.data?.bookingLog) ? data.data.bookingLog : []);
          setQuotationLogs(Array.isArray(data?.data?.quotationLog) ? data?.data?.quotationLog : []);
          setBookingFollowupLogs(Array.isArray(data?.data?.bookingFollowupLog) ? data?.data?.bookingFollowupLog : []);
          setBookingExtraCharges(Array.isArray(data?.data?.bookingExtraCharges) ? data.data.bookingExtraCharges : []);

          const tripMaster = data.data.tripMaster || {};
          setTripFare(tripMaster.tripFare || 0);
          setFuelCost(tripMaster.fuelCost || 0);
          setTollCost(tripMaster.tollCost || 0);
          setPermitCost(tripMaster.permitCost || 0);
          
          // Initialize tripDetailsLogs with user name from tripMaster only if tripMaster exists
          if (tripMaster && Object.keys(tripMaster).length > 0) {
            setTripDetailsLogs([{ 
              id: 1, 
              createdBy: tripMaster?.createdBy?.name || tripMaster?.User?.name || 'System', 
              created_at: new Date().toISOString(), 
              tripFare: tripMaster.tripFare || 0, 
              fuelCost: tripMaster.fuelCost || 0, 
              tollCost: tripMaster.tollCost || 0, 
              permitCost: tripMaster.permitCost || 0 
            }]);
          } else {
            setTripDetailsLogs([]);
          }
        } else {
          console.warn('API call failed, falling back to notesData:', data?.message);
          setItems(fallbackNotes);
          setBookingLogs([]);
          setQuotationLogs([]);
          setTripDetailsLogs([]);
          setBookingFollowupLogs([]);
          setBookingExtraCharges([]);
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        setItems(fallbackNotes);
        setBookingLogs([]);
        setQuotationLogs([]);
        setTripDetailsLogs([]);
        setBookingFollowupLogs([]);
        setBookingExtraCharges([]);
      }
    };

    fetchNotes();
  }, [bookingId, notesData]);

  const handleAddItem = async () => {
    setErrorMessage(''); 
    if (!noteType) {
      setErrorMessage('Please select a note type first');
      return;
    }

    if (!text.trim()) {
      setErrorMessage('Please enter some text');
      return;
    }

    const newItem = {
      notes: text.trim(),
      bookingId: bookingId,
      noteType: noteType,
    };

    try {
      addNotes(newItem)
      setText('');
      setNoteType(''); 
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_NOTES_BOOKING, { bookingId });
      // console.log('API response after adding note:', data);
      if (data?.success) {
        // Set notes, ensuring it's an array
        setItems(Array.isArray(data?.data?.notes) ? data.data.notes : []);
        // Set bookingLogs, ensuring it's an array
        setBookingLogs(Array.isArray(data?.data?.bookingLog) ? data.data.bookingLog : []);
        setQuotationLogs(Array.isArray(data?.data?.quotationLog) ? data?.data?.quotationLog : []);
        setBookingFollowupLogs(Array.isArray(data?.data?.bookingFollowupLog) ? data?.data?.bookingFollowupLog : []);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const tabs = [
    { id: 'notes', label: 'Notes' },
    { id: 'extra', label: 'Extra Booking Charges Log' },
    { id: 'estimates', label: 'Check Estimate Price Log' },
    { id: 'status', label: 'Booking Status Log' },
  ];

  return (
    <div className="flex-1 p-4 bg-gray-100">
      <div className="border-b border-gray-200 mb-6">
        <div className="flex flex-wrap gap-6 text-sm font-medium text-gray-600">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 transition-colors ${activeTab === tab.id ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : 'hover:text-blue-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'notes' && (
        <>
      <div className='pt-2'>
        <label htmlFor="noteType" className="text-sm font-medium text-gray-700">
         Please select a Notes Type
        </label>
        <select
          id="noteType"
          value={noteType}
          onChange={(e) => setNoteType(e.target.value)}
          className="p-2 w-full rounded-md border bg-white border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
        >
          <option value="">Select Note Type</option>
          <option value="ENQUIRY">Enquiry</option>
          <option value="TRIP">Trip</option>
          <option value="PAYMENT">Payment</option>
          <option value="FEEDBACK">Feedback</option>
        </select>
      </div>
      <div className="mb-4 pt-2">
        <textarea
          className="border border-gray-200 rounded-lg p-3 mb-2 bg-white text-base min-h-[60px] w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter text..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {errorMessage && (
          <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
        )}
        <button
          onClick={handleAddItem}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Add Note
        </button>
      </div>

      <div className="flex-1">
        {items.length === 0 ? (
          <p className="text-center text-gray-500 text-base mt-5">No items yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item?.id}
                className="bg-white rounded-lg p-3 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    {item?.User?.name || 'Unknown User'}
                  </span>
                  <span className="text-sm text-gray-500 ml-auto">
                    {moment(item?.created_at).format('DD-MM-YYYY / hh:mm A')}
                  </span>
                </div>
                <p className="text-base text-gray-700">Note Type: 
                  <span className='text-primary-600'>
                      {item?.noteType || 'N/A'}
                  </span>
                  </p>
                <p className="text-base text-gray-700">{item?.notes}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
     {tripDetailsLogs.length > 0 && (
  <>
    <div className='py-5'>
      <Typography className="text-xl font-semibold text-blue-gray-600">
        Trip Details Log
      </Typography>
    </div>
    
    <div className="flex-1">
      {tripDetailsLogs.length > 0 ? (
        <ul className="space-y-3">
          {tripDetailsLogs.map((log) => (
            <li
              key={log?.id}
              className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <UserIcon className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">
                  {log?.createdBy || 'System'}
                </span>
                <span className="text-sm text-gray-500 ml-auto">
                  {moment(log?.created_at).format('DD-MM-YYYY / hh:mm A')}
                </span>
              </div>
              <p className="text-base text-gray-700">
                Trip Fare: ₹{log?.tripFare || '0'} | Fuel Cost: ₹{log?.fuelCost || '0'} | Toll Cost: ₹{log?.tollCost || '0'} | Permit Cost: ₹{log?.permitCost || '0'}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 text-base mt-5">No trip details logs yet.</p>
      )}
    </div>
  </>
)}
        </>
      )}

      {activeTab === 'extra' && (
        <>
      {/* <div className='py-5'>
        <Typography className="text-xl font-semibold text-blue-gray-600">
          Extra Booking Charges Log
        </Typography>
      </div> */}
      <div className="flex-1 mb-5">
        {bookingExtraCharges.length === 0 ? (
          <p className="text-center text-gray-500 text-base mt-5">No extra charges yet.</p>
        ) : (
          <ul className="space-y-3">
            {bookingExtraCharges.map((charge) => (
              <li
                key={charge.id}
                className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    {charge.User?.name || charge.user?.name || 'System'}
                  </span>
                  <span className="text-sm text-gray-500 ml-auto">
                    {moment(charge.created_at).format('DD-MM-YYYY / hh:mm A')}
                  </span>
                </div>
                <div className="text-base text-gray-700 space-y-1 ">
                   {charge.newValues?.permitCharge !== undefined && (
                  <span>
                    <span className="font-bold text-green-700">Permit Charge</span>{' '}
                    Changed from  
                    <span className="font-bold"> ₹{charge.previousValues?.permitCharge ?? 0} </span>
                    To 
                    <span className="font-bold"> ₹{charge.newValues.permitCharge} </span>|
                  </span>
                )} 
                 {charge.newValues?.hillStationCharge !== undefined && (
                  <span>
                    <span className="font-bold text-green-700">Hill Station Charge</span>{' '}
                    Changed from  
                    <span className="font-bold"> ₹{charge.previousValues?.hillStationCharge ?? 0} </span>
                    To 
                    <span className="font-bold"> ₹{charge.newValues.hillStationCharge} </span>|
                  </span>
                )} 


                  {charge.newValues?.tollCharge !== undefined && (
                    <span>
                    <span className="font-bold text-green-700">Toll Charge</span>{' '}
                    Changed from  
                    <span className="font-bold"> ₹{charge.previousValues?.tollCharge ?? 0} </span>
                    To 
                    <span className="font-bold"> ₹{charge.newValues.tollCharge} </span>|
                  </span>
                  )} 
                  {charge.newValues?.parkingCharge !== undefined && (
                   <span>
                    <span className="font-bold text-green-700">Parking Charge</span>{' '}
                    Changed from  
                    <span className="font-bold"> ₹{charge.previousValues?.parkingCharge ?? 0} </span>
                    To 
                    <span className="font-bold"> ₹{charge.newValues.parkingCharge} </span>
                  </span>
                  )} 
                 
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
        </>
      )}

{activeTab === 'estimates' && (
  <>
      {/* <div className='py-5'>
        <Typography className="text-xl font-semibold text-blue-gray-600">
          Check Estimate Price Log
        </Typography>
      </div> */}
      <div className="flex-1 mb-5">
        {quotationLogs.length === 0 ? (
          <p className="text-center text-gray-500">No estimate logs yet.</p>
        ) : (
          <ul className="space-y-3">
            {quotationLogs.map((log) => (
              <li key={log.id} className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    {log?.User?.name || 'System'}
                  </span>
                  <span className="text-sm text-gray-500 ml-auto">
                    {moment(log?.created_at).format('DD-MM-YYYY / hh:mm A')}
                  </span>
                </div>
              <div className="text-base text-gray-700 flex items-center gap-2">
              <span>
              <span className="font-bold">Service Type:</span> {log?.serviceType === 'RENTAL_DROP_TAXI' ? ' Drop Taxi' : log?.serviceType === 'HOURLY_PACKAGE' ? ' Hourly Package' : log?.serviceType === 'OUTSTATION' ? ' Outstation' : log?.serviceType ==='RIDES' ? ' Local Rides' : log?.serviceType === 'DRIVER' ? ' Acting Driver' : log?.serviceType || 'N/A'} |{' '}
                {log?.startDate != null && (
                  <>
              <span className="font-bold">Start Date:</span> {log?.startDate ? moment(log?.startDate).format('DD-MM-YYYY / hh:mm A') : 'N/A'} |{' '}
                  </>
                )}
               {log?.endDate != null && (
                <>
              <span className="font-bold">End Date:</span> {log?.endDate ? moment(log?.endDate).format('DD-MM-YYYY / hh:mm A') : 'N/A'} |{' '}
              </>
               )}
              <span className="font-bold">Pickup:</span> {log?.pickupAddress?.name || 'N/A'} |{' '}
              {log?.dropAddress && Object.keys(log.dropAddress).length > 0 && (
                <>
              <span className="font-bold">Drop:</span> {log?.dropAddress?.name || 'N/A'} |{' '}
                </>
              )}
              <span className="font-bold">Cab Type:</span> {log?.cabType || 'N/A'} |{' '}
              {String(log?.serviceType || '').toUpperCase() === 'PARCEL' && (
                <>
                  <span className="font-bold">Parcel Vehicle Type:</span> {log?.parcelVehicleType || 'N/A'} |{' '}
                  <span className="font-bold">Sub Zone ID:</span> {log?.subZoneId || 0} |{' '}
                  <span className="font-bold">Weight Range:</span> {log?.weightRange || 'N/A'} |{' '}
                  <span className="font-bold">Order Type:</span> {log?.orderType || 'N/A'} |{' '}
                  <span className="font-bold">Order Type Other:</span> {log?.orderTypeOther || 'N/A'} |{' '}
                </>
              )}
              <span className="font-bold">Estimate Price:</span> ₹{log?.amount || 'N/A'} |{' '}
              {log?.adminDiscount && (
                <>
                  <span className="font-bold">Admin Discount Status:</span> {log?.adminDiscount?.status || 'N/A'} |{' '}
                  <span className="font-bold">Admin Discount Type:</span> {log?.adminDiscount?.discountType || 'N/A'} |{' '}
                  <span className="font-bold">Admin Discount Value:</span> {log?.adminDiscount?.discountValue ?? 'N/A'} |{' '}
                  <span className="font-bold">Admin Discount Amount:</span> ₹{log?.adminDiscount?.discountAmount ?? 'N/A'} |{' '}
                  <span className="font-bold">Admin Discount Remarks:</span> {log?.adminDiscount?.remarks || 'N/A'} |{' '}
                  <span className="font-bold">Admin Discount Quote Ref:</span> {log?.adminDiscount?.quoteRef || 'N/A'} |{' '}
                </>
              )}
              {log?.discount > 0 && (
                <>
                  <span className="font-bold">Discount Applied:</span> {log?.discount || 'N/A'}% |{' '}
                  <span className="font-bold">Total Estimate Fare:</span> ₹{log?.discountAmount || 'N/A'} 
                </>
              )}
            
              {/* {log?.packageId && ` | <span className="font-bold">Package ID:</span> ${log?.packageId}`} */}
            </span>
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
    Estimated
  </span>
</div>
              </li>
            ))}
          </ul>
        )}
      </div>
  </>
)}

{activeTab === 'status' && (
  <>
      {/* <div className='py-5'>
        <Typography className="text-xl font-semibold text-blue-gray-600">
          Booking Status Log
        </Typography>
      </div> */}
      <div className="flex-1">
        {bookingLogs.length === 0 && bookingFollowupLogs.length === 0 ? (
          <p className="text-center text-gray-500 text-base mt-5">No activity logs yet.</p>
        ) : (
          <ul className="space-y-3">
            {[...bookingLogs.map((log) => ({ ...log, type: "booking" })),
              ...bookingFollowupLogs.map((log) => ({ ...log, type: "followup" })),
            ]
              .map((log) => (
              <li
                key={`${log.type}-${log.id}`}
                className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    {log.type === "booking"
                        ? log?.createdBy?.name || "System"
                        : log?.followupCreatedBy?.name || "System"}
                  </span>
                  <span className="text-sm text-gray-500 ml-auto">
                    {moment(log?.created_at).format('DD-MM-YYYY / hh:mm A')}
                  </span>
                </div>
                <div className="text-base text-gray-700 flex items-center gap-2">
                  <span>
                {log.type === "booking" ? (
                  <>
                    Customer Trip Status changed from{' '}
                    <span className="font-medium text-primary-600">{
                    log?.old_status === 'BOOKING_ACCEPTED' ? 'DRIVER_ACCEPTED' : log?.old_status || 'N/A'}</span>{' '}
                    to{' '}
                    <span className="font-medium text-green-600">{log?.new_status === 'BOOKING_ACCEPTED' ? 'DRIVER_ACCEPTED' : log?.new_status || 'N/A'}</span>
                        </>
                      ) : (
                        <>
                          Follow-up Status changed from{" "}
                          <span className="font-medium text-primary-600">
                            {log?.previousStatus === "NONE" ? "QUOTED" : log?.previousStatus || "N/A"}
                          </span>{" "}
                          to{" "}
                          <span className="font-medium text-green-600">
                            {log?.newStatus === "NONE" ? "QUOTED" : log?.newStatus || "N/A"}
                          </span>
                  </>
                )}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
  </>
)}
    </div>
  );
};

export default TextBoxWithList;