import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, CardHeader, Dialog, DialogBody, DialogFooter, DialogHeader, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";

const validationSchema = Yup.object().shape({
  title: Yup.string().trim().required("Title is required"),
  redirectUrl: Yup.string().trim().required("Redirect URL is required"),
  position: Yup.number().typeError("Position must be a number").required("Position is required"),
  status: Yup.boolean().required("Status is required"),
  image: Yup.mixed().required("Image is required"),
  image2: Yup.mixed().required("Image 2 is required"),
});

const initialValues = {
  type:'VENDOR_LIST',
  title: "",
  redirectUrl: "",
  position: "",
  status: true,
  image: null,
  image2: null,
};

function ExternalPromotionsAdd() {
  const navigate = useNavigate();
  const [modalMessage, setModalMessage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [image2Preview, setImage2Preview] = useState(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (image2Preview) URL.revokeObjectURL(image2Preview);
    };
  }, [imagePreview, image2Preview]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append("type",values.type)
      formData.append("title", values.title.trim());
      formData.append("redirectUrl", values.redirectUrl.trim());
      formData.append("position", String(values.position));
      formData.append("status", String(Boolean(values.status)));

      if (values.image) {
        formData.append("image", values.image, values.image.name);
        formData.append("extImage", values.image.name.split(".").pop()?.toLowerCase() || "");
        formData.append("fileTypeImage", values.image.type || "");
      }

      if (values.image2) {
        formData.append("image2", values.image2, values.image2.name);
        formData.append("extImage2", values.image2.name.split(".").pop()?.toLowerCase() || "");
        formData.append("fileTypeImage2", values.image2.type || "");
      }
      // console.log('payload :- ', values)
      const response = await ApiRequestUtils.postDocs(API_ROUTES.ADD_EXTERNAL_PROMOTIONS, formData);
      if (response?.success) {
        navigate("/dashboard/vendors/external-promotions");
        return;
      }

      setModalMessage(response?.error || response?.message || "Unable to save external promotion.");
    } catch (error) {
      console.error("Failed to create external promotion:", error);
      setModalMessage(error?.response?.data?.error || error?.response?.data?.message || error?.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl rounded-xl bg-white p-4 shadow-md">
      <Card>
        <CardHeader variant="gradient" className="mb-4 bg-primary p-6">
          <Typography variant="h6" color="white">
            Add External Promotions
          </Typography>
        </CardHeader>
        <Dialog open={Boolean(modalMessage)} handler={() => setModalMessage("")} size="sm">
        <DialogHeader className="flex items-center justify-between">
          <Typography variant="h6" color="blue-gray">
            Alert
          </Typography>
        </DialogHeader>
        <DialogBody divider>
          <Typography variant="paragraph" color="blue-gray">
            {modalMessage}
          </Typography>
        </DialogBody>
        <DialogFooter>
          <Button type="button" className={`${ColorStyles.continueButtonColor}`} onClick={() => setModalMessage("")}>
            Ok
          </Button>
        </DialogFooter>
      </Dialog>
        <CardBody>
          <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
            {({ isSubmitting, values, setFieldValue }) => (
              <Form className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Title</label>
                    <Field name="title" type="text" className="w-full rounded-md border border-gray-300 p-2 shadow-sm" />
                    <ErrorMessage name="title" component="div" className="text-sm text-red-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Redirect URL</label>
                    <Field name="redirectUrl" type="text" className="w-full rounded-md border border-gray-300 p-2 shadow-sm" />
                    <ErrorMessage name="redirectUrl" component="div" className="text-sm text-red-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Position</label>
                    <Field name="position" type="number" className="w-full rounded-md border border-gray-300 p-2 shadow-sm" />
                    <ErrorMessage name="position" component="div" className="text-sm text-red-500" />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <input
                      type="checkbox"
                      checked={Boolean(values.status)}
                      onChange={(e) => setFieldValue("status", e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">{values.status ? "Active" : "Inactive"}</span>
                    <ErrorMessage name="status" component="div" className="text-sm text-red-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full rounded-md border border-gray-300 p-2 shadow-sm"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0] || null;
                        setFieldValue("image", file);
                        if (imagePreview) URL.revokeObjectURL(imagePreview);
                        setImagePreview(file ? URL.createObjectURL(file) : null);
                      }}
                    />
                    <ErrorMessage name="image" component="div" className="text-sm text-red-500" />
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Image preview"
                        className="mt-3 h-32 w-full rounded-lg border border-gray-200 object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Image 2</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full rounded-md border border-gray-300 p-2 shadow-sm"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0] || null;
                        setFieldValue("image2", file);
                        if (image2Preview) URL.revokeObjectURL(image2Preview);
                        setImage2Preview(file ? URL.createObjectURL(file) : null);
                      }}
                    />
                    <ErrorMessage name="image2" component="div" className="text-sm text-red-500" />
                    {image2Preview ? (
                      <img
                        src={image2Preview}
                        alt="Image 2 preview"
                        className="mt-3 h-32 w-full rounded-lg border border-gray-200 object-cover"
                      />
                    ) : null}
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => navigate("/dashboard/vendors/external-promotions")}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className={ColorStyles.bgColor} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Add"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </CardBody>
      </Card>
    </div>
  );
}

export default ExternalPromotionsAdd;