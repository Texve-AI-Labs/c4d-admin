import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, CardBody, Input, List, ListItem, Switch, Typography } from "@material-tailwind/react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const LocationInput = ({ field, form, suggestions, onSearch, onSelect }) => {
  const [isFocused, setIsFocused] = useState(false);

  const getPrimaryLabel = (suggestion) => {
    if (typeof suggestion === "string") return suggestion;
    if (suggestion && typeof suggestion === "object") {
      return suggestion.title || suggestion.name || suggestion.label || "";
    }
    return "";
  };

  const getSuggestionLabel = (suggestion) => {
    if (typeof suggestion === "string") return suggestion;
    if (suggestion && typeof suggestion === "object") {
      return (
        suggestion.fullText ||
        suggestion.name ||
        suggestion.address ||
        suggestion.label ||
        suggestion.title ||
        suggestion.subtitle ||
        suggestion.formatted_address ||
        suggestion.description ||
        suggestion.display_name ||
        ""
      );
    }
    return "";
  };

  useEffect(() => {
    form.validateField(field.name);
  }, []);

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Enter warehouse location"
        {...field}
        onChange={(e) => {
          form.setFieldValue(field.name, e.target.value);
          form.setFieldValue("warehouseAddress.placeId", "");
          onSearch(e.target.value);
          form.setFieldTouched(field.name, true, false);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          field.onBlur(e);
          setTimeout(() => setIsFocused(false), 200);
          form.validateField(field.name);
        }}
        className="pr-10"
      />
      {suggestions.length > 0 && isFocused && (
        <List className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-xl">
          {suggestions.map((suggestion, index) => (
            <ListItem
              key={index}
              onMouseDown={(e) => {
                e.preventDefault();
                const selectedValue = getSuggestionLabel(suggestion);
                form.setFieldValue(field.name, selectedValue);
                form.setFieldValue("warehouseAddress.placeId", suggestion?.placeId || suggestion?.place_id || suggestion?.placeID || suggestion?.id || "");
                form.setFieldTouched(field.name, true, false);
                if (typeof onSelect === "function") onSelect(suggestion);
                setIsFocused(false);
                form.validateField(field.name);
              }}
              className="cursor-pointer px-4 py-2 text-gray-900 hover:bg-gray-100"
            >
              <div className="flex flex-col">
                <Typography variant="small" className="text-gray-900">
                  {getPrimaryLabel(suggestion) || getSuggestionLabel(suggestion)}
                </Typography>
                {typeof suggestion === "object" && suggestion?.fullText ? (
                  <Typography variant="small" className="text-xs text-gray-600">
                    {suggestion.fullText}
                  </Typography>
                ) : null}
              </div>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
};

const schema = Yup.object({
  vendorId: Yup.string().required("Vendor is required"),
  productId: Yup.string().required("Product is required"),
  availableQty: Yup.number().typeError("Must be a number"),
  reservedQty: Yup.number().typeError("Must be a number"),
  warehouseAddress: Yup.object().shape({
    name: Yup.string().required("Warehouse location is required"),
    placeId: Yup.string().required(),
  }),
});

export const VendorManagementInventoryEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouseSuggestions, setWarehouseSuggestions] = useState([]);

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
    ApiRequestUtils.get(API_ROUTES.GET_INVENTORY_BY_ID.replace(":id", id))
      .then((r) => setRecord(r?.data || null))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    Promise.all([ApiRequestUtils.get(API_ROUTES.GET_VENDORS), ApiRequestUtils.get(API_ROUTES.GET_PRODUCTS)])
      .then(([vendorsResponse, productsResponse]) => {
        setVendors(Array.isArray(vendorsResponse?.data) ? vendorsResponse.data : vendorsResponse?.data?.rows || []);
        setProducts(Array.isArray(productsResponse?.data) ? productsResponse.data : productsResponse?.data?.rows || []);
      })
      .catch(() => {});
  }, []);

  const initialValues = useMemo(
    () => ({
      vendorId: record?.vendorId ?? "",
      productId: record?.productId ?? "",
      availableQty: record?.availableQty ?? "",
      reservedQty: record?.reservedQty ?? "",
      warehouseAddress: record?.warehouseAddress ?? { name: "", placeId: "" },
      status: Boolean(record?.status ?? true),
    }),
    [record]
  );

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      await ApiRequestUtils.update(API_ROUTES.UPDATE_INVENTORY, {
        inventoryId: Number(id),
        vendorId: Number(values.vendorId),
        productId: Number(values.productId),
        availableQty: values.availableQty === "" ? null : Number(values.availableQty),
        reservedQty: values.reservedQty === "" ? null : Number(values.reservedQty),
        warehouseAddress: values.warehouseAddress,
        status: Boolean(values.status),
      });
      navigate("/dashboard/vendor-management/inventory");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWarehouseSearch = async (query) => {
    if (!query?.trim()) {
      setWarehouseSuggestions([]);
      return;
    }
    try {
      const data = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SEARCH_ADDRESS, { address: query });
      setWarehouseSuggestions(data?.success && Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      setWarehouseSuggestions([]);
    }
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-5xl">
      <CardBody>
        <div className="mb-6 text-left text-xl font-bold text-black">Edit Inventory</div>
        <Formik enableReinitialize initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit}>
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
                  <label className="mb-1 block text-sm font-bold">Available Qty  <span className="text-red-600">*</span></label>
                  <Field name="availableQty" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Reserved Qty  <span className="text-red-600">*</span></label>
                  <Field name="reservedQty" type="number" className="w-full rounded-md border-2 border-gray-300 p-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-bold">Warehouse Location <span className="text-red-600">*</span></label>
                  <Field
                    name="warehouseAddress.name"
                    component={LocationInput}
                    suggestions={warehouseSuggestions}
                    onSearch={handleWarehouseSearch}
                    onSelect={(suggestion) =>
                      setFieldValue("warehouseAddress", {
                        name:
                          suggestion?.fullText ||
                          suggestion?.name ||
                          suggestion?.address ||
                          suggestion?.label ||
                          suggestion?.title ||
                          "",
                        placeId: suggestion?.placeId || suggestion?.place_id || suggestion?.placeID || suggestion?.id || "",
                      })
                    }
                  />
                  <ErrorMessage name="warehouseAddress.name" component="div" className="text-sm text-red-500" />
                </div>
                <div className="rounded-lg border-2 border-gray-300 p-3">
                  <div className="mb-2 text-sm font-bold">Status <span className="text-red-600">*</span></div>
                  <Switch checked={Boolean(values.status)} onChange={(e) => setFieldValue("status", e.target.checked)} label={values.status ? "Active" : "Inactive"} />
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="outlined" onClick={() => navigate("/dashboard/vendor-management/inventory")}>
                  Cancel
                </Button>
                <Button className={ColorStyles.continueButtonColor} type="submit" disabled={!dirty || !isValid || isSubmitting}>
                  Update
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </CardBody>
    </Card>
  );
};
export default VendorManagementInventoryEdit;
