import { useState, useEffect } from "react";
import {
    Card,
    CardBody,
    Typography,
    Button,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
} from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import Swal from "sweetalert2";

const DocumentsList = ({ id, type, noApprove = true, cabsList, autoList, parcelsList, serviceType }) => {
    const [documentData, setdocumentData] = useState([]);
    const [modalData, setModalData] = useState(null);
    const navigate = useNavigate();
    const [isDeclining, setIsDeclining] = useState(false);
    const [declineReason, setDeclineReason] = useState("");
    const cabs = Array.isArray(cabsList) ? cabsList : cabsList ? [cabsList] : [];
    const autos = Array.isArray(autoList) ? autoList : autoList ? [autoList] : [];
    const parcels = Array.isArray(parcelsList) ? parcelsList : parcelsList ? [parcelsList] : [];
    const hasVehicleRecords = cabs.length > 0 || autos.length > 0 || parcels.length > 0;

    const getVehicleLabel = () => {
        const normalizedService = (serviceType || "").toLowerCase();
        if (normalizedService === "parcel") return "bike";
        if (normalizedService === "auto") return "auto";
        if (normalizedService === "individual" || normalizedService === "company") return "cab";
        return "vehicle";
    };

    const fetchData = async () => {
        if (!id || !type) return;
        const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_DOCUMENT_DETAILS, {
            "id": id,
            "user": type.toLowerCase()
        })
        //console.log("DATA IN DETAILS DOC", data);
        if (data.success) {
            setdocumentData(data?.data?.Proofs);
        }
    }

    useEffect(() => {
        fetchData();
    }, [id, type]);

    const handleCloseModal = () => {
        setModalData(null);
        setDeclineReason("");
        setIsDeclining(false);
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case "pending":
                return "text-primary-500";
            case "approved":
                return "text-green-500";
            case "declined":
                return "text-red-500";
            case "not_interested":
                return "text-orange-500";
            case "no_response":
                return "text-gray-500";
            case "invalid":
                return "text-red-400";
            default:
                return "text-gray-500";
        }
    };

    const handleStatusChange = async (docId, status, reason) => {
        const docData = {
            documentId: docId,
            status: status,
            comments: reason,
        };
        const data = await ApiRequestUtils.update(API_ROUTES.GET_DOCUMENT_DETAILS_LIST, docData);
        // console.log("DATAAA",data)
        if (data?.success) {
            setDeclineReason("");
            setIsDeclining(false);
            setModalData(null)
            Swal.fire({
                position: "center",
                icon: "success",
                title: `Document status updated to ${status}`,
                showConfirmButton: false,
                timer: 1500
            });
            fetchData();
            // const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_DOCUMENT_DETAILS, {
            //     "id": id,
            //     "user": type
            // })
        } else {
            setDeclineReason("");
            setIsDeclining(false);
            setModalData(null)
            Swal.fire({
                position: "center",
                icon: "error",
                title: "Failed to update status. Please try again.",
                showConfirmButton: false,
                timer: 1500
            });
        }
    };

    return (
        <>
            <div className='flex flex-row justify-between px-2 mb-2 mt-4'>
                <h2 className="text-2xl font-bold mb-4">Documents</h2>
            </div>
            <Card>
                {documentData && documentData.length > 0 ? (
                    <>
                        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                            <table className="w-full min-w-[640px] table-auto">
                                <thead>
                                    <tr>
                                        {[
                                            "Type",
                                            "Status",
                                            "View Details",
                                            "Created At",
                                            "Updated At",
                                            "Verified By",
                                            "Verified At",

                                        ].map((el, index) => (
                                            <th
                                                key={index}
                                                className="border-b border-blue-gray-50 py-3 px-5 text-left"
                                            >
                                                <Typography
                                                    variant="small"
                                                    className="text-[11px] font-bold uppercase text-blue-gray-700"
                                                >
                                                    {el}
                                                </Typography>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {documentData.map(
                                        ({ id, type, image1, status, User, created_at, updated_at, image2, Proofs }, key) => {
                                            const className = `py-3 px-5 ${key === documentData.length - 1
                                                ? ""
                                                : "border-b border-blue-gray-50"
                                                }`;
                                            return (
                                                    <tr key={id}>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {type}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography
                                                                className={`text-xs font-semibold ${status === 'PENDING' ? 'text-primary-500' :
                                                                    status === 'APPROVED' ? 'text-green-500' :
                                                                        status === 'DECLINED' ? 'text-red-500' : ''
                                                                    }`}

                                                            >
                                                                {status}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <div className="flex items-center gap-4">
                                                                <div>
                                                                    <Typography
                                                                        variant="small"
                                                                        className="font-semibold underline cursor-pointer text-primary-900"
                                                                        onClick={() => {
                                                                            setDeclineReason("");
                                                                            setIsDeclining(false);
                                                                            setModalData({
                                                                                id,
                                                                                image: image1,
                                                                                image2: image2,
                                                                                status,
                                                                                User,
                                                                                type
                                                                            });
                                                                        }}
                                                                    >
                                                                        View Details
                                                                    </Typography>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {moment(created_at).format("DD-MM-YYYY")}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {status !== 'PENDING' ?
                                                                    moment(Proofs?.[0]?.updated_at).format("DD-MM-YYYY") : ""}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {User ? User?.name : ''}
                                                            </Typography>
                                                        </td>
                                                        <td className={className}>
                                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                                                {status !== 'PENDING' ? moment(updated_at).format("DD-MM-YYYY") : ""}
                                                            </Typography>
                                                        </td>
                                                    </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </CardBody>
                    </>) : (
                    <h2 className="text-lg font-medium p-4">No Documents</h2>
                )
                }
            </Card>
            <Dialog open={Boolean(modalData)} handler={handleCloseModal} size="md" className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex justify-between items-center w-full">
                            <Typography variant="h6">Document Details</Typography>
                            <button
                                className="text-gray-600 hover:text-gray-900"
                                onClick={handleCloseModal}
                            >
                                X
                            </button>
                        </div>
                    </DialogHeader>
                    <DialogBody divider>
                        <div className="flex flex-col items-center space-y-3">
                            <div className={`flex ${modalData?.image2 ? "flex-row space-x-6" : "flex-col"} justify-center`}>
                                {modalData?.image?.toLowerCase?.()?.endsWith(".pdf") ? (
                                    <iframe
                                        src={modalData?.image}
                                        className="w-full rounded-lg shadow-md"
                                        style={{ height: "45vh" }}
                                    />
                                ) : (
                                    <img
                                        src={modalData?.image}
                                        alt="Document"
                                        className="rounded-lg shadow-md"
                                        style={{ width: "45%", height: "45vh", objectFit: "contain" }}
                                    />
                                )
                                }
                                {modalData?.image2 && (
                                    modalData?.image2?.toLowerCase?.()?.endsWith(".pdf") ? (
                                        <iframe
                                            src={modalData?.image2}
                                            className="rounded-lg shadow-md"
                                            style={{ height: "45vh", width: "45%" }}
                                        />
                                    ) : (
                                        <img
                                            src={modalData?.image2}
                                            alt="Document"
                                            className="rounded-lg shadow-md"
                                            style={{ height: "45vh", width: "45%", objectFit: "contain" }}
                                        />
                                    )
                                )}
                            </div>

                            <div className="flex justify-center mt-4">
                                <a
                                    href={modalData?.image}
                                    download
                                    target="_blank"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700"
                                >
                                    Download Image 1
                                </a>
                                {modalData?.image2 && (
                                    <a
                                        href={modalData?.image2}
                                        download
                                        target="_blank"
                                        className="ml-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700"
                                    >
                                        Download Image 2
                                    </a>
                                )}
                            </div>
                            <Typography variant="body1" className="text-gray-600">
                                Document Status: <span className={getStatusColor(modalData?.status || "")}>{modalData?.status}</span>
                            </Typography>
                            {modalData?.status !== 'PENDING' && <Typography variant="body1" className="text-gray-600">
                                Verified By : {modalData?.User ? modalData?.User?.name : ''}
                            </Typography>}
                        </div>
                        {isDeclining && (
                            <div className="mt-4 w-full">
                                <Typography variant="body2" className="text-gray-600 mb-2">
                                    Please enter a reason for declining:
                                </Typography>
                                <textarea
                                    className="p-2 border rounded-md w-full text-black"
                                    placeholder="Enter reason here..."
                                    value={declineReason}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                />
                            </div>
                        )}
                    </DialogBody>
                    {modalData?.status !== "APPROVED" && !noApprove && (
                        <DialogFooter className="flex flex-col items-center">
                            {!isDeclining ? (
                                <div className="flex space-x-5">
                                    <Button
                                        onClick={() => {
                                            if (type !== "driver" && ["RC_COPY", "LICENSE"].includes(modalData?.type) ? hasVehicleRecords : true) {
                                                handleStatusChange(modalData?.id, "APPROVED", "")
                                            } else {
                                                handleCloseModal();
                                                Swal.fire({
                                                    position: "center",
                                                    icon: "error",
                                                    title: `Please add ${getVehicleLabel()} first to approve this document.`,
                                                    showConfirmButton: false,
                                                    timer: 1500
                                                });
                                            }
                                        }}
                                        className="text-xs font-semibold text-black bg-white border border-black px-4 py-2"
                                    >
                                        Approve
                                    </Button>
                                   <Button
                                        onClick={() => setIsDeclining(true)}
                                        className="text-xs font-semibold text-white bg-black px-4 py-2"
                                    >
                                        Decline
                                    </Button>
                                      {/* {["PENDING"].includes(modalData.status) && ( */}
                                    <>
                                        <Button
                                        onClick={() => handleStatusChange(modalData?.id, "NOT_INTERESTED", "")}
                                        className="text-xs font-semibold text-white bg-orange-500 px-4 py-2"
                                        >
                                        Not Interested
                                        </Button>

                                        <Button
                                        onClick={() => handleStatusChange(modalData?.id, "NO_RESPONSE", "")}
                                        className="text-xs font-semibold text-white bg-gray-500 px-4 py-2"
                                        >
                                        No Response
                                        </Button>

                                        <Button
                                        onClick={() => handleStatusChange(modalData?.id, "INVALID", "")}
                                        className="text-xs font-semibold text-white bg-red-600 px-4 py-2"
                                        >
                                        Invalid
                                        </Button>
                                    </>
                                    {/* )} */}
                                  {["NOT_INTERESTED", "INVALID", "NO_RESPONSE"].includes(modalData?.status) && (
                                    <Button
                                        onClick={() => handleStatusChange(modalData?.id, "PENDING", "")}
                                        className="text-xs font-semibold text-white bg-blue-500 px-4 py-2"
                                    >
                                        Pending
                                    </Button>
                                    
                                )}
                                   
                                </div>
                            ) : (
                                <div className="flex space-x-4">
                                    <Button
                                        onClick={() => setIsDeclining(false)}
                                        className="text-xs font-semibold text-black bg-gray-300 px-4 py-2"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            handleStatusChange(modalData?.id, "DECLINED", declineReason);
                                            setIsDeclining(false);
                                        }}
                                        className="bg-primary-400 hover:bg-primary-500 text-white px-4 py-2"
                                        disabled={!declineReason.trim()}
                                    >
                                        Send
                                    </Button>
                                </div>
                            )}
                        </DialogFooter>
                    )}
                </Dialog>
        </>
    )
};

export default DocumentsList;