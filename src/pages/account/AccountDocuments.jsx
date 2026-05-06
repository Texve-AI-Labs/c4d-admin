const AccountDocuments = ({
  DocumentUpload,
  imagePreviews,
  setFieldValue,
  handleImageUpload,
  handlePhotoUpload,
  setModalData,
}) => {
  return (
    <>
      <DocumentUpload
        label="Aadhaar Image"
        value={imagePreviews.aadhaarImage?.image1}
        name="aadhaarImage"
        onChange={(e) => handleImageUpload(e, setFieldValue, "aadhaarImage")}
        setModalData={setModalData}
        fullDocVal={imagePreviews.aadhaarImage}
        image2={imagePreviews.aadhaarImage?.image2}
      />
      <DocumentUpload
        label="Live Photo"
        value={imagePreviews.livePhoto?.image1}
        name="livePhoto"
        onChange={(e) => handlePhotoUpload(e, setFieldValue, "livePhoto")}
        setModalData={setModalData}
        fullDocVal={imagePreviews.livePhoto}
        image2={imagePreviews.livePhoto?.image2}
      />
    </>
  );
};

export default AccountDocuments;
