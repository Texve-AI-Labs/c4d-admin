import * as Yup from "yup";

export const driverAdsValidationSchema = Yup.object({
  name: Yup.string().trim().required("Name is required"),
  description: Yup.string().trim().required("Description is required"),
  zone: Yup.string().trim().required("Zone is required"),
  subZoneId: Yup.string().trim().required("Sub Zone is required"),
  contractPeriod: Yup.number().oneOf([30, 60, 90], "Contract period must be 30, 60, or 90").required("Contract period is required"),
  paymentFrequency: Yup.string().required("Payment frequency is required"),
  paymentAmount: Yup.number().typeError("Payment amount must be a number").positive("Payment amount must be greater than 0").required("Payment amount is required"),
  tier: Yup.string().oneOf(["SILVER", "GOLD", "ELITE"], "Tier is required").required("Tier is required"),
  termsAndConditions: Yup.string().trim().required("Terms and conditions are required"),
  imageFile: Yup.mixed().required("Image is required"),
  isActive: Yup.boolean().required(),
  placements: Yup.array()
    .of(
      Yup.object({
        place: Yup.string().trim().required("Place is required"),
        from: Yup.string().trim().required("From time is required"),
        to: Yup.string().trim().required("To time is required"),
      })
    )
    .min(1, "Add at least one placement")
    .required(),
  claimRequest: Yup.boolean().required(),
});