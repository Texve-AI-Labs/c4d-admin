import React, { useState, useEffect } from "react";
import {
    Card,
    CardBody,
    Typography,
    Button,
    Spinner,
    Select,
    Option,
    Input,
} from "@material-tailwind/react";
import { Formik, Form, Field, ErrorMessage, validateYupSchema } from 'formik';
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ApiRequestUtils } from "../../utils/apiRequestUtils";
import { API_ROUTES, BOOKING_FEATURES, BOOKING_STATUS, BOOKING_TERMS_AND_CONDITIONS } from "../../utils/constants";
import { Utils } from '../../utils/utils';
import 'react-datepicker/dist/react-datepicker.css';
import moment from "moment";
import TextBoxWithList from "@/components/BookingNotes";
import Swal from "sweetalert2";
import { PencilIcon } from "@heroicons/react/24/solid";
import {fetchAdminDiscountStatusSafe,getQuoteRefSafe,normalizeBookingIdSafe,normalizeQuoteRefSafe} from "./utils/confirmBookingSafe";

const ADMIN_PENDING_STATUS = "PENDING";
const ADMIN_EFFECTIVE_STATUSES = ["APPROVED", "AUTO_APPROVED"];

const normalizeBoolean = (value) => {
    if (value === true) return true;
    if (typeof value === "string") return value.trim().toLowerCase() === "true";
    if (typeof value === "number") return value === 1;
    return false;
};

const getSuggestionText = (suggestion) => {
    if (typeof suggestion === 'string') return suggestion;
    if (!suggestion || typeof suggestion !== 'object') return '';
    return suggestion.fullText || suggestion.title || suggestion.subtitle || '';
};

const getSuggestionPlaceId = (suggestion) => {
    if (!suggestion || typeof suggestion !== 'object') return '';
    return suggestion.placeId || suggestion.place_id || suggestion.id || '';
};

const getSuggestionTitle = (suggestion) => {
    if (typeof suggestion === 'string') {
        const [firstPart] = suggestion.split(',');
        return (firstPart || suggestion).trim();
    }
    if (!suggestion || typeof suggestion !== 'object') return '';
    return suggestion.title || suggestion.fullText || '';
};

const makeAddressPayload = (address, placeId) => ({
    address,
    ...(placeId ? { placeId } : {}),
});

const ConfirmBooking = (props) => {
    const [bookingDetails, setBookingDetails] = useState("");
    const [dateVal, setDateVal] = useState();
    const [kms, setKms] = useState();
    const [timeVal, setTimeVal] = useState();
    const [amount, setAmount] = useState({
        price: 0,
        extraPrice: 0,
        total: 0,
        extraHours: 0,
        extraHourPrice: 0,
        extraKMs: 0,
        extraKMPrice: 0,
        extraNightCharge: 0,
        extraNightChargePrice: 0,
    });
    const [customerFeedback, setCustomerFeedback] = useState();
    const [driverFeedback, setDriverFeedback] = useState();
    const [showDetails, setShowDetails] = useState(true);
    const [finalPaymentPirces, setFinalPaymentPrices] = useState({});
    const [isEditingDriverEnd, setIsEditingDriverEnd] = useState(false);
    const [driverEndAddress, setDriverEndAddress] = useState("");
    const [driverEndPlaceId, setDriverEndPlaceId] = useState("");
    const [driverEndSuggestions, setDriverEndSuggestions] = useState([]);
    const [selectedDriverEndLocation, setSelectedDriverEndLocation] = useState(null);
    const [isEditingAdditionalCharges, setIsEditingAdditionalCharges] = useState(false);
    const [additionalPaymentDetails, setAdditionalPaymentDetails] = useState({
        tripType: "",
        tollCost: "",
        permitCost: "",
        fuelCost: "",
        fuelType: "",
        tripFare: "",
        notes: "",
    });
    const [additionalCharges, setAdditionalCharges] = useState({
        permit: 0,
        toll: 0,
        parking: 0,
        hill: 0,
        });

    const [paymentDetails, setPaymentDetails] = useState({
        paymentCollected: "",
        paymentMethod: "",
        paymentStatus: "NOT PAID",
        enable: false // Default value
    });
    const { hideBackButton = false } = props;

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const stateParams = location.state || {};
    const queryBookingId = normalizeBookingIdSafe(searchParams.get("bookingId"));
    const queryCustomerId = searchParams.get("customerId");
    const queryFromPath = searchParams.get("fromPath");
    const queryQuoteRef = searchParams.get("quoteRef");
    const paramsPassed = {
        ...stateParams,
        bookingId: queryBookingId || normalizeBookingIdSafe(stateParams?.bookingId),
        customerId: queryCustomerId ?? stateParams?.customerId,
        fromPath: queryFromPath ?? stateParams?.fromPath,
        quoteRef: normalizeQuoteRefSafe(queryQuoteRef) || normalizeQuoteRefSafe(stateParams?.quoteRef),
    };

    const [loading, setLoading] = useState(true);
    const [adminStatusRefreshing, setAdminStatusRefreshing] = useState(false);
    const [adminDiscountMeta, setAdminDiscountMeta] = useState(null);
    const audioUrl = bookingDetails?.deliveryDetails?.deliveryInstructionsAudioUrl;

    // Handler to update state
    const handleChange = (field, value) => {
        setPaymentDetails((prev) => ({ ...prev, [field]: value }));
    };

    // Handler for additional payment details
    const handleAdditionalChange = (field, value) => {
        setAdditionalPaymentDetails((prev) => ({ ...prev, [field]: value }));
    };
    const hasOnConfirm = typeof props?.onConfirm === "function";
    const hasSetIsOpen = typeof props?.setIsOpen === "function";
    const hasOnEdit = typeof props?.onEdit === "function";
    const hasOnAssignDriver = typeof props?.onAssignDriver === "function";
    const fromPath = paramsPassed?.fromPath;
    const backPath = fromPath || "/dashboard/booking";
    const triggerParentRefresh = () => {
        if (hasOnConfirm) {
            props.onConfirm();
        }
    };
    const closeOrNavigateBack = () => {
        if (hasSetIsOpen) {
            props.setIsOpen(false);
        } else {
            navigate(backPath);
        }
    };
    const handleEditAction = (booking) => {
        if (!booking?.id) return;

        if (hasOnEdit) {
            props.onEdit(booking);
        } else {
            navigate(backPath, {
                state: {
                    ...(location.state || {}),
                    editBooking: booking,
                },
            });
        }
    };
    const handleAssignDriverAction = (booking) => {
        if (hasOnAssignDriver) {
            props.onAssignDriver(booking);
        }
    };
    // const renderStatusBadge = (status) => {
    //     const statusLower = status?.toLowerCase();
    //     switch (statusLower) {
    //         case 'started':
    //             return (
    //                 <span className="mx-3 px-2 py-1 text-white bg-primary rounded-md text-sm font-medium">
    //                     On Trip
    //                 </span>
    //             );
    //         case 'ended':
    //             if (bookingDetails?.tripStatus === true) {
    //                 return (
    //                     <span className="mx-3 px-2 py-1 text-white bg-green-600 rounded-md text-sm font-medium">
    //                         Completed
    //                     </span>
    //                 );
    //             }
    //             return (
    //                 <span className="mx-3 px-2 py-1 text-white bg-green-600 rounded-md text-sm font-medium">
    //                     ENDED
    //                 </span>
    //             );
    //         case 'customer_cancelled':
    //             return (
    //                 <span className="mx-3 px-2 py-1 text-white bg-gray-600 rounded-md text-sm font-medium">
    //                     Cancelled
    //                 </span>
    //             );
    //         case 'cancelled':
    //             return (
    //                 <span className="mx-3 px-2 py-1 text-white bg-primary rounded-md text-sm font-medium">
    //                     Customer Cancelled
    //                 </span>
    //             );
    //         case 'initiated':
    //             if (bookingDetails?.Driver?.id || bookingDetails?.Cab?.id) {
    //                 return (
    //                     <span className="mx-3 px-2 py-1 text-white bg-gray-600 rounded-md text-sm font-medium">
    //                         Booked
    //                     </span>
    //                 );
    //             }
    //             return null;
    //         case 'quoted':
    //             return (
    //                 <span className="mx-3 px-2 py-1 text-white bg-yellow-600 rounded-md text-sm font-medium">
    //                     QUOTED
    //                 </span>
    //             );
    //         case 'confirmed':
    //             return (
    //                 <span className="mx-3 px-2 py-1 text-white bg-green-600 rounded-md text-sm font-medium">
    //                     CONFIRMED
    //                 </span>
    //             );
    //         case 'request_driver':
    //             return (
    //                 <span className="mx-3 px-2 py-1 text-white bg-orange-600 rounded-md text-sm font-medium">
    //                     REQUEST DRIVER
    //                 </span>
    //             );
    //         case 'booking_accepted':
    //             return (
    //                 <span className="mx-3 px-2 py-1 text-white bg-green-600 rounded-md text-sm font-medium">
    //                     DRIVER ACCEPTED
    //                 </span>
    //             );
    //         case 'end_otp':
    //             return (
    //                 <span className="mx-3 px-2 py-1 text-white bg-gray-600 rounded-md text-sm font-medium">
    //                     END OTP
    //                 </span>
    //             );
    //         case 'driver_on_the_way':
    //             return (
    //                 <span className="mx-3 px-2 py-1 text-white bg-primary rounded-md text-sm font-medium">
    //                     DRIVER ON THE WAY
    //                 </span>
    //             );
    //         case 'driver_reached':
    //             return (
    //                 <span className="mx-3 px-2 py-1 text-white bg-yellow-600 rounded-md text-sm font-medium">
    //                     DRIVER REACHED
    //                 </span>
    //             );
    //         case 'payment_requested':
    //             return (
    //                 <span className="mx-3 px-2 py-1 text-white bg-green-600 rounded-md text-sm font-medium">
    //                     PAYMENT REQUESTED
    //                 </span>
    //             );
    //         case 'support_cancelled':
    //             return (
    //                 <span className="mx-3 px-2 py-1 text-white bg-primary rounded-md text-sm font-medium">
    //                     SUPPORT CANCELLED
    //                 </span>
    //             );
    //         default:
    //             return null;
    //     }
    // };
    const getServiceTypeLabel = () => {
        if (bookingDetails?.serviceType === 'DRIVER') {return bookingDetails?.bookingType? `ACTING DRIVER - ${bookingDetails.bookingType}` : 'ACTING DRIVER';}
        if (bookingDetails?.serviceType === 'RIDES') return 'Local Rides';
        if (bookingDetails?.packageType === 'Local') return 'Hourly Package';
        if (bookingDetails?.serviceType === 'RENTAL' && bookingDetails?.bookingType === 'DROP ONLY') return 'Drop Taxi';
        if (bookingDetails?.serviceType === 'AUTO') return 'Auto';
        if (bookingDetails?.serviceType === 'PARCEL') {
            const parcelVehicleTypeLabel = bookingDetails?.parcelVehicleType === 'AUTO' ? 'Auto' : bookingDetails?.parcelVehicleType === 'BIKE' ? 'Bike' : '';
            return parcelVehicleTypeLabel ? `Parcel - ${parcelVehicleTypeLabel}` : 'Parcel';
        }
        return 'Outstation';
    };
    const formatStatus = (status = '') => {
         if (status === 'BOOKING_ACCEPTED') {
                return 'Driver Accepted';
            }
 

        if (status === 'ENDED' &&  bookingDetails?.tripStatus === true) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold">
                    Completed
                </span>
            );
        }
        return status
            .toLowerCase()
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };
      const minsToHHMM = (totalMins)=> {
        const hrs = Math.floor(totalMins / 60);
        const mins = Math.round(totalMins % 60);          // round to nearest minute
        return `${hrs} hrs : ${mins.toString().padStart(2, "0")} mins`;
        };
    const getTotalDurationMinutes = (startTime, endTime) => {
        if (!startTime || !endTime) return null;

        const start = moment(startTime);
        const end = moment(endTime);

        if (!start.isValid() || !end.isValid() || !end.isAfter(start)) {
            return null;
        }

        const duration = moment.duration(end.diff(start));
        return Math.round(duration.asMinutes());
    };
    const onConfirmPressHandler = async () => {
        setLoading(true);
        let dateTime = dateVal + " " + timeVal;
        const reqBody = {
            bookingId: bookingDetails?.id,
            id: bookingDetails?.serviceType == "CAB" ? bookingDetails?.Cab?.id : bookingDetails?.Driver?.id,
            bookingType: bookingDetails?.serviceType,
            date: moment(dateTime).format("YYYY-MM-DD HH:mm:ss.SSSZ"),
            amount: 0,
            extraHours: 0,
            price: 0,
            extraPrice: 0,
            extraHourPrice: 0,
            kilometer: bookingDetails?.serviceType !== "CAR_WASH" ? kms : 0,
            
        };
        if (bookingDetails.status == BOOKING_STATUS.INITIATED || bookingDetails.status === 'BOOKING_ACCEPTED') {
            reqBody.type = "start";
        } else if (bookingDetails.status == BOOKING_STATUS.STARTED) {
            reqBody.type = "end";
            if (amount?.total) {
                reqBody.amount = amount?.total;
                reqBody.extraHours = amount?.extraHours;
                reqBody.price = amount?.price;
                reqBody.extraPrice = amount?.extraPrice;
                reqBody.extraHourPrice = amount?.extraHourPrice;
                reqBody.extraKMs = amount?.extraKMs;
                reqBody.extraKMPrice = amount?.extraKMPrice;
                reqBody.extraNightCharge = amount?.extraNightCharge;
                reqBody.extraNightChargePrice = amount?.extraNightChargePrice;
                reqBody.totalPrice = amount?.total;
                reqBody.totalDistance = amount?.totalKM;
                reqBody.paymentCollected = paymentDetails?.paymentCollected;
                reqBody.paymentMethod = paymentDetails?.paymentMethod;
                reqBody.paymentStatus = paymentDetails?.paymentStatus;
                reqBody.endKM = kms;
            } else {
                alert("Please check price before end the trip");
                setLoading(false);
                return false;
            }
        }
        const data = await ApiRequestUtils.update(API_ROUTES.ADMIN_BOOKING_STATUS, reqBody, bookingDetails?.customerId);
        // console.log("CONFIRM BOOKING", data);
        if (data?.success) {
            //navigate("/dashboard/booking");
            triggerParentRefresh();
            setLoading(false);
        }
    };
    const buildAmountSummary = (booking = {}, overrideTotal = 0) => {
        const extraHours = Number(booking?.extraHours) || 0;
        const extraHourPrice = Number(booking?.extraHourPrice) || 0;

        return {
            price: Number(booking?.price) || 0,
            extraPrice: booking?.extraPrice !== undefined ? Number(booking?.extraPrice) || 0 : extraHours * extraHourPrice,
            total: Number(booking?.endPayment || booking?.totalPrice || overrideTotal) || 0,
            extraHours,
            extraHourPrice,
            extraKMs: Number(booking?.extraKMs) || 0,
            extraKMPrice: Number(booking?.extraKMPrice) || 0,
            extraNightCharge: Number(booking?.extraNightCharge) || 0,
            extraNightChargePrice: Number(booking?.extraNightChargePrice) || 0,
        };
    };
    const getBookingById = async (bookingId, customerId) => {
        setLoading(true);
        try {
        const data = await ApiRequestUtils.get(API_ROUTES.GET_CONFIRMATION_BOOKING_BY_ID + "/" + bookingId, customerId);
        // console.log("BOOKING DATA", data);
        if (data?.success) {
                let bookingPayload = {...data?.data, estimatedPrice: data?.estimatedPrice, discount: data?.discount,notesData: data?.notes,landmark: data?.data?.landmark,customerBookingCount: data?.customerBookingCount, lastBookingCreatedAt: data?.lastBookingCreatedAt};
            if(data?.data?.status === BOOKING_STATUS.END_OTP){
                    try {
                const finalPrice = await ApiRequestUtils.get(API_ROUTES.GET_BOOKINGDETAILS_FINAL_PAYMENT + bookingId);
                        const bookingPaymentDetails = finalPrice?.data?.bookingDetails;
                        const gstDetails = finalPrice?.data?.gstDetails;
                        const gstSummary = gstDetails?.details;
                setFinalPaymentPrices({
                    amountAfterGST: gstSummary?.amountAfterGst || 0,
                    customerWalledUsed: gstSummary?.walletAmountUsed || 0,
                    driverWalletAdded: Number(gstSummary?.walletAmountUsed || 0) + Number(gstSummary?.discountAmount || 0),
                    discountAmount: gstSummary?.discountAmount || 0,
                    amountBeforeGst:gstSummary?.amountBeforeGst || 0,
                        });
                        if (bookingPaymentDetails) {
                            bookingPayload = {...bookingPayload,...bookingPaymentDetails};
                        }
                        if (gstDetails) {
                            bookingPayload.paymentDetails = gstDetails;
                        }
                        
                        setAmount(buildAmountSummary(bookingPaymentDetails || bookingPayload, gstSummary?.amountAfterGst || 0));
                    } catch (err) {
                        console.error("Error fetching final payment details:", err);
                        setAmount(buildAmountSummary(bookingPayload));
                    }
                } else if (bookingPayload?.status == BOOKING_STATUS.ENDED || bookingPayload?.status == BOOKING_STATUS.PAYMENT_REQUESTED) {
                    setAmount(buildAmountSummary(bookingPayload));
                setCustomerFeedback({
                    rating: bookingPayload?.CustomerFeedbacks?.[0]?.rating,
                    comment: bookingPayload?.CustomerFeedbacks?.[0]?.comments,

                });

                setDriverFeedback({
                    rating: bookingPayload?.Feedbacks?.[0]?.rating,
                    comment: bookingPayload?.Feedbacks?.[0]?.message,
                });
                setPaymentDetails({
                    paymentCollected: bookingPayload?.paymentCollected,
                    paymentMethod: bookingPayload?.paymentMethod,
                    paymentStatus: bookingPayload?.paymentStatus,
                    enable: true
                })
            } else {
                setAmount();
            }
                setBookingDetails({
                    ...bookingPayload,
                    quoteRef: normalizeQuoteRefSafe(bookingPayload?.quoteRef) || paramsPassed?.quoteRef || "",
                });
            }
        } catch (err) {
            console.error("Error fetching booking data:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
    if (bookingDetails?.extraCharges) {
        setAdditionalCharges({
            permit: Number(bookingDetails.extraCharges.permitCharge) || 0,
            toll: Number(bookingDetails.extraCharges.tollCharge) || 0,
            parking: Number(bookingDetails.extraCharges.parkingCharge) || 0,
            hill: Number(bookingDetails.extraCharges.hillStationCharge

            ) || 0,
        });
    }
}, [bookingDetails?.extraCharges]);
    const getPriceForBooking = async () => {
        if (bookingDetails?.status == BOOKING_STATUS.STARTED && dateVal && timeVal) {
            //const date = moment(dateVal).format("YYYY-MM-DD HH:mm:ss.SSSZ");
            setLoading(true);
            let dateTime = dateVal + " " + timeVal;
            //console.log(dateTime, "dateTime");
            const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.ADMIN_BOOKING_PRICE, {
                bookingId: bookingDetails?.id,
                id: bookingDetails?.serviceType == "CAB" ? bookingDetails?.Cab?.id : bookingDetails?.Driver?.id,
                date: moment(dateTime).format("YYYY-MM-DD HH:mm:ss.SSSZ"),
                bookingType: bookingDetails?.serviceType,
                kilometer: kms ? kms : 0
            });
            // console.log("PRICE DATA", data);
            if (data?.success) {
                setAmount(data?.data);
                handleChange('enable', true);
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        if (paramsPassed?.bookingId) {
            getBookingById(paramsPassed?.bookingId, paramsPassed?.customerId);
        }

    }, []);
    useEffect(() => {
  if (isEditingDriverEnd) {
    setDriverEndAddress("");                
    setDriverEndSuggestions([]);
  }
}, [isEditingDriverEnd]);

    useEffect(() => {
        if (props.bookingData) {
            getBookingById(props.bookingData.id, props.bookingData.customerId);
        }
        if(props?.hideAllNewButton){
            setShowDetails(false);

        }
    }, [props.bookingData]);

    const onBackPressHandler = async () => {
        triggerParentRefresh();
        closeOrNavigateBack();
    };

    const [showCancelReason, setShowCancelReason] = useState(false);
    const [cancelData, setCancelData] = useState({
        cancelReason: "",
        customReason: "",
        cancelBy: "",
        cancelCharge: "",
    });

    const handleCancelChange = (e) => {
        const { name, value } = e.target;
        setCancelData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    const searchDriverEndLocations = async (query) => {
  if (query.length < 3) {
    setDriverEndSuggestions([]);
    return;
  }
  try {
    const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, { address: query });
    if (data?.success && data?.data) {
      setDriverEndSuggestions(data.data);
    } else {
      setDriverEndSuggestions([]);
    }
  } catch (err) {
    console.error("Error searching driver end location:", err);
    setDriverEndSuggestions([]);
  }
};

const handleSelectDriverEndLocation = async (address,placeId) => {
  try {
    const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_LATLONG, { address,placeId });
    if (data?.success) {
      setDriverEndAddress(address);
      setDriverEndPlaceId(placeId || "");
      setSelectedDriverEndLocation({ lat: data.data.lat, lng: data.data.lng });
      setDriverEndSuggestions([]);
    }
  } catch (err) {
    console.error("Error getting lat/long:", err);
    Swal.fire({
    icon: "error",
    title: "Error",
    text: "Could not get location coordinates",
    timer: 1500,
  });
  }
};

const handleSaveDriverEndLocation = async () => {
  if (!selectedDriverEndLocation) {

    Swal.fire({
    icon: "error",
    title: "Error",
    text: "Please select a valid location",
    timer: 1500,
  });
    return;
  }

  setLoading(true);
  try {
    const payload = {
      bookingId: bookingDetails.id,
      driverEndLat: selectedDriverEndLocation.lat,
      driverEndLong: selectedDriverEndLocation.lng,
      ...(driverEndPlaceId ? { driverEndPlaceId } : {}),
    };

    const response = await ApiRequestUtils.update(API_ROUTES.UPDATE_DRIVER_END_LOCATION, payload);

    if (response?.success) {
    
   Swal.fire({
//   icon: "success",
  title: "Success",
  text: "The price and total kilometers will be updated when the trip ends.",
  width: 450,
  confirmButtonColor: "#1976d2" 
});

      setIsEditingDriverEnd(false);
      setDriverEndAddress("");
      setDriverEndPlaceId("");
      setSelectedDriverEndLocation(null);
      // Refresh booking details
      getBookingById(bookingDetails.id, bookingDetails.customerId);
    } else {
      
      Swal.fire({
    icon: "error",
    title: "Error",
    text: response?.message || "Failed to update",
    timer: 1500,
  });
    }
  } catch (err) {
    console.error(err);
    
    Swal.fire({
    icon: "error",
    title: "Error",
    text: "Something went wrong!",
    timer: 1500,
  });
  } finally {
    setLoading(false);
  }
};
    const handleRecalculateAndSaveExtraCharges = async () => {
    // Prevent if no changes or booking ended already
    if (!bookingDetails?.id) return;

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || "{}");
    const userId = loggedInUser?.id || null;

    const payload = {
        bookingId: bookingDetails.id,
        tollCharge: Number(additionalCharges.toll) || 0,
        parkingCharge: Number(additionalCharges.parking) || 0,
        permitCharge: Number(additionalCharges.permit) || 0,
        hillStationCharge: Number(additionalCharges.hill) || 0,
        userId: userId,
    };

    try {
        setLoading(true);
        const response = await ApiRequestUtils.update(API_ROUTES.UPDATE_EXTRA_CHARGES, payload);
        
        if (response?.success) {
            Swal.fire({
                icon: "success",
                title: "Additional charges updated successfully!",
                timer: 1500,
                showConfirmButton: false
            });
            getBookingById(bookingDetails.id, bookingDetails.customerId);
        } else {
            
              Swal.fire({
                icon: "error",
                title: response?.message || "Failed to update charges",
                timer: 1500,
                
            });
        }
    } catch (err) {
        console.error("Error updating extra charges:", err);
    } finally {
        setLoading(false);
    }
};

    const handleBookingAction = async (actionType) => {
        if (actionType === BOOKING_STATUS.CANCELLED && !cancelData.cancelReason.trim()) return;

        const reqBody = {
            status: actionType,
            bookingId: normalizeBookingIdSafe(bookingDetails?.id)
                ? Number(normalizeBookingIdSafe(bookingDetails?.id))
                : undefined,
            quoteRef:
                bookingDetails?.quoteRef ||
                visibleAdminDiscount?.quoteRef ||
                paramsPassed?.quoteRef ||
                undefined,
            ...(actionType === BOOKING_STATUS.CANCELLED && {
                cancelReason: cancelData.cancelReason,
                ...(cancelData.cancelReason === "Other Reason" &&
      cancelData.cancelReason?.trim() && {
        customReason: cancelData.customReason || null,
      }),

                cancelRequestedBy: cancelData.cancelBy,
                isCancelChargeApplicable: cancelData.cancelCharge,
            }),
        };
        const data = await ApiRequestUtils.update(
            actionType === BOOKING_STATUS.CANCELLED
                ? API_ROUTES.CANCEL_ADMIN_BOOKING
                : API_ROUTES.CONFIRM_ADMIN_BOOKING,
            reqBody
        );
        // console.log("CANCELBOKING", data);

        if (data?.success) {
            triggerParentRefresh();
            closeOrNavigateBack();
        }
    };
    const baseTripFare = Number(bookingDetails?.paymentDetails?.details?.amountAfterGst || 0);
    const discountBreakdown = bookingDetails?.paymentDetails?.discountBreakdown || {};
    const paymentAdminDiscount = bookingDetails?.paymentDetails?.adminDiscount || {};
    const visibleAdminDiscount = BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW
        ? (
            bookingDetails?.paymentDetails?.adminDiscount ||
            bookingDetails?.adminDiscount ||
            adminDiscountMeta ||
            {}
        )
        : {};
    const visibleQuoteRef = bookingDetails?.quoteRef || paramsPassed?.quoteRef || "";
    const visibleAdminDiscountStatus = String(visibleAdminDiscount?.status || "").toUpperCase();
    const adminDiscountStatus = visibleAdminDiscountStatus;
    const adminDiscountEffective = ADMIN_EFFECTIVE_STATUSES.includes(adminDiscountStatus);
    const isAdminDiscountPending = visibleAdminDiscountStatus === ADMIN_PENDING_STATUS;
    const requiresSuperUserApproval = normalizeBoolean(visibleAdminDiscount?.requiresApproval) === true;
    const quoteEstimatedPrice = (() => {
        if (bookingDetails?.packageType === "Local") {
            const carType = String(bookingDetails?.carType || "").toUpperCase();
            if (bookingDetails?.serviceType === "RENTAL") {
                return Number(
                    carType === "MINI"
                        ? bookingDetails?.Package?.price
                        : carType === "SUV"
                            ? bookingDetails?.Package?.priceSuv
                            : carType === "MUV"
                                ? bookingDetails?.Package?.priceMVP
                                : carType === "SEDAN"
                                    ? bookingDetails?.Package?.priceSedan
                                    : bookingDetails?.Package?.price || 0
                );
            }
            if (bookingDetails?.serviceType === "DRIVER") {
                return Number(
                    carType === "MUV"
                        ? bookingDetails?.Package?.priceMVP
                        : bookingDetails?.Package?.price || 0
                );
            }
        }
        return Number(bookingDetails?.paymentDetails?.details?.amountBeforeGst || 0);
    })();
    const systemDiscountAmount = Number(bookingDetails?.discount?.amount || 0) > 0
        ? Number(bookingDetails?.discount?.amount || 0)
        : quoteEstimatedPrice * (Number(bookingDetails?.discount?.percentage || 0) / 100);
    const systemDiscountType = String(bookingDetails?.discount?.discountType || "").toUpperCase() ||
        (Number(bookingDetails?.discount?.amount || 0) > 0 ? "AMOUNT" : "PERCENTAGE");
    const systemDiscountValue = Number(bookingDetails?.discount?.amount || 0) > 0
        ? Number(bookingDetails?.discount?.amount || 0)
        : Number(bookingDetails?.discount?.percentage || 0);
    const totalEstimatedFareAfterSystemDiscount = quoteEstimatedPrice - systemDiscountAmount;
    const visibleAdminDiscountType = String(visibleAdminDiscount?.discountType || "").toUpperCase();
    const visibleAdminDiscountValue = Number(visibleAdminDiscount?.discountValue || 0);
    const visibleAdminDiscountAmount = Number(visibleAdminDiscount?.discountAmount || 0);
    const adminDiscountAmountOnQuoteTotal = visibleAdminDiscountType === "PERCENTAGE"
        ? (visibleAdminDiscountAmount > 0
            ? visibleAdminDiscountAmount
            : totalEstimatedFareAfterSystemDiscount * (visibleAdminDiscountValue / 100))
        : Number(visibleAdminDiscount?.discountAmount || 0);
    const finalEstimatedFareAfterAdminDiscount = Math.max(
        0,
        totalEstimatedFareAfterSystemDiscount - adminDiscountAmountOnQuoteTotal
    );
    const finalEstimatedFareDisplay = Number.isFinite(finalEstimatedFareAfterAdminDiscount)
        ? finalEstimatedFareAfterAdminDiscount
        : totalEstimatedFareAfterSystemDiscount;
    const quoteCancelChargeAmount = Number(bookingDetails?.cancelCharge ?? bookingDetails?.paymentDetails?.details?.cancelCharge ?? 0);
    const quoteCancelChargePaid = bookingDetails?.cancelChargePaid === true;
    const quoteCancelChargeApplicable = quoteCancelChargeAmount > 0;
    // Keep existing discount math intact; apply cancel charge only as the final step.
    const hasNormalDiscount = systemDiscountAmount > 0;
    const hasEffectiveAdminDiscount =
        BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && adminDiscountEffective && (visibleAdminDiscountValue > 0 || visibleAdminDiscountAmount > 0);
    const finalTotalLabel = hasNormalDiscount || hasEffectiveAdminDiscount
        ? (quoteCancelChargeApplicable ? "Final Total (After Discounts + Cancel Charge):" : "Final Total (After Discounts):")
        : (quoteCancelChargeApplicable ? "Final Total (After Cancel Charge):" : "Final Total:");
    const finalEstimatedFareAfterDiscounts =
        BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && adminDiscountEffective && (visibleAdminDiscountValue > 0 || visibleAdminDiscountAmount > 0)
            ? finalEstimatedFareAfterAdminDiscount
            : totalEstimatedFareAfterSystemDiscount;
    const finalEstimatedFareAfterDiscountsWithCancelCharge =
        finalEstimatedFareAfterDiscounts + quoteCancelChargeAmount;
        //hidden swal.fire
    // const lastAdminStatusToastKeyRef = React.useRef("");
    // const shouldShowAdminDiscountStatusToast =
    //     [BOOKING_STATUS.QUOTED, BOOKING_STATUS.CONFIRMED].includes(bookingDetails?.status);

    const fetchAdminDiscountStatus = async ({ silent = false } = {}) => {
        if (!BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW) return;
        const quoteRef = getQuoteRefSafe(bookingDetails, paramsPassed);
        const bookingId = normalizeBookingIdSafe(bookingDetails?.id || paramsPassed?.bookingId);
        if (!quoteRef && !bookingId) {
            if (!silent) {
                Swal.fire({
                    icon: "warning",
                    title: "Quote reference is missing for status refresh.",
                });
            }
            return;
        }

        try {
            setAdminStatusRefreshing(true);
            const latest = await fetchAdminDiscountStatusSafe({ quoteRef, bookingId });
            const latestStatus = String(latest?.status || "").toUpperCase();
            if (latest && latestStatus) {
                setAdminDiscountMeta(latest);
                setBookingDetails((prev) => ({
                    ...prev,
                    paymentDetails: {
                        ...(prev?.paymentDetails || {}),
                        adminDiscount: {
                            ...(prev?.paymentDetails?.adminDiscount || {}),
                            ...latest,
                            id: latest?.id || latest?.discountId || prev?.paymentDetails?.adminDiscount?.id,
                            status: latestStatus,
                        },
                    },
                }));
            }

            // Intentionally suppress admin discount status toast.
            // if (shouldShowAdminDiscountStatusToast && latestStatus && latestStatus !== visibleAdminDiscountStatus) {
            //     const statusKey = `${quoteRef || bookingId}:${latestStatus}`;
            //     if (lastAdminStatusToastKeyRef.current !== statusKey) {
            //         lastAdminStatusToastKeyRef.current = statusKey;
            //         Swal.fire({
            //             toast: true,
            //             position: "top-end",
            //             icon: ADMIN_EFFECTIVE_STATUSES.includes(latestStatus) ? "success" : latestStatus === "REJECTED" ? "error" : "info",
            //             title: `Admin discount status: ${latestStatus}`,
            //             showConfirmButton: false,
            //             timer: 1800,
            //         });
            //     }
            // }
        } catch (err) {
            console.error("Failed to refresh admin discount status:", err);
            if (!silent) {
                Swal.fire({
                    icon: "error",
                    title: "Failed to refresh admin discount status.",
                });
            }
        } finally {
            setAdminStatusRefreshing(false);
        }
    };
    const handleRefreshAdminDiscountStatus = async () => {
        await fetchAdminDiscountStatus();
    };

    useEffect(() => {
        if (!BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW) return;
        const quoteRef = bookingDetails?.quoteRef || paramsPassed?.quoteRef;
        const bookingId = bookingDetails?.id || paramsPassed?.bookingId;
        const hasVisibleStatus =
            String(bookingDetails?.paymentDetails?.adminDiscount?.status || "").trim() ||
            String(bookingDetails?.adminDiscount?.status || "").trim() ||
            String(adminDiscountMeta?.status || "").trim();
        if ((quoteRef || bookingId) && !hasVisibleStatus) {
            fetchAdminDiscountStatus({ silent: true });
        }
    }, [bookingDetails?.quoteRef, bookingDetails?.id]);
    const cancelTripFare = Number(bookingDetails?.paymentDetails?.details?.cancelCharge || 0);
    const gstAmount = Number(
        bookingDetails?.paymentDetails?.details?.gstAmount ??
        bookingDetails?.value?.gst_amount ??
        0
    );
    const inclTaxLabel = gstAmount > 0 ? " (Incl Tax)" : "";
    const premiumDetailsSource =
        bookingDetails?.premiumDetails ||
        bookingDetails?.value?.premiumDetails ||
        bookingDetails?.estimatedFareBreakdown?.premiumDetails ||
        {};
    const premiumFareCandidate = Number(
        premiumDetailsSource?.premiumFare ??
        bookingDetails?.premiumFare ??
        bookingDetails?.value?.premiumFare ??
        0
    );
    const normalPriceCandidate = Number(
        bookingDetails?.normalPrice ??
        bookingDetails?.value?.normalPrice ??
        bookingDetails?.estimatedFareBreakdown?.normalPrice ??
        bookingDetails?.value?.estimatedPrice ??
        bookingDetails?.estimatedFareBreakdown?.total ??
        0
    );
    const explicitPremiumSurcharge = Number(premiumDetailsSource?.surcharge || 0);
    const isPremiumBooking =
        normalizeBoolean(bookingDetails?.isPremiumService) ||
        normalizeBoolean(bookingDetails?.isPremiumFare) ||
        normalizeBoolean(bookingDetails?.value?.isPremiumService) ||
        normalizeBoolean(bookingDetails?.value?.isPremiumFare) ||
        explicitPremiumSurcharge > 0 ||
        premiumFareCandidate > 0;
    const isNearlyEqual = (a, b) => Math.abs(Number(a || 0) - Number(b || 0)) < 0.01;
    const isPeakHour = bookingDetails?.estimatedFareBreakdown?.isPeakHour === true;
    const getSafePremiumEstimatedPrice = (baseValue) => {
        const base = Number(baseValue || 0);
        if (!isPremiumBooking) return base;

        // Authoritative premium value from backend.
        if (premiumFareCandidate > 0) return premiumFareCandidate;

        // Only add surcharge if the current base clearly looks like non-premium.
        if (explicitPremiumSurcharge > 0 && normalPriceCandidate > 0 && isNearlyEqual(base, normalPriceCandidate)) {
            return base + explicitPremiumSurcharge;
        }

        return base;
    };


