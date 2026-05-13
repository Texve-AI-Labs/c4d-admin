import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Typography, Button, Chip, Dialog, DialogHeader, DialogBody } from "@material-tailwind/react";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import AccountCreationTabs from "./AccountCreationTabs";

const normalizeSubType = () => "Parcel";

const VehicleDocuments = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [requiredDocs, setRequiredDocs] = useState([]);
  const [account, setAccount] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [uploadingByType, setUploadingByType] = useState({});
  const [uploadErrorsByType, setUploadErrorsByType] = useState({});

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const accountRes = await ApiRequestUtils.get(`${API_ROUTES.GET_ACCOUNT_BY_ID}/${id}`);
      const accountData = accountRes?.data?.data;
      setAccount(accountData || null);

      const vehicleDocsRes = await ApiRequestUtils.getWithQueryParam(API_ROUTES.ADMIN_REQUIRED_DOCUMENTS, {
        subjectType: "ACCOUNT",
        serviceType: normalizeSubType(accountData?.type),
      });

      const vehicleDocs = vehicleDocsRes?.data?.vehicleRequiredDocuments || [];
      const combinedDocs = vehicleDocs.map((docType) => ({ type: docType, subjectType: "VEHICLE" }));
      setRequiredDocs(combinedDocs);
    } catch (err) {
      console.error("Failed to load vehicle documents data", err);
    }
  };

  const proofsByType = useMemo(() => {
    const map = new Map();
    (account?.Proofs || []).forEach((proof) => {
      if (proof?.type) map.set(proof.type, proof);
    });
    return map;
  }, [account]);

  const rows = useMemo(() => {
    return (requiredDocs || []).map((item, index) => {
      const docType = item?.type || item?.documentType || item?.name || `DOC_${index + 1}`;
      const proof = proofsByType.get(docType);
      return {
        key: `${docType}-${index}`,
        docType,
        proof,
        type: item?.displayName || item?.label || docType,
        status: proof?.image1 ? "UPLOADED" : "PENDING UPLOAD",
        createdAt: proof?.created_at ? moment(proof.created_at).format("DD-MM-YYYY") : "-",
      };
    });
  }, [requiredDocs, proofsByType]);

  const isSingleFileDocType = (docType) => ["PHOTO", "INSURANCE", "PERMIT"].includes(docType);

  const handleUploadDocument = async (event, row) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploadErrorsByType((prev) => ({ ...prev, [row.docType]: "" }));

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    const maxSize = 10 * 1024 * 1024;
    const singleFile = isSingleFileDocType(row.docType);

    if (singleFile && files.length > 1) {
      setUploadErrorsByType((prev) => ({
        ...prev,
        [row.docType]: "Only one document is allowed for this type.",
      }));
      return;
    }
    if (!singleFile && files.length > 2) {
      setUploadErrorsByType((prev) => ({
        ...prev,
        [row.docType]: "You can upload a maximum of two documents.",
      }));
      return;
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setUploadErrorsByType((prev) => ({
          ...prev,
          [row.docType]: "Invalid file type. Please upload JPG, PNG, or PDF.",
        }));
        return;
      }
      if (file.size > maxSize) {
        setUploadErrorsByType((prev) => ({
          ...prev,
          [row.docType]: "File size exceeds 10MB limit.",
        }));
        return;
      }
    }

    const formData = new FormData();
    formData.append("type", row.docType);
    formData.append("accountId", id);

    if (files[0]) {
      formData.append("image1", files[0]);
      formData.append("extImage1", files[0].name.split(".").pop() || "");
      formData.append("fileTypeImage1", files[0].type);
    }

    if (files[1] && !singleFile) {
      formData.append("image2", files[1]);
      formData.append("extImage2", files[1].name.split(".").pop() || "");
      formData.append("fileTypeImage2", files[1].type);
    }

    try {
      setUploadingByType((prev) => ({ ...prev, [row.docType]: true }));
      if (row.proof?.id) {
        formData.append("documentId", row.proof.id);
        await ApiRequestUtils.updateDocs(API_ROUTES.UPDATE_PHOTO, formData);
      } else {
        await ApiRequestUtils.postDocs(API_ROUTES.UPLOAD_PHOTO, formData);
      }
      setUploadErrorsByType((prev) => ({ ...prev, [row.docType]: "" }));
      await fetchData();
    } catch (error) {
      setUploadErrorsByType((prev) => ({
        ...prev,
        [row.docType]: "Upload failed. Please try again.",
      }));
      console.error("Failed to upload document:", error);
    } finally {
      setUploadingByType((prev) => ({ ...prev, [row.docType]: false }));
      event.target.value = "";
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <AccountCreationTabs activeStage={3} />
      <div className="mb-4">
        {/* <h2 className="text-2xl font-bold">Vehicle Documents</h2> */}
        <span className="text-xs text-blue-gray-600 mt-1">Account ID: {id}</span>
        <p className="text-sm text-gray-600 mt-1">
          Document upload is required to verify your account and ensure compliance with our policies.
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Please upload the following documents:
        </p>
        <ul className="text-sm text-gray-600 list-disc list-inside">
          <li><strong>Rc Copy:</strong> 2 documents</li>
          <li><strong>Insurance:</strong> 1 document</li>
          {/* <li><strong>Permit:</strong> 1 documents</li> */}

          <li><strong>Vehicle Photo:</strong> 2 documents</li>

        </ul>
      </div>

      <Card>
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["Type", "Status", "View Details", "Created At", "Action"].map((el) => (
                  <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                    <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                      {el}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 px-5 text-center">
                    <Typography variant="small" className="font-semibold text-blue-gray-700">
                      No required documents found
                    </Typography>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.key}>
                    <td className="py-3 px-5 border-b border-blue-gray-50">
                      <Typography className="text-xs font-semibold text-blue-gray-900">{row.type}</Typography>
                    </td>
                    <td className="py-3 px-5 border-b border-blue-gray-50">
                      <Chip
                        variant="ghost"
                        color={row.status === "UPLOADED" ? "green" : "blue-gray"}
                        value={row.status === "UPLOADED" ? "Uploaded" : "Pending Upload"}
                        className="py-0.5 px-2 text-[11px] font-medium normal-case w-fit"
                      />
                    </td>
                    <td className="py-3 px-5 border-b border-blue-gray-50">
                      {row.proof?.image1 ? (
                        <Typography
                          className="text-xs font-semibold text-blue-700 underline cursor-pointer"
                          onClick={() => setModalData({ image1: row.proof?.image1, image2: row.proof?.image2 })}
                        >
                          View Details
                        </Typography>
                      ) : (
                        <Typography className="text-xs font-semibold text-blue-gray-400">-</Typography>
                      )}
                    </td>
                    <td className="py-3 px-5 border-b border-blue-gray-50">
                      <Typography className="text-xs font-semibold text-blue-gray-900">{row.createdAt}</Typography>
                    </td>
                    <td className="py-3 px-5 border-b border-blue-gray-50">
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor={`upload-${row.key}`}
                          className="inline-block w-fit text-center text-white border border-gray-400 bg-primary rounded-lg px-4 py-1 cursor-pointer text-xs"
                        >
                          {uploadingByType[row.docType] ? "Uploading..." : row.proof?.id ? "Update" : "Upload"}
                        </label>
                        <input
                          type="file"
                          id={`upload-${row.key}`}
                          className="hidden"
                          accept="image/*,application/pdf"
                          multiple={!isSingleFileDocType(row.docType)}
                          onChange={(e) => handleUploadDocument(e, row)}
                          disabled={Boolean(uploadingByType[row.docType])}
                        />
                        {uploadErrorsByType[row.docType] && (
                          <Typography className="text-[11px] text-red-600 font-medium">
                            {uploadErrorsByType[row.docType]}
                          </Typography>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <div className="flex flex-row mt-4">
        <Button
          fullWidth
          onClick={() => navigate(`/dashboard/vendors/account/owner-onboarding-bike/documents/${id}`)}
          className={`my-2 mx-2 ${ColorStyles.backButton}`}
        >
          Back
        </Button>
        <Button
          fullWidth
          onClick={() => {
            const accountId = account?.id || id;
            navigate(`/dashboard/vendors/account/owner-onboarding-bike/vehicle-creation/${id}`, {
              state: {
                ownerName: account?.name || "",
                type: account?.type || "Parcel",
                accountId,
                fromDetails: true,
              },
            });
          }}
          className={`my-2 mx-2 ${ColorStyles.continueButtonColor}`}
        >
          Continue
        </Button>
      </div>

      {modalData && (
        <Dialog open={Boolean(modalData)} handler={() => setModalData(null)} size="md">
          <DialogHeader>
            <div className="flex justify-between items-center w-full">
              <Typography variant="h6">Document Preview</Typography>
              <button className="text-gray-600 hover:text-gray-900" onClick={() => setModalData(null)}>
                X
              </button>
            </div>
          </DialogHeader>
          <DialogBody divider>
            <div className={`flex ${modalData.image2 ? "flex-row space-x-6" : "flex-col"} justify-center`}>
              {modalData.image1 && (
                <iframe src={modalData.image1} className="rounded-lg shadow-md" style={{ height: "45vh", width: "45%" }} />
              )}
              {modalData.image2 && (
                <iframe src={modalData.image2} className="rounded-lg shadow-md" style={{ height: "45vh", width: "45%" }} />
              )}
            </div>
            <div className="flex justify-center mt-4">
              {modalData.image1 && (
                <a
                  href={modalData.image1}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700"
                >
                  Download Image 1
                </a>
              )}
              {modalData.image2 && (
                <a
                  href={modalData.image2}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="ml-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700"
                >
                  Download Image 2
                </a>
              )}
            </div>
          </DialogBody>
        </Dialog>
      )}
    </div>
  );
};

export default VehicleDocuments;