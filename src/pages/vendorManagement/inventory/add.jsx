import React, { useEffect, useMemo } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, Switch } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const initialValues = {
  vendorId: "",
  productId: "",
  availableQty: "",
  reservedQty: "",
  // warehouseAddress: {
  //   name: "",
  //   placeId: "",
  // },
  warehouseAddress:'',
  status: true,
};

const schema = Yup.object({
  vendorId: Yup.string().required("Vendor is required"),
  productId: Yup.string().required("Product is required"),
  availableQty: Yup.number().typeError("Must be a number"),
  reservedQty: Yup.number().typeError("Must be a number"),
  // warehouseAddress: Yup.object().shape({
  //   name: Yup.string().required("Warehouse location is required"),
  //   placeId: Yup.string().required(),
  // }),
});

export const VendorManagementInventoryAdd = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = React.useState([]);
  const [products, setProducts] = React.useState([]);

  const vendorOptions = useMemo(
    () =>
      vendors.map((item) => ({
        value: item.vendorId ?? item.id,
        label: item.name || item.title || `Vendor ${item.vendorId ?? item.id}`,
      })),
    [vendors]
  );

  const productOptions = useMemo(
    () =>
      products.map((item) => ({
        value: item.productId ?? item.id,
        label: item.name || item.title || `Product ${item.productId ?? item.id}`,
      })),
    [products]
  );

  useEffect(() => {
    Promise.all([ApiRequestUtils.get(API_ROUTES.GET_VENDORS), ApiRequestUtils.get(API_ROUTES.GET_PRODUCTS)])
      .then(([vendorsResponse, productsResponse]) => {
        setVendors(Array.isArray(vendorsResponse?.data) ? vendorsResponse.data : vendorsResponse?.data?.rows || []);
        setProducts(Array.isArray(productsResponse?.data) ? productsResponse.data : productsResponse?.data?.rows || []);
      })
      .catch(() => {});
  }, []);

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      await ApiRequestUtils.post(API_ROUTES.ADD_INVENTORY, {
        vendorId: Number(values.vendorId),
        productId: Number(values.productId),
        availableQty: values.availableQty === "" ? null : Number(values.availableQty),
        reservedQty: values.reservedQty === "" ? null : Number(values.reservedQty),
        warehouseAddress: values.warehouseAddress,
        status: Boolean(values.status),
      });
      navigate("/dashboard/vendor-management/inventory");
    } catch (error) {
      console.error("Failed to add inventory:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Add Inventory</div>
        <Formik initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit}>
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold">Vendor ID <span className="text-red-600">*</span></label>
                  <Field as="select" name="vendorId" className="w-full rounded-md border-2 border-gray-300 p-2">
                    <option value="">Select Vendor</option>
                    {vendorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="vendorId" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Product ID <span className="text-red-600">*</span></label>
                  <Field as="select" name="productId" className="w-full rounded-md border-2 border-gray-300 p-2">
                    <option value="">Select Product</option>
                    {productOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="productId" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Available Qty <span className="text-red-600">*</span></label>
                  <Field name="availableQty" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="availableQty" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Reserved Qty <span className="text-red-600">*</span></label>
                  <Field name="reservedQty" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="reservedQty" component="div" className="text-sm text-red-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-bold">Warehouse Location <span className="text-red-600">*</span></label>
                  <Field name="warehouseAddress.name" className="w-full rounded-md border-2 border-gray-300 p-2" placeholder="Enter warehouse location" />
                  <ErrorMessage
                    name="warehouseAddress"
                    component="div"
                    className="text-sm text-red-500"
                  />
                </div>
                <div className="rounded-lg border-2 border-gray-300 p-3">
                  <div className="mb-2 text-sm font-bold">Status <span className="text-red-600">*</span></div>
                  <Switch checked={Boolean(values.status)} onChange={(e) => setFieldValue("status", e.target.checked)} label={values.status ? "Active" : "Inactive"} />
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outlined"
                  onClick={() => navigate("/dashboard/vendor-management/inventory")}
                >
                  Cancel
                </Button>
                <Button
                  className={ColorStyles.continueButtonColor}
                  type="submit"
                  disabled={!dirty || !isValid || isSubmitting}
                >
                  Save
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </CardBody>
    </Card>
  );
};

export default VendorManagementInventoryAdd;