const totalExtraCharges = 
    Number(additionalCharges.permit || 0) +
    Number(additionalCharges.toll || 0) +
    Number(additionalCharges.parking || 0) +
    Number(additionalCharges.hill || 0);
    // const taxAmount = Number(bookingDetails?.paymentDetails?.details?.gstAmount || 0);

const finalAmountAfterExtras = baseTripFare + totalExtraCharges;
const hasAdditionalCharges = Object.values(additionalCharges || {}).some((value) => Number(value) > 0);
    const contextBooking = props?.bookingData || bookingDetails;
    const contextServiceType = contextBooking?.serviceType;
    const contextBookingId = contextBooking?.id || paramsPassed?.bookingId;
    const contextCustomerId = contextBooking?.customerId || paramsPassed?.customerId || bookingDetails?.customerId;

    const refreshCurrentBookingData = () => {
        if (contextBookingId && contextCustomerId) {
            getBookingById(contextBookingId, contextCustomerId);
        }
    };

    const addNotes = async (text) => {
        setLoading(true);
        if (!contextBookingId) {
            setLoading(false);
            return;
        }
        text.bookingId = contextBookingId;
        const response = await ApiRequestUtils.post(API_ROUTES.ADD_NOTES_BOOKING, text);
        if (response?.success) {
            refreshCurrentBookingData();
        }
    };
     const LandMarkNotes = async (text) => {
        setLoading(true);
        if (!contextBookingId) {
            setLoading(false);
            return;
        }
        text.bookingId = contextBookingId;
        const response = await ApiRequestUtils.update(API_ROUTES.UPDATE_LANDMARK, text);
        if (response?.success) {
            refreshCurrentBookingData();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

        const convertTo12HourFormat = (time24) => {
        if (!time24) return '';

        const [hours, minutes] = time24.split(':');
        let hour = parseInt(hours, 10);
        const minute = minutes || '00';
        const period = hour >= 12 ? 'PM' : 'AM';

        hour = hour % 12;
        hour = hour === 0 ? 12 : hour;

        return `${hour}:${minute} ${period}`;
    };

    const bookingTimes = Utils.generateBookingTimesForDay(moment().add(1, 'days'));
    const shouldShowReceipt = bookingDetails && (bookingDetails.status === BOOKING_STATUS.END_OTP || ((bookingDetails.status === BOOKING_STATUS.ENDED || bookingDetails.status === BOOKING_STATUS.PAYMENT_REQUESTED) && !!amount));
    const isTerminalStatus = [BOOKING_STATUS.ENDED,BOOKING_STATUS.END_OTP,BOOKING_STATUS.PAYMENT_REQUESTED,BOOKING_STATUS.CANCELLED,BOOKING_STATUS.CUSTOMER_CANCELLED,BOOKING_STATUS.SUPPORT_CANCELLED].includes(bookingDetails?.status);
    const shouldShowEndOtp = [BOOKING_STATUS.TRIP_ENDED,BOOKING_STATUS.END_OTP,BOOKING_STATUS.PAYMENT_REQUESTED,BOOKING_STATUS.ENDED,BOOKING_STATUS.COMPLETED].includes(bookingDetails?.status);         // BOOKING_STATUS.STARTED,
    const extraHoursMinutes = Number(bookingDetails?.finalFareBreakdown?.extraHours?.minutes || bookingDetails?.extraHours || 0);
    const hasExtraHours = extraHoursMinutes > 0;
    const extraHoursRate = Number(bookingDetails?.finalFareBreakdown?.extraHours?.rate || bookingDetails?.extraHourPrice || 0);
    const extraHoursCharge = Number(bookingDetails?.finalFareBreakdown?.extraHours?.charge || bookingDetails?.extraPrice || 0);
    const isDropTaxiBooking = (booking) => (booking?.serviceType === 'RENTAL' && booking?.bookingType === 'DROP ONLY' && booking?.packageType ==='Outstation') || booking?.serviceType === 'RENTAL_DROP_TAXI';
    const isOutstationBooking = (booking) => booking?.serviceType === 'RENTAL' && booking?.packageType === 'Outstation' && booking?.bookingType === 'ROUND TRIP';
    const isQuotedWithoutCarType = (booking) => booking?.status === BOOKING_STATUS.QUOTED && (booking?.carType === '' || booking?.carType == null);
    const shouldShowQuotePricing = (booking) => !isQuotedWithoutCarType(booking);
    const isHourlyShowingPrice = (booking) => booking?.serviceType === 'RENTAL' && booking?.packageType === 'Local';
    const hasPreferredBaseFare = bookingDetails?.finalFareBreakdown?.baseFare !== undefined && bookingDetails?.finalFareBreakdown?.baseFare !== null;
    const preferredBaseFare = Number(bookingDetails?.finalFareBreakdown?.baseFare || 0);
    const fallbackBaseFare = Number(bookingDetails?.value?.fareBreakdown?.baseFare || 0);
    const baseFareToShow = hasPreferredBaseFare ? preferredBaseFare : fallbackBaseFare;

    const hasPreferredPerKm = bookingDetails?.finalFareBreakdown?.distanceFare?.rate !== undefined && bookingDetails?.finalFareBreakdown?.distanceFare?.rate !== null;
    const preferredPerKm = Number(bookingDetails?.finalFareBreakdown?.distanceFare?.rate || 0);
    const fallbackPerkm = Number(bookingDetails?.value?.fareBreakdown?.distanceFare?.rate || 0);
    const perKmShow = hasPreferredPerKm ? preferredPerKm : fallbackPerkm;
    const shouldShowPerKmRate =
        perKmShow > 0 &&
        (
            bookingDetails?.serviceType === 'AUTO' ||
            bookingDetails?.serviceType === 'RIDES' ||
            // isHourlyShowingPrice(bookingDetails) ||
            isOutstationBooking(bookingDetails) ||
            isDropTaxiBooking(bookingDetails)
        ) &&
        (
            bookingDetails?.serviceType === 'AUTO' ||
            bookingDetails?.serviceType === 'RIDES' ||
            shouldShowQuotePricing(bookingDetails)
        );
    const hourlyPackageBaseFare = isHourlyShowingPrice(bookingDetails)
        // ? Number(bookingDetails?.estimatedFareBreakdown?.distanceFare?.rate || 0)
        ? Number(
            bookingDetails?.carType === "Sedan"
                ? bookingDetails?.Package?.baseFareSedan
                : bookingDetails?.carType === "MUV"
                    ? bookingDetails?.Package?.baseFareMVP
                    : bookingDetails?.carType === "SUV"
                        ? bookingDetails?.Package?.baseFareSuv
                        : bookingDetails?.Package?.baseFare || 0
        )
        : 0;
    const packagePerKm = Number(
        bookingDetails?.carType === "Sedan"
            ? bookingDetails?.Package?.kilometerPriceSedan
            : bookingDetails?.carType === "MUV"
                ? bookingDetails?.Package?.kilometerPriceMVP
                : bookingDetails?.carType === "SUV"
                    ? bookingDetails?.Package?.kilometerPriceSuv
                    : bookingDetails?.Package?.kilometerPrice || 0
    );
    const estimatedPerKm = Number(bookingDetails?.estimatedFareBreakdown?.distanceFare?.rate || 0);
    const hourlyPackagePerKm = isHourlyShowingPrice(bookingDetails)
        ? (estimatedPerKm || packagePerKm)
        : packagePerKm;


    return (
        <div className="container mx-auto px-2 md:px-6">
            {bookingDetails && (
                <div>
                    <div className="flex flex-wrap pb-3 items-center gap-3 w-full lg:w-auto">
                        {showDetails == true &&  !hideBackButton && (
                        <Button
                            variant="text"
                            color="black"
                            className="flex items-center bg-white"
                            onClick={onBackPressHandler}
                        >
                            Back
                        </Button>
                        )}
                        <p className="text-2xl font-bold text-gray-900">
                            {`Booking #${bookingDetails?.bookingNumber || ''}`}
                        </p>


                        {bookingDetails?.status && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                {formatStatus(bookingDetails?.status)}
                            </span>
                        )}
                        {bookingDetails?.serviceType && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-rose-100 text-rose-800">
                                {getServiceTypeLabel()}
                            </span>
                        )}
                        {isPremiumBooking && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-600 text-white">
                                Premium
                            </span>
                        )}

                        {bookingDetails?.returnTripId > 0  && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                                Return Trip
                            </span>
                        )}
                    
                    </div>           
                    {showDetails && (
                <div className="w-full pb-3 lg:w-auto flex flex-wrap justify-start lg:justify-end gap-3">
                    {visibleQuoteRef && (
                        <div className="w-full">
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                                <span className="text-sm text-blue-700">Quote Ref:</span>
                                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-blue-900">
                                    {visibleQuoteRef}
                                </span>
                            </div>
                        </div>
                    )}
                    {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && visibleAdminDiscountStatus && (
                        <div className="w-full">
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                <span className="text-sm text-gray-600">Admin Discount:</span>
                                <span
                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${isAdminDiscountPending
                                        ? "bg-amber-100 text-amber-800"
                                        : ADMIN_EFFECTIVE_STATUSES.includes(visibleAdminDiscountStatus)
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                >
                                    {visibleAdminDiscountStatus}
                                </span>
                                {requiresSuperUserApproval && isAdminDiscountPending && (
                                    <>
                                        <span className="text-xs text-amber-700">Awaiting SUPER_USER approval</span>
                                        <Button
                                            size="sm"
                                            variant="outlined"
                                            className="px-2 py-1"
                                            disabled={adminStatusRefreshing}
                                            onClick={handleRefreshAdminDiscountStatus}
                                        >
                                            {adminStatusRefreshing ? "Refreshing..." : "Refresh Status"}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    {(!isTerminalStatus && (
                        (bookingDetails.status === "QUOTED" && bookingDetails.followup !== "FOLLOWUP") ||
                        (bookingDetails.ownership === "ASSIGNED_TO_SUPPORT" &&
                            bookingDetails.status === "QUOTED" &&
                            (bookingDetails.serviceType === "AUTO" || bookingDetails.serviceType === "PARCEL"))
                    )) && (
                    <Button
                        color="white"
                        variant="outlined"
                        ripple="dark"
                        className="px-2 bg-green-600"
                        onClick={() => {
                            handleBookingAction(BOOKING_STATUS.CONFIRMED);
                        }}
                    >
                        Confirm
                    </Button>
                )}

                {bookingDetails.status !== "ENDED" &&
                    bookingDetails.status !== "STARTED" &&
                    bookingDetails.status !== "CANCELLED" && (
                        <>
                            {!showCancelReason && (bookingDetails?.status == 'QUOTED' || bookingDetails?.status == 'INITIATED' || bookingDetails?.status == 'DRIVER_ON_THE_WAY' || bookingDetails?.status == 'DRIVER_REACHED' || bookingDetails?.status == 'REQUEST_DRIVER' || bookingDetails?.status == 'CONFIRMED' || bookingDetails?.status == 'BOOKING_ACCEPTED') &&
                                (
                                    <Button
                                        color="white"
                                        variant="outlined"
                                        ripple="dark"
                                        className="px-2 bg-red-900"
                                        onClick={() => setShowCancelReason(true)}
                                    >
                                        Cancel
                                    </Button>
                                )
                            }
                        </>
                    )
                }

                {bookingDetails?.status === 'QUOTED' && bookingDetails?.serviceType !== 'PARCEL' && (
                    <Button
                        color="white"
                        variant="outlined"
                        ripple="dark"
                        className="px-4 bg-gray-600"
                        onClick={() => { handleEditAction(bookingDetails); }}
                    >
                        Edit
                    </Button>
                )}

                {/* {(['INITIATED', 'QUOTED', 'CONFIRMED'].includes(bookingDetails.status) || (bookingDetails.status == "REQUEST_DRIVER" && bookingDetails.serviceType == "RIDES" || bookingDetails.status == "REQUEST_DRIVER" && bookingDetails.serviceType == "DRIVER" || bookingDetails.status == "REQUEST_DRIVER" && bookingDetails.serviceType == "RENTAL")) &&
                    bookingDetails?.pickupAddress &&
                    !bookingDetails?.Driver?.id &&
                    !bookingDetails?.Cab?.id && (
                        <Button
                            color="blue"
                            variant="outlined"
                            ripple="light"
                            fullWidth
                            onClick={() => {
                                let obj = { ...bookingDetails };
                                obj.requestType = "REQUEST_ALL";
                                setBookingDetails(obj);

                                props.onAssignDriver(bookingDetails);

                            }}
                        >
                            {props.bookingData.serviceType != "CAB" && props.bookingData.serviceType != "DRIVER"
                                ? "Assign Cab"
                                : "Assign Captain"}
                        </Button>
                    )}

                {(['INITIATED', 'QUOTED', 'CONFIRMED'].includes(bookingDetails.status) || (bookingDetails.status == "REQUEST_DRIVER" && bookingDetails.serviceType == "RIDES" || bookingDetails.status == "REQUEST_DRIVER" && bookingDetails.serviceType == "DRIVER" || bookingDetails.status == "REQUEST_DRIVER" && bookingDetails.serviceType == "RENTAL")) &&
                    bookingDetails?.pickupAddress &&
                    !bookingDetails?.Driver?.id &&
                    !bookingDetails?.Cab?.id && (
                        <Button
                            color="blue"
                            variant="outlined"
                            ripple="light"
                            fullWidth
                            onClick={() => { props.onAssignDriver(bookingDetails); }}
                        >
                            {props.bookingData.serviceType != "CAB" && props.bookingData.serviceType != "DRIVER"
                                ? "Request Cab"
                                : "Request Captain"}
                        </Button>
                    )} */}

                {hasOnAssignDriver && bookingDetails.status === 'ASSIGNED_TO_SUPPORT' &&
                    bookingDetails?.pickupAddress &&
                    !bookingDetails?.Driver?.id &&
                    !bookingDetails?.Cab?.id && (
                        <Button
                            color="white"
                            variant="outlined"
                            ripple="light"
                            className="px-6 bg-gray-600"
                            onClick={() => { handleAssignDriverAction(bookingDetails); }}
                        >
                            {contextServiceType === "CAB"
                                ? "Assign Cab"
                                : "Assign Captain"}
                        </Button>
                    )}

                {hasOnAssignDriver && ['QUOTED', 'CONFIRMED', 'BOOKING_ACCEPTED'].includes(bookingDetails.status) &&
                    (bookingDetails?.Driver?.id || bookingDetails?.Cab?.id) && (
                        <Button
                            color="white"
                            variant="outlined"
                            ripple="light"
                            className="px-6 bg-gray-600"
                            onClick={() => { handleAssignDriverAction(bookingDetails); }}
                        >
                            {contextServiceType !== "DRIVER"
                                ? "Choose Another Cab"
                                : "Choose Another Captain"}
                        </Button>
                    )}

                {/* {(bookingDetails.status === 'BOOKING_ACCEPTED' && //start
                        dateVal &&
                        timeVal &&
                        kms) ? (
                            <Button
                                color="black"
                                ripple="light"
                                fullWidth
                                onClick={onConfirmPressHandler}
                            >
                                Start Trip
                            </Button>
                            ) : 
                        (bookingDetails?.serviceType === 'CAR_WASH' && bookingDetails.status === 'INITIATED' && dateVal && timeVal ) ?
                            (<Button
                                    color="black"
                                    ripple="light"
                                    fullWidth
                                    onClick={onConfirmPressHandler}
                                >
                                    Start Trip
                            </Button> 
                        ) : <></>
                    } */}

                {/* {(bookingDetails.status === 'STARTED' &&
                        dateVal &&
                        timeVal &&
                        kms &&
                        paymentDetails.paymentCollected &&
                        paymentDetails.paymentMethod &&
                        paymentDetails.paymentStatus ) ? (
                            <Button
                                color="black"
                                ripple="light"
                                fullWidth
                                onClick={onConfirmPressHandler}
                            >
                                End Trip
                            </Button>
                        ) : (
                        bookingDetails?.serviceType === 'CAR_WASH' &&
                        bookingDetails.status === 'STARTED' &&
                        dateVal &&
                        timeVal &&
                        paymentDetails.paymentCollected &&
                        paymentDetails.paymentMethod &&
                        paymentDetails.paymentStatus) ? (
                            <Button
                                color="black"
                                ripple="light"
                                fullWidth
                                onClick={onConfirmPressHandler}
                            >
                                End Trip
                            </Button>
                        ) :<></>
                    } */}
            </div>
        )}
            {showCancelReason && (
                <div className="mt-4 space-y-4 w-full lg:max-w-xl">
                    <select
                        name="cancelBy"
                        value={cancelData.cancelBy}
                        onChange={handleCancelChange}
                        className="border border-gray-300 px-4 py-2 rounded-md w-full"
                    >
                        <option value="">Select who cancelled</option>
                        <option value="SUPPORT_CANCELLED">Cancelled By Support</option>
                        <option value="Customer">Cancelled by Customer</option>
                        <option value="Driver">Cancelled by Driver</option>
                    </select>

    {/* Cancellation Reason - only shown when cancelled by Support */}
    {cancelData.cancelBy === "SUPPORT_CANCELLED" && (
      <>
        <select
          value={cancelData.cancelReason}
          onChange={(e) => {
            const value = e.target.value;
           setCancelData((prev) => ({
      ...prev,
      cancelReason: value,
      customReason: value === "Other Reason" ? prev.customReason || "" : "",
    }));
          }}
          className="border border-gray-300 px-4 py-2 rounded-md w-full"
        >
          <option value="">Select cancellation reason</option>
          <option value="No Cabs Available">No Cabs Available</option>
           <option value="Cab Taking Too Long to Arrive">Just checking the price</option>
          <option value="Cab Taking Too Long to Arrive">Cab Taking Too Long to Arrive</option>
          <option value="Booked by Mistake">Booked by Mistake</option>
          <option value="Wrong Service Selected">Wrong Service Selected</option>
          <option value="Got a Ride Elsewhere">Got a Ride Elsewhere</option>
          <option value="Change of Plans">Change of Plans</option>
          <option value="Price Variation">Price is high</option>
          <option value="Customer Not Reachable">Customer Not Reachable</option>
          <option value="Moved to Different ID">Moved to Different ID</option>
          <option value="Other Reason">Other Reason</option>
        </select>

        {/* Custom reason input when "Other Reason" is selected */}
        {cancelData.cancelReason === "Other Reason" && (
          <Input
            type="text"
            placeholder="Please specify the reason..."
            value={cancelData.customReason || ""}
            onChange={(e) =>
              setCancelData((prev) => ({
                ...prev,
                // cancelReason: e.target.value,
                customReason: e.target.value,
              }))
            }
            className="border border-gray-300 px-4 py-2 rounded-md w-full"
          />
        )}
      </>
    )}

    {/* For Customer/Driver cancelled - free text */}
                        {(cancelData.cancelBy === "Customer" || cancelData.cancelBy === "Driver") && (
                    <Input
                        type="text"
                        name="cancelReason"
                        value={cancelData.cancelReason}
                        onChange={handleCancelChange}
                        placeholder="Enter cancellation reason..."
                        className="border border-gray-300 px-4 py-2 rounded-md w-full"
                    />
                        )}

    {/* Cancellation Charge Applicable */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-3 sm:space-y-0">
                        <label className="font-medium text-gray-700">Cancellation Charge Applicable:</label>
                        <label className="inline-flex items-center space-x-2">
                            <input
                                type="radio"
                                name="cancelCharge"
                                value="Yes"
                                checked={cancelData.cancelCharge === "Yes"}
                                onChange={handleCancelChange}
                            />
                            <span>Yes</span>
                        </label>
                        <label className="inline-flex items-center space-x-2">
                            <input
                                type="radio"
                                name="cancelCharge"
                                value="No"
                                checked={cancelData.cancelCharge === "No"}
                                onChange={handleCancelChange}
                            />
                            <span>No</span>
                        </label>
                    </div>

    {/* Action Buttons */}
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        color="red"
        className="w-full sm:w-auto"
        onClick={() => handleBookingAction(BOOKING_STATUS.CANCELLED)}
        disabled={
          !cancelData.cancelBy ||
          !cancelData.cancelReason?.trim() ||
          !cancelData.cancelCharge || (cancelData.cancelBy === "SUPPORT_CANCELLED" && cancelData.cancelReason === "Other Reason" && !cancelData.customReason?.trim())
        }
                        >
                            Confirm Cancel
                        </Button>
                        <Button
                            color="gray"
                            variant="outlined"
        className="w-full sm:w-auto"
        onClick={() => {
          setShowCancelReason(false);
          setCancelData({ cancelReason: "", cancelBy: "", cancelCharge: "", customReason: "" });
        }}
      >
                            Close
                        </Button>
                    </div>
                </div>
                )}

            {showDetails && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className="mb-4 rounded-2xl shadow-sm border border-gray-100">
                    <CardBody className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
                            <span>Customer Info</span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Name:</span>
                                <span className="text-gray-900 font-medium">{bookingDetails?.Customer?.firstName || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Phone:</span>
                                <span className="text-gray-900 font-medium">{bookingDetails?.Customer?.phoneNumber || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Rating:</span>
                                <span className="text-gray-900 font-medium flex items-center gap-1">
                                    <span className="text-yellow-500">★</span>
                                    {customerFeedback?.rating || 0}
                                </span>
                                {customerFeedback?.rating <= 4 && (
                                    <> 
                                 <span className="italic">
                                        {customerFeedback?.comment || 'N/A'}
                                    </span>
                                </>)}
                            </div>
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Total Enquiries:</span>
                                <span className="text-gray-900 font-medium">{bookingDetails?.customerBookingCount || 'N/A'}</span>
                            </div>
                        </div>
                        {bookingDetails?.lastBookingCreatedAt && (
                            <p className="text-xs text-gray-500">
                                Last enquiry: {moment(bookingDetails.lastBookingCreatedAt).format('DD-MM-YYYY')}
                            </p>
                        )}
                    </CardBody>
                </Card>
            {bookingDetails?.serviceType === 'PARCEL' && (
                <Card className="mb-4 rounded-2xl border border-gray-100 shadow-sm">
                    <CardBody className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
                            <span>Parcel Details</span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-500 font-semibold">Sender Name: </span>
                                <span className="text-gray-900 font-medium">{bookingDetails?.deliveryDetails?.senderName || '-'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 font-semibold">Phone: </span>
                                <span className="text-gray-900 font-medium">{bookingDetails?.deliveryDetails?.senderPhone || '-'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 font-semibold">Receiver Name: </span>
                                <span className="text-gray-900 font-medium">{bookingDetails?.deliveryDetails?.receiverName || '-'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 font-semibold">Receiver Phone: </span>
                                <span className="text-gray-900 font-medium">{bookingDetails?.deliveryDetails?.receiverPhone || '-'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 font-semibold">Order Type: </span>
                                <span className="text-gray-900 font-medium">{bookingDetails?.orderType || '-'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 font-semibold">Instructions: </span>
                                <span className="text-gray-900 font-medium">{bookingDetails?.deliveryDetails?.deliveryInstructions || '-'}</span>
                                </div>
                            </div>                        
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-gray-500 font-semibold">Pickup Proof:</p>
                                {bookingDetails?.deliveryDetails?.pickupProofImage ? (
                                    <div className="mt-1 space-y-2">
                                        <a
                                            href={bookingDetails.deliveryDetails.pickupProofImage}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-block"
                                        >
                                            <img
                                                src={bookingDetails.deliveryDetails.pickupProofImage}
                                                alt="Pickup proof"
                                                className="w-32 h-16 object-cover rounded border border-gray-200"
                                            />
                                        </a>
                                        <div className="flex items-center gap-2">
                                        <a
                                            href={bookingDetails.deliveryDetails.pickupProofImage}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold"
                                        >
                                            View
                                        </a>
                                    </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-900 font-medium">-</p>
                                )}
                            </div>
                            <div>
                                <p className="text-gray-500 font-semibold">Drop Proof:</p>
                                {bookingDetails?.deliveryDetails?.dropProofImage ? (
                                    <div className="mt-1 space-y-2">
                                        <a
                                            href={bookingDetails.deliveryDetails.dropProofImage}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-block"
                                        >
                                            <img
                                                src={bookingDetails.deliveryDetails.dropProofImage}
                                                alt="Drop proof"
                                                className="w-32 h-16 object-cover rounded border border-gray-200"
                                            />
                                        </a>
                                        <div className="flex items-center gap-2">
                                        <a
                                            href={bookingDetails.deliveryDetails.dropProofImage}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold"
                                        >
                                            View
                                        </a>
                                    </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-900 font-medium">-</p>
                                )}
                            </div>
                        </div>
                        {/* <div className="flex items-center gap-2">
                            <p className="text-gray-500 font-semibold">Delivery Audio:</p>
                            {audioUrl ? (
                                <audio controls muted className="flex-1">
                                    <source src={audioUrl} type="audio/mp4" />
                                    Your browser does not support the audio element.
                                </audio>
                            ) : (
                                <p className="text-sm text-gray-500">No audio available</p>
                            )}
                        </div> */}
                    </CardBody>
                </Card>
            )}

                {(bookingDetails?.status == "SUPPORT_CANCELLED" || bookingDetails?.status == "CANCELLED" || bookingDetails?.status == "CUSTOMER_CANCELLED") &&
                    <Card className="mb-2">
                        <CardBody>
                            <div className="flex justify-between mb-2">
                                <Typography variant="h5">Cancellation Reason</Typography>
                            </div>
                            <hr className="my-2" />
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Typography color="gray" variant="h6">Reason:</Typography>
                                    <Typography>{bookingDetails?.cancelReason}</Typography>
                                </div>
                                
                                     {bookingDetails?.cancelReason === "Other Reason" && (
                                        <div className="flex justify-between">
                                         <Typography color="gray" variant="h6">Custom Reason:</Typography>
                                          <Typography>{bookingDetails?.customReason}</Typography>
                                           </div>
                                     )}
                               
                                <div className="flex justify-between">
                                    <Typography color="gray" variant="h6">Cancel Requested By:</Typography>
                                    <Typography>{bookingDetails?.cancelRequestedBy || 'Customer'}</Typography>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                }
                {bookingDetails?.Driver?.id &&
                    <Card className="mb-2">
                        <CardBody>
                            <div className="flex justify-between mb-2">
                                <Typography variant="h5">Driver Details </Typography>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                {/* <div className="flex items-center gap-3 col-span-2"> */}
                                    {/* <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold">
                                        {bookingDetails?.Driver?.firstName?.[0] || 'D'}
                                    </div> */}
                                    <div className="flex flex-col-2 gap-2">
                                        <span className="text-gray-500 font-semibold">Name:</span>
                                        <span className="text-gray-900 font-medium">{bookingDetails?.Driver?.firstName || 'N/A'}</span>
                                    </div>
                                {/* </div> */}
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Phone:</span>
                                    <span className="text-gray-900 font-medium">{bookingDetails?.Driver?.phoneNumber || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Vehicle Number:</span>
                                    <span className="text-gray-900 font-medium">{bookingDetails?.Cab?.carNumber  || bookingDetails?.Parcel?.vehicleNumber || bookingDetails?.Auto?.autoNumber ||'-'}</span>
                                </div>
                                {(bookingDetails?.serviceType !== 'AUTO') && (bookingDetails?.serviceType !== 'PARCEL') && (
                                <>
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Model:</span>
                                    <span className="text-gray-900 font-medium">{bookingDetails?.Cab?.name || bookingDetails?.Cab?.carType || '-'}</span>
                                </div>
                                </>)}
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Rating:</span>
                                    <span className="text-gray-900 font-medium flex items-center gap-1">
                                        <span className="text-yellow-500">★</span>
                                        {driverFeedback?.rating || 0}
                                    </span>
                                    {driverFeedback?.rating <= 4  && (<>
                                     <span className="italic">
                                        {driverFeedback?.comment || 'N/A'}
                                    </span>
                                    </>)}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                }
            </div>
            )}
           
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className="mb-4 rounded-2xl border border-gray-100 shadow-sm">
                    <CardBody className="space-y-5">
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-900">
                                Ride Details
                                {isPeakHour && (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                        Peak Hrs
                                    </span>
                                )}
                            </span>
                            <Typography variant="h6" color="green"><a target="_blank" href={Utils.generateWhatsAppMessage(bookingDetails)}>Share on Whatsapp</a></Typography>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Service Type:</span>
                                <span className="text-gray-900 font-medium">{bookingDetails.serviceType === 'DRIVER' ? 'ACTING DRIVER' : bookingDetails.serviceType == "RIDES" ? 'Local Rides' : bookingDetails?.packageType == "Local" ? 'Hourly Package' : (bookingDetails?.serviceType == "RENTAL" && bookingDetails?.bookingType == "DROP ONLY") ? 'Drop Taxi' : bookingDetails?.serviceType == 'AUTO' ? 'Auto' : bookingDetails?.serviceType == "PARCEL" ? 'Parcel' : 'Outstation'}</span>
                            </div>
                            {bookingDetails?.serviceType === 'DRIVER' && (
                                <>
                                    <div className="flex flex-col-2 gap-2">
                                        <span className="text-gray-500 font-semibold">Trip Type:</span>
                                        <span className="text-gray-900 font-medium">{bookingDetails?.bookingType}</span>
                                    </div>
                                    
                                </>                                    
                            )}
                            {bookingDetails?.serviceType ==='DRIVER' && bookingDetails?.packageType === 'Outstation' && (
                                      <div className="flex flex-col-2 gap-2">
                                        <span className="text-gray-500 font-semibold">Period:</span>
                                        <span className="text-gray-900 font-medium">{(bookingDetails?.Package?.extraCabType === '0' && bookingDetails?.Package?.period === '1')  ? "Custom Date" : bookingDetails?.Package?.period + ' Hrs'}</span>
                                    </div>
                            )}
                            {bookingDetails?.serviceType == "PARCEL" &&
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Delivery Type:</span>
                                <span className="text-gray-900 font-medium">
                                    {bookingDetails?.deliveryType === 'DOOR_DELIVERY' ? "Door Delivery" : ""}
                                </span>
                            </div>
                            }
                            {bookingDetails?.serviceType == "PARCEL" &&
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Vehicle Type:</span>
                                    <span className="text-gray-900 font-medium">
                                        {bookingDetails?.parcelVehicleType === 'BIKE' ? "Bike" : bookingDetails?.parcelVehicleType === 'AUTO' ? "Auto" :  ''}
                                    </span>
                                </div>
                            }
                            {bookingDetails?.serviceType == "PARCEL" &&
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Weight:</span>
                                    <span className="text-gray-900 font-medium">
                                        {bookingDetails?.weight ? `${bookingDetails?.weight} Kg` : 'N/A'}
                                    </span>
                                </div>  
                            }
                            {bookingDetails?.serviceType == "PARCEL" &&
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Per Km Rate:</span>
                                <span className="text-gray-900 font-medium">
                                    {bookingDetails?.estimatedFareBreakdown?.ratePerKm ? `₹${bookingDetails?.estimatedFareBreakdown?.ratePerKm}` : 'N/A'}
                                </span>
                            </div>
                            }
                            {bookingDetails?.sourceType &&
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Source Type:</span>
                                 <span className="text-gray-900 font-medium">
                                    {bookingDetails?.sourceType}
                                </span>
                            </div>
                            }
                            {(bookingDetails?.sourceType == 'Others' || bookingDetails?.sourceType == 'Offline Ads') && 
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Specification:</span>
                                 <span className="text-gray-900 font-medium">
                                    {bookingDetails?.otherSourceType}
                                </span>
                            </div>
                             }

                            {bookingDetails?.source !== "Mobile App" &&
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Service Area:</span>
                                <span className="text-gray-900 font-medium">{bookingDetails?.zone}</span>
                            </div>
                            }
                            
                            {/* {bookingDetails?.zone > 0 &&
                            <div className="flex justify-between">
                                <Typography color="gray" variant="h6">Service Area:</Typography>
                                <Typography>{bookingDetails.zone}</Typography>
                            </div>
                            } */}
                            {/* {bookingDetails?.serviceType !='RIDES' && <div className="flex justify-between">
                            <Typography color="gray" variant="h6">Package Type:</Typography>
                            <Typography>{bookingDetails.packageType}</Typography>
                            </div>} */}
                            {/* {(
                            bookingDetails?.serviceType === 'DRIVER' || 
                            (bookingDetails?.serviceType === 'RENTAL' && 
                            bookingDetails?.packageType === 'Outstation' && 
                            bookingDetails?.bookingType !== 'Hourly Package')
                            ) && (
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Booking Type:</span>
                                <span className="text-gray-900 font-medium">{bookingDetails?.bookingType}</span>
                            </div>
                            )} */}
                            {(bookingDetails?.serviceType === 'RENTAL' && bookingDetails?.packageType =='Local') && 
                            <div className="flex flex-col-2 gap-2">
                            <span className="text-gray-500 font-semibold">Package KM:</span>
                            <span className="text-gray-900 font-medium">
                            {bookingDetails?.packageType === 'Local' ? `${bookingDetails?.Package?.kilometer} Km` : ''}
                            </span>
                            </div>
                            }
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Start Date:</span>
                                <span className="text-gray-900 font-medium">{moment(bookingDetails.fromDate).format("DD-MM-YYYY / hh:mm A")}</span>
                            </div>
                              {baseFareToShow > 0 &&  bookingDetails?.serviceType === 'AUTO' &&  (
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Base Fare:</span>
                                    <span className="text-gray-900 font-medium">₹ {baseFareToShow}</span>
                                </div>
                            )}
                                    {isHourlyShowingPrice(bookingDetails) && hourlyPackagePerKm !== null && hourlyPackagePerKm !== undefined && (
                                        <div className="flex gap-2">
                                            <span className="text-gray-500 font-semibold">Per KM Rate:</span>
                                            <span className="text-gray-900 font-medium">₹ {Number(hourlyPackagePerKm).toFixed(2)}</span>
                                        </div>
                                    )}
                            
                              {shouldShowPerKmRate && (
                             <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Per KM Rate:</span>
                                    <span className="text-gray-900 font-medium">₹ {perKmShow}</span>
                                </div>
                                )}
                                 
                                 
                            {bookingDetails?.toDate &&
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">End Date:</span>
                                    <span className="text-gray-900 font-medium">{moment(bookingDetails.toDate).format("DD-MM-YYYY / hh:mm A")}</span>
                                </div>
                            }
                            {bookingDetails?.packageType == "Outstation" &&
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">AC Type:</span>
                                    <span className="text-gray-900 font-medium">{bookingDetails?.acType}</span>
                                </div>
                            }
                                {/* {bookingDetails?.Cab?.carType && bookingDetails?.serviceType === 'RIDES' && (bookingDetails?.status === "STARTED" || bookingDetails?.status === "ENDED") && (
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Cab Type:</span>
                                    <span className="text-gray-900 font-medium">{bookingDetails?.Cab?.carType}</span>
                                </div>
                            )} */}
                            {bookingDetails?.serviceType !== 'DRIVER' && bookingDetails?.carType && bookingDetails?.serviceType !== 'AUTO' && (
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Car Type:</span>
                                    <span className="text-gray-900 font-medium">{bookingDetails?.carType}</span>
                                </div>
                            )}
                            {(bookingDetails?.serviceType != 'RIDES'  && bookingDetails?.serviceType !='AUTO') && bookingDetails.luggage > 0 &&
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Luggage:</span>
                                    <span className="text-gray-900 font-medium">{bookingDetails.luggage || '0'}</span>
                                </div>
                                
                            }
                            {(bookingDetails?.serviceType != 'RIDES'  && bookingDetails?.serviceType !='AUTO') && bookingDetails.seaterCapacity > 0 &&
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Seater Capacity:</span>
                                    <span className="text-gray-900 font-medium">{bookingDetails.seaterCapacity || '0'}</span>
                                </div>
                                
                            }
                            {bookingDetails?.serviceType != 'RIDES' && bookingDetails?.packageType != 'Outstation' && bookingDetails?.serviceType != 'AUTO' && bookingDetails?.serviceType != 'PARCEL' && 
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Package:</span>
                                    <span className="text-gray-900 font-medium">{`${bookingDetails?.packageType == 'Local' ? bookingDetails?.Package?.period : ''}
                                            ${bookingDetails?.packageType === "Outstation" ? bookingDetails.totalDays ? bookingDetails?.totalDays + ' Days' : bookingDetails?.value?.differenceDays + ' Days' :
                                            bookingDetails?.packageType === "Local" ? "hours" : ""}`}</span>
                                </div>
                            }
                            {bookingDetails?.serviceType == 'DRIVER' && 
                              <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">KM:</span>
                                    <span className="text-gray-900 font-medium">{`${bookingDetails?.packageType == 'Local' ? `${Number(bookingDetails?.Package?.kilometer || 0).toFixed(2)}` + ' Km' : ''}
                                            ${bookingDetails?.packageType === "Outstation" ? `${Number(bookingDetails?.value?.travelDistance || 0).toFixed(2)}` + ' Km':''}`}</span>
                                </div>
                            }
                           
                            {baseFareToShow > 0 && bookingDetails?.serviceType !== 'AUTO' && shouldShowQuotePricing(bookingDetails) && !isHourlyShowingPrice(bookingDetails) && (
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Base Fare:</span>
                                    <span className="text-gray-900 font-medium">₹ {baseFareToShow}</span>
                                </div>
                            )}
                            {isHourlyShowingPrice(bookingDetails) && hourlyPackageBaseFare > 0 && (
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Base Fare:</span>
                                    <span className="text-gray-900 font-medium">₹ {hourlyPackageBaseFare}</span>
                                </div>
                            )}
                        

                            {bookingDetails?.estimatedDistance > 0  &&
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Estimate km:</span>
                                <span className="text-gray-900 font-medium"> {bookingDetails?.estimatedDistance} Km</span>
                            </div>
                            }
                            {(bookingDetails?.status === BOOKING_STATUS.ENDED || bookingDetails?.status === BOOKING_STATUS.END_OTP) && (bookingDetails?.serviceType === 'AUTO' || bookingDetails?.serviceType === 'RIDES') && (
                                    <div className="flex flex-col-2 gap-2">
                                        <span className="text-gray-500 font-semibold">Total Distance:</span>
                                        <span className="text-gray-900 font-medium">  {(Number(bookingDetails?.totalDistanceKilometer || 0) + Number(bookingDetails?.value?.driverWithin || 0)).toFixed(2)} Km</span>
                                    </div>
                                )} 
                            {bookingDetails?.status !== BOOKING_STATUS.END_OTP && bookingDetails?.status !== BOOKING_STATUS.ENDED  &&
                                (bookingDetails?.serviceType === 'RIDES' || bookingDetails?.serviceType === 'AUTO') && (
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Total Distance:</span>
                                    <span className="text-gray-900 font-medium">{(Number(bookingDetails?.value?.distanceEstimated || 0) + Number(bookingDetails?.value?.driverWithin || 0)).toFixed(2)} Kms</span>
                                </div>
                                )
                            }
                            {bookingDetails?.status !== BOOKING_STATUS.END_OTP && bookingDetails?.status !== BOOKING_STATUS.ENDED  && bookingDetails?.serviceType !=="RIDES" && bookingDetails?.serviceType !=="AUTO" && (!isHourlyShowingPrice(bookingDetails) || Number(bookingDetails?.value?.estimatedDistance || 0) > 0) &&
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Total Distance :</span>
                                    <span className="text-gray-900 font-medium">{Number(bookingDetails?.value?.estimatedDistance || 0).toFixed(2)} Kms</span>
                                </div>
                            }
                             {(bookingDetails?.status === BOOKING_STATUS.ENDED || bookingDetails?.status === BOOKING_STATUS.END_OTP) && (bookingDetails?.serviceType === 'AUTO' || bookingDetails?.serviceType === 'RIDES') && (
                                    
                             <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Estimated Price{inclTaxLabel}:</span>
                                    <span className="text-gray-900 font-medium">₹ {getSafePremiumEstimatedPrice(Number(bookingDetails?.estimatedFareBreakdown?.total || bookingDetails?.value?.fareBreakdown?.total || 0)).toFixed(2)}</span>
                                </div>
                                
                                )}
                        {bookingDetails?.serviceType == "PARCEL" &&
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Estimated Price:</span>
                                <span className="text-gray-900 font-medium">
                                    {bookingDetails?.estimatedFareBreakdown?.total ? `₹${getSafePremiumEstimatedPrice(Number(bookingDetails?.estimatedFareBreakdown?.total || 0)).toFixed(2)}` : 'N/A'}
                                </span>
                            </div>
                            }
                             {!(bookingDetails?.status === BOOKING_STATUS.ENDED || bookingDetails?.status === BOOKING_STATUS.END_OTP) && (bookingDetails?.serviceType === 'AUTO' || bookingDetails?.serviceType === 'RIDES') && (
                                    
                             <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Estimated Price{inclTaxLabel}:</span>
                                    <span className="text-gray-900 font-medium">₹ {getSafePremiumEstimatedPrice(Number(bookingDetails?.estimatedFareBreakdown?.total || bookingDetails?.value?.fareBreakdown?.total || 0)).toFixed(2)}</span>
                                </div>
                                
                                )}
                                 {bookingDetails?.discount?.percentage > 0 &&  bookingDetails?.serviceType === 'AUTO' &&  bookingDetails?.status !== "END_OTP" && bookingDetails?.status !== "ENDED"  && shouldShowQuotePricing(bookingDetails)  &&(
                                    
                                        <div className="flex flex-col-2 gap-2">
                                            <span className="text-gray-500 font-semibold">Discount Applied:</span>
                                            <span className="text-gray-900 font-medium">{bookingDetails?.discount?.percentage} %</span>
                                        </div>
                                        )}
                                         {bookingDetails?.discount?.percentage > 0 &&  bookingDetails?.serviceType === 'AUTO' && bookingDetails?.status !=="DRIVER_ON_THE_WAY"&& bookingDetails?.status !== "ENDED" && bookingDetails?.status !== "END_OTP" && shouldShowQuotePricing(bookingDetails) &&(
                                          <div className="flex flex-col-2 gap-2">  
                                        <span className="text-gray-500 font-semibold">Total estimated Fare:</span>
                                                <span className="text-gray-900 font-medium">₹ {Number(
                                                    (bookingDetails?.value?.estimatedPrice || 0) -
                                                    ((bookingDetails?.value?.estimatedPrice || 0) * (bookingDetails?.discount?.percentage || 0) / 100)
                                                ).toFixed(2)}</span>
                                            </div>
                                        )}
                                         {bookingDetails?.discount?.amount > 0 &&  bookingDetails?.serviceType === 'AUTO' && bookingDetails?.status !== "ENDED" && bookingDetails?.status !== "END_OTP"  && shouldShowQuotePricing(bookingDetails)  &&(
                                             <div  className="flex flex-col-2 gap-2">                                                                       
                                            <span className="text-gray-500 font-semibold">Discount Applied:</span>
                                            <span className="text-gray-900 font-medium">₹ {bookingDetails?.discount?.amount} </span>
                                            </div>
                                        )}
                                        {bookingDetails?.discount?.amount > 0 &&  bookingDetails?.serviceType === 'AUTO' && bookingDetails?.status !== "ENDED" && bookingDetails?.status !== "END_OTP"&& shouldShowQuotePricing(bookingDetails) &&(
                                          <div className="flex flex-col-2 gap-2">  
                                        <span className="text-gray-500 font-semibold">Total estimated Fare:</span>
                                                <span className="text-gray-900 font-medium">₹ {Number(
                                                    (bookingDetails?.value?.estimatedPrice || 0) - (bookingDetails?.discount?.amount || 0)
                                                ).toFixed(2)}</span>
                                            </div>
                                        )}
                                {bookingDetails?.serviceType != 'RIDES' && bookingDetails?.serviceType !== 'AUTO'  &&  (bookingDetails?.status == "ENDED" || bookingDetails?.status == "END_OTP") && (!isHourlyShowingPrice(bookingDetails) || (Number(bookingDetails?.totalDistanceKilometer || 0) + Number(bookingDetails?.value?.driverWithin || 0)) > 0) &&                
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Total Distance:</span>
                                    <span className="text-gray-900 font-medium">{(Number(bookingDetails?.totalDistanceKilometer)+Number (bookingDetails?.value?.driverWithin ||0)).toFixed(2)} Kms</span>
                                </div>
                            }
                            {bookingDetails?.estimatedFareBreakdown?.primeLocation?.charge > 0 && 
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Prime Location Charge:</span>
                                    <span className="text-gray-900 font-medium">₹ {(Number(bookingDetails?.estimatedFareBreakdown?.primeLocation?.charge)).toFixed(2)}</span>
                                </div>
                            }
                            {/* {bookingDetails?.serviceType === 'RIDES' && bookingDetails?.value?.distanceEstimated > 0 && (
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Total Distance:</span>
                                    <span className="text-gray-900 font-medium">{(Number(bookingDetails?.value?.distanceEstimated) + Number(bookingDetails?.value?.driverWithin)).toFixed(1)} Kms</span>
                                </div>
                            )} */}
                            {/* {(bookingDetails?.serviceType == 'RENTAL' && bookingDetails?.packageType == 'Outstation' && bookingDetails?.bookingType == 'ROUND TRIP') &&
                                <div className="flex justify-between">
                                    <Typography color="gray" variant="h6">Total Days:</Typography>
                                    <Typography>{bookingDetails?.value?.displayTime}</Typography>
                                </div>
                            }
                            {(bookingDetails?.serviceType == 'RENTAL' && bookingDetails?.packageType == 'Outstation' && bookingDetails?.bookingType == 'DROP ONLY') &&
                                <div className="flex justify-between">
                                    <Typography color="gray" variant="h6">Total Days:</Typography>
                                    <Typography>{bookingDetails?.value?.displayTime}</Typography>
                                </div>
                            } */}
                                    {/* </div> */}
                            {/* need to add logic for price */}
                    {/* <div className="grid sm:grid-cols-2 gap-4 text-sm">                                         */}
                            {bookingDetails?.status !== BOOKING_STATUS.ENDED && bookingDetails?.status !== BOOKING_STATUS.END_OTP && bookingDetails?.serviceType !== 'AUTO' && bookingDetails?.serviceType !== 'RIDES' && bookingDetails?.serviceType !== 'PARCEL' && shouldShowQuotePricing(bookingDetails)  && (                            
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Estimated Price{inclTaxLabel}:</span>
                                    <span className="text-gray-900 font-medium">
                                        ₹ {getSafePremiumEstimatedPrice(Number(
                                            (bookingDetails?.serviceType === 'DRIVER' && bookingDetails?.packageType === 'Local'
                                                ? bookingDetails?.carType === "Sedan"
                                                    ? bookingDetails?.Package?.price
                                                    : bookingDetails?.carType === "MUV"
                                                        ? bookingDetails?.Package?.priceMVP
                                                        : bookingDetails?.carType === "SUV"
                                                            ? bookingDetails?.Package?.price
                                                            : bookingDetails?.Package?.price
                                                : (bookingDetails?.packageType === 'Local' && bookingDetails?.serviceType === 'RENTAL')
                                                    ? (
                                                        bookingDetails?.carType === "Sedan"
                                                            ? bookingDetails?.Package?.priceSedan
                                                            : bookingDetails?.carType === "MUV"
                                                                ? bookingDetails?.Package?.priceMVP
                                                                : bookingDetails?.carType === "SUV"
                                                                    ? bookingDetails?.Package?.priceSuv
                                                                    : bookingDetails?.Package?.price 
                                                    )
                                                    : bookingDetails?.value?.fareBreakdown?.total) || 0
                                        )).toFixed(2)}
                                    </span>
                                </div>
                            )}
                            {/* offerPrice use case for drop taxi and outstation estimated price no gst added */}
                             {bookingDetails?.serviceType !== 'AUTO' && bookingDetails?.serviceType !== 'RIDES'&& (bookingDetails?.status === BOOKING_STATUS.END_OTP || (bookingDetails?.status === BOOKING_STATUS.ENDED &&(isDropTaxiBooking(bookingDetails) || isOutstationBooking(bookingDetails))) 
                            )  && (
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Estimated Price{inclTaxLabel}:</span>
                                    <span className="text-gray-900 font-medium">
                                        ₹ {getSafePremiumEstimatedPrice(Number(bookingDetails?.estimatedFareBreakdown?.total || bookingDetails?.value?.fareBreakdown?.total || 0)).toFixed(2)}
                                    </span>
                                </div>
                            )}
                                {/* {bookingDetails?.offerPrice > 0 && (
                                    <div className="flex flex-col-2 gap-2">
                                        <span className="text-gray-500 font-semibold">Driver Accepted Price:</span>
                                        <span className="text-gray-900 font-medium">₹ {bookingDetails?.offerPrice}</span>
                                    </div>
                                )} */}
                               
                                {bookingDetails?.status !== BOOKING_STATUS.ENDED && bookingDetails?.totalPrice > 0 && (
                                    <div className="flex flex-col-2 gap-2">
                                        <span className="text-gray-500 font-semibold">Total Price:</span>
                                        <span className="text-gray-900 font-medium">₹ {Number(bookingDetails?.totalPrice || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                {bookingDetails?.discount?.percentage > 0 && bookingDetails?.serviceType !== 'AUTO' && shouldShowQuotePricing(bookingDetails) && (
                                    <>
                                    {bookingDetails?.status !== 'ENDED' && bookingDetails?.status !== 'END_OTP' && (
                                        <div className="flex flex-col-2 gap-2">
                                            <span className="text-gray-500 font-semibold">Discount Applied:</span>
                                            <span className="text-gray-900 font-medium">{bookingDetails?.discount?.percentage} %</span>
                                        </div>
                                    )}
                                    {bookingDetails?.status !== 'PAYMENT_REQUESTED'&&bookingDetails?.status !== 'ENDED'&&bookingDetails?.status !== 'END_OTP' && bookingDetails?.serviceType !== 'AUTO' && !isHourlyShowingPrice(bookingDetails) && (
                                        bookingDetails?.serviceType !== 'RIDES' ||  ( bookingDetails?.serviceType === 'RIDES' && !['END_OTP', 'ENDED'].includes(bookingDetails?.status) )
                                        )  && shouldShowQuotePricing(bookingDetails) && (
                                            <div className="flex flex-col-2 gap-2">
                                                <span className="text-gray-500 font-semibold">Total estimated Fare:</span>
                                                <span className="text-gray-900 font-medium">
                                                    ₹ {(() => {
                                                        let basePrice;
                                                        const discountPercentage = bookingDetails?.discount?.percentage || 0;

                                                        if (bookingDetails?.packageType === 'Local') {
                                                            if (bookingDetails?.serviceType === 'RENTAL') {
                                                                const carType = bookingDetails?.carType?.toUpperCase();
                                                                basePrice = carType === 'MINI' ? bookingDetails?.Package?.price :
                                                                    carType === 'SUV' ? bookingDetails?.Package?.priceSuv :
                                                                    carType === 'MUV' ? bookingDetails?.Package?.priceMVP :
                                                                    carType === 'SEDAN' ? bookingDetails?.Package?.priceSedan :
                                                                    bookingDetails?.Package?.price;
                                                            } else if (bookingDetails?.serviceType === 'DRIVER') {
                                                                basePrice = bookingDetails?.carType?.toUpperCase() === 'MUV'
                                                                    ? bookingDetails?.Package?.priceMVP
                                                                    : bookingDetails?.Package?.price;
                                                            }
                                                        } else {
                                                            basePrice = bookingDetails?.value?.estimatedPrice;
                                                        }

                                                        return basePrice && basePrice !== 'N/A'
                                                            ? (basePrice - (basePrice * discountPercentage / 100)).toFixed(2)
                                                            : 'N/A';
                                                    })()}
                                                </span>
                                            </div>
                                        )}
                                        {bookingDetails?.status === 'PAYMENT_REQUESTED' && (
                                            <div className="flex flex-col-2 gap-2">
                                                <span className="text-gray-500 font-semibold">Total{inclTaxLabel}:</span>
                                                <span className="text-gray-900 font-medium">
                                                    ₹ {Math.round(Number(bookingDetails?.paymentDetails?.details?.amountAfterGst || 0))}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                              
                                {bookingDetails?.paymentDetails?.details?.discountAmount > 0 && bookingDetails?.status !=="ENDED" && bookingDetails?.status !== 'END_OTP' && shouldShowQuotePricing(bookingDetails) &&(
                                    <div className="flex flex-col-2 gap-2">
                                        <span className="text-gray-500 font-semibold">Discount Applied:</span>
                                        <span className="text-gray-900 font-medium">  ₹ {bookingDetails?.paymentDetails?.details?.discountAmount} </span>
                                </div>
                                )} 
                                {bookingDetails?.status === BOOKING_STATUS.ENDED && (
                                    <>
                            
                                {bookingDetails?.totalPrice > 0  && bookingDetails?.serviceType !== 'DRIVER' && (
                                    <div className="flex flex-col-2 gap-2">
                                        <span className="text-gray-500 font-semibold"> Trip Fare:</span>
                                        <span className="text-gray-900 font-medium">₹ {Number(bookingDetails?.totalPrice || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                 {bookingDetails?.totalPrice > 0 && bookingDetails?.serviceType === 'DRIVER' && (
                                    <div className="flex flex-col-2 gap-2">
                                       <span className="text-gray-500 font-semibold"> {bookingDetails?.toDate ? 'Price:' : 'Package Price:'}</span>
                                        <span className="text-gray-900 font-medium">₹ {Number(bookingDetails?.totalPrice || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                 {bookingDetails?.paymentDetails?.details?.walletAmountUsed !== 0 && bookingDetails?.paymentDetails?.details?.walletAmountUsed &&
                                    <div className="flex flex-col-2 gap-2">
                                        <span className="text-gray-500 font-semibold">Wallet Points Used:</span>
                                        <span className="text-gray-900 font-medium">₹ {Math.round(Number(bookingDetails?.paymentDetails?.details?.walletAmountUsed || 0))}</span>
                                    </div>
                                }



                                {bookingDetails?.paymentDetails?.details?.discountPercentage > 0 && bookingDetails?.serviceType !== 'AUTO' && bookingDetails?.status !=='ENDED' && bookingDetails?.status !== 'END_OTP' && (
                                    <div className="flex flex-col-2 gap-2">
                                        <span className="text-gray-500 font-semibold">Discount Applied:</span>
                                        <span className="text-gray-900 font-medium">{bookingDetails?.paymentDetails?.details?.discountPercentage} %</span>
                                </div>
                                )}                                                                                                                         
                        </>)}
                         {bookingDetails?.discount?.amount > 0 &&  bookingDetails?.serviceType !== 'AUTO' && bookingDetails?.status !== 'ENDED' && bookingDetails?.status !== 'END_OTP' && shouldShowQuotePricing(bookingDetails) &&(
                                             <div  className="flex flex-col-2 gap-2">                                                                       
                                            <span className="text-gray-500 font-semibold">Discount Applied:</span>
                                            <span className="text-gray-900 font-medium">₹ {bookingDetails?.discount?.amount} </span>
                                            </div>
                                        )}
                                        {bookingDetails?.discount?.amount > 0  && bookingDetails?.status !== 'ENDED' && bookingDetails?.status !== 'END_OTP' &&  bookingDetails?.serviceType !== 'AUTO' && !isHourlyShowingPrice(bookingDetails)&& shouldShowQuotePricing(bookingDetails) && (
                                          <div className="flex flex-col-2 gap-2">  
                                        <span className="text-gray-500 font-semibold">Total estimated Fare:</span>
                                        <span className="text-gray-900 font-medium">₹ {Number(
                                            (bookingDetails?.value?.estimatedPrice || 0) - (bookingDetails?.discount?.amount || 0)
                                        ).toFixed(2)}</span>
                                            </div>
                                        )}
                         {bookingDetails?.status === BOOKING_STATUS.END_OTP && (
                            <>
                            <div className="">
                                {finalPaymentPirces.discountAmount > 0 && (
                                    <div className="flex flex-col-2 gap-2">
                                        <span className="text-gray-500 font-semibold">Customer Discount Applied:</span>
                                        <span className="text-gray-900 font-medium">₹ {Math.round(Number(finalPaymentPirces.discountAmount || 0))}</span>
                                    </div>
                                )}
                            </div>
                                {finalPaymentPirces.customerWalledUsed > 0 && (
                                    <div className="flex flex-col-2 gap-2">
                                        <span className="text-gray-500 font-semibold">Customer Wallet Points Used:</span>
                                        <span className="text-gray-900 font-medium">{finalPaymentPirces.customerWalledUsed}</span>
                                    </div>
                                )}
                                {finalPaymentPirces.driverWalletAdded > 0 && (
                                    <div className="flex flex-col-2 gap-2">
                                        <span className="text-gray-500 font-semibold">Driver Wallet Points Added:</span>
                                        <span className="text-gray-900 font-medium">{finalPaymentPirces.driverWalletAdded}</span>
                                    </div>
                                )}
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Total{inclTaxLabel}:</span>
                                    <span className="text-gray-900 font-semibold">₹ {Number(finalPaymentPirces.amountAfterGST || 0).toFixed(2)}</span>
                                </div>
                        </>)}

                                        {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW &&
                                            adminDiscountEffective &&
                                            visibleAdminDiscountValue > 0 && (
                                            <>
                                                <div className="flex flex-col-2 gap-2">
                                                    <span className="text-gray-500 font-semibold">Admin Discount Applied</span>
                                                    <span className="text-gray-900 font-medium">
                                                        ({visibleAdminDiscountType === "PERCENTAGE"
                                                            ? `${Number(visibleAdminDiscountValue || 0).toFixed(2)} % : ₹ ${Number(adminDiscountAmountOnQuoteTotal || 0).toFixed(2)}`
                                                            : `₹ ${Number(adminDiscountAmountOnQuoteTotal || 0).toFixed(2)}`
                                                        })
                                                    </span>
                                                </div>
                                                {Number(systemDiscountAmount || 0) > 0 && (
                                                    <>
                                                        <div className="flex flex-col-2 gap-2">
                                                            <span className="text-gray-500 font-semibold">System Discount Applied:</span>
                                                            <span className="text-gray-900 font-medium">
                                                                {systemDiscountType === "PERCENTAGE"
                                                                    ? `${systemDiscountValue.toFixed(2)} %`
                                                                    : `₹ ${Math.round(systemDiscountValue)}`
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col-2 gap-2">
                                                            <span className="text-gray-500 font-semibold">System Discount Amount:</span>
                                                            <span className="text-gray-900 font-medium">₹ {Number(systemDiscountAmount || 0).toFixed(2)}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                          {bookingDetails?.paymentDetails?.details?.discountAmount > 0  && bookingDetails?.serviceType !== 'AUTO' &&(
                                    <div className="flex flex-col-2 gap-2">
                                        <span className="text-gray-500 font-semibold">Total Discount Applied:</span>
                                        <span className="text-gray-900 font-medium">  ₹ {bookingDetails?.paymentDetails?.details?.discountAmount} </span>
                                </div>
                                )}
                                        {quoteCancelChargeApplicable && shouldShowQuotePricing(bookingDetails) && (
                                            <div className="flex flex-col-2 gap-2">
                                                <span className="text-gray-500 font-semibold">Cancel Charge Added:</span>
                                                <span className="text-gray-900 font-medium">
                                                    ₹ {Math.round(Number(quoteCancelChargeAmount || 0))} ({quoteCancelChargePaid ? "Paid" : "Unpaid"})
                                                </span>
                                            </div>
                                        )}
                                    {Number(amount?.total || 0) > 0 && (
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Total Collected Amount {inclTaxLabel}:</span>
                                    <span className="text-gray-900 font-semibold">₹ {Number(amount?.total || 0).toFixed(2)}</span>
                                </div>
                                    )}
                                        {/* {shouldShowQuotePricing(bookingDetails) && (
                                            <div className="flex flex-col-2 gap-2">
                                                <span className="text-gray-500 font-semibold">{finalTotalLabel}</span>
                                                <span className="text-gray-900 font-medium">
                                                    ₹ {Math.max(0, Number(finalEstimatedFareAfterDiscountsWithCancelCharge || 0)).toFixed(2)}
                                                </span>
                                            </div>
                                        )} */}
                    </div>                            

                        
                       
                    
                    </CardBody>
                </Card>

                <Card className="mb-4 rounded-2xl border border-gray-100 shadow-sm">
                    <CardBody className="space-y-5">
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-900">Location Details</span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Pickup:</span>
                                <span className="text-gray-900 font-medium">{bookingDetails?.pickupAddress?.name}</span>
                            </div>
                            <div className="flex flex-col-2 gap-2">
                                <span className="text-gray-500 font-semibold">Drop-off:</span>
                                <span className="text-gray-900 font-medium">
                                    {bookingDetails?.dropAddress?.name || bookingDetails?.endAddress?.name || "Not Added"}
                                </span>
                            </div>
                            {bookingDetails?.packageType !== 'Local' && bookingDetails?.serviceType !== 'DRIVER' && (bookingDetails?.driverStartAddress?.name?.trim() || Number(bookingDetails?.value?.driverWithin) > 0) && (
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">{bookingDetails?.serviceType === 'AUTO' ? 'Auto' : 'Cab'} Starting Points:</span>
                                    <span className="text-gray-900 font-medium">
                                        {bookingDetails?.driverStartAddress?.name || `${Number(bookingDetails?.value?.driverWithin).toFixed(2)} km`}
                                    </span>
                                </div>
                            )}
                            {bookingDetails?.status !== "QUOTED" && bookingDetails?.serviceType !== "PARCEL" &&(
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">Start OTP:</span>
                                    <span className="text-gray-900 font-medium">
                                        {bookingDetails?.startOtp || "Not Added"}
                                    </span>
                                </div>
                            )}
                            {shouldShowEndOtp && bookingDetails?.serviceType !== "RIDES" && bookingDetails?.serviceType !== "AUTO" && (
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">End OTP:</span>
                                    <span className="text-gray-900 font-medium">
                                        {bookingDetails?.endOtp || "Not Added"}
                                    </span>
                                </div>
                            )}
                            {bookingDetails?.landmark !== null && (
                                <div className="flex flex-col-2 gap-2">
                                    <span className="text-gray-500 font-semibold">LandMark:</span>
                                    <span className="text-gray-900 font-medium">
                                        {bookingDetails?.landmark || "Not Added"}
                                    </span>
                                </div>
                            )}
                        </div>
                        {bookingDetails?.serviceType === 'RENTAL' && bookingDetails?.packageType === "Outstation" && (
                            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-4">
                                <div className="flex justify-between items-center gap-4">
                                    <div className="flex gap-2 text-sm">
                                        <p className="text-gray-500 font-semibold">Cab Ending Point:</p>
                                        <p className="text-gray-900 font-medium">
                                            {bookingDetails?.driverEndAddress?.name || `${bookingDetails?.value?.driverEndPoint} km`}
                                        </p>
                                    </div>
                                    {bookingDetails?.status !== "ENDED" && (
                                <Button
                                    size="sm"
                                    color="blue"
                                    onClick={() => {
                                        setDriverEndAddress(bookingDetails?.driverEndAddress?.name || "");
                                        setDriverEndPlaceId(bookingDetails?.driverEndAddress?.placeId || "");
                                        setDriverEndSuggestions([]);
                                        setIsEditingDriverEnd(true);
                                        }}
                                    className="flex items-center gap-2 px-3 py-2"
                                    disabled={loading}
                                >
                                        <PencilIcon className="h-4 w-4" />
                                </Button>
                                    )}
                                </div>
                                {isEditingDriverEnd && (
                                <div className="space-y-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={driverEndAddress}
                                        onChange={(e) => {
                                        const query = e.target.value;
                                        setDriverEndAddress(query);
                                        setDriverEndPlaceId("");
                                        if (query.length > 2) {
                                            searchDriverEndLocations(query);
                                        } else {
                                            setDriverEndSuggestions([]);
                                        }
                                        }}
                                        placeholder="Search driver ending location..."
                                        className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                                    />
                                    {driverEndSuggestions.length > 0 && (
                                        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {driverEndSuggestions.map((suggestion, index) => (
                                            <li
                                            key={index}
                                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0"
                                            onClick={() => {
                                                handleSelectDriverEndLocation(getSuggestionText(suggestion), getSuggestionPlaceId(suggestion));
                                            }}
                                            >
                                            <div className="flex flex-col">
                                                <span className="font-bold text-black">{getSuggestionTitle(suggestion)}</span>
                                                {getSuggestionText(suggestion) !== getSuggestionTitle(suggestion) && (
                                                    <span className="text-xs text-gray-600">{getSuggestionText(suggestion)}</span>
                                                )}
                                            </div>
                                            </li>
                                        ))}
                                        </ul>
                                    )}
                                    </div>
                                    <div className="flex gap-3">
                                    <Button
                                        size="sm"
                                        variant="outlined"
                                        color="gray"
                                        onClick={() => {
                                        setIsEditingDriverEnd(false);
                                        setDriverEndAddress("");
                                        setDriverEndPlaceId("");
                                        setDriverEndSuggestions([]);
                                        setSelectedDriverEndLocation(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outlined"
                                        color="green"
                                        onClick={() => {
                                        handleSaveDriverEndLocation();
                                        }}
                                    >
                                        Save
                                    </Button>
                                    </div>
                                </div>
                                )}
                            </div>
                            )}
                    </CardBody>
                </Card>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {bookingDetails?.serviceType === 'PARCEL' && bookingDetails?.paymentStatus === 'PAID' && (
                <Card className="mb-4 rounded-2xl border border-gray-100 shadow-sm">
                    <CardBody className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
                            <span>Parcel Payment Details</span>
                        </div>
                        <div>
                            <div className="space-y-4 gap-2">
                                <span className=" text-gray-500 font-semibold">Payment Collected by</span> : <span className="text-gray-900 font-medium">{bookingDetails?.paymentCollected}</span>
                                <div>
                                    <span className="text-gray-500 font-semibold">Payment Method</span> : <span className="text-gray-900 font-medium">{bookingDetails?.paymentMethod}</span></div>
                                <div>
                                <span className="text-gray-500 font-semibold">Payment Status</span> : <span className="text-gray-900 font-medium">{bookingDetails?.paymentStatus}</span>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-2">
                {shouldShowReceipt && (
                    <Card className="mb-4 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-4">
                        <div className="flex justify-center items-center mb-2">
                            <span className="mr-2 font-semibold text-lg text-center text-gray-900">Receipt</span>
                        </div>
                        <hr className="my-2" />
                        <div className="space-y-2">
                            {/* <div className="mt-3">
                            <div className="flex justify-between">
                                <Typography color="gray" variant="h6">Company Name: </Typography>
                                <Typography color="gray" variant="small">{COMPANY_NAME}</Typography>
                            </div>
                            <div className="flex justify-between">
                                <Typography color="gray" variant="h6">GST Number: </Typography>
                                <Typography color="gray" variant="small">{GST_NUMBER}</Typography>
                            </div>
                        </div> */}

                            <div className="mt-4">
                                {/* <div className="flex justify-between">
                                <Typography color="gray" variant="h6">Package:</Typography>
                                <Typography>{`${bookingDetails?.Package?.period} ${bookingDetails?.packageType === "Outstation" ? "d" : bookingDetails?.packageType === "Local" ? "hr" : ""
                                    }`}</Typography>
                            </div> */}
                            {/* { bookingDetails?.serviceType !== "RIDES" && bookingDetails?.packageType !== 'Local' && bookingDetails?.bookingType !=="DROP ONLY" &&(
                                <div className="flex justify-between">
                                <Typography color="gray" variant="h6">Estimate Hrs:</Typography>
                                <Typography>{bookingDetails?.value?.displayTime || '0'}</Typography>
                                </div>
                            )} */}
                            {hasExtraHours && (bookingDetails?.serviceType === "RIDES" || bookingDetails?.serviceType === "DRIVER" || (bookingDetails?.serviceType === "RENTAL" && bookingDetails?.packageType === "Local")) && (
                                <div className="flex justify-between  my-1">
                                    <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Extra Hrs:</Typography>
                                    <Typography color="gray" variant="sm" className="text-sm text-black font-medium"> {minsToHHMM(extraHoursMinutes)}
                                    </Typography>
                                </div>
                            )}
                            
                                {bookingDetails?.estimatedMin > 0 && 
                                <div className="flex justify-between  my-1">
                                        <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Estimate Hours:</Typography>
                                         <Typography className="text-sm text-black font-medium">{minsToHHMM(bookingDetails?.estimatedMin)}</Typography>
                                </div>
                                }
                                {hasExtraHours && (bookingDetails?.serviceType == "RENTAL" && bookingDetails?.packageType != "Local") && (
                                <div className="flex justify-between  my-1">
                                    <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Extra Hrs  : </Typography>
                                    <Typography color="gray" variant="sm" className="text-sm text-black font-medium">
                                        {minsToHHMM(extraHoursMinutes)}
                                    </Typography>
                                </div>
                                )}
                       {bookingDetails?.startTime && bookingDetails?.endedTime && getTotalDurationMinutes(bookingDetails.startTime, bookingDetails.endedTime) !== null && (
                                <div className="flex justify-between  my-1">
                                        <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Total Hours:</Typography>
                                         <Typography className="text-sm text-black font-medium">
                                            {minsToHHMM(getTotalDurationMinutes(bookingDetails.startTime, bookingDetails.endedTime))}
                                        </Typography>
                                </div>
                                )}
                                {bookingDetails?.packageType !== 'Local' && bookingDetails?.serviceType !== 'DRIVER' && bookingDetails?.serviceType !== 'RENTAL_DROP_TAXI'  &&
                                    <div className="flex justify-between my-1">
                                    <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Estimate km:</Typography>
                                    <Typography className="text-sm text-black font-medium">
                                        {Number(bookingDetails?.estimatedDistance || 0).toFixed(2)} Km
                                    </Typography>
                                    </div>

                                }
                                {bookingDetails?.serviceType !== "RIDES" && bookingDetails?.serviceType !== 'AUTO' && bookingDetails?.serviceType !== 'PARCEL' && <>
                                <div className="flex justify-between  my-1">
                                    <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Start KM:</Typography>
                                    <Typography className="text-sm text-black font-medium">{bookingDetails?.startKM}</Typography>
                                </div>


                                <div className="flex justify-between  my-1">
                                    <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">End KM:</Typography>
                                    <Typography className="text-sm text-black font-medium">{bookingDetails?.endKM}</Typography>
                                </div>
                                </>
                                }
                               {bookingDetails?.extraKMs > 0 && bookingDetails?.serviceType !== 'RIDES' && bookingDetails?.serviceType !== 'AUTO' &&
                                <div className="flex justify-between  my-1">
                                    <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Extra KMs:</Typography>
                                    <Typography className="text-sm text-black font-medium"> {Number(bookingDetails?.extraKMs).toFixed(2)}</Typography>
                                </div>
                                 }
                                  {bookingDetails?.finalFareBreakdown?.extraKm?.kilometers > 0  && (
                                <div className="flex justify-between my-1">
                                    <Typography 
                                    color="gray" 
                                    variant="sm" 
                                    className="text-sm text-gray-500 font-semibold"
                                    >
                                    Extra Distance ({Number(bookingDetails.finalFareBreakdown.extraKm.kilometers).toFixed(1)} km × ₹{bookingDetails.finalFareBreakdown.extraKm.rate})
                                    </Typography>
                                    <Typography className="text-sm text-black font-medium">
                                    ₹ {Math.round(Number(bookingDetails.finalFareBreakdown.extraKm.charge || 0))}
                                    </Typography>
                                </div>
                                )}
                                 {Number(bookingDetails?.value?.driverWithin || 0) > 0 && bookingDetails?.packageType !== "Local" &&<div className="flex justify-between  my-1">
                                    <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Driver to Pickup Distance</Typography>
                                    <Typography className="text-sm text-black font-medium">
                                        {(Number(bookingDetails?.value?.driverWithin + 2 || 0)).toFixed(2)} Km
                                    </Typography>
                                </div>}
                                {bookingDetails?.serviceType !== 'RIDES' && bookingDetails?.serviceType !== 'AUTO' &&  bookingDetails?.serviceType !== "PARCEL" &&
                                <div className="flex justify-between  my-1">
                                    <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Total KM:</Typography>
                                    <Typography className="text-sm text-black font-medium">
                                        {bookingDetails?.endKM  ?( (bookingDetails.endKM - bookingDetails.startKM)+
                                         (bookingDetails?.value?.driverWithin || 0)).toFixed(2) : "0.00"} km
                                    </Typography>
                                </div>}
                                {bookingDetails?.serviceType === 'AUTO'  || bookingDetails?.serviceType === 'RIDES' &&
                                
                                        <div className="flex justify-between  my-1">
                                            <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Total KM:</Typography>
                                            <Typography className="text-sm text-black font-medium">{(Number(bookingDetails?.totalDistanceKilometer) + Number(bookingDetails?.value?.driverWithin)).toFixed(2)} Kms</Typography>
                                        </div>
                                    
                                 }
                                 {bookingDetails?.serviceType === 'PARCEL' &&
                                
                                        <div className="flex justify-between  my-1">
                                            <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Total KM:</Typography>
                                            <Typography className="text-sm text-black font-medium">{(Number(bookingDetails?.totalDistanceKilometer).toFixed(2))} Kms</Typography>
                                        </div>
                                    
                                 }

                                {/* <div className="flex justify-between">
                                <Typography color="gray" variant="sm">Total:</Typtext-sm ography>
                                <Typography style={{
                                    fontWeight: 'bold'
                                }}>₹ {amount?.total}</Typography>
                            </div> */}
                                {/* Amount After Gst:  */}
                                <div className="flex justify-between  my-1">
                                    <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Start Time:</Typography>
                                    <Typography className="text-sm text-black font-medium">{moment(bookingDetails.startTime).format("DD-MM-YYYY / hh:mm A")}</Typography>
                                    {/* <Typography>moment{bookingDetails.startTime}</Typography> */}
                                </div>


                                <div className="flex justify-between  my-1">
                                    <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">End Time:</Typography>
                                    <Typography className="text-sm text-black font-medium">{moment(bookingDetails.endedTime).format("DD-MM-YYYY / hh:mm A")}</Typography>
                                    {/* <Typography>{bookingDetails?.endedTime}</Typography> */}
                                </div>

                                {/* {bookingDetails?.extraHourPrice >0 &&
                                <div className="flex justify-between">
                                    <Typography color="gray" variant="sm">Extra Hrs:<text-sm /Typography>
                                     <Typography>{bookingDetails?.extraHourPrice}</Typography>     
                                </div>
                                } */}


                                {bookingDetails?.extraKM > 0 &&
                                    <div className="flex justify-between  my-1">
                                        <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Extra Per KM Price:</Typography>
                                        <Typography className="text-sm text-black font-medium">₹ {Number(bookingDetails?.extraKMPrice || 0).toFixed(2)}</Typography>
                                    </div>
                                }
                                {/* {bookingDetails?.extraNightChargePrice > 0 &&
                                    <div className="flex justify-between  my-1">
                                        <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Extra KM Price:</Typography>
                                        <Typography className="text-sm text-black font-medium">₹ {Number(bookingDetails?.extraNightChargePrice || 0).toFixed(2)}</Typography>
                                    </div>
                                } */}
                                {hasExtraHours &&
                                    <div className="flex justify-between  my-1">
                                        <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Extra hrs price (After first 15 mins):</Typography>
                                        <Typography className="text-sm text-black font-medium">₹ {extraHoursRate.toFixed(2)}</Typography>
                                    </div>
                                }
                                {bookingDetails?.packageType === "Local" || bookingDetails?.packageType === "Outstation" ?
                                    <>
                                        {/* <div className="flex justify-between">
                                        <Typography color="gray" variant="sm">Base Fare:<text-sm /Typography>
                                        <Typography>₹ {amount?.price}</Typography>
                                    </div> */}
                                        {hasExtraHours && (bookingDetails?.serviceType == "RENTAL" && bookingDetails?.packageType != "Local") && (
                                            <div className="flex justify-between  my-1">
                                                <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">{`Extra fare after ${bookingDetails?.Package?.period
                                                    } hrs ${bookingDetails?.packageType === "Outstation" ? "d" : bookingDetails?.packageType === "Intercity" ? "hr" : ""}: (${extraHoursMinutes} x ${extraHoursRate})`}</Typography>
                                                <Typography className="text-sm text-black font-medium">₹ {extraHoursCharge.toFixed(2)}</Typography>
                                            </div>)}
                                        {hasExtraHours && (bookingDetails?.serviceType === "RIDES" || bookingDetails?.serviceType === "DRIVER" || (bookingDetails?.serviceType === "RENTAL" && bookingDetails?.packageType === "Local")) && (
                                            <div className="flex justify-between  my-1">
                                                <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">{`Extra fare after ${bookingDetails?.Package?.period
                                                    } hrs ${bookingDetails?.packageType === "Outstation" ? "d" : bookingDetails?.packageType === "Intercity" ? "hr" : ""}: (${minsToHHMM(extraHoursMinutes)} x ${extraHoursRate})`}</Typography>
                                                <Typography className="text-sm text-black font-medium">₹ {extraHoursCharge.toFixed(2)}</Typography>
                                            </div>)}
                                        {/* {amount.extraKMs > 0 &&
                                            <div className="flex justify-between  my-1">
                                                <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">  {`Extrad KM's Fare: (${Number(amount?.extraKMs).toFixed(2)} x ${Number(amount?.extraKMPrice)})`}</Typography>
                                                <Typography className="text-sm text-black font-medium">
                                                    ₹ {Math.round(amount?.extraKMs * amount?.extraKMPrice)}
                                                </Typography>
                                            </div>
                                        } */}
                                        {bookingDetails?.finalFareBreakdown?.driverCharge > 0 &&
                                            <div className="flex justify-between  my-1">
                                                <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Driver Charge: </Typography>
                                                <Typography className="text-sm text-black font-medium">₹ {Number(bookingDetails?.finalFareBreakdown?.driverCharge || 0).toFixed(2)}</Typography>
                                            </div>
                                        }
                                         {bookingDetails?.finalFareBreakdown?.foodCharge > 0 &&
                                            <div className="flex justify-between  my-1">
                                                <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Food Charge</Typography>
                                                <Typography className="text-sm text-black font-medium">₹ {bookingDetails?.finalFareBreakdown?.foodCharge}</Typography>
                                            </div>
                                        }
                                        {bookingDetails?.paymentDetails?.details?.waitingCharge > 0 &&
                                            <div className="flex justify-between  my-1">
                                                <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Waiting Charge</Typography>
                                                <Typography className="text-sm text-black font-medium">₹ {bookingDetails?.paymentDetails?.details?.waitingCharge}</Typography>
                                            </div>
                                        }
                                        {bookingDetails?.paymentDetails?.details?.cancelCharge  > 0 &&
                                            <div className="flex justify-between  my-1">
                                                <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Cancellation Charge</Typography>  
                                                <Typography className="text-sm text-black font-medium">₹ {bookingDetails?.paymentDetails?.details?.cancelCharge}</Typography>
                                            </div>
                                        }
                                    </> : ""
                                }
                                {bookingDetails?.finalFareBreakdown?.nightCharge > 0 &&
                                    <div className="flex justify-between  my-1">
                                        <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">{`Night Charge: ₹ (${bookingDetails?.finalFareBreakdown?.nightCharge})`}</Typography>
                                        <Typography className="text-sm text-black font-medium">₹ {Number(bookingDetails?.finalFareBreakdown?.nightCharge || 0).toFixed(2)}</Typography>
                                    </div>
                                }
                                <hr className="my-2" />
                                {finalPaymentPirces.amountBeforeGst > 0 && (
                                    <div className="flex justify-between  my-1">
                                        <span className="text-sm text-gray-500 font-semibold">Amount Before Gst:</span>
                                        <span className="text-sm text-gray-900 font-medium">₹ {Math.round(Number(finalPaymentPirces.amountBeforeGst || 0))}</span>
                                    </div>
                                )}
                                {bookingDetails?.finalFareBreakdown?.primeLocation?.charge > 0 && 
                                <div className="flex justify-between  my-1">
                                    <Typography color="gray" variant="sm" className=" text-gray-500 text-sm font-semibold">Prime Location Charge:</Typography>
                                    <Typography className="text-sm text-black font-medium">₹ {(Number(bookingDetails?.estimatedFareBreakdown?.primeLocation?.charge)).toFixed(2)}</Typography>
                                </div>
                                }
                                {(BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW || quoteCancelChargeApplicable) && (
                                    <>
                                        {BOOKING_FEATURES.ADMIN_DISCOUNT_FLOW && visibleAdminDiscountValue > 0 && (
                                            <>
                                                <div className="flex justify-between my-1">
                                                    <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Admin Discount Percentage:</Typography>
                                                    <Typography className="text-sm text-black font-medium">
                                                        {visibleAdminDiscountType === "PERCENTAGE"
                                                            ? `${Number(visibleAdminDiscountValue || 0).toFixed(2)} % : ₹ ${Number(adminDiscountAmountOnQuoteTotal || 0).toFixed(2)}`
                                                            : `₹ ${Number(adminDiscountAmountOnQuoteTotal || 0).toFixed(2)}`
                                                        }
                                                    </Typography>
                                                </div>
                                                {Number(systemDiscountAmount || 0) > 0 && (
                                                    <>
                                                        <div className="flex justify-between my-1">
                                                            <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">System Discount Applied:</Typography>
                                                            <Typography className="text-sm text-black font-medium">
                                                                {systemDiscountType === "PERCENTAGE"
                                                                    ? `${Number(systemDiscountValue || 0).toFixed(2)} %`
                                                                    : `₹ ${Math.round(Number(systemDiscountValue || 0))}`
                                                                }
                                                            </Typography>
                                                        </div>
                                                        <div className="flex justify-between my-1">
                                                            <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">System Discount Amount:</Typography>
                                                            <Typography className="text-sm text-black font-medium">₹ {Number(systemDiscountAmount || 0).toFixed(2)}</Typography>
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                        {quoteCancelChargeApplicable && (
                                            <div className="flex justify-between my-1">
                                                <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Cancel Charge Added:</Typography>
                                                <Typography className="text-sm text-black font-medium">
                                                    ₹ {Math.round(Number(quoteCancelChargeAmount || 0))} ({quoteCancelChargePaid ? "Paid" : "Unpaid"})
                                                </Typography>
                                            </div>
                                        )}
                                    </>
                                )}
                                {bookingDetails?.totalPrice > 0 &&
                                    <div className="flex justify-between  my-1">
                                        <Typography color="gray" variant="sm" className=" text-gray-500 text-sm font-semibold">Final Trip Fare:</Typography>
                                        <Typography className="text-sm text-black font-medium">₹ {Number(bookingDetails?.totalPrice || 0).toFixed(2)}</Typography>
                                    </div>
                                }
                                {bookingDetails?.paymentDetails?.details?.discountAmount !== 0 && bookingDetails?.paymentDetails?.details?.discountAmount &&
                                    <div className="flex justify-between  my-1">
                                        <Typography color="red" variant="sm" className="text-sm text-gray-500 font-semibold">Total Discount Applied:</Typography>
                                        <Typography color="red" variant="sm" className="text-sm text-black font-medium"> - ₹ {Math.round(Number(bookingDetails?.paymentDetails?.details?.discountAmount || 0))}</Typography>
                                    </div>
                                }
                                {bookingDetails?.paymentDetails?.details?.walletAmountUsed !== 0 && bookingDetails?.paymentDetails?.details?.walletAmountUsed &&
                                    <div className="flex justify-between  my-1">
                                        <Typography variant="sm" className="text-sm  text-red-400 font-semibold">Wallet Points Used:</Typography>
                                        <Typography variant="sm" className="text-sm  text-red-400">- ₹ {Math.round(Number(bookingDetails?.paymentDetails?.details?.walletAmountUsed || 0))}</Typography>
                                    </div>
                                }
                                {/* moved above Total */}
                                {/* Amount After Gst:  */}
                                {bookingDetails?.paymentDetails?.details?.gstAmount > 0 && (
                                <div className="flex justify-between  my-1">
                                    <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">TAX:</Typography>
                                    <Typography className="text-sm text-black font-medium">₹ {Math.round(Number(bookingDetails?.paymentDetails?.details?.gstAmount || 0))}</Typography>
                                </div>
                                )}

                                <hr className="my-2" />
                                {Number(bookingDetails?.paymentDetails?.details?.amountAfterGst || 0) > 0 && (
                                    <div className="flex justify-between  my-1">
                                        <span className="text-gray-500 font-semibold">Total:</span>
                                        <span className="text-gray-900 font-medium">₹ {Math.round(Number(bookingDetails?.paymentDetails?.details?.amountAfterGst || 0))}</span>
                                    </div>
                                )}
                                 {/* <hr className="my-2" /> */}
                                {bookingDetails?.serviceType === 'PARCEL' && (
                                    <>
                                    {/* <Typography color="gray" variant="sm" className="text-sm text-black font-semibold">Parcel Booking Surcharges:</Typography> */}
                                     {bookingDetails?.finalFareBreakdown?.surcharges?.zone > 0 && (
                                     <div className="flex justify-between  my-1">
                                        <span className="text-gray-500 font-semibold">zone:</span>
                                        <span className="text-gray-900 font-medium">₹ {Number(bookingDetails?.finalFareBreakdown?.surcharges?.zone || 0).toFixed(2)}</span>
                                    </div>
                                    )}
                                    {bookingDetails?.finalFareBreakdown?.surcharges?.night > 0 && (
                                     <div className="flex justify-between  my-1">
                                        <span className="text-gray-500 font-semibold">night:</span>
                                        <span className="text-gray-900 font-medium">₹ {Number(bookingDetails?.finalFareBreakdown?.surcharges?.night || 0).toFixed(2)}</span>
                                    </div>
                                    )}
                                    {bookingDetails?.finalFareBreakdown?.surcharges?.weight > 0 && (
                                     <div className="flex justify-between  my-1">
                                        <span className="text-gray-500 font-semibold">weight:</span>
                                        <span className="text-gray-900 font-medium">₹ {Number(bookingDetails?.finalFareBreakdown?.surcharges?.weight || 0).toFixed(2)}</span>
                                    </div>
                                    )}
                                    {bookingDetails?.finalFareBreakdown?.surcharges?.weather > 0 && (
                                     <div className="flex justify-between  my-1">
                                        <span className="text-gray-500 font-semibold">weather:</span>
                                        <span className="text-gray-900 font-medium">₹ {Number(bookingDetails?.finalFareBreakdown?.surcharges?.weather || 0).toFixed(2)}</span>
                                    </div>
                                    )}
                                    {bookingDetails?.finalFareBreakdown?.surcharges?.handling > 0 && (

                                     <div className="flex justify-between  my-1">
                                        <span className="text-gray-500 font-semibold">handling:</span>
                                        <span className="text-gray-900 font-medium">₹ {Number(bookingDetails?.finalFareBreakdown?.surcharges?.handling || 0).toFixed(2)}</span>
                                    </div> 
                                    )}
                                    </>
                                )}
                                 <hr className="my-2" />





                                {/* Additional Charges Section */}

                                {bookingDetails?.serviceType !== 'RIDES' && bookingDetails?.serviceType !== 'AUTO' && bookingDetails?.serviceType !== 'DRIVER' && bookingDetails?.serviceType !== 'PARCEL' && (
                                    <>
                                        <hr className="my-2" />
                                        <div className="flex justify-between items-center mb-2">
                                  {(
                                    (bookingDetails?.status === "ENDED" &&  Object.values(additionalCharges).some(val => val > 0)) || bookingDetails?.status === "END_OTP") && (
                                            <Typography
                                                variant="sm"
                                                className="text-sm font-semibold text-blue-700 mr-2"
                                            >
                                                Additional Charges
                                            </Typography>
                                            )}
                                            {bookingDetails?.serviceType !== 'RIDES' && bookingDetails?.serviceType !== 'AUTO' && bookingDetails?.status !== 'ENDED' && (
                                                <button
                                                    onClick={() => setIsEditingAdditionalCharges(!isEditingAdditionalCharges)}
                                                    className={`p-2 rounded-full transition-all ${isEditingAdditionalCharges ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                                                        }`}
                                                    title={isEditingAdditionalCharges ? "Save Changes" : "Edit Additional Charges"}
                                                >
                                                    {isEditingAdditionalCharges ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <PencilIcon className="w-5 h-5" />
                                                    )}
                                                </button>)}

                                        </div>
                                    </>
                                )}
                                {/* View Mode: Show only non-zero */}
                                {!isEditingAdditionalCharges ? (
                                    <>
                                        {additionalCharges.permit > 0 && <div className="flex justify-between my-1"><span className="font-semibold text-sm text-gray-500">Permit Charge:</span> <b className=" text-black">₹ {additionalCharges.permit}</b></div>}
                                        {additionalCharges.toll > 0 && <div className="flex justify-between my-1"><span className="font-semibold text-sm text-gray-500">Toll Charge:</span> <b className="text-black">₹ {additionalCharges.toll}</b></div>}
                                        {additionalCharges.parking > 0 && <div className="flex justify-between my-1"><span className="font-semibold text-sm text-gray-500">Parking Charge:</span> <b className="text-black">₹ {additionalCharges.parking}</b></div>}
                                        {additionalCharges.hill > 0 && <div className="flex justify-between my-1"><span className="font-semibold text-sm text-gray-500">Hill Charge:</span> <b className="text-black">₹ {additionalCharges.hill}</b></div>}
                                        {/* {cancelTripFare > 0 && <div className="flex justify-between my-1"><span className="font-semibold text-sm text-gray-500">Cancel Charge:</span> <b className="text-black">₹ {cancelTripFare}</b></div>} */}
                                    </>
                                ) : (
                                    /* Edit Mode: Show all 4 fields */
                                    ["permit", "toll", "parking", "hill"].map((type) => (
                                        <div key={type} className="flex justify-between items-center my-2">
                                            <span className="text-gray-600 font-medium">
                                                {type.charAt(0).toUpperCase() + type.slice(1)} Charge:
                                            </span>
                                            <div className="flex items-center gap-2">

                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-24 p-1 text-center border border-gray-500 rounded  focus:ring-gray-700"
                                                    value={additionalCharges[type] || ""}
                                                    onChange={(e) => setAdditionalCharges(prev => ({ ...prev, [type]: +e.target.value || 0 }))}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                                {(() => {
                                    const hasAnyCharge = Object.values(additionalCharges).some(val => val > 0);
                                    const totalExtra = Object.values(additionalCharges).reduce((a, b) => a + b, 0);

                                    // Hide entire section if no charges in view mode
                                    if (!hasAnyCharge && !isEditingAdditionalCharges) return null;

                                    return (

                                        <>

                                            <hr className="my-2" />
                                            <div className="flex justify-between text-lg font-bold">
                                                <span className="text-green-700 font-semibold">Final Amount:</span>
                                                <span className="text-green-700">₹ {Number(finalAmountAfterExtras + cancelTripFare).toFixed(2)}</span>
                                            </div>
                                        </>
                                    )


                                })()}

                                {/* Edit/Save Buttons */}
                                {isEditingAdditionalCharges && (
                                    <div className="flex justify-end gap-3 mt-4">
                                        <Button size="sm" variant="outlined" onClick={() => setIsEditingAdditionalCharges(false)}>
                                            Cancel
                                        </Button>
                                        <Button size="sm" color="green" onClick={() => { handleRecalculateAndSaveExtraCharges(); setIsEditingAdditionalCharges(false); }} disabled={loading}>
                                            Submit
                                        </Button>
                                    </div>
                                )}

                            </div>
                        </div>
                        </div>
                    </Card>
                )                          
             }
                    {(bookingDetails?.status === 'ENDED' || paymentDetails.enable) && bookingDetails?.serviceType !== 'PARCEL' &&
                        <Card>
                            <CardBody>
                                <div className="flex justify-between mb-2">
                                    <span className="text-lg font-semibold text-gray-900">Payment Details</span>
                                </div>
                                <hr className="my-2" />
                                <div className="space-y-2">
                                    {/* Payment Collected */}
                                    <div className="flex flex-col-2 gap-2">
                                        <Typography color="gray" variant="sm"className="text-sm text-gray-500 font-semibold">Collected By:</Typography>
                                        <Typography className="text-sm text-black font-medium">{bookingDetails?.paymentCollected}</Typography>
                                    </div>
                                    {/* Payment Method */}
                                    <div className="flex flex-col-2 gap-10">
                                        <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Method:</Typography>
                                        <Typography className="text-sm text-black font-medium">{bookingDetails?.paymentMethod}</Typography>
                                    </div>
                                    {/* Payment Status */}
                                    <div className="flex flex-col-2 gap-12">
                                        <Typography color="gray" variant="sm" className="text-sm text-gray-500 font-semibold">Status:</Typography>
                                        <Typography className="text-sm text-black font-medium">{bookingDetails?.paymentStatus}</Typography>
                                    </div>
                            {showDetails && bookingDetails?.status === 'ENDED' && (bookingDetails?.tripStatus === false) && (
                                <>

            <div className="space-y-2">
                {/* Trip Type */}
                 <div className="flex justify-between mb-2 mt-2">
                <span className="text-lg font-semibold text-gray-900">Trip Master Details</span>
            </div>
             <hr className="my-2 mb-4" />
               <div className="grid grid-cols-6 gap-x-4 pt-2">
                             <Typography className="text-sm text-gray-500 font-semibold">
                               Fuel Type 
                             </Typography>
                             <Select
                               label="Enter Fuel Type"
                               name="fuelType"
                               value={additionalPaymentDetails.fuelType}
                               onChange={(value) => handleAdditionalChange('fuelType', value)}
                             >
                               <Option value="CNG">CNG</Option>
                               <Option value="PETROL">Petrol</Option>
                               <Option value="DIESEL">Diesel</Option>
                               <Option value="GAS">Gas</Option>
                               <Option value="ELECTRIC">Electric</Option>
                               <Option value="NONE">None</Option>
                             </Select>
                           </div>
                {/* Fuel Cost */}
                <div className="grid grid-cols-6 gap-x-4">
                    <Typography className="text-sm text-gray-500 font-semibold">Fuel Cost:</Typography>
                    <Input
                        type="number"
                        value={additionalPaymentDetails.fuelCost || ""}
                        onChange={(e) => handleAdditionalChange("fuelCost", e.target.value)}
                        placeholder="Enter Fuel Cost"
                        disabled={bookingDetails?.tripStatus === true}
                    />
                </div>

                <div className="grid grid-cols-6 gap-x-4">
                    <Typography className="text-sm text-gray-500 font-semibold">Trip Type:</Typography>
                    <Select
                        label="Select Trip Type"
                        value={additionalPaymentDetails.tripType || ""}
                        onChange={(value) => handleAdditionalChange("tripType", value)}
                        disabled={bookingDetails?.tripStatus === true}
                    >
                        <Option value="Internal">Internal</Option>
                        <Option value="External">External</Option>
                    </Select>
                </div>
                 {/* Notes */}
                {/* <div className="col-span-2">
                    <Typography color="gray" variant="h6" className="mb-1">
                        Notes
                    </Typography>
                    <textarea
                        name="notes"
                        value={additionalPaymentDetails.notes || ""}
                        onChange={(e) => handleAdditionalChange("notes", e.target.value)}
                        placeholder="Enter notes..."
                        className="p-2 w-full border rounded-md h-12"
                        disabled={bookingDetails?.tripStatus === true}
                    />
                </div> */}
            </div>
<div className="mt-4">
<Button
    color="green"
    onClick={async () => {
        setLoading(true);

        // Retrieve userId from local storage
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || "{}");
        const loggedInUserId = loggedInUser.id || 0;

        // Calculate totalKm
        const startKm = bookingDetails?.startKM ? parseFloat(bookingDetails.startKM) : 0;
        const endKm = bookingDetails?.endKM ? parseFloat(bookingDetails.endKM) : 0;
        const rawTotalDistance = Number(bookingDetails?.totalDistanceKilometer);
        const totalKm = Number.isFinite(rawTotalDistance) ? rawTotalDistance.toFixed(2) : Math.max(endKm - startKm, 0).toFixed(2);

        // Construct tripDetails payload
        const tripDetails = {
            bookingId: bookingDetails?.id || null,
            bookingNumber: bookingDetails?.bookingNumber || null,
            // cabId: bookingDetails?.Cab?.id || null,
            driverId: bookingDetails?.Driver?.id || null,
            customerId: bookingDetails?.Customer?.id || null,
            tripDate: bookingDetails?.fromDate ? moment(bookingDetails.fromDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
            vehicleNumber: bookingDetails?.Cab?.carNumber || bookingDetails?.Parcel?.vehicleNumber || bookingDetails?.Auto?.autoNumber|| null,
            driverName: bookingDetails?.Driver?.firstName || null,
            startAddress: bookingDetails?.pickupAddress?.name
                ? makeAddressPayload(bookingDetails.pickupAddress.name, bookingDetails?.pickupAddress?.placeId)
                : null,
            endAddress: (bookingDetails?.dropAddress?.name || bookingDetails?.endAddress?.name)
                ? makeAddressPayload(
                    bookingDetails?.dropAddress?.name || bookingDetails?.endAddress?.name,
                    bookingDetails?.dropAddress?.placeId || bookingDetails?.endAddress?.placeId,
                )
                : null,
            startKm: startKm,
            endKm: endKm,
            totalKm: parseFloat(totalKm),
            fuelType: additionalPaymentDetails.fuelType || 'CNG', // Use dynamic fuelType if available
            fuelCost: additionalPaymentDetails.fuelCost ? parseFloat(additionalPaymentDetails.fuelCost) : 0,
            tripFare: finalAmountAfterExtras ? parseFloat(finalAmountAfterExtras) : 0,
            notes: additionalPaymentDetails.notes || '',
            startLat: bookingDetails?.startLat ? parseFloat(bookingDetails.startLat) : 0,
            startLong: bookingDetails?.startLong ? parseFloat(bookingDetails.startLong) : 0,
            endLat: bookingDetails?.endLat ? parseFloat(bookingDetails.endLat) : 0,
            endLong: bookingDetails?.endLong ? parseFloat(bookingDetails.endLong) : 0,
            toll: bookingDetails?.extraCharges?.tollCharge ? parseFloat(bookingDetails?.extraCharges?.tollCharge) : 0,
            permit: bookingDetails?.extraCharges?.permitCharge ? parseFloat(bookingDetails?.extraCharges?.permitCharge) : 0,
            tripType: additionalPaymentDetails.tripType || 'Internal',
            latitude: bookingDetails?.startLat ? parseFloat(bookingDetails.startLat) : 0, // Included for compatibility
            userId: loggedInUserId || null,
        };
           if (bookingDetails?.Cab?.id) {
                        tripDetails.cabId = bookingDetails.Cab.id;
                      }

        // Validate required fields
        const isParcelBooking = bookingDetails?.serviceType === 'PARCEL';
        const requiredFields = [
            'bookingId',
            'bookingNumber',
            'tripDate',
            // 'vehicleNumber',
            'driverName',
            'startAddress',
            'endAddress',
            ...(!isParcelBooking ? ['startKm', 'endKm'] : []),
            // 'totalKm',
            'fuelType',
            'tripFare',
            'tripType',
            'userId', // Add userId to required fields if it's mandatory
        ];

        const missingFields = requiredFields.filter(field =>
            !tripDetails[field] ||
            tripDetails[field] === null ||
            (typeof tripDetails[field] === 'object' && !tripDetails[field]?.address)
        );

                                    if (missingFields.length > 0) {
                                        console.error("Missing required fields:", missingFields);
                                        Swal.fire({
                                            position: "center",
                                            icon: "error",
                                            title: `Please provide the following required fields: ${missingFields.join(', ')}`,
                                            showConfirmButton: false,
                                            timer: 1500
                                        });
            setLoading(false);
            return;
        }

        // Log the payload for debugging
        // console.log("Trip Details to be sent:", JSON.stringify(tripDetails, null, 2));

        try {
            const response = await ApiRequestUtils.post(API_ROUTES.ADD_TRIP_DETAILS, tripDetails);
            // console.log("API Response:", response);

            if (response?.success) {
                Swal.fire({
                    position: "center",
                    icon: "success",
                    title: "Trip details added successfully",
                    showConfirmButton: false,
                    timer: 1500
                });

                // Refresh parent if needed
                if (typeof props?.onConfirm === "function") {
                    props.onConfirm();
                }

                // Close modal or navigate back
                if (typeof props?.setIsOpen === "function") {
                    props.setIsOpen(false); 
                } else {
                    navigate(backPath); 
                }

            } else {
                Swal.fire({
                    position: "center",
                    icon: "error",
                    title: `Failed to add trip details: ${response?.message || "Unknown error"}`,
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        } catch (err) {
            console.error("Submission error:", err);
            Swal.fire({
                position: "center",
                icon: "error",
                title: "Failed to add trip details. Please try again.",
                showConfirmButton: false,
                timer: 1500
            });
        } finally {
            setLoading(false);
        }
    }}
>
    Complete
</Button>
</div>
                                </>)}


                        </div>

                    </CardBody>
                </Card>
            }                            
            </div>

            {/* {(bookingDetails?.serviceType !== 'DRIVER' && bookingDetails?.serviceType !== 'RIDES' && bookingDetails?.sourceType === null && bookingDetails?.source === 'Mobile App' && bookingDetails?.packageType !== 'Local' && (bookingDetails?.Cab?.carType || bookingDetails?.value?.carType)
            ) && (
                    <div className="bg-white p-6 mt-6 mb-8 rounded-2xl shadow-lg border border-gray-100">
                        <Typography className="font-bold text-xl text-gray-900 pb-2">
                            Terms and Conditions
                        </Typography>
                        <div className="space-y-4 text-gray-700">
                            <Typography className="text-sm">
                                • Toll, parking, permit charges and state tax are <span className="font-bold">excluded</span>.
                            </Typography>
                            <Typography className="text-sm">
                                • For Every extra <span className="font-bold">15 minutes</span>,  <span className="font-bold text-black">₹ 
                                    {bookingDetails?.Cab?.carType === 'Mini'
                                        ? bookingDetails?.Package?.additionalMinCharge
                                        : bookingDetails?.Cab?.carType === 'Sedan'
                                            ? bookingDetails?.Package?.additionalMinChargeSedan
                                            : bookingDetails?.Cab?.carType === 'SUV'
                                                ? bookingDetails?.Package?.additionalMinChargeSuv
                                                : bookingDetails?.Package?.additionalMinChargeMVP}
                                </span> will be charged
                            </Typography>
                            <Typography className="text-sm">
                                • For every extra kilometer  <span className="font-bold text-black">₹ 
                                    {bookingDetails?.Cab?.carType === 'Mini'
                                        ? bookingDetails?.Package?.extraKilometerPrice
                                        : bookingDetails?.Cab?.carType === 'Sedan'
                                            ? bookingDetails?.Package?.extraKilometerPriceSedan
                                            : bookingDetails?.Cab?.carType === 'SUV'
                                                ? bookingDetails?.Package?.extraKilometerPriceSuv
                                                : bookingDetails?.Package?.extraKilometerPriceMVP}
                                </span> will be charged
                            </Typography>
                            <Typography className="text-sm">
                                • Night Charge of <span className="font-bold text-black">₹
                                    {bookingDetails?.Package?.nightCharge}
                                </span> applies if the trip extends past{' '}
                                <span className="font-bold text-black">
                                    {convertTo12HourFormat(bookingDetails?.Package?.nightHoursFrom)}
                                </span>.
                            </Typography>
                        <div className="border border-gray-300 bg-yellow-600 rounded-xl p-2">
                            <Typography
                                className=" text-center text-sm text-gray-700"
                            >
                                {BOOKING_TERMS_AND_CONDITIONS}
                            </Typography>
                        </div>
                        </div>
                    </div>
                )}
{bookingDetails?.packageType === 'Local' && 
 bookingDetails?.serviceType === 'RENTAL' && 
 bookingDetails?.source === 'Mobile App'  && (
  <div className="bg-white p-6 mt-6 mb-8 rounded-2xl shadow-lg border border-gray-100">
    <Typography className="font-bold text-xl text-gray-900 pb-2">
      Terms and Conditions
    </Typography>

    <div className="space-y-4 text-gray-700">
      <Typography className="text-sm">
        • Toll, parking, permits charges and state tax are <span className="font-bold">excluded</span>.
      </Typography>

      <Typography className="text-sm">
        • For every extra 15 minutes after <span className="font-bold">{bookingDetails?.Package?.period} hours</span>, ₹
        <span className="font-bold">
          {(() => {
            const type = bookingDetails?.Cab?.carType;
            if (type === 'Mini') return bookingDetails?.Package?.additionalMinCharge;
            if (type === 'Sedan') return bookingDetails?.Package?.additionalMinChargeSedan;
            if (type === 'SUV') return bookingDetails?.Package?.additionalMinChargeSuv;
            return bookingDetails?.Package?.additionalMinChargeMVP;
          })()}
        </span> will be charged.
      </Typography>

      <Typography className="text-sm">
        • For every extra kilometer ₹
        <span className="font-bold">
          {(() => {
            const type = bookingDetails?.Cab?.carType;
            if (type === 'Mini') return bookingDetails?.Package?.extraKilometerPrice;
            if (type === 'Sedan') return bookingDetails?.Package?.extraKilometerPriceSedan;
            if (type === 'SUV') return bookingDetails?.Package?.extraKilometerPriceSuv;
            return bookingDetails?.Package?.extraKilometerPriceMVP;
          })()}
        </span> will be charged.
      </Typography>

      <Typography className="text-sm">
        • Night Charge of <span className="font-bold">₹{bookingDetails?.Package?.nightCharge}</span> 
        will be charged after <span className="font-bold">{convertTo12HourFormat(bookingDetails?.Package?.nightHoursFrom)}</span>.
      </Typography>

      <div className="border border-gray-300 bg-yellow-500 rounded-xl p-3 text-center">
        <Typography className="text-sm text-gray-800 font-medium">
                                {BOOKING_TERMS_AND_CONDITIONS}
                            </Typography>
                        </div>
                  </div>
                </div>
          )} */}
            {/*{(bookingDetails?.status === 'STARTED') ||
                ((bookingDetails?.status === 'INITIATED' || bookingDetails?.status === 'BOOKING_ACCEPTED') && (!!bookingDetails?.Driver?.id || !!bookingDetails?.Cab?.id)) &&
                <Card className="my-4 gap-4">
                    <CardBody >
                        <Typography variant="h5" className="mb-2">
                            {bookingDetails?.status === 'STARTED' ? "End" : "Start"} Time
                        </Typography>
                        <div className='flex gap-x-5'>
                            <div className=''>
                                <Formik>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                        <div className="flex flex-col-2 gap-2">
                                            <label htmlFor="dateVal" className="text-sm font-medium text-gray-700">
                                                Select Date
                                            </label>
                                            <Field
                                                type="date"
                                                name="dateVal"
                                                id="dateVal"
                                                className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                min={bookingDetails?.date}
                                                onChange={(e) => setDateVal(e.target.value)}
                                                value={dateVal}
                                            />
                                        </div>
                                        <div className="flex flex-col-2 gap-2">
                                            <label htmlFor="rideTime" className="text-sm font-medium text-gray-700">
                                                Select Time
                                            </label>
                                            <Field
                                                as="select"
                                                name="rideTime"
                                                id="rideTime"
                                                className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                onChange={(e) => setTimeVal(e.target.value)}
                                                value={timeVal}
                                            >
                                                <option value="">Select time</option>
                                                {bookingTimes.map((item) => (
                                                    <option key={item.id} value={item.id}>
                                                        {Utils.convertTimeFormat(item.id)}
                                                    </option>
                                                ))}
                                            </Field>
                                        </div>

                                        {bookingDetails?.serviceType !== 'CAR_WASH' &&
                                            <div className="flex flex-col-2 gap-2">
                                                <label htmlFor="kms" className="text-sm font-medium text-gray-700">
                                                    Distance (KM)
                                                </label>
                                                <div className="relative flex items-center">
                                                    <Field
                                                        type="number"
                                                        name="kms"
                                                        id="kms"
                                                        placeholder="Enter KM"
                                                        className="p-2 w-full rounded-xl border-2 border-gray-300"
                                                        onChange={(e) => {
                                                            const inputValue = e.target.value;
                                                            const value = parseFloat(inputValue);
                                                            if (inputValue === "" || (value > 0 && !isNaN(value))) {
                                                                setKms(inputValue);
                                                            }

                                                        }}
                                                        value={kms}
                                                    />
                                                </div>
                                            </div>
                                        }
                                        {bookingDetails.status == BOOKING_STATUS.STARTED && (
                                            <div className="flex flex-col-2 gap-2">
                                                <label htmlFor="kms" className="text-sm font-medium text-white">
                                                    Distance (KM)
                                                </label>
                                                <Button onClick={getPriceForBooking} className=" justify-center items-center">
                                                    Check Price
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Formik>
                            </div>
                        </div>
                    </CardBody>
                </Card>  
            }*/}
            <>
                {showDetails && <TextBoxWithList addNotes={addNotes} notesData={bookingDetails?.notesData} bookingId={bookingDetails?.id} />}
            </>
            
        </div>
            )}
</div>
    );
}


export default ConfirmBooking;                                                    
