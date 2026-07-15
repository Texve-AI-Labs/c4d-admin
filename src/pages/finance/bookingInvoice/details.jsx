import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import {
  Spinner,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
} from "@material-tailwind/react";
import ConfirmBooking from "@/pages/booking/confirmBooking";
import moment from "moment";
import { downloadBlob } from "@/utils/downloadUtils";

const BookingInvoiceDetails = () => {
  const { id } = useParams(); // bookingId
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const customerIdFromState = location.state?.customerId;
  const customerIdFromQuery = searchParams.get("customerId");
  const customerId = customerIdFromState || customerIdFromQuery || 0;

  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // Modal state

  useEffect(() => {
    if (!id) {
      console.error("Missing bookingId");
      setLoading(false);
      return;
    }

    fetchInvoiceDetails();
  }, [id, customerId]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);

      console.log("Booking ID:", id);
      console.log("Customer ID:", customerId);

      const response = await ApiRequestUtils.get(
        `${API_ROUTES.GET_CONFIRMATION_BOOKING_BY_ID}/${id}`,
        Number(customerId) || 0
      );

      if (response?.success) {
        setInvoiceDetails(response.data);
      } else {
        console.error("API returned error:", response);
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error);
    } finally {
      setLoading(false);
    }
  };

 const handleDownloadInvoice = async () => {
  try {
    if (!id) return;

    const pdfData = await ApiRequestUtils.fetchPdfDowload(
      API_ROUTES.GENERATE_INVOICE + "/" + id
    );

    downloadBlob(
      new Blob([pdfData], { type: "application/pdf" }),
      `Invoice_${id}.pdf`
    );
  } catch (error) {
    console.error("Error downloading invoice:", error);
  }
};
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!invoiceDetails) {
    return (
      <div className="text-center mt-10">
        <p className="text-gray-500">No invoice details found.</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">
        Booking Invoice Details
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Booking Id
          </label>
          <div
            onClick={() => invoiceDetails.id && setIsOpen(true)}
            className="p-3 h-[50px] rounded-md border bg-gray-200 flex items-center text-primary-900 underline font-medium cursor-pointer"
          >
            {invoiceDetails.id || "-"}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Created Date
          </label>
          <div className="p-3 h-[50px] rounded-md border bg-gray-200 flex items-center">
            {moment(
              invoiceDetails.fromDate || invoiceDetails.created_at
            ).format("DD-MM-YYYY")}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Customer Name
          </label>
          <div className="p-3 h-[50px] rounded-md border bg-gray-200 flex items-center">
            {invoiceDetails.Customer?.firstName || "-"}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Driver Name
          </label>
          <div className="p-3 h-[50px] rounded-md border bg-gray-200 flex items-center">
            {invoiceDetails.Driver?.firstName || "-"}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Payment Method
          </label>
          <div className="p-3 h-[50px] rounded-md border bg-gray-200 flex items-center">
            {invoiceDetails.paymentMethod || "-"}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Total Amount
          </label>
          <div className="p-3 h-[50px] rounded-md border bg-gray-200 flex items-center font-bold text-lg">
            ₹{" "}
            {invoiceDetails.paymentDetails?.details?.amountAfterGst || "-"}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={isOpen}>
        <DialogHeader className="flex justify-end items-end">
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-black text-xl font-bold focus:outline-none"
          >
            ×
          </button>
        </DialogHeader>

        <DialogBody className="max-h-[80vh] overflow-y-auto">
          <ConfirmBooking
            bookingData={{
              id: invoiceDetails?.id,
              customerId: customerId,
            }}
            setIsOpen={setIsOpen}
            onConfirm={setIsOpen}
            hideBackButton={true}
          />
        </DialogBody>
      </Dialog>

      <div className="flex justify-center gap-6 mt-10">
        <Button
          onClick={() =>
            navigate("/dashboard/finance/bookingInvoiceList")
          }
          className="px-8"
        >
          Back
        </Button>

        <Button
          onClick={handleDownloadInvoice}
          className="px-8 bg-green-500 text-white rounded-xl"
        >
          Download Invoice
        </Button>
      </div>
    </div>
  );
};

export default BookingInvoiceDetails;
