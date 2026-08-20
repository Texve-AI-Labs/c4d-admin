import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, CardHeader, Switch, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const initialValues = {
  vendorId: "",
  categoryId: "",
  productId: "",
  vendorSku: "",
  overrideName: "",
  image: null,
  isVisible: true,
  sortOrder: 0,
};

const schema = Yup.object({
  vendorId: Yup.string().required("Vendor is required"),
  categoryId: Yup.string().required("Category is required"),
  productId: Yup.string().required("Product is required"),
  vendorSku: Yup.string().trim().required("Vendor SKU is required"),
  // overrideName: Yup.string().trim(),
  // image: Yup.mixed().required("Image is required"),
  // sortOrder: Yup.number().typeError("Sort order must be a number").nullable(),
});

export const VendorManagementCatalogMappingAdd = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [vendorRes, categoryRes, productRes] = await Promise.all([
          ApiRequestUtils.get(API_ROUTES.GET_VENDORS),
          ApiRequestUtils.get(API_ROUTES.GET_CATEGORIES),
          ApiRequestUtils.get(API_ROUTES.GET_PRODUCTS),
        ]);
        setVendors(Array.isArray(vendorRes?.data) ? vendorRes.data : vendorRes?.data?.rows || []);
        setCategories(Array.isArray(categoryRes?.data) ? categoryRes.data : categoryRes?.data?.rows || []);
        setProducts(Array.isArray(productRes?.data) ? productRes.data : productRes?.data?.rows || []);
      } catch (error) {
        console.error("Failed to load catalog mapping options:", error);
      }
    };

    loadOptions();
  }, []);

  const vendorOptions = useMemo(
    () => vendors.map((item) => ({ value: item.vendorId ?? item.id, label: item.name || item.title || `Vendor ${item.vendorId ?? item.id}` })),
    [vendors]
  );
  const categoryOptions = useMemo(
    () => categories.map((item) => ({ value: item.categoryId ?? item.id, label: item.name || item.title || `Category ${item.categoryId ?? item.id}` })),
    [categories]
  );
  const productOptions = useMemo(
    () => products.map((item) => ({ value: item.productId ?? item.id, label: item.name || item.title || `Product ${item.productId ?? item.id}` })),
    [products]
  );

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append("vendorId", Number(values.vendorId));
      formData.append("categoryId", Number(values.categoryId));
      formData.append("productId", Number(values.productId));
      formData.append("vendorSku", values.vendorSku);
      formData.append("overrideName", values.overrideName);
      formData.append("image", values.image || "");
      formData.append("isVisible", Boolean(values.isVisible));
      formData.append("sortOrder", values.sortOrder || 0);
      if (values.image?.name) {
        formData.append("fileTypeImage", values.image.type || "");
        formData.append("extImage", values.image.name.split(".").pop()?.toLowerCase() || "");
      }
      await ApiRequestUtils.postDocs(API_ROUTES.ADD_CATALOG_MAPPING, formData);
      navigate("/dashboard/vendor-management/catalog-mapping");
    } catch (error) {
      console.error("Failed to add catalog mapping:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Add Catalog Mapping</div>
        <Formik initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit}>
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Vendor <span className="text-red-600">*</span></label>
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
                  <label className="mb-1 block text-sm font-bold text-gray-700">Category <span className="text-red-600">*</span></label>
                  <Field as="select" name="categoryId" className="w-full rounded-md border-2 border-gray-300 p-2">
                    <option value="">Select Category</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="categoryId" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Product <span className="text-red-600">*</span></label>
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
                  <label className="mb-1 block text-sm font-bold text-gray-700">Vendor SKU <span className="text-red-600">*</span></label>
                  <Field name="vendorSku" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="vendorSku" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Override Name</label>
                  <Field name="overrideName" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="overrideName" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Image <span className="text-red-600">*</span></label>
                  <input type="file" accept="image/*" className="w-full rounded-md border-2 border-gray-300 p-2" onChange={(e) => setFieldValue("image", e.target.files?.[0] || null)} />
                  <ErrorMessage name="image" component="div" className="text-sm text-red-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Sort Order <span className="text-red-600">*</span></label>
                  <Field name="sortOrder" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" />
                  <ErrorMessage name="sortOrder" component="div" className="text-sm text-red-500" />
                </div>
                <div className="rounded-lg border-2 border-gray-300 p-3">
                  <div className="mb-2 text-sm font-bold text-gray-700">Visible <span className="text-red-600">*</span></div>
                  <Switch checked={Boolean(values.isVisible)} onChange={(e) => setFieldValue("isVisible", e.target.checked)} label={values.isVisible ? "Active" : "Inactive"} />
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="outlined" onClick={() => navigate("/dashboard/vendor-management/catalog-mapping")}>
                  Cancel
                </Button>
                <Button className={ColorStyles.continueButtonColor} type="submit" disabled={!dirty || !isValid || isSubmitting}>
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

export default VendorManagementCatalogMappingAdd;
