const getErrorMessage = (errorOrResponse, fallback = "Unable to create the Parcel account.") => {
    const responseData = errorOrResponse?.response?.data;
    const message =
        (typeof responseData?.data === "string" ? responseData.data : "") ||
        (typeof errorOrResponse?.data === "string" ? errorOrResponse.data : "") ||
        errorOrResponse?.message ||
        "";

    return String(message || fallback);
};

export const handleParcelRegisterApiError = (errorOrResponse) => {
    const message = getErrorMessage(errorOrResponse);
    console.error("Parcel account registration failed:", errorOrResponse);
    return message;
};

