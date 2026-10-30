const getErrorMessage = (errorOrResponse, fallback = "Unable to create the driver.") => {
    const responseData = errorOrResponse?.response?.data;
    const message =
        (typeof responseData?.data === "string" ? responseData.data : "") ||
        (typeof responseData?.message === "string" ? responseData.message : "") ||
        (typeof errorOrResponse?.data === "string" ? errorOrResponse.data : "") ||
        (typeof errorOrResponse?.message === "string" ? errorOrResponse.message : "") ||
        "";

    return String(message || fallback);
};

export const handleDriverRegisterApiError = (errorOrResponse) => {
    const message = getErrorMessage(errorOrResponse);
    console.error("Driver registration failed:", errorOrResponse);
    return message;
};
