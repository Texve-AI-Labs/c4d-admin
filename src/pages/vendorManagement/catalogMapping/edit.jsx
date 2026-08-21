import React, { useEffect, useMemo, useState } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, Switch } from "@material-tailwind/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const schema = Yup.object({
  vendorId: Yup.string().required("Vendor is required"),
  categoryId: Yup.string().required("Category is required"),
  productId: Yup.string().required("Product is required"),
});

export const VendorManagementCatalogMappingEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const vendorIdParam = new URLSearchParams(location.search).get("vendorId") || "";
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [preview, setPreview] = useState("");
  const [record, setRecord] = useState(null);

  useEffect(() => {
    Promise.all([
      ApiRequestUtils.get(API_ROUTES.GET_VENDORS),
      ApiRequestUtils.get(API_ROUTES.GET_CATEGORIES),
      ApiRequestUtils.get(API_ROUTES.GET_PRODUCTS),
      vendorIdParam
        ? ApiRequestUtils.get(API_ROUTES.GET_VENDOR_CATALOG.replace(":vendorId", vendorIdParam))
        : Promise.resolve(null),
    ]).then(([v, c, p, r]) => {
      setVendors(Array.isArray(v?.data) ? v.data : v?.data?.rows || []);
      setCategories(Array.isArray(c?.data) ? c.data : c?.data?.rows || []);
      setProducts(Array.isArray(p?.data) ? p.data : p?.data?.rows || []);
      const rows = Array.isArray(r?.data) ? r.data : r?.data?.rows || r?.data?.data || [];
      const data = rows.find((row) => String(row?.id ?? row?.catalogMappingId ?? "") === String(id)) || null;
      setRecord(data);
      setPreview(data?.overrideImageUrl || data?.image || "");
    }).catch(() => {});
  }, [id, vendorIdParam]);

  const initialValues = useMemo(() => ({
    vendorId: vendorIdParam || (record?.vendorId ?? ""),
    categoryId: record?.categoryId ?? "",
    productId: record?.productId ?? "",
    overrideName: record?.overrideName ?? "",
    image: null,
    isVisible: Boolean(record?.isVisible),
    sortOrder: record?.sortOrder ?? 0,
  }), [record, vendorIdParam]);

  const vendorOptions = useMemo(() => vendors.map((item) => ({ value: item.vendorId ?? item.id, label: item.name ?? `Vendor ${item.vendorId ?? item.id}` })), [vendors]);
  const categoryOptions = useMemo(() => categories.map((item) => ({ value: item.categoryId ?? item.id, label: item.name ?? `Category ${item.categoryId ?? item.id}` })), [categories]);
  const productOptions = useMemo(() => products.map((item) => ({ value: item.productId ?? item.id, label: item.name ?? `Product ${item.productId ?? item.id}` })), [products]);
  const vendorNameById = useMemo(() => new Map(vendors.map((item) => [String(item?.vendorId ?? item?.id ?? ""), item?.name || String(item?.vendorId ?? item?.id ?? "")])), [vendors]);
  const categoryNameById = useMemo(() => new Map(categories.map((item) => [String(item?.categoryId ?? item?.id ?? ""), item?.name || String(item?.categoryId ?? item?.id ?? "")])), [categories]);
  const productNameById = useMemo(() => new Map(products.map((item) => [String(item?.productId ?? item?.id ?? ""), item?.name || String(item?.productId ?? item?.id ?? "")])), [products]);

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append("catalogMappingId", Number(id));
      formData.append("vendorId", Number(values.vendorId));
      formData.append("categoryId", Number(values.categoryId));
      formData.append("productId", Number(values.productId));
      formData.append("overrideName", values.overrideName || "");
      formData.append("isVisible", Boolean(values.isVisible));
      formData.append("sortOrder", values.sortOrder || 0);
      if (values.image?.name) {
        formData.append("image", values.image);
        formData.append("fileTypeImage", values.image.type || "");
        formData.append("extImage", values.image.name.split(".").pop()?.toLowerCase() || "");
      }
      await ApiRequestUtils.updateDocs(API_ROUTES.UPDATE_CATALOG_MAPPING, formData);
      navigate(vendorIdParam ? `/dashboard/vendor-management/vendors/details/${vendorIdParam}?tab=Catalog%20Mapping` : "/dashboard/vendor-management/catalog-mapping");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl bg-white shadow-none">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Edit Catalog Mapping</div>
        <Formik initialValues={initialValues} enableReinitialize validationSchema={schema} onSubmit={onSubmit}>
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="hidden">
                  <label className="mb-1 block text-sm font-bold text-gray-700">Vendor</label>
                  <input value={vendorNameById.get(String(values.vendorId || vendorIdParam || "")) || values.vendorId || vendorIdParam || "-"} disabled className="w-full rounded-md border-2 border-gray-300 bg-gray-100 p-2" />
                </div>
                <div className="hidden">
                  <label className="mb-1 block text-sm font-bold text-gray-700">Vendor <span className="text-red-600">*</span></label>
                  <Field as="select" name="vendorId" className="w-full rounded-md border-2 border-gray-300 p-2">
                    <option value="">Select Vendor</option>
                    {vendorOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Field>
                  <ErrorMessage name="vendorId" component="div" className="text-sm text-red-500" />
                </div>
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Category <span className="text-red-600">*</span></label><Field as="select" name="categoryId" className="w-full rounded-md border-2 border-gray-300 p-2"><option value="">Select Category</option>{categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Field><ErrorMessage name="categoryId" component="div" className="text-sm text-red-500" /></div>
                {/* <div><label className="mb-1 block text-sm font-bold text-gray-700">Selected Category</label><input value={categoryNameById.get(String(values.categoryId)) || values.categoryId || "-"} disabled className="w-full rounded-md border-2 border-gray-300 bg-gray-100 p-2" /></div> */}
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Product <span className="text-red-600">*</span></label><Field as="select" name="productId" className="w-full rounded-md border-2 border-gray-300 p-2"><option value="">Select Product</option>{productOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Field><ErrorMessage name="productId" component="div" className="text-sm text-red-500" /></div>
                {/* <div><label className="mb-1 block text-sm font-bold text-gray-700">Selected Product</label><input value={productNameById.get(String(values.productId)) || values.productId || "-"} disabled className="w-full rounded-md border-2 border-gray-300 bg-gray-100 p-2" /></div> */}
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Override Name</label><Field name="overrideName" className="w-full rounded-md border-2 border-gray-300 p-2" /></div>
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Image</label><input type="file" accept="image/*" className="w-full rounded-md border-2 border-gray-300 p-2" onChange={(e) => { const file = e.target.files?.[0] || null; setFieldValue("image", file); setPreview(file ? URL.createObjectURL(file) : preview); }} /></div>
                              {preview ? <div className="rounded-lg border-2 border-gray-300 p-4 mt-2"><div className="mb-2 text-sm font-bold text-gray-700">Preview</div><img src={preview} alt="override preview" className="h-24 w-24 rounded object-cover" /></div> : null}
                <div><label className="mb-1 block text-sm font-bold text-gray-700">Sort Order</label><Field name="sortOrder" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" /></div>
                <div className="rounded-lg border-2 border-gray-300 p-3"><div className="mb-2 text-sm font-bold text-gray-700">Visibility</div><Switch checked={Boolean(values.isVisible)} onChange={(e) => setFieldValue("isVisible", e.target.checked)} label={values.isVisible ? "Visible" : "Hidden"} /></div>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Button type="button" variant="outlined" className="border-gray-800 text-black" onClick={() => navigate(vendorIdParam ? `/dashboard/vendor-management/vendors/details/${vendorIdParam}?tab=Catalog%20Mapping` : "/dashboard/vendor-management/catalog-mapping")}>Cancel</Button>
                <Button type="submit" className={ColorStyles.continueButtonColor} disabled={!dirty || !isValid || isSubmitting}>Save</Button>
              </div>
            </Form>
          )}
        </Formik>
      </CardBody>
    </Card>
  );
};

export default VendorManagementCatalogMappingEdit;
