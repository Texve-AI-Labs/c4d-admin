import * as Yup from 'yup'

export const PERSONALINFO_SCHEMA = Yup.object().shape({
    salutation: Yup.string().required('Salutation is required'),
    firstName: Yup.string().required('Your Name is required'),
    // lastName: Yup.string(),
    // email: Yup.string()
    //     .email('Invalid email address')
    //     .matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/, 'Invalid email address')
    //     .required('Email address is required')
});

export const VEHICLEINFO_SCHEMA = Yup.object().shape({
    nickName: Yup.string().required('Nickname is required'), // Nickname is required
    carNumber: Yup.string()
        .matches('^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$', 'Invalid Car Number')
        .required('Car Number is required'),
    carType: Yup.string().required('Car Type is required'),
    fuelType: Yup.string().required('Fuel Type is required'),
    transmissionType: Yup.string().required('Transmission Type is required'),
    // insuranceNumber: Yup.string()
    //     .when(['nickName'], {
    //         is: (nickName) => nickName && nickName.trim().length > 0,
    //         then: () => Yup.string().required('Insurance Number is required when Nickname is provided')
    //     }),
    // insuranceExpiryDate: Yup.string()
    //     .when(['nickName', 'insuranceNumber'], {
    //         is: (nickName, insuranceNumber) =>
    //             (nickName && nickName.trim().length > 0) || (insuranceNumber && insuranceNumber.trim().length > 0),
    //         then: () => Yup.string().required('Insurance Expiry Date is required when Nickname or Insurance Number is provided'),
    //         otherwise: Yup.string().optional(),
    //     }),
});

export const ADD_USER_SCHEMA = Yup.object({
    name: Yup.string().required('Name is required'),
    phoneNumber: Yup.string().matches(/^[6-9][0-9]{9}$/, 'Must be a valid 10-digit number').required('Phone number is required'),
    email: Yup.string().email('Invalid email address').matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,4}$/, 'Invalid email address').required('Email address is required'),
    role: Yup.string().required('Role is required'),
    password: Yup.string().required('Password is required'),
    permission: Yup.array()
        .of(Yup.string().required('Each permission must be selected'))
        .required('At least one permission must be selected')
        .min(1, 'At least one permission must be selected'),
    status: Yup.string().required("Status is required"),
});

export const EDIT_USER_SCHEMA = Yup.object({
    name: Yup.string().required('Name is required'),
    phoneNumber: Yup.string().matches(/^[6-9][0-9]{9}$/, 'Must be a valid 10-digit number').required('Phone number is required'),
    email: Yup.string().email('Invalid email address').matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,4}$/, 'Invalid email address').required('Email address is required'),
    role: Yup.string().required('Role is required'),
    permission: Yup.array()
        .of(Yup.string().required('Each permission must be selected'))
        .required('At least one permission must be selected')
        .min(1, 'At least one permission must be selected'),
    password: Yup.lazy((value) =>
        !value
            ? Yup.string().notRequired()
            : Yup.string().min(3, 'Password must be at least 3 characters')),
    status: Yup.string().required('Status is required')
});

