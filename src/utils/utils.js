// import { Dimensions } from 'react';
import moment from "moment";
import {
    GPAY_NAME, GPAY_NUMBER, supportNumber,
    WHATSAPP_BOOKING_CONFIRMED_TEMPLATE,WHATSAPP_FARE_QUOTATION_TEMPLATE,WHATSAPP_TRIP_STARTED,WHATSAPP_TRIP_COMPLETED,WHATSAPP_BOOKING_CANCELLED,
    WHATSAPP_DRIVER_REACHED,
    WHATSAPP_BOOKING_ACCEPTED,

} from "./constants";


export const Utils = {
    isBookingReadyForEstimation: (values, selectedCustomer) => {
        const hasPickupDateTime = !!(values?.rideDate && values?.rideTime);

        switch (values?.serviceType) {
            case 'DRIVER':
                return (
                    hasPickupDateTime &&
                    !!selectedCustomer &&
                    !!values?.packageTypeSelected &&
                    !!values?.pickupLocation &&
                    !!values?.sourceType &&
                    !!values?.carType &&
                    !!values?.packageSelected
                    // (values?.packageTypeSelected !== 'Outstation' || !!values?.dropLocation) &&
                    // (values?.packageTypeSelected !== 'Outstation' || !!values?.tripType) &&
                    // (values?.packageTypeSelected !== 'Outstation' || !!values?.driverPickUpLocation || !!values?.driverPickUpAddress)
                );
            case 'RIDES':
                return hasPickupDateTime && !!selectedCustomer && !!values?.pickupLocation && !!values?.dropLocation && !!values?.sourceType && !!values?.carType;
            case 'AUTO':
                return hasPickupDateTime && !!selectedCustomer && !!values?.pickupLocation && !!values?.dropLocation && !!values?.sourceType;
            case 'PARCEL':
                return hasPickupDateTime && !!values?.customerId?.id && !!values?.pickupLocation && !!values?.dropLocation && !!values?.sourceType;
            case 'RENTAL':
                return (
                    hasPickupDateTime &&
                    !!selectedCustomer &&
                    !!values?.packageTypeSelected &&
                    !!values?.pickupLocation &&
                    !!values?.sourceType &&
                    !!values?.carType &&
                    !!values?.packageSelected &&
                    (values?.packageTypeSelected !== 'Outstation' || !!values?.dropLocation) &&
                    (values?.packageTypeSelected !== 'Outstation' || !!values?.acType) &&
                    (values?.packageTypeSelected !== 'Outstation' || values?.tripType !== 'Round Trip' || !!values?.toDate) &&
                    (values?.packageTypeSelected !== 'Outstation' || !!values?.driverPickUpLocation || !!values?.driverPickUpAddress)
                );
            case 'RENTAL_HOURLY_PACKAGE':
                return hasPickupDateTime && !!selectedCustomer && !!values?.pickupLocation && !!values?.sourceType && !!values?.packageSelected && !!values?.carType;
            case 'RENTAL_DROP_TAXI':
                return hasPickupDateTime && !!selectedCustomer && !!values?.pickupLocation && !!values?.dropLocation && !!values?.sourceType && !!values?.acType && !!values?.carType;
            case 'CAR_WASH':
                return hasPickupDateTime && !!selectedCustomer && !!values?.packageTypeSelected && !!values?.pickupLocation && !!values?.sourceType && !!values?.carType;
            default:
                return false;
        }
    },

    isBookingReadyForContinue: (values, selectedCustomer, quoteDetails, validationCheckForDriver, validationCheckForDriverRental) => {
        if (!Utils.isBookingReadyForEstimation(values, selectedCustomer)) return false;
        if (!quoteDetails) return false;

        switch (values?.serviceType) {
            case 'DRIVER':
            case 'CAR_WASH':
                return !validationCheckForDriver(values);
            case 'RENTAL':
                return !validationCheckForDriverRental(values);
            default:
                return true;
        }
    },

    formatSelectedDate: (date) => {
        const selectedDate = new Date(date);
        //const today = new Date();

        // Normalize dates to remove time part for comparison
        const selectedDateString = selectedDate.toISOString().split('T')[0];
        //const todayString = today.toISOString().split('T')[0];
        return selectedDateString;
        // if (selectedDateString === todayString) {
        //     return `Today:${selectedDateString}`;
        // } else {
        //     return `${selectedDate.toLocaleDateString("en-GB", {
        //         day: "numeric",
        //         month: "short",
        //     })}:${selectedDateString}`;
        // }
    },
    formatTime: (date) => {
        return moment(date).format("DD-MM-YYYY hh:mm A");
    },

    formatRideTime: (time) => {
        const [hours, minutes] = time.split(':');
        let period = 'a.m.';
        let formattedHours = parseInt(hours, 10);

        // Convert hours to 12-hour format and determine the period (a.m. or p.m.)
        if (formattedHours > 12) {
            formattedHours -= 12;
            period = 'p.m.';
        } else if (formattedHours === 0) {
            formattedHours = 12;
        }

        return `${formattedHours}:${minutes} ${period}`;
    },

    convertTimeFormat: (time) => {
        let [hours, minutes, seconds] = time.split(':');
        hours = parseInt(hours);

        const period = hours >= 12 ? 'p.m.' : 'a.m.';
        hours = hours % 12 || 12;

        return `${hours}:${minutes} ${period}`;
    },

    generateBookingTimesForDay: (date) => {
        const selectedDate = new Date(date);
        const today = new Date();

        // Normalize dates to remove time part for comparison
        const selectedDateString = selectedDate.toISOString().split('T')[0];
        const todayString = today.toISOString().split('T')[0];

        if (selectedDateString === todayString) {
            return Utils.generateBookingTimes();
        } else {
            const intervalMinutes = 30; // Set the interval between booking times in minutes
            const totalIntervals = 24 * 60 / intervalMinutes; // Total intervals in a day

            const times = [];

            for (let i = 0; i < totalIntervals; i++) {
                const time = new Date();

                time.setHours(0, i * intervalMinutes, 0);

                const hours = time.getHours();
                const minutes = time.getMinutes();
                const formattedHours = hours < 10 ? '0' + hours : hours;
                const formattedTime = `${formattedHours}:${minutes < 10 ? '0' : ''}${minutes}:00`;

                times.push({
                    id: formattedTime,
                    data: `${formattedHours}:${minutes < 10 ? '0' : ''}${minutes} ${formattedHours >= 12 ? 'p.m' : 'a.m'}`
                });
            }

            return times;
        }

    },

    generateBookingTimes: () => {
        const intervalMinutes = 30; // Set the interval between booking times in minutes

        const times = [];

        const currentTime = new Date();
        if (currentTime.getMinutes() >= 30) {
            currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0);
        } else {
            currentTime.setMinutes(30, 0, 0);
        }

        let numberOfSlots = (24 - new Date(currentTime).getHours()) * 2;

        for (let i = 0; i < numberOfSlots - 1; i++) {
            const time = new Date(currentTime);

            time.setMinutes(time.getMinutes() + i * intervalMinutes);

            const hours = time.getHours();
            const minutes = time.getMinutes();
            const formattedHours = hours < 10 ? '0' + hours : hours;
            const formattedTime = `${formattedHours}:${minutes < 10 ? '0' : ''}${minutes}:00`;

            times.push({
                id: formattedTime,
                data: `${formattedHours}:${minutes < 10 ? '0' : ''}${minutes} ${formattedHours >= 12 ? 'p.m' : 'a.m'}`
            });
        }
        return times;
    },

    // getLatLongDelta: () => {
    //     try {
    //         const screen = Dimensions.get('window');
    //         const ASPECT_RATIO = screen.width / screen.height;
    //         const LATITUDE_DELTA = 0.04;
    //         const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
    //         return {
    //             LATITUDE_DELTA,
    //             LONGITUDE_DELTA
    //         }
    //     } catch (err) {
    //         console.log('Error in getLatLongDelta: ', err);
    //     }
    // },

    formatDateTime: (dateStr, timeStr) => {
        const inputDate = new Date(`${dateStr}T${timeStr}`);
        const currentDate = new Date();

        // Get today's date at midnight
        const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

        // Get tomorrow's date at midnight
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const hours = inputDate.getHours();
        const minutes = inputDate.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'p.m' : 'a.m';
        const formattedTime = `${hours}:${minutes} ${ampm}`;

        // Check if the date is today or tomorrow
        if (inputDate >= today && inputDate < tomorrow) {
            return `Today:${formattedTime}`;
        } else {
            const day = inputDate.getDate().toString().padStart(2, '0');
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = monthNames[inputDate.getMonth()];

            return `${day} ${month}:${formattedTime}`;
        }
    },

    extractTime: (formattedString) => {
        // Split the string by the colon character
        const parts = formattedString.split(':');
        // Extract the time part
        const time = parts[1] + ':' + parts[2].trim().split(' ')[0] + ':00'; // Get the part before the space and trim any whitespace

        return time;
    },

    formatDate: (dateString) => {
        const inputDate = new Date(dateString);
        const currentDate = new Date();

        // Reset the time part for accurate comparison
        inputDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);

        if (inputDate.getTime() === currentDate.getTime()) {
            return `Today:${dateString}`;
        } else {
            const options = { day: '2-digit', month: 'short' };
            const formattedDate = inputDate.toLocaleDateString('en-GB', options).replace(' ', ' ');
            return `${formattedDate}:${dateString}`;
        }
    },

    getTimeDifferenceForCancellationTimer: (data) => {
        let time = new Date(`${data?.date}T${data?.time}`);
        let created_date = new Date(`${data?.created_at}`);
        let timeDifferenceVal = time - created_date;
        const timeDifference = new Date() - new Date(`${data?.updated_at}`);
        console.log('TIME DIFFERENCE -', timeDifference)
        const differenceInMinutes = timeDifference / (1000 * 60);
        console.log("differenceInMinutes---->>>>", differenceInMinutes);
        console.log("timeDifferenceVal---->>>>", timeDifferenceVal / (1000 * 60 * 60));
        timeDiff = timeDifferenceVal / (1000 * 60 * 60);

        return {
            diffInHours: timeDiff,
            diffInMins: differenceInMinutes
        }
    },

    formatTime: async ({ hours, minutes }) => {
        // Convert hours and minutes to seconds
        const totalSeconds = hours * 3600 + minutes * 60;

        // Calculate hours, minutes, and seconds
        const displayHours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const displayMinutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const displaySeconds = String(totalSeconds % 60).padStart(2, '0');

        return `${displayHours}:${displayMinutes}:${displaySeconds}`;
    },

    generateWhatsAppMessage: (bookingDetails) => {
        const pickupName =
            bookingDetails?.pickupAddress?.name?.trim() ||
            bookingDetails?.pickupGeocodeAddress?.name?.trim() ||
            bookingDetails?.pickupFormatAddress?.name?.trim() ||
            'Not specified';

        let text = '';



        // Trip Fare Quotation message
        if (bookingDetails?.status === "QUOTED") {
            const totalFare = parseFloat(bookingDetails.Package.price) + parseFloat(bookingDetails.extraPrice);
            const estimatedFare = bookingDetails.estimatedFare || totalFare.toFixed(2);
            const vehicleType = bookingDetails?.Cab?.carType || bookingDetails?.carType || 'Not assigned';
            const rawDateTime = bookingDetails.fromDate;
            const isValid = moment(rawDateTime).isValid();

            const startDate = isValid ? moment(rawDateTime).format("DD-MM-YYYY") : 'Not available';
            const startTime = isValid ? moment(rawDateTime).format("hh:mm A") : 'Not available';

            text = encodeURIComponent(
                WHATSAPP_FARE_QUOTATION_TEMPLATE
                    .replace('${bookingNumber}', bookingDetails.bookingNumber)
                    .replace('${customerName}', bookingDetails.Customer.firstName)
                    .replace('${pickup}', pickupName)
                    .replace('${drop}', bookingDetails.dropAddress?.name || 'Not specified')
                    .replace('${startDate}', startDate)
                    .replace('${startTime}', startTime)
                    .replace('${carType}', vehicleType)
                    .replace('${totalAmount}', estimatedFare)
                    .replace('${supportNumber}', supportNumber)
                    .replace('${startOtp}',bookingDetails.startOtp)
            );
        }


        // BOOKING CONFIRMED
        if (bookingDetails?.status === "CONFIRMED") {

            const rawDateTime = bookingDetails.date && bookingDetails.time
                ? `${bookingDetails.date} ${bookingDetails.time}`
                : bookingDetails.fromDate;

            const isValid = moment(rawDateTime, ["DD-MM-YYYY hh:mm A", moment.ISO_8601], true).isValid();

            const startDate = isValid ? moment(rawDateTime).format("DD-MM-YYYY") : 'Not available';
            const startTime = isValid ? moment(rawDateTime).format("hh:mm A") : 'Not available';

            const vehicleType = bookingDetails?.Cab?.carType || bookingDetails?.carType || 'Not assigned';

            let packageRow = '';

            if (
                bookingDetails?.tripType === "LOCAL" &&
                bookingDetails?.Package?.period
            ) {
                packageRow = `\nPackage: ${bookingDetails.Package.period} hours`;
            }
            text = encodeURIComponent(
                WHATSAPP_BOOKING_CONFIRMED_TEMPLATE
                    .replace('${bookingNumber}', bookingDetails.bookingNumber)
                    .replace('${customerName}', bookingDetails.Customer.firstName)
                    .replace('${pickup}', pickupName)
                    .replace('${drop}', bookingDetails.dropAddress?.name || 'Not specified')
                    .replace('${startDate}', startDate)
                    .replace('${startTime}', startTime)
                     .replace('${startOtp}',bookingDetails.startOtp)
                    .replace('${baseFare}', bookingDetails.Package.price)
                    .replace('${carType}', vehicleType)
                    .replace('${packageRow}', packageRow)
                    .replace('${supportNumber}', supportNumber)
            );
        }

        // Trip Started
        if (bookingDetails?.status === "STARTED") {
            const driverName = bookingDetails.Driver?.firstName || 'Not assigned';
            const vehicleType = bookingDetails?.Cab?.carType || bookingDetails?.carType || 'Not assigned';
            const pickup = pickupName;
            const startTime = bookingDetails.startTime ? moment(bookingDetails.startTime).format("hh:mm A") : 'Not available';

            text = encodeURIComponent(
                WHATSAPP_TRIP_STARTED
                    .replace('${bookingNumber}', bookingDetails.bookingNumber)
                    .replace('${customerName}', bookingDetails.Customer.firstName)
                    .replace('${pickup}', pickup)
                    .replace('${carType}', vehicleType)
                    .replace('${driverName}', driverName)
                    .replace('${startTime}', startTime)
                    .replace('${supportNumber}', supportNumber)
                    .replace('${startOtp}',bookingDetails.startOtp)
            );
        }

        if (bookingDetails?.status === "DRIVER_REACHED") {
            const driverName = bookingDetails.Driver?.firstName || 'Not assigned';
            const vehicleType = bookingDetails?.Cab?.carType || bookingDetails?.carType || 'Not assigned';
            const pickup = pickupName;
            const startTime = bookingDetails.startTime ? moment(bookingDetails.startTime).format("hh:mm A") : 'Not available';
            

            text = encodeURIComponent(
                WHATSAPP_DRIVER_REACHED
                    .replace('${bookingNumber}', bookingDetails.bookingNumber)
                    .replace('${customerName}', bookingDetails.Customer.firstName)
                    .replace('${pickup}', pickup)
                    .replace('${drop}', bookingDetails.dropAddress?.name || 'Not specified')
                    .replace('${carType}', vehicleType)
                    .replace('${driverName}', driverName)
                    .replace('${startTime}', startTime)
                    .replace('${supportNumber}', supportNumber)
                    .replace('${startOtp}',bookingDetails.startOtp)
            );
        }
         if ( bookingDetails?.status === "BOOKING_ACCEPTED") {
            const driverName = bookingDetails.Driver?.firstName || 'Not assigned';
            const vehicleType = bookingDetails?.Cab?.carType || bookingDetails?.carType || 'Not assigned';
            const pickup = pickupName;
            const startTime = bookingDetails.startTime ? moment(bookingDetails.startTime).format("hh:mm A") : 'Not available';
            

            text = encodeURIComponent(
                WHATSAPP_BOOKING_ACCEPTED
                    .replace('${bookingNumber}', bookingDetails.bookingNumber)
                    .replace('${customerName}', bookingDetails.Customer.firstName)
                    .replace('${pickup}', pickup)
                    .replace('${drop}', bookingDetails.dropAddress?.name || 'Not specified')
                    .replace('${carType}', vehicleType)
                    .replace('${driverName}', driverName)
                    .replace('${startTime}', startTime)
                    .replace('${supportNumber}', supportNumber)
                    .replace('${startOtp}',bookingDetails.startOtp)
            );
        }

        // Trip Compelted
        if (bookingDetails?.status === "ENDED" && bookingDetails?.paymentStatus === "PAID") {

            const carType = bookingDetails.Cab?.carType || 'Not assigned';
            const pickup = pickupName;
            const drop = bookingDetails.endAddress?.name || bookingDetails.dropAddress?.name || 'Not specified';
            const startTime = bookingDetails.startTime ? moment(bookingDetails.startTime).format("DD-MM-YYYY hh:mm A") : 'N/A';
            const endTime = bookingDetails.endedTime ? moment(bookingDetails.endedTime).format("DD-MM-YYYY hh:mm A") : 'N/A';
            const bookedDuration = bookingDetails.Package?.period || '0';
            const extraTime = bookingDetails.extraHours || '0';
            const extraCharges = bookingDetails.extraPrice || '0'
            const totalFare = parseFloat(bookingDetails.Package.price) + parseFloat(bookingDetails.extraPrice);

            text = encodeURIComponent(
                WHATSAPP_TRIP_COMPLETED
                    .replace('${bookingNumber}', bookingDetails.bookingNumber)
                    .replace('${customerName}', bookingDetails.Customer.firstName)
                    .replace('${carType}', carType)
                    .replace('${pickup}', pickup)
                    .replace('${drop}', drop)
                    .replace('${startTime}', startTime)
                    .replace('${endTime}', endTime)
                    .replace('${endOtp}', bookingDetails.endOtp)
                    .replace('${totalAmount}', totalFare)
                    .replace('${bookedDuration}', bookedDuration)
                    .replace('${extraTime}', extraTime)
                    .replace('${extraCharges}', extraCharges)
                    .replace('${supportNumber}', supportNumber)
            );
        }

        // BOOKING CANCELLED
        if (bookingDetails?.status === "CUSTOMER_CANCELLED" || bookingDetails?.status === "SUPPORT_CANCELLED") {
            const pickup = pickupName;
            const rawDateTime = bookingDetails.fromDate;
            const isValid = moment(rawDateTime).isValid();

            const startDate = isValid ? moment(rawDateTime).format("DD-MM-YYYY") : 'Not available';
            const startTime = isValid ? moment(rawDateTime).format("hh:mm A") : 'Not available';

            text = encodeURIComponent(
                
                WHATSAPP_BOOKING_CANCELLED
                    .replace('${bookingNumber}', bookingDetails.bookingNumber)
                    .replace('${customerName}', bookingDetails.Customer.firstName)
                    .replace('${pickup}', pickup)
                    .replace('${startDate}', startDate)
                    .replace('${startTime}', startTime)
                    .replace('${supportNumber}', supportNumber)
            );
        }

        if (text === '') {
            text = encodeURIComponent(
                (bookingDetails?.Driver ? `Driver Name: ${bookingDetails?.Driver.firstName}\nDriver Number: ${bookingDetails?.Driver.phoneNumber}\n` : '') +
                `Pickup Address: ${pickupName}\n` +
                (bookingDetails?.dropAddress ? `Drop Address: ${bookingDetails?.dropAddress?.name}\n` : '')
            );
        }

        return `https://wa.me/${bookingDetails?.Customer?.phoneNumber.replace(/^(\+91)/, '')}?text=${text}`

    },

    calculateEndTime: (startTime, duration) => {
        return moment(startTime).add(duration, 'hours');
    },

    calculateDuration: (bookingDetails) => {
        const start = moment(bookingDetails?.startTime);
        const end = moment(`${start.format("YYYY-MM-DD")}T${bookingDetails?.endTime}`);
        const packageHours = parseFloat(bookingDetails?.Package?.period);
        const totalHours = end.diff(start, "hours", true);
        const extraHours = Math.max(0, totalHours - packageHours);

        return {
            total: `${Math.floor(totalHours)} hours`,
            extra: `${Math.floor(extraHours)} hours`
        };
    },

    convertTimeFormatToMinutes: (time) => {
        if (!time) return null;

        // Split time into hours, minutes, and seconds
        const [hours, minutes, seconds] = time.split(':').map(Number);

        // Convert to total minutes (ignoring seconds)
        return hours * 60 + minutes;
    },

    formatTimeWithSeconds: (timeValue) => {
        if (!timeValue) return null;
        return `${timeValue}:00`;  // Add ":00" for seconds
    },

    convertMinutesToTimeFormat: (minutes) => {
        if (minutes === null || minutes === undefined) return null;

        // Convert to number in case it's a string
        const mins = parseInt(minutes, 10);

        // Calculate hours and remaining minutes
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;

        // Format with leading zeros
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMins = remainingMins.toString().padStart(2, '0');

        // Return in hh:mm:ss format
        return `${formattedHours}:${formattedMins}:00`;
    },

        getTodayDateInput: () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
 
    getNowDateTimeLocalInput: () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    },
 
    isDateOnOrAfterToday: (dateString) => {
        if (!dateString) return false;
        const inputDate = new Date(dateString);
        if (isNaN(inputDate.getTime())) return false;
 
        const today = new Date();
        inputDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
 
        return inputDate.getTime() >= today.getTime();
    },
 
    isDateTimeOnOrAfterNow: (dateTimeString) => {
        if (!dateTimeString) return false;
 
        const parsed = moment(
            dateTimeString,
            [moment.ISO_8601, "YYYY-MM-DDTHH:mm", "YYYY-MM-DD HH:mm", "DD-MM-YYYY HH:mm"],
            true
        );
 
        if (!parsed.isValid()) return false;
 
        const inputDate = parsed.toDate();
        const now = new Date();
        inputDate.setSeconds(0, 0);
        now.setSeconds(0, 0);
        const nowMinus2Min = new Date(now.getTime() - 2 * 60 * 1000);
        return inputDate.getTime() >= nowMinus2Min.getTime();
    },
 
    validateDateTimeRange: ({ startDate, endDate }) => {
        const errors = {};
 
        if (!startDate) {
            errors.startDate = 'Start date is required';
        } else if (!Utils.isDateTimeOnOrAfterNow(startDate)) {
            errors.startDate = 'Start date & time must be current or in the future.';
        }
 
        if (!endDate) {
            errors.endDate = 'End date is required';
        } else if (!Utils.isDateTimeOnOrAfterNow(endDate)) {
            errors.endDate = 'End date & time must be current or in the future.';
        }
 
        return errors;
    },
 
    validateRideAndReturnDateTime: (values) => {
        const rideDateTime =
            values.rideDate && values.rideTime
                ? `${values.rideDate}T${values.rideTime}`
                : '';
 
        const hasReturnField =
            (values.serviceType === 'RENTAL' &&
                values.packageTypeSelected === 'Outstation' &&
                values.tripType === 'Round Trip') ||
            (values.serviceType === 'DRIVER' &&
                values.packageTypeSelected === 'Outstation' &&
                values.tripType === 'Round Trip' &&
                values.packageSelected === 'custom_date');
 
        const returnDateTime =
            hasReturnField && values.toDate && values.toTime
                ? `${values.toDate}T${values.toTime}`
                : '';
 
        const rangeErrors = Utils.validateDateTimeRange({
            startDate: rideDateTime,
            endDate: hasReturnField ? returnDateTime : undefined,
        });
 
        const errors = {};
        if (rangeErrors.startDate) {
            errors.rideDateTime = rangeErrors.startDate;
        }
        if (hasReturnField && rangeErrors.endDate) {
            errors.returnDateTime = rangeErrors.endDate;
        }

        return errors;
    },

    getFirstValidationError: (errObj) => {
        if (!errObj) return '';
        if (typeof errObj === 'string') return errObj;
        if (Array.isArray(errObj)) {
            for (const item of errObj) {
                const found = Utils.getFirstValidationError(item);
                if (found) return found;
            }
            return '';
        }
        for (const key of Object.keys(errObj)) {
            const found = Utils.getFirstValidationError(errObj[key]);
            if (found) return found;
        }
        return '';
    },

    getBookingContinueDisabledStates: ({
        values,
        dirty,
        isValid,
        quoteDetails,
        selectedCustomer,
        isButtonDisabled,
        validationCheckForDriver,
        validationCheckForDriverRental,
    }) => {
        const estimationReady = Utils.isBookingReadyForEstimation(values, selectedCustomer);
        const continueBaseDisabled = !dirty || !isValid || !quoteDetails || !estimationReady;
        const driverContinueDisabled = continueBaseDisabled || validationCheckForDriver(values);
        const ridesContinueDisabled = continueBaseDisabled;
        const autoContinueDisabled = continueBaseDisabled;
        const parcelContinueDisabled = continueBaseDisabled;
        const rentalContinueDisabled = continueBaseDisabled || validationCheckForDriverRental(values);
        const hourlyContinueDisabled = continueBaseDisabled;
        const dropTaxiContinueDisabled = continueBaseDisabled;

        return {
            driverContinueDisabled,
            ridesContinueDisabled,
            autoContinueDisabled,
            parcelContinueDisabled,
            rentalContinueDisabled,
            hourlyContinueDisabled,
            dropTaxiContinueDisabled,
        };
    },

    getBookingContinueHint: ({
        values,
        errors,
        dirty,
        isValid,
        quoteDetails,
        selectedCustomer,
        isButtonDisabled,
        validationCheckForDriver,
        validationCheckForDriverRental,
    }) => {
        const firstValidationError = Utils.getFirstValidationError(errors);
        if (firstValidationError) return firstValidationError;
        if (values.serviceType === 'DRIVER' || values.serviceType === 'CAR_WASH') {
            if (!quoteDetails) return 'Please click Check Estimated Price.';
            if (!values.sourceType) return 'Please select Source Type.';
            if (!values.rideDate || !values.rideTime) return 'Please select pickup date & time.';
            if (!values.packageTypeSelected) return 'Please select package type.';
            if (values.packageTypeSelected === "Local" && !values.packageSelected) return 'Please choose a package.';
            if (!values.pickupAddress) return 'Please select pickup location.';
            // if (values.packageTypeSelected === "Outstation" && !values.dropAddress) return 'Please select drop location.';
            // if (validationCheckForDriver(values)) return 'Please complete required driver trip fields.';
            if (!isValid) return 'Please correct form validation errors.';
            if (!dirty) return 'Please update at least one field.';
        } else if (values.serviceType === 'RIDES') {
            if (!quoteDetails) return 'Please click Check Estimated Price.';
            if (!selectedCustomer) return 'Please select customer.';
            if (!values.rideDate || !values.rideTime) return 'Please select pickup date & time.';
            if (!values.pickupAddress || !values.dropAddress) return 'Please select pickup and drop locations.';
        } else if (values.serviceType === 'AUTO') {
            if (!quoteDetails) return 'Please click Check Estimated Price.';
            if (!selectedCustomer) return 'Please select customer.';
            if (!values.sourceType) return 'Please select Source Type.';
            if (!values.rideDate || !values.rideTime) return 'Please select pickup date & time.';
            if (!values.pickupAddress || !values.dropAddress) return 'Please select pickup and drop locations.';
        } else if (values.serviceType === 'PARCEL') {
            if (!quoteDetails) return 'Please click Check Estimated Price.';
            if (!values.customerId?.id) return 'Please select customer.';
            if (!values.sourceType) return 'Please select Source Type.';
            if (!values.rideDate || !values.rideTime) return 'Please select pickup date & time.';
            if (!values.pickupAddress || !values.dropAddress) return 'Please select pickup and drop locations.';
        } else if (values.serviceType === 'RENTAL') {
            if (!quoteDetails) return 'Please click Check Estimated Price.';
            if (!values.sourceType) return 'Please select Source Type.';
            if (!values.rideDate || !values.rideTime) return 'Please select pickup date & time.';
            if (!values.packageTypeSelected) return 'Please select package type.';
            if (values.packageTypeSelected === "Local" && !values.packageSelected) return 'Please choose a package.';
            if (values.packageTypeSelected === "Outstation" && !values.acType) return 'Please select AC type.';
            if (values.packageTypeSelected === "Outstation" && !values.dropAddress) return 'Please select drop location.';
            if (values.packageTypeSelected === "Outstation" && values.tripType === "Round Trip" && !values.toDate) return 'Please select return date & time.';
            if (!values.pickupAddress) return 'Please select pickup location.';
            if (validationCheckForDriverRental(values)) return 'Please complete required rental trip fields.';
            if (!isValid) return 'Please correct form validation errors.';
            if (!dirty) return 'Please update at least one field.';
        } else if (values.serviceType === 'RENTAL_HOURLY_PACKAGE') {
            if (!quoteDetails) return 'Please click Check Estimated Price.';
            if (!values.sourceType) return 'Please select Source Type.';
            if (!values.rideDate || !values.rideTime) return 'Please select pickup date & time.';
            if (!values.packageSelected) return 'Please choose a package.';
            if (!values.pickupAddress) return 'Please select pickup location.';
            if (!isValid) return 'Please correct form validation errors.';
            if (!dirty) return 'Please update at least one field.';
        } else if (values.serviceType === 'RENTAL_DROP_TAXI') {
            if (!quoteDetails) return 'Please click Check Estimated Price.';
            if (!values.rideDate || !values.rideTime) return 'Please select pickup date & time.';
            if (!values.sourceType) return 'Please select Source Type.';
            if (!values.acType) return 'Please select AC type.';
            if (!values.pickupAddress || !values.dropAddress) return 'Please select pickup and drop locations.';
            if (!isValid) return 'Please correct form validation errors.';
            if (!dirty) return 'Please update at least one field.';
        }
        return 'Please complete required fields to continue.';
    },
};
