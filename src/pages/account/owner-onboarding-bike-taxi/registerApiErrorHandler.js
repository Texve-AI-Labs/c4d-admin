const getErrorMessage = (errorOrResponse, fallback = "Unable to create the Bike-taxi account.") => {
    const responseData = errorOrResponse?.response?.data;
    const message =
        (typeof responseData?.data === "string" ? responseData.data : "") ||
        (typeof errorOrResponse?.data === "string" ? errorOrResponse.data : "") ||
        errorOrResponse?.message ||
        "";

    return String(message || fallback);
};

export const handleBikeTaxiRegisterApiError = (errorOrResponse) => {
    const message = getErrorMessage(errorOrResponse);
    console.error("Bike-taxi account registration failed:", errorOrResponse);
    return message;
};

