const CabDocuments = ({
  DocumentUpload,
  imagePreviews,
  setFieldValue,
  handleImageUpload,
  setModalData,
}) => {
  return (
    <>
      <DocumentUpload
        label="Driving License Image"
        value={imagePreviews.drivingLicenseImage?.image1}
        name="drivingLicenseImage"
        onChange={(e) => handleImageUpload(e, setFieldValue, "drivingLicenseImage")}
        setModalData={setModalData}
        fullDocVal={imagePreviews.drivingLicenseImage}
        image2={imagePreviews.drivingLicenseImage?.image2}
      />
      <DocumentUpload
        label="RC"
        value={imagePreviews.rc?.image1}
        name="rc"
        onChange={(e) => handleImageUpload(e, setFieldValue, "rc")}
        setModalData={setModalData}
        fullDocVal={imagePreviews.rc}
        image2={imagePreviews.rc?.image2}
      />
      <DocumentUpload
        label="Vehicle Photo"
        value={imagePreviews.vehiclePhoto?.image1}
        name="vehiclePhoto"
        onChange={(e) => handleImageUpload(e, setFieldValue, "vehiclePhoto")}
        setModalData={setModalData}
        fullDocVal={imagePreviews.vehiclePhoto}
        image2={imagePreviews.vehiclePhoto?.image2}
      />
      <DocumentUpload
        label="Insurance"
        value={imagePreviews.insurance?.image1}
        name="insurance"
        onChange={(e) => handleImageUpload(e, setFieldValue, "insurance")}
        setModalData={setModalData}
        fullDocVal={imagePreviews.insurance}
      />
      <DocumentUpload
        label="Permit"
        value={imagePreviews.permit?.image1}
        name="permit"
        onChange={(e) => handleImageUpload(e, setFieldValue, "permit")}
        setModalData={setModalData}
        fullDocVal={imagePreviews.permit}
      />
    </>
  );
};

export default CabDocuments;