export const BOOKING_DETAILS_SCHEMA = Yup.object().shape({
    packageTypeSelected: Yup.string().when('serviceType', {
        is: (val) => val !== 'Outstation' && val !== 'RIDES' && val !== 'AUTO' && val !== 'PARCEL',
        then: (schema) => schema.required('Package Type is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    rideTime: Yup.string().when('serviceType', {
        is: (val) => val !== 'RIDES' && val !== 'AUTO',
        then: (schema) => schema.required('Ride Time is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    rideDate: Yup.string().when('serviceType', {
        is: (val) => val !== 'RIDES' && val !== 'AUTO',
        then: (schema) => schema.required('Ride Date is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    customerId: Yup.object().shape({
        id: Yup.string().required('Customer ID is required'),
    }).required('Customer information is required'),
    // cabType: Yup.string().when('serviceType', {
    //     is: 'CAB',
    //     then: () => Yup.string().required('Cab type is required'),
    //     otherwise: () => Yup.string(),
    // }),
    sourceType: Yup.string().required('Source Type is required'),
    otherSourceType: Yup.string().when('sourceType', {
        is: (val) => val === 'Others' || val === 'Offline Ads',
        then: (schema) => schema.required('Please specify the source'),
        otherwise: (schema) => schema.notRequired(),
        }),

    carType: Yup.string().when('serviceType', {
        is: (val) =>['DRIVER', 'RIDES', 'RENTAL', 'RENTAL_HOURLY_PACKAGE', 'RENTAL_DROP_TAXI'].includes(val),
        then: () => Yup.string().required('Please select a car type'),
        otherwise: () => Yup.string(),
    }),
    transmissionType: Yup.string().when('serviceType', {
        is: (val) => val === 'DRIVER',
        then: () => Yup.string().required('Transmission Type is required'),
        otherwise: () => Yup.string(),
    }),
    tripType: Yup.string().when('serviceType', {
        is: (val) => val == 'DRIVER',
        then: () => Yup.string().required('Trip Type is required'),
        otherwise: () => Yup.string(),
    }),
   pickupAddress: Yup.string().when('serviceType', {
    is: (val) => ['RIDES', 'AUTO'].includes(val),
    then: () => Yup.string().required('Pickup Address is required'),
    otherwise: () => Yup.string(),
}),
dropAddress: Yup.string().when('serviceType', {
    is: (val) => ['RIDES', 'AUTO'].includes(val),
    then: () => Yup.string().required('Drop Address is required'),
    otherwise: () => Yup.string(),
}),
    driverPickUpAddress: Yup.string().when('serviceType', {
        is: (val) => ['RENTAL', 'RENTAL_DROP_TAXI'].includes(val),
        then: () =>
            Yup.string().test(
                'driver-pickup-suggestion-selected',
                'Please select the starting point from suggestions',
                function (value) {
                    const { driverPickUpLocation } = this.parent;
                    if (!value) {
                        return true;
                    }
                    return !!driverPickUpLocation;
                }
            ),
        otherwise: () => Yup.string(),
    }),
landmark: Yup.string()
    .nullable()
    .max(100, 'Landmark should not exceed 100 characters')
    .trim(),

});


export const PERSONAL_INFO_DETAILS_EDIT_SCHEMA = Yup.object().shape({
    salutation: Yup.string().required('Salutation is required'),
    firstName: Yup.string().required('First Name is required'),
    lastName: Yup.string(),
    email: Yup.string()
        .email('Invalid email address')
        .matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/, 'Invalid email address')
        .required('Email address is required')
});

export const ACCOUNT_ADD_SCHEMA = Yup.object().shape({
    type: Yup.string().required('Service Type is required'),
    name: Yup.string().required('Full Name/Company Name is required'),
    phoneNumber: Yup.string()
        .matches(/^\d{10}$/, 'Phone Number must be exactly 10 digits')
        .required('Phone Number is required'),
    source: Yup.string().required('Source is required'),
    // email: Yup.string().email('Invalid email format').required('Email is required'),
    address: Yup.string().nullable(),
    street: Yup.string().nullable(),
    thaluk: Yup.string().nullable(),
    district: Yup.string().nullable(),
    state: Yup.string().nullable(),
    pincode: Yup.string()
        .nullable()
        .test('pincode-format', 'Pincode must be exactly 6 digits', (value) => {
            if (!value) return true;
            return /^\d{6}$/.test(value);
        }),
});

export const ACCOUNT_EDIT_SCHEMA = Yup.object().shape({
    type: Yup.string().required('Service Type is required'),
    name: Yup.string().required('Full Name/Company Name is required'),
    phoneNumber: Yup.string()
        .matches(/^\d{10}$/, 'Phone Number must be exactly 10 digits')
        .required('Phone Number is required'),
    source: Yup.string().required('Source is required'),
    // email: Yup.string().email('Invalid email format').required('Email is required'),
    address: Yup.string().required('Current Address is required'),
    street: Yup.string().required('Street Name is required'),
    thaluk: Yup.string().required('Thaluk is required'),
    district: Yup.string().required('District is required'),
    state: Yup.string().required('State is required'),
    pincode: Yup.string()
        .matches(/^\d{6}$/, 'Pincode must be exactly 6 digits')
        .required('Pincode is required'),
});

export const DRIVER_ADD_SCHEMA = Yup.object({
    salutation: Yup.string().required('Salutation is required'),
    firstName: Yup.string().required('Name is required'),
    fatherName: Yup.string().optional(),
    dateOfBirth: Yup.date()
        .max(new Date(), 'Date of birth cannot be in the future')
        .test('age', 'Driver must be at least 18 years old', function (value) {
            if (!value) return true;
            const cutoff = new Date();
            cutoff.setFullYear(cutoff.getFullYear() - 18);
            return value <= cutoff;
        }),
    phoneNumber: Yup.string().matches(/^[6-9]{1}[0-9]{9}/, 'Must be a valid mobile number').required('Phone number is required'),
    license: Yup.string().matches('^[a-zA-Z]{2}[0-9]{13}$', 'Invalid Driver\'s License').required('Driving License is required'),
    licenseType: Yup.string().required('License Type is required'),
    licenseExpiryDate: Yup.date()
        .min(new Date(), 'License expiry date must be in the future')
        .required('License expiry date is required'),
    source: Yup.string()
        .required("Source is required"),
    serviceType: Yup.string()
        .required("Service type is required"),
    address: Yup.string()
        .required('Address is required')
        .min(5, 'Address must be at least 5 characters')
        // .matches(
        //     /^[a-zA-Z0-9\s,.-/#]+$/,
        //     'Address can only contain letters, numbers, spaces, and common symbols (,./#-)'
        // )
        .test(
            'no-multiple-spaces',
            'Address should not contain multiple consecutive spaces',
            value => !value || !/\s\s+/.test(value)
        )
        .test(
            'not-only-numbers',
            'Address cannot contain only numbers',
            value => !value || !/^\d+$/.test(value.replace(/[\s,.-/#]/g, ''))
        )
        .trim(),
    streetName: Yup.string().required('Street is required').min(3, 'Street name must be atleast 3 characters'),
    thaluk: Yup.string().required('Thaluk is required'),
    district: Yup.string().required('District is required'),
    state: Yup.string().required('State is required'),
    pinCode: Yup.string()
        .required('Pincode is required')
        .matches(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit pincode'),
    reference1: Yup.string()
        .required('Reference 1 is required')
        .min(2, 'Reference name must be at least 2 characters')
        .matches(/^[a-zA-Z\s]*$/, 'Reference name can only contain letters'),
    phoneNumber1: Yup.string()
        .required('Phone number 1 is required')
        .matches(/^[6-9]{1}[0-9]{9}$/, 'Must be a valid mobile number'),
    reference2: Yup.string()
        .required('Reference 2 is required')
        .min(2, 'Reference name must be at least 2 characters')
        .matches(/^[a-zA-Z\s]*$/, 'Reference name can only contain letters'),
    phoneNumber2: Yup.string()
        .required('Phone number 2 is required')
        .matches(/^[6-9]{1}[0-9]{9}$/, 'Must be a valid mobile number'),
    transmissionType: Yup.string().required('Transmission Type is required'),
    // packages: Yup.array().when(['jobType'], {
    //     is: (jobType) => jobType === 'CAB',
    //     then: () =>
    //         Yup.array()
    //             .of(Yup.string().required('Each package must be selected'))
    //             .required('At least one package must be selected'),
    //     otherwise: () => Yup.array().nullable(),
    // }),
    // prices: Yup.array().when(['jobType'], {
    //     is: (jobType) => jobType !== 'CAB',
    //     then: () =>
    //         Yup.array()
    //             .of(
    //                 Yup.object().shape({
    //                     price: Yup.number().required('Price is required'),
    //                     extraPrice: Yup.number().required('Extra price is required'),
    //                     extraKmPrice: Yup.number().required('Extra KM price is required'),
    //                     nightCharge: Yup.number().required('Night charge is required'),
    //                     cancelCharge: Yup.number().required('Cancel charge is required'),
    //                     extraCabType: Yup.string().required('Cab type is required'),
    //                 })
    //             )
    //             .test(
    //                 'at-least-one-price',
    //                 'At least one price must be added',
    //                 function (prices) {
    //                     return prices && prices.some(price =>
    //                         price.price || price.extraPrice || price.extraKmPrice ||
    //                         price.nightCharge || price.cancelCharge || price.extraCabType
    //                     );
    //                 }
    //             )
    //             .required('At least one price must be added'),
    //     otherwise: () => Yup.array().nullable(),
    // })
});

export const DRIVER_SCHEMA = Yup.object({
    salutation: Yup.string().required('Salutation is required'),
    firstName: Yup.string().required('Name is required'),
    fatherName: Yup.string().optional(),
    dateOfBirth: Yup.date()
        .max(new Date(), 'Date of birth cannot be in the future')
        .test('age', 'Driver must be at least 18 years old', function (value) {
            if (!value) return true;
            const cutoff = new Date();
            cutoff.setFullYear(cutoff.getFullYear() - 18);
            return value <= cutoff;
        }),
    phoneNumber: Yup.string().matches(/^[6-9]{1}[0-9]{9}/, 'Must be a valid mobile number').required('Phone number is required'),
    license: Yup.string().matches('^[a-zA-Z]{2}[0-9]{13}$', 'Invalid Driver\'s License').required('Driving License is required'),
    licenseType: Yup.string().required('License Type is required'),
    licenseExpiryDate: Yup.date()
        .min(new Date(), 'License expiry date must be in the future')
        .required('License expiry date is required'),
    source: Yup.string()
        .required("Source is required"),
    serviceType: Yup.string()
        .required("Service type is required"),
    address: Yup.string()
        .required('Address is required')
        .min(5, 'Address must be at least 5 characters')
        // .matches(
        //     /^[a-zA-Z0-9\s,.-/#]+$/,
        //     'Address can only contain letters, numbers, spaces, and common symbols (,./#-)'
        // )
        .test(
            'no-multiple-spaces',
            'Address should not contain multiple consecutive spaces',
            value => !value || !/\s\s+/.test(value)
        )
        .test(
            'not-only-numbers',
            'Address cannot contain only numbers',
            value => !value || !/^\d+$/.test(value.replace(/[\s,.-/#]/g, ''))
        )
        .trim(),
    streetName: Yup.string().required('Street is required').min(3, 'Street name must be atleast 3 characters'),
    thaluk: Yup.string().required('Thaluk is required'),
    district: Yup.string().required('District is required'),
    state: Yup.string().required('State is required'),
    pinCode: Yup.string()
        .required('Pincode is required')
        .matches(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit pincode'),
    reference1: Yup.string()
        .min(2, 'Reference name must be at least 2 characters')
        .matches(/^[a-zA-Z\s]*$/, 'Reference name can only contain letters'),
    phoneNumber1: Yup.string()
        .matches(/^[6-9]{1}[0-9]{9}$/, 'Must be a valid mobile number'),
    reference2: Yup.string()
        .min(2, 'Reference name must be at least 2 characters')
        .matches(/^[a-zA-Z\s]*$/, 'Reference name can only contain letters'),
    phoneNumber2: Yup.string()
        .matches(/^[6-9]{1}[0-9]{9}$/, 'Must be a valid mobile number'),
    transmissionType: Yup.string().required('Transmission Type is required'),
    // packages: Yup.array()
    //     .of(Yup.string().required('Each package must be selected'))
    //     .required('At least one package must be selected')
    //     .min(1, 'At least one package must be selected'),
    //wallet: Yup.string().required('Wallet is required'),
    // prices: Yup.array().of(
    //     Yup.object().shape({
    //         price: Yup.number().required('Price is required'),
    //         extraPrice: Yup.number().required('Extra price is required'),
    //         extraKmPrice: Yup.number().required('Extra KM price is required'),
    //         nightCharge: Yup.number().required('Night charge is required'),
    //         cancelCharge: Yup.number().required('Cancel charge is required'),
    //         extraCabType: Yup.string().required('Cab type is required'),
    //     })
    // ).test('at-least-one-price', 'At least one price must be added', function (prices) {
    //     return prices.some(price =>
    //         price.price || price.extraPrice || price.extraKmPrice ||
    //         price.nightCharge || price.cancelCharge || price.extraCabType
    //     );
    // })
});

export const CAB_SCHEMA = Yup.object({
    name: Yup.string().required('Vehicle Name is required'),
    // ownerPhoneNumber: Yup.string().matches(/^[6-9]{1}[0-9]{9}/, 'Must be a valid mobile number').required('Phone number is required'),
    carNumber: Yup.string().matches('^[a-zA-Z]{2}[0-9]{2}[a-zA-Z]{1,2}[0-9]{4}$', 'Invalid Car Number').required('Car Number is required'),
    address: Yup.string()
        .required('Address is required')
        .min(5, 'Address must be at least 5 characters')
        // .matches(
        //     /^[a-zA-Z0-9\s,.-/#]+$/,
        //     'Address can only contain letters, numbers, spaces, and common symbols (,./#-)'
        // )
        .test(
            'no-multiple-spaces',
            'Address should not contain multiple consecutive spaces',
            value => !value || !/\s\s+/.test(value)
        )
        .test(
            'not-only-numbers',
            'Address cannot contain only numbers',
            value => !value || !/^\d+$/.test(value.replace(/[\s,.-/#]/g, ''))
        )
        .trim(),
    insurance: Yup.string().required('Insurance Expiry Date is required'),
    assignOrAddDriver: Yup.string().when(['withDriver'], {
        withDriver: Yup.string().required('Driver is required'),
        is: (withDriver) => withDriver === 'Yes',
        then: () => Yup.string().required('Assign Or Add Driver is required'),
        otherwise: () => Yup.string()
    }),
    driverId: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Yes',
        then: () => Yup.string().required('Driver Id is required'),
        otherwise: () => Yup.string()
    }),
    driverName: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Add',
        then: () => Yup.string().required('Driver Name is required'),
        otherwise: () => Yup.string()
    }),
    phoneNumber: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Add',
        then: () => Yup.string().matches(/^[6-9]{1}[0-9]{9}/, 'Must be a valid mobile number').required('Phone number is required'),
        otherwise: () => Yup.string()
    }),
    driverAddress: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Add',
        then: () => Yup.string()
            .required('Address is required')
            .min(5, 'Address must be at least 5 characters')
            .test(
                'no-multiple-spaces',
                'Address should not contain multiple consecutive spaces',
                value => !value || !/\s\s+/.test(value)
            )
            .test(
                'not-only-numbers',
                'Address cannot contain only numbers',
                value => !value || !/^\d+$/.test(value.replace(/[\s,.-/#]/g, ''))
            )
            .trim(),
        otherwise: () => Yup.string()
    }),
    licenseNumber: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Add',
        then: () => Yup.string().required('Driving License is required'),
        otherwise: () => Yup.string()
    }),
    // notify: Yup.string().required('Notification Recipients is required'),
    // carType: Yup.string().required('Car Type is required'),
    vehicleType: Yup.string().required('Vehicle Type is required'),
    seater: Yup.string()
        .required('Seater is required')
        .oneOf(['4', '5', '6', '7', '8', '9', '10', '12', '14'],
            'Seater must be 4, 5, 6, 7, 8, 9, 10, 12, or 14'),
    luggage: Yup.number()
        .typeError('Luggage must be a number')
        .required('Luggage capacity is required')
        .integer('Must be a whole number (e.g., 1, 2, 3)')
        .min(0, 'Luggage cannot be negative')
        .max(10, 'Maximum luggage capacity is 10'),
    modelYear: Yup.string()
        .required('Year of Model is required')
        .test(
            'is-valid-year',
            'Model Year cannot be in the future',
            (value) => {
                if (!value) return true;
                const currentYear = new Date().getFullYear();
                return parseInt(value) <= currentYear;
            }
        ),
    packages: Yup.array()
        .of(Yup.string().required('Each package must be selected'))
        .required('At least one package must be selected'),

    //wallet: Yup.string().required('Wallet is required'),
    type: Yup.string()
        .oneOf(["RENTAL"], "Rides"),

    prices: Yup.array().of(
        Yup.object().shape({
              kilometer: Yup.number()
                .typeError("Kilometer must be a number")
                .positive("Kilometer must be greater than zero")
                .required("Kilometer is required")
                .when("type", {
                    is:"RENTAL",
                    then: (schema) => schema.required("Kilometer is required."),
                    otherwise: (schema) => schema.notRequired(),
                }),
                

            baseFare: Yup.number()
                .typeError("Base Fare must be a number")
                .positive("Base Fare must be greater than zero")
                .required("Base Fare is required"),

            kilometerPrice: Yup.number()
                .typeError("Kilometer Price must be a number")
                .positive("Kilometer Price must be greater than zero")
                .required("Kilometer Price is required"),

            additionalMinCharge: Yup.number()
                .typeError("Additional Mins Charge must be a number")
                .positive("Additional Mins Charge must be greater than zero")
                .required("Additional Mins Charge  is required")
                .when("type", {
                    is:"RENTAL",
                    then: (schema) => schema.required("Additional Mins Charge is required"),
                    otherwise: (schema) => schema.notRequired(),
                }),

            minCharge: Yup.number()
                .typeError("Mins Charge must be a number")
                .positive("Mins Charge  must be greater than zero")
                .required("Mins Charge  is required")
                .when("type", {
                    is: "Rides",
                    then: (schema) => schema.required("Mins Charge is required."),
                    otherwise: (schema) => schema.notRequired(),
                }),
        })

    ).test('at-least-one-price', 'At least one price must be added', function (prices) {
        return prices.some(price =>
            price.price || price.kilometer || price.baseFare ||
            price.kilometerPrice || price.additionalMinCharge || price.minCharge
        );
    })
});

export const REASSIGN_DRIVER = Yup.object({
    withDriver: Yup.string().required('Driver is required'),
    assignOrAddDriver: Yup.string().when(['withDriver'], {
        is: (withDriver) => withDriver === 'Yes',
        then: () => Yup.string().required('Assign Or Add Driver is required'),
        otherwise: () => Yup.string()
    }),
    driverId: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Yes',
        then: () => Yup.string().required('Driver Id is required'),
        otherwise: () => Yup.string()
    }),
    driverName: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Add',
        then: () => Yup.string().required('Driver Name is required'),
        otherwise: () => Yup.string()
    }),
    phoneNumber: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Add',
        then: () => Yup.string().matches(/^[6-9]{1}[0-9]{9}/, 'Must be a valid mobile number').required('Phone number is required'),
        otherwise: () => Yup.string()
    }),
    driverAddress: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Add',
        then: () => Yup.string()
            .required('Address is required')
            .min(5, 'Address must be at least 5 characters')
            .test(
                'no-multiple-spaces',
                'Address should not contain multiple consecutive spaces',
                value => !value || !/\s\s+/.test(value)
            )
            .test(
                'not-only-numbers',
                'Address cannot contain only numbers',
                value => !value || !/^\d+$/.test(value.replace(/[\s,.-/#]/g, ''))
            )
            .trim(),
        otherwise: () => Yup.string()
    }),
    licenseNumber: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Add',
        then: () => Yup.string().required('Driving License is required'),
        otherwise: () => Yup.string()
    }),
})

export const CAB_ADD_SCHEMA = Yup.object({
    name: Yup.string().required('Owner Name is required'),
    // ownerPhoneNumber: Yup.string().matches(/^[6-9]{1}[0-9]{9}/, 'Must be a valid mobile number').required('Phone number is required'),
    // carNumber: Yup.string().matches('^[a-zA-Z]{2}[0-9]{2}[a-zA-Z]{1,2}[0-9]{4}$', 'Invalid Car Number').required('Car Number is required'),
    address: Yup.string()
        .required('Address is required')
        .min(5, 'Address must be at least 5 characters')
        // .matches(
        //     /^[a-zA-Z0-9\s,.-/#]+$/,
        //     'Address can only contain letters, numbers, spaces, and common symbols (,./#-)'
        // )
        .test(
            'no-multiple-spaces',
            'Address should not contain multiple consecutive spaces',
            value => !value || !/\s\s+/.test(value)
        )
        .test(
            'not-only-numbers',
            'Address cannot contain only numbers',
            value => !value || !/^\d+$/.test(value.replace(/[\s,.-/#]/g, ''))
        )
        .trim(),
    insurance: Yup.string().required('Insurance Expiry Date is required'),
    assignOrAddDriver: Yup.string().when(['withDriver'], {
        withDriver: Yup.string().required('Driver is required'),
        is: (withDriver) => withDriver === 'Yes',
        then: () => Yup.string().required('Assign Or Add Driver is required'),
        otherwise: () => Yup.string()
    }),
    driverId: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Assign',
        then: () => Yup.string().required('Driver Id is required'),
        otherwise: () => Yup.string()
    }),
    driverName: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Add',
        then: () => Yup.string().required('Driver Name is required'),
        otherwise: () => Yup.string()
    }),
    phoneNumber: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Add',
        then: () => Yup.string().matches(/^[6-9]{1}[0-9]{9}/, 'Must be a valid mobile number').required('Phone number is required'),
        otherwise: () => Yup.string()
    }),
    driverAddress: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Add',
        then: () => Yup.string()
            .required('Address is required')
            .min(5, 'Address must be at least 5 characters')
            .test(
                'no-multiple-spaces',
                'Address should not contain multiple consecutive spaces',
                value => !value || !/\s\s+/.test(value)
            )
            .test(
                'not-only-numbers',
                'Address cannot contain only numbers',
                value => !value || !/^\d+$/.test(value.replace(/[\s,.-/#]/g, ''))
            )
            .trim(),
        otherwise: () => Yup.string()
    }),
    licenseNumber: Yup.string().when(['assignOrAddDriver'], {
        is: (assignOrAddDriver) => assignOrAddDriver === 'Add',
        then: () => Yup.string().required('Driving License is required'),
        otherwise: () => Yup.string()
    }),
    carNumber:Yup.string().required('Car Number is requried'),
    carType: Yup.string().required('Car Type is required'),
    vehicleType: Yup.string().required('Vehicle Type is required'),
    seater: Yup.string()
        .required('Seater is required')
        .oneOf(['4', '5', '6', '7', '8', '9', '10', '12', '14'],
            'Seater must be 4, 5, 6, 7, 8, 9, 10, 12, or 14'),
    luggage: Yup.number()
        .typeError('Luggage must be a number')
        .required('Luggage capacity is required')
        .integer('Must be a whole number (e.g., 1, 2, 3)')
        .min(0, 'Luggage cannot be negative')
        .max(10, 'Maximum luggage capacity is 10'),
    modelYear: Yup.string()
        .required('Year of Model is required')
        .test(
            'is-valid-year',
            'Model Year cannot be in the future',
            (value) => {
                if (!value) return true;
                const currentYear = new Date().getFullYear();
                return parseInt(value) <= currentYear;
            }
        ),
    packages: Yup.array()
        .of(Yup.string().required('Each package must be selected'))
        .required('At least one package must be selected'),

    type: Yup.string()
                .oneOf(["RENTAL"], "Rides"),

    prices: Yup.array().of(
        Yup.object().shape({
            
           kilometer: Yup.number()
                .typeError("Kilometer must be a number")
                .positive("Kilometer must be greater than zero")
                .required("Kilometer is required")
                .when("type", {
                    is: "RENTAL",
                    then: (schema) => schema.required("Kilometer  is required."),
                    otherwise: (schema) => schema.notRequired(),
                }),
                

            baseFare: Yup.number()
                .typeError("Base Fare must be a number")
                .positive("Base Fare must be greater than zero")
                .required("Base Fare is required"),

            kilometerPrice: Yup.number()
                .typeError("Kilometer Price must be a number")
                .positive("Kilometer Price must be greater than zero")
                .required("Kilometer Price is required"),

            additionalMinCharge: Yup.number()
                .typeError("Additional Mins Charge must be a number")
                .positive("Additional Mins Charge  must be greater than zero")
                .required("Additional Mins Charge  is required")
                .when("type", {
                    is: "RENTAL",
                    then: (schema) => schema.required("Additional Mins Charge  is required"),
                    otherwise: (schema) => schema.notRequired(),

                }),

            minCharge: Yup.number()
                .typeError("Mins Charge must be a number")
                .positive("Mins Charge  must be greater than zero")
                .required("Mins Charge  is required")
                .when("type", {
                    is: "Rides",
                    then: (schema) => schema.required("Mins Charge is required."),
                    otherwise: (schema) => schema.notRequired(),
                }),

        })

    ).test('at-least-one-price', 'At least one price must be added', function (prices) {
        return prices.some(price =>
            price.price || price.kilometer || price.baseFare ||
            price.kilometerPrice || price.additionalMinCharge || price.minCharge
        );
    })
});

export const SUBSCRIPTION_ADD_SCHEME = Yup.object().shape({
    assignmentType: Yup.string().required("Assignment Type is required"),
    assignmentValue: Yup.string().required("Assignment Value is required"),
    priority: Yup.number()
        .typeError("Priority is required")
        .moreThan(0, "Priority is required")
        .required("Priority is required"),
    serviceType: Yup.string()
        .typeError("Service Type must be a String")
        .required("Service Type is required"),
    packagePrice: Yup.number()
        .typeError("Package Price Amount must be a number")

        .required("Package Price Amount is required"),
    price: Yup.number()
        .typeError("Price must be a number")

        .required("Price is required"),
    name: Yup.string()
        .typeError("Name must be a String")
        .required("Name is required"),
    type: Yup.string()
        .typeError("Type must be a String")
        .required("Type is required"),
    bonusPrice: Yup.number()
        .typeError("Bonus Price must be a number")
        .required("Bonus Price is required"),

    totalPrice: Yup.number()
        .typeError("Total Price must be a number")
        .positive("Total Price must be greater than zero")
        .required("Total Price is required"),

    validityDays: Yup.number()
        .transform((value, originalValue) => (originalValue === "" ? undefined : value))
        .when("type", {
            is: (type) => type !== "PAID",
            then: (schema) => schema.typeError("validityDays  must be a number").required("validityDays  is required"),
            otherwise: (schema) => schema.notRequired(),
        }),

});
export const SUBSCRIPTION_EDIT_SCHEME = Yup.object().shape({
    assignmentType: Yup.string().required("Assignment Type is required"),
    assignmentValue: Yup.string().required("Assignment Value is required"),
    priority: Yup.number()
        .typeError("Priority is required")
        .moreThan(0, "Priority is required")
        .required("Priority is required"),
    serviceType: Yup.string()
        .typeError("Service Type must be a String")
        .required("Service Type is required"),
    packagePrice: Yup.number()
        .typeError("Package Price Amount must be a number")

        .required("Package Price Amount is required"),
    price: Yup.number()
        .typeError("Price must be a number")

        .required("Price is required"),
    name: Yup.string()
        .typeError("Name must be a String")
        .required("Name is required"),
    type: Yup.string()
        .typeError("Type must be a String")
        .required("Type is required"),
    bonusPrice: Yup.number()
        .typeError("Bonus Price must be a number")

        .required("Bonus Price is required"),

    totalPrice: Yup.number()
        .typeError("Total Price must be a number")

        .required("Total Price is required"),

    validityDays: Yup.number()
        .transform((value, originalValue) => (originalValue === "" ? undefined : value))
        .when("type", {
            is: (type) => type !== "PAID",
            then: (schema) => schema.typeError("validityDays  must be a number").required("validityDays  is required"),
            otherwise: (schema) => schema.notRequired(),
        }),
});
export const MASTERPRICE_ADD_SCHEME = Yup.object().shape({
    serviceType: Yup.string().required('Service Type is required'),
    type: Yup.string().required('Type is required'),
    period: Yup.number().required('Period is required'),
    price: Yup.number().required('Price is required'),
    // priceMVP: Yup.number().required('Price MUV is required'),
    dropPrice: Yup.number().required('Drop Price is required'),
    nightCharge: Yup.number().required('Night Charge is required'),
    // cancelCharge: Yup.number().required('Cancel Charge is required'),
    status: Yup.string().required('Status is required'),
    zone: Yup.string().required('Zone is required'),
    // extraPrice: Yup.number().required('Extra Price is required'),
    // nightHoursFrom:Yup.time().required('Night Hours From Start 22:00 PM.'),
    // nightHoursFrom:Yup.time().required('Night Hours To End 06:00 AM.')
});

export const VERSION_CONTROL_EDIT=Yup.object({
    name: Yup.string().required('Name is required'),
    applicationFor: Yup.string().required('Application type is required'),
  latestVersion: Yup.string().required('Version is required'),
});
   
 

export const DISCOUNT_ADD_SCHEMA = Yup.object({
    entity: Yup.string()
        .oneOf(['DRIVER', 'CAB', 'AUTO', 'PARCEL'], 'Invalid entity type')
        .required('Entity type is required'),
    offerType: Yup.string()
        .oneOf(['GENERAL', 'CUSTOM'], 'Invalid offer type')
        .required('Offer type is required'),
    targetMode: Yup.string().when('offerType', {
        is: 'CUSTOM',
        then: (schema) => schema.oneOf(['TARGETED', 'SEGMENT'], 'Invalid target mode').required('Target mode is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    minCompletedTrips: Yup.number().when(['offerType', 'targetMode'], {
        is: (offerType, targetMode) => offerType === 'CUSTOM' && targetMode === 'SEGMENT',
        then: (schema) => schema.typeError('Minimum completed trips must be a number').required('Minimum completed trips is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    maxCompletedTrips: Yup.number().when(['offerType', 'targetMode'], {
        is: (offerType, targetMode) => offerType === 'CUSTOM' && targetMode === 'SEGMENT',
        then: (schema) => schema.typeError('Maximum completed trips must be a number').required('Maximum completed trips is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    couponCode: Yup.string().when(['offerType', 'targetMode'], {
        is: (offerType, targetMode) => offerType === 'CUSTOM' && targetMode === 'SEGMENT',
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.required('Coupon code is required'),
    }),  
    percentage: Yup.mixed().notRequired(),
    amount: Yup.mixed().notRequired(),
    cabType: Yup.string().when(['isPremium', 'serviceType', 'offerType'], {
        is: (isPremium, serviceType, offerType) =>
            isPremium === false &&
            serviceType !== 'AUTO' &&
            serviceType !== 'PARCEL' &&
            !(offerType === 'GENERAL' && serviceType === 'PARCEL'),
        then: (schema) => schema.required('Car Type is required'),
        otherwise: (schema) => schema.nullable(),
    }),
    premiumCabType: Yup.string().when(['isPremium', 'serviceType', 'offerType'], {
        is: (isPremium, serviceType, offerType) =>
            isPremium === true &&
            serviceType !== 'AUTO' &&
            serviceType !== 'PARCEL' &&
            !(offerType === 'GENERAL' && serviceType === 'PARCEL'),
        then: (schema) => schema.required('Car Type is required'),
        otherwise: (schema) => schema.nullable(),
    }),
    parcelVehicleType: Yup.string().when(['serviceType'], {
        is: (serviceType) => serviceType === 'PARCEL',
        then: (schema) => schema.oneOf(['BIKE', 'AUTO'], 'Invalid Parcel Vehicle Type').required('Parcel Vehicle Type is required'),
        otherwise: (schema) => schema.nullable(),
    }),
    subZoneId: Yup.string().when(['serviceType', 'parcelVehicleType'], {
        is: (serviceType, parcelVehicleType) =>
            serviceType === 'PARCEL' && String(parcelVehicleType || '').toUpperCase() === 'BIKE',
        then: (schema) => schema.required('Sub Zone is required'),
        otherwise: (schema) => schema.nullable(),
    }),
    startDate: Yup.string().required('Start date is required'),
    endDate: Yup.string().required('End date is required'),
    serviceType: Yup.string().required('Service type is required'),
    isActive: Yup.boolean().required('Status is required'),
    description: Yup.string().required('Description is required'),
    title: Yup.string().required('Title is required'),
    serviceArea: Yup.array()
          .min(1, 'At least one city must be selected')
          .test('single-for-parcel', 'Only one zone can be selected for Parcel service', function (value) {
              const { serviceType } = this.parent;
              if (serviceType === 'PARCEL') {
                  return Array.isArray(value) && value.length === 1;
              }
              return true;
          })
          .test('no-all-for-parcel', '"All" is not allowed for Parcel service', function (value) {
              const { serviceType } = this.parent;
              if (serviceType === 'PARCEL') {
                  return Array.isArray(value) && !value.includes('All');
              }
              return true;
          })
          .test('all-with-others', 'Cannot select "All" with other cities', (value) => {
              if (!Array.isArray(value)) return true;
              if (value.includes('All')) {
                  return value.length === 1;
              }
              return true;
          })
          .required('City is required'),
  });

export const DISCOUNT_EDIT_SCHEMA=  Yup.object({
    discountId: Yup.number().required('Discount ID is required'),
    entity: Yup.string()
        .oneOf(['DRIVER', 'CAB', 'AUTO', 'PARCEL'], 'Invalid entity type')
        .required('Entity type is required'),
    offerType: Yup.string()
        .oneOf(['GENERAL', 'CUSTOM'], 'Invalid offer type')
        .required('Offer type is required'),
    targetMode: Yup.string().when('offerType', {
        is: 'CUSTOM',
        then: (schema) => schema.oneOf(['TARGETED', 'SEGMENT'], 'Invalid target mode').required('Target mode is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    minCompletedTrips: Yup.number().when(['offerType', 'targetMode'], {
        is: (offerType, targetMode) => offerType === 'CUSTOM' && targetMode === 'SEGMENT',
        then: (schema) => schema.typeError('Minimum completed trips must be a number').required('Minimum completed trips is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    maxCompletedTrips: Yup.number().when(['offerType', 'targetMode'], {
        is: (offerType, targetMode) => offerType === 'CUSTOM' && targetMode === 'SEGMENT',
        then: (schema) => schema.typeError('Maximum completed trips must be a number').required('Maximum completed trips is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    couponCode: Yup.string().when(['offerType', 'targetMode'], {
        is: (offerType, targetMode) => offerType === 'CUSTOM' && targetMode === 'SEGMENT',
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.required('Coupon code is required'),
    }),
    percentage: Yup.mixed().notRequired(),
    amount: Yup.mixed().notRequired(),
    cabType: Yup.string().when(['isPremium', 'serviceType', 'offerType'], {
        is: (isPremium, serviceType, offerType) =>
            isPremium === false &&
            serviceType !== 'AUTO' &&
            serviceType !== 'PARCEL' &&
            !(offerType === 'GENERAL' && serviceType === 'PARCEL'),
        then: (schema) => schema.required('Car Type is required'),
        otherwise: (schema) => schema.nullable(),
    }),
    premiumCabType: Yup.string().when(['isPremium', 'serviceType', 'offerType'], {
        is: (isPremium, serviceType, offerType) =>
            isPremium === true &&
            serviceType !== 'AUTO' &&
            serviceType !== 'PARCEL' &&
            !(offerType === 'GENERAL' && serviceType === 'PARCEL'),
        then: (schema) => schema.required('Car Type is required'),
        otherwise: (schema) => schema.nullable(),
    }),
    parcelVehicleType: Yup.string().when(['serviceType'], {
        is: (serviceType) => serviceType === 'PARCEL',
        then: (schema) => schema.oneOf(['BIKE', 'AUTO'], 'Invalid Parcel Vehicle Type').required('Parcel Vehicle Type is required'),
        otherwise: (schema) => schema.nullable(),
    }),
    subZoneId: Yup.string().when(['serviceType', 'parcelVehicleType'], {
        is: (serviceType, parcelVehicleType) =>
            serviceType === 'PARCEL' && String(parcelVehicleType || '').toUpperCase() === 'BIKE',
        then: (schema) => schema.required('Sub Zone is required'),
        otherwise: (schema) => schema.nullable(),
    }),
    startDate: Yup.string().required('Start date is required'),
    endDate: Yup.string().required('End date is required'),
    serviceType: Yup.string().required('Service type is required'),
    isActive: Yup.boolean().required('Status is required'),
    description: Yup.string().required('Description is required'),
    title: Yup.string().required('Title is required'),
    serviceArea: Yup.array()
        .min(1, 'At least one city must be selected')
        .test('single-for-parcel', 'Only one zone can be selected for Parcel service', function (value) {
            const { serviceType } = this.parent;
            if (serviceType === 'PARCEL') {
                return Array.isArray(value) && value.length === 1;
            }
            return true;
        })
        .test('no-all-for-parcel', '"All" is not allowed for Parcel service', function (value) {
            const { serviceType } = this.parent;
            if (serviceType === 'PARCEL') {
                return Array.isArray(value) && !value.includes('All');
            }
            return true;
        })
        .test('all-with-others', 'Cannot select "All" with other cities', (value) => {
            if (!Array.isArray(value)) return true;
            if (value.includes('All')) {
                return value.length === 1;
            }
            return true;
        })
        .required('City is required'),
  });

export const GST_EDIT_SCHEMA = Yup.object().shape({
    serviceType: Yup.string().required('Service type is required'),
    name: Yup.string().required('Name is required'),
    totalGst: Yup.number()
      .typeError('GST % must be a number')
      .min(0, 'GST % cannot be negative')
      .required('GST % is required'),
    hsnCode: Yup.string().required('HSN Code is required'),
    serviceCategory: Yup.string().required('Category is required'),
    serviceDescription: Yup.string().required('Description is required'),
    gstNo: Yup.string().required('GST No is required'),
    isActive: Yup.boolean().required(),
  });
  export const GST_ADD_SCHEMA = Yup.object({
      serviceType: Yup.string().required('Service Type is required'),
      name: Yup.string().required('Name is required'),
      totalGst: Yup.number()
        .typeError('GST % must be a number')
        .min(0, 'GST % cannot be negative')
        .required('GST % is required'),
      hsnCode: Yup.string().required('HSN Code is required'),
      serviceCategory: Yup.string().required('Service Category is required'),
      serviceDescription: Yup.string().required('Description is required'),
      gstNo: Yup.string().required('GST No is required'),
      isActive: Yup.boolean().required('Status is required'),
    });
export const DriverOfferSchema = Yup.object({
  title: Yup.string().required("Title is required"),
//   serviceType: Yup.string().required("Service type is required"),
//   serviceArea: Yup.string().required("Service area is required"),
  startDate: Yup.string().required("Start date is required"),
  endDate: Yup.string()
    .required("End date is required")
    .test("end-after-start", "End date cannot be before start date", function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return true;
      return new Date(value) >= new Date(startDate);
    }),
  tripTarget: Yup.number()
    .typeError("Trip target must be a number")
    .integer("Trip target must be an integer")
    .min(1, "Trip target must be at least 1")
    .required("Trip target is required"),
  amount: Yup.number()
    .typeError("Amount must be a number")
    .min(0, "Amount cannot be negative")
    .required("Amount is required"),
  startMsg: Yup.string().required("Start message is required"),
  midMsg: Yup.string().required("Mid  message is required"),
  endMsg: Yup.string().required("End message is required"),
  status: Yup.mixed().required("Status is required"),
});

export const CASH_BACK_SCHEMA = Yup.object().shape({
  serviceType: Yup.string().required("Service type is required"),
  name: Yup.string().trim().required("Name is required"),
  description: Yup.string().nullable(),
  config: Yup.object()
    .shape({
      zones: Yup.array()
        .of(Yup.string())
        .min(1, "At least one zone is required")
        .required("Zones are required"),
      cashbackDiscount: Yup.number()
        .typeError("Cashback discount must be a number")
        .required("Cashback discount is required"),
      parcelVehicleType: Yup.string().nullable(),
      subZoneId: Yup.string().nullable(),
    })
    .test("parcel-config-fields", function (config) {
      const serviceType = this.parent?.serviceType;
      if (serviceType !== "PARCEL") return true;

      const parcelVehicleType = String(config?.parcelVehicleType || "").toUpperCase();
      if (!parcelVehicleType) {
        return this.createError({
          path: "config.parcelVehicleType",
          message: "Parcel Vehicle Type is required",
        });
      }

      if (!["BIKE", "AUTO"].includes(parcelVehicleType)) {
        return this.createError({
          path: "config.parcelVehicleType",
          message: "Invalid Parcel Vehicle Type",
        });
      }

      if (parcelVehicleType === "BIKE" && !config?.subZoneId) {
        return this.createError({
          path: "config.subZoneId",
          message: "Sub Zone is required",
        });
      }

      return true;
    })
    .required(),
  isActive: Yup.boolean().required("Status is required"),
});
