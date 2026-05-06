import { Formik, Form, Field, ErrorMessage } from "formik";
import { Button } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ColorStyles } from "@/utils/constants";
import * as Yup from "yup";

const STEP1_SCHEMA = Yup.object().shape({
  type: Yup.string().required("Service Type is required"),
  name: Yup.string().required("Name is required"),
  phoneNumber: Yup.string()
    .matches(/^\d{10}$/, "Phone Number must be exactly 10 digits")
    .required("Phone Number is required"),
  source: Yup.string().required("Source is required"),
  email: Yup.string().email("Invalid email format").nullable(),
});

const AddNewAccountStep1 = () => {
  const navigate = useNavigate();

  const initialValuesStep1 = {
    type: "",
    name: "",
    phoneNumber: "",
    email: "",
    source: "",
  };

  const onSubmit = (values) => {
    navigate("/dashboard/vendors/account/add/new/step-2", {
      state: { step1Values: values },
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Add New Account - Step 1</h2>
      <Formik initialValues={initialValuesStep1} validationSchema={STEP1_SCHEMA} onSubmit={onSubmit}>
        {({ handleSubmit, dirty, isValid }) => (
          <Form className="space-y-4 bg-gray-200 p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="text-sm font-medium text-gray-700">Service Type</label>
                <Field as="select" name="type" className="p-2 w-full rounded-md border-2 border-gray-300">
                  <option value="">Select Type</option>
                  <option value="Individual">Owner cum Driver</option>
                  <option value="Company">Travels</option>
                </Field>
                <ErrorMessage name="type" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label htmlFor="name" className="text-sm font-medium text-gray-700">Name</label>
                <Field type="text" name="name" className="p-2 w-full rounded-md border-2 border-gray-300" />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                <Field type="text" name="phoneNumber" maxLength={10} className="p-2 w-full rounded-md border-2 border-gray-300" />
                <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label htmlFor="source" className="text-sm font-medium text-gray-700">Source</label>
                <Field as="select" name="source" className="p-2 w-full rounded-md border-2 border-gray-300">
                  <option value="">Select Source</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Walk In">Walk In</option>
                  <option value="Call">Call</option>
                  <option value="Website">Website</option>
                </Field>
                <ErrorMessage name="source" component="div" className="text-red-500 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                <Field type="email" name="email" className="p-2 w-full rounded-md border-2 border-gray-300" />
                <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => navigate("/dashboard/vendors/account")}
                className="text-black border-2 border-gray-400 bg-white rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" onClick={handleSubmit} disabled={!dirty || !isValid} className={ColorStyles.continueButtonColor}>
                Continue to Step 2
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AddNewAccountStep1;
