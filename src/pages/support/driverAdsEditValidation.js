import * as Yup from "yup";

export const driverAdsEditValidationSchema = Yup.object({
  name: Yup.string().trim().required("Name is required"),
  description: Yup.string().trim().required("Description is required"),
  zone: Yup.string().trim().required("Zone is required"),
  subZoneId: Yup.string().trim().required("Sub Zone is required"),
  imageFile: Yup.mixed().nullable(),
  launchAt: Yup.string()
    .required("Launch At is required")
    .test("future-launch-at", "Launch At must be a future datetime.", (value) => {
      if (!value) return false;
      const parsed = new Date(value);
      return !Number.isNaN(parsed.getTime()) && parsed > new Date();
    }),
  isActive: Yup.boolean().required(),
  timeSlots: Yup.array()
    .of(
      Yup.object({
        from: Yup.string().trim().required("From time is required"),
        to: Yup.string().trim().required("To time is required"),
      }).test("time-range", "To time must be after From time", function (slot) {
        if (!slot?.from || !slot?.to) return true;
        return slot.to > slot.from;
      })
    )
    .min(1, "Add at least one time slot")
    .required(),
});
