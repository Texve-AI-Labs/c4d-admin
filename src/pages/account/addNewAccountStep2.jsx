import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Spinner,
  Typography,
} from "@material-tailwind/react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, STATE_LIST, THALUK_LIST, KYC_PROCESS, ColorStyles } from "@/utils/constants";
import { ACCOUNT_ADD_SCHEMA } from "@/utils/validations";
import LocationInput from "@/components/LocationInput";
import AccountDocuments from "./AccountDocuments";

const AddNewAccountStep2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const step1Values = location.state?.step1Values || {};
  const hasStep1Values = Boolean(step1Values?.type && step1Values?.name && step1Values?.phoneNumber && step1Values?.source);

  const [serviceAreas, setServiceAreas] = useState([]);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSameAddress, setIsSameAddress] = useState(false);
  const [ownerAdded, setOwnerAdded] = useState({ ownerId: "", value: false });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [docModalData, setDocModalData] = useState(null);
  const [imagePreviews, setImagePreviews] = useState({
    aadhaarImage: null,
    livePhoto: null,
    drivingLicenseImage: null,
  });

  useEffect(() => {
    if (!hasStep1Values && !ownerAdded.value) {
      navigate("/dashboard/vendors/account/add/new/step-1", { replace: true });
    }
  }, [hasStep1Values, ownerAdded.value, navigate]);

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam("/geo-markings", {
          type: "Service Area",
        });
        setServiceAreas(response?.data || []);
      } catch (error) {
        console.error("Error fetching service areas:", error);
      }
    };

    fetchGeoData();
  }, []);

  const districtOptions = [...new Set(serviceAreas.map((area) => area?.district || area?.name).filter(Boolean))].map((district) => ({
    id: district,
    name: district,
  }));

  const thalukOptions = THALUK_LIST.map((thaluk) => ({
    id: thaluk.value,
    name: thaluk.label,
  }));

  const stateOptions = STATE_LIST.map((state) => ({
    id: state.value,
    name: state.label,
  }));

  const searchLocations = async (query) => {
    if (query.length > 2) {
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, {
        address: query,
      });
      if (data?.success && data?.data) {
        setAddressSuggestions(data.data);
      }
    } else {
      setAddressSuggestions([]);
    }
  };

  const parseAddress = (address) => {
    if (!address || typeof address !== "string") {
      return { street: "", taluk: "", district: "", state: "", pincode: "" };
    }
    const parts = address.split(", ").reverse();
    return {
      street: parts[4] || "",
      taluk: parts[3] || "",
      district: parts[2] || "",
      state: parts[1] || "",
      pincode: "",
    };
  };

  const getDocumentByType = (proofs = [], type) => proofs.find((proof) => proof.type === type) || null;

  const fetchExistingProofs = async () => {
    try {
      if (!ownerAdded?.ownerId) return;
      const res = await ApiRequestUtils.get(`${API_ROUTES.GET_ACCOUNT_BY_ID}/${ownerAdded.ownerId}`);
      const proofs = res?.data?.data?.Proofs || [];
      setImagePreviews((prev) => ({
        ...prev,
        aadhaarImage: getDocumentByType(proofs, KYC_PROCESS.AADHAAR) || prev.aadhaarImage,
        livePhoto: getDocumentByType(proofs, KYC_PROCESS.LIVE_PHOTO) || prev.livePhoto,
        drivingLicenseImage: getDocumentByType(proofs, KYC_PROCESS.DRIVING_LICENSE) || prev.drivingLicenseImage,
      }));
    } catch (error) {
      console.error("Error fetching existing proofs:", error);
    }
  };

  const initialValuesStep2 = {
    ...step1Values,
    address: "",
    street: "",
    state: "",
    thaluk: "",
    district: "",
    pincode: "",
  };

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const reqBody = {
        type: values?.type,
        name: values?.name,
        phoneNumber: values?.phoneNumber,
        email: values?.email,
        address: values?.address,
        street: values?.street,
        thaluk: values?.thaluk,
        district: values?.district,
        state: values?.state,
        pincode: values?.pincode,
        source: values?.source,
      };

      if (!hasStep1Values) {
        setAlert({ message: "Step 1 details are missing. Please complete Step 1 again.", color: "red" });
        return;
      }

      const data = await ApiRequestUtils.post(API_ROUTES.CREATE_ACCOUNT, reqBody);
      if (data?.success) {
        setOwnerAdded({ ownerId: data?.data?.id || "", value: true });
        setSuccessModal(true);
      }
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e, setFieldValue, label) => {
    try {
      setLoading(true);
      const files = e.target.files;
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      const maxSize = 10 * 1024 * 1024;

      if (files.length > 2) {
        setLoading(false);
        setAlert({ message: "You can upload a maximum of two documents.", color: "red" });
        return;
      }

      for (let i = 0; i < files.length; i += 1) {
        if (!allowedTypes.includes(files[i].type)) {
          setLoading(false);
          setAlert({ message: "Invalid file type. Please upload JPG, PNG, or PDF.", color: "red" });
          return;
        }
        if (files[i].size > maxSize) {
          setLoading(false);
          setAlert({ message: "File size exceeds 10MB limit.", color: "red" });
          return;
        }
      }

      setFieldValue(label, files);

      let type = "";
      switch (label) {
        case "aadhaarImage":
          type = KYC_PROCESS.AADHAAR;
          break;
        case "livePhoto":
          type = KYC_PROCESS.LIVE_PHOTO;
          break;        
        default:
          break;
      }

      const formData = new FormData();
      const isSingleFileDoc = label === "insurance" || label === "permit";

      formData.append("image1", files[0]);
      formData.append("extImage1", files[0].name.split(".").pop());
      formData.append("fileTypeImage1", files[0].type);

      if (files[1] && !isSingleFileDoc) {
        formData.append("image2", files[1]);
        formData.append("extImage2", files[1].name.split(".").pop());
        formData.append("fileTypeImage2", files[1].type);
      }

      formData.append("type", type);
      formData.append("accountId", ownerAdded?.ownerId);

      const data = await ApiRequestUtils.postDocs(API_ROUTES.UPLOAD_PHOTO, formData);

      if (data?.success) {
        setImagePreviews((prev) => ({
          ...prev,
          [label]: {
            image1: data?.data?.image1 || prev[label]?.image1,
            image2: data?.data?.image2 || prev[label]?.image2,
            id: data?.data?.id,
          },
        }));
      } else if (data?.code === 203) {
        setAlert({ message: `${label} already uploaded for this account.`, color: "amber" });
        await fetchExistingProofs();
      } else {
        setAlert({ message: data?.message || "Failed to upload document. Please try again.", color: "red" });
      }
    } catch (err) {
      setAlert({ message: "An error occurred while uploading document.", color: "red" });
    } finally {
      setLoading(false);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handlePhotoUpload = async (e, setFieldValue, label) => {
    try {
      setLoading(true);
      const file = e.target.files[0];
      if (!file) {
        setLoading(false);
        return;
      }

      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      const maxSize = 10 * 1024 * 1024;

      if (!allowedTypes.includes(file.type)) {
        setAlert({ message: "Invalid file type. Please upload JPG, PNG, or PDF.", color: "red" });
        setLoading(false);
        return;
      }
      if (file.size > maxSize) {
        setAlert({ message: "File size exceeds 10MB limit.", color: "red" });
        setLoading(false);
        return;
      }

      setFieldValue(label, file);

      const type = label === "livePhoto" ? KYC_PROCESS.LIVE_PHOTO : "";
      const formData = new FormData();
      formData.append("image1", file);
      formData.append("extImage1", file.name.split(".").pop());
      formData.append("fileTypeImage1", file.type);
      formData.append("type", type);
      formData.append("accountId", ownerAdded?.ownerId);

      const data = await ApiRequestUtils.postDocs(API_ROUTES.UPLOAD_PHOTO, formData);
      if (data?.success) {
        setImagePreviews((prev) => ({
          ...prev,
          [label]: {
            image1: data?.data?.image1 || prev[label]?.image1,
            id: data?.data?.id,
          },
        }));
      } else if (data?.code === 203) {
        setAlert({ message: `${label} already uploaded for this account.`, color: "amber" });
        await fetchExistingProofs();
      } else {
        setAlert({ message: data?.message || "Failed to upload photo. Please try again.", color: "red" });
      }
    } catch (err) {
      setAlert({ message: "An error occurred while uploading the photo.", color: "red" });
    } finally {
      setLoading(false);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  useEffect(() => {
    if (ownerAdded?.value) {
      fetchExistingProofs();
    }
  }, [ownerAdded?.value]);

  const DocumentUpload = ({ label, value, name, onChange, fullDocVal }) => (
    <tr>
      <td className="py-3 px-5 border-b border-blue-gray-50">
        <Typography className="text-xs font-semibold text-blue-gray-600">{label}</Typography>
      </td>
      <td className="py-3 px-5 border-b border-blue-gray-50">
        <Typography className={`text-xs font-semibold ${value ? "text-green-500" : "text-primary-500"}`}>
          {value ? "UPLOADED" : "NO DOCUMENTS"}
        </Typography>
      </td>
      <td className="py-3 px-5 border-b border-blue-gray-50">
        <div className="flex items-center gap-2">
          <label htmlFor={name} className="inline-block text-center text-white border border-gray-400 bg-black rounded-lg px-4 py-1 cursor-pointer">
            Upload
          </label>
          <input
            type="file"
            accept="image/*, application/pdf"
            id={name}
            name={name}
            onChange={onChange}
            className="hidden"
            multiple={name !== "livePhoto" && name !== "insurance" && name !== "permit"}
          />
        </div>
      </td>
      <td className="py-3 px-5 border-b border-blue-gray-50">
        {value && (
          <Typography
            variant="small"
            className="font-semibold underline cursor-pointer text-primary-900"
            onClick={() => {
              if (label === "Live Photo" || label === "Insurance" || label === "Permit") {
                setDocModalData({ image1: fullDocVal?.image1 });
              } else {
                setDocModalData({ image1: fullDocVal?.image1, image2: fullDocVal?.image2 });
              }
            }}
          >
            View/Download
          </Typography>
        )}
      </td>
    </tr>
  );

  return (
    <div className="p-6 bg-gray-200 rounded-md">
      <h2 className="text-2xl font-bold mb-4">Add New Account - Step 2</h2>
      {alert && <Alert color={alert.color}>{alert.message}</Alert>}

      <Formik initialValues={initialValuesStep2} validationSchema={ACCOUNT_ADD_SCHEMA} onSubmit={onSubmit} enableReinitialize>
        {({ handleSubmit, values, setFieldValue, dirty, isValid }) => {
          const handleGoogleAddressSelect = (selectedAddress) => {
            if (!selectedAddress || typeof selectedAddress !== "string") return;
            const parsedAddress = parseAddress(selectedAddress);
            setFieldValue("address", selectedAddress);
            if (isSameAddress) {
              setFieldValue("street", parsedAddress.street);
              setFieldValue("thaluk", parsedAddress.taluk);
              setFieldValue("district", parsedAddress.district);
              setFieldValue("state", parsedAddress.state);
              setFieldValue("pincode", parsedAddress.pincode);
            }
          };

          return (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="text-sm font-medium text-gray-700">Current Address</label>
                  <Field name="address">
                    {({ field, form }) => (
                      <LocationInput
                        field={field}
                        form={form}
                        suggestions={addressSuggestions}
                        onSearch={searchLocations}
                        disabled={ownerAdded.value}
                        onSelect={handleGoogleAddressSelect}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="address" component="div" className="text-red-500 text-sm" />
                </div>

                <div className="md:col-span-2 flex items-center">
                  <input
                    type="checkbox"
                    id="sameAddress"
                    checked={isSameAddress}
                    disabled={ownerAdded.value}
                    onChange={(e) => {
                      setIsSameAddress(e.target.checked);
                      if (e.target.checked) {
                        const currentAddress = parseAddress(values.address);
                        setFieldValue("street", currentAddress.street);
                        setFieldValue("thaluk", currentAddress.taluk);
                        setFieldValue("district", currentAddress.district);
                        setFieldValue("state", currentAddress.state);
                        setFieldValue("pincode", currentAddress.pincode);
                      }
                    }}
                    className="mr-2"
                  />
                  <label htmlFor="sameAddress" className="text-sm text-gray-700">Same as Current Address</label>
                </div>

                <div>
                  <label htmlFor="street" className="text-sm font-medium text-gray-700">Street Name</label>
                  <Field type="text" name="street" disabled={ownerAdded.value} className="p-2 w-full rounded-md border-2 border-gray-300" />
                </div>
                <div>
                  <label htmlFor="thaluk" className="text-sm font-medium text-gray-700">Thaluk</label>
                  <Field as="select" name="thaluk" disabled={ownerAdded.value} className="p-2 w-full rounded-md border-2 border-gray-300">
                    <option value="">Select Thaluk</option>
                    {thalukOptions.map((thaluk) => (
                      <option key={thaluk.id} value={thaluk.id}>{thaluk.name}</option>
                    ))}
                  </Field>
                </div>
                <div>
                  <label htmlFor="district" className="text-sm font-medium text-gray-700">District</label>
                  <Field as="select" name="district" disabled={ownerAdded.value} className="p-2 w-full rounded-md border-2 border-gray-300">
                    <option value="">Select District</option>
                    {districtOptions.map((district) => (
                      <option key={district.id} value={district.id}>{district.name}</option>
                    ))}
                  </Field>
                </div>
                <div>
                  <label htmlFor="state" className="text-sm font-medium text-gray-700">State</label>
                  <Field as="select" name="state" disabled={ownerAdded.value} className="p-2 w-full rounded-md border-2 border-gray-300">
                    <option value="">Select State</option>
                    {stateOptions.map((state) => (
                      <option key={state.id} value={state.id}>{state.name}</option>
                    ))}
                  </Field>
                </div>
                <div>
                  <label htmlFor="pincode" className="text-sm font-medium text-gray-700">Pincode</label>
                  <Field type="text" name="pincode" disabled={ownerAdded.value} className="p-2 w-full rounded-md border-2 border-gray-300" />
                </div>
              </div>

              {!ownerAdded.value && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => navigate("/dashboard/vendors/account/add/new/step-1", { state: { step1Values } })}
                    className={ColorStyles.backButton}
                  >
                    Back
                  </Button>
                  <Button type="submit" onClick={handleSubmit} disabled={!dirty || !isValid} className={ColorStyles.continueButtonColor}>
                    Create Account
                  </Button>
                </div>
              )}

              {ownerAdded.value && (
                <div>
                  {loading ? (
                    <div className="flex justify-center items-center h-screen">
                      <Spinner className="h-12 w-12" />
                    </div>
                  ) : (
                    <div className="mt-6">
                      <div className="flex flex-row justify-between px-2 mb-2">
                        <Typography variant="h3" className="text-2xl font-bold text-blue-gray-800">
                          Document Upload
                        </Typography>
                      </div>
                      <Card>
                        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
                          <table className="w-full min-w-[640px] table-auto">
                            <thead>
                              <tr>
                                {["Type", "Status", "Action", ""].map((el, index) => (
                                  <th key={index} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                    <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                      {el}
                                    </Typography>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <AccountDocuments
                                DocumentUpload={DocumentUpload}
                                imagePreviews={imagePreviews}
                                setFieldValue={setFieldValue}
                                handleImageUpload={handleImageUpload}
                                handlePhotoUpload={handlePhotoUpload}
                                setModalData={setDocModalData}
                              />
                              
                            </tbody>
                          </table>
                        </CardBody>
                      </Card>
                    </div>
                  )}

                  <div className="flex flex-row mt-4">
                    <Button
                      fullWidth
                      onClick={() => navigate("/dashboard/vendors/account")}
                      className={`my-6 mx-2 ${ColorStyles.backButton}`}
                    >
                      Back
                    </Button>
                    <Button
                      fullWidth
                      color="black"
                      onClick={() =>
                        navigate("/dashboard/vendors/account/add/new/step-3", {
                          state: {
                            accountId: ownerAdded.ownerId,
                            ownerName: step1Values?.name || "",
                            type: step1Values?.type || "",
                          },
                        })
                      }
                      className={`my-6 mx-2 ${ColorStyles.continueButtonColor}`}
                    >
                      Continue to Step 3
                    </Button>
                  </div>
                </div>
              )}
            </Form>
          );
        }}
      </Formik>

      <Dialog open={successModal} handler={() => setSuccessModal(false)} size="sm">
        <DialogHeader>Success</DialogHeader>
        <DialogBody divider>
          <Typography className="text-sm text-blue-gray-700">Your Account is Registered Succcessfully</Typography>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => setSuccessModal(false)} className={ColorStyles.continueButtonColor}>
            OK
          </Button>
        </DialogFooter>
      </Dialog>

      {docModalData && (
        <Dialog open={Boolean(docModalData)} handler={() => setDocModalData(null)} size="md">
          <DialogHeader>
            <div className="flex justify-between items-center w-full">
              <Typography variant="h6">Document Details</Typography>
              <button className="text-gray-600 hover:text-gray-900" onClick={() => setDocModalData(null)}>
                X
              </button>
            </div>
          </DialogHeader>
          <DialogBody divider>
            <div className="flex flex-col items-center space-y-3">
              <div className={`flex ${docModalData.image2 ? "flex-row space-x-6" : "flex-col"} justify-center`}>
                {docModalData.image1 && <iframe src={docModalData.image1} className="w-full rounded-lg shadow-md" style={{ height: "45vh", width: "45%" }} />}
                {docModalData.image2 && <iframe src={docModalData.image2} className="rounded-lg shadow-md" style={{ height: "45vh", width: "45%" }} />}
              </div>
              <div className="flex justify-center mt-4">
                <a href={docModalData.image1} download target="_blank" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700" rel="noreferrer">
                  Download Image 1
                </a>
                {docModalData.image2 && (
                  <a href={docModalData.image2} download target="_blank" className="ml-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700" rel="noreferrer">
                    Download Image 2
                  </a>
                )}
              </div>
            </div>
          </DialogBody>
        </Dialog>
      )}
    </div>
  );
};

export default AddNewAccountStep2;
