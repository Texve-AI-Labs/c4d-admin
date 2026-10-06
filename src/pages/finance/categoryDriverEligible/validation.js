import * as Yup from "yup";
import { shouldUseBookingType, shouldUseDriverRules, shouldUsePackageFields } from "./rules";

const driverRuleSchema = Yup.object({
  carTypes: Yup.array()
    .of(Yup.string())
    .min(1, "Select at least one car type")
    .required("Select at least one car type"),
  planNames: Yup.array()
    .of(Yup.string())
    .min(1, "Select at least one plan")
    .required("Select at least one plan"),
});

const validateUniqueCarPlanCombinations = function (rules = []) {
  const plansByCarType = new Map();

  for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex += 1) {
    const rule = rules[ruleIndex] || {};
    const carTypes = Array.isArray(rule.carTypes) ? rule.carTypes : [];
    const planNames = Array.isArray(rule.planNames) ? rule.planNames : [];

    for (const carType of carTypes) {
      for (const planName of planNames) {
        const existingPlans = plansByCarType.get(carType) || new Map();
        const allRuleIndex = existingPlans.get("ALL");
        const specificRuleIndex = existingPlans.get(planName);
        const currentPlanIsAll = planName === "ALL";
        const firstExistingPlan = existingPlans.entries().next().value;
        const conflictRuleIndex = currentPlanIsAll
          ? firstExistingPlan?.[1]
          : allRuleIndex ?? specificRuleIndex;

        if (conflictRuleIndex !== undefined) {
          const conflictPlanName = currentPlanIsAll
            ? firstExistingPlan?.[0]
            : allRuleIndex !== undefined
              ? "ALL"
              : planName;
          return this.createError({
            path: `driverRules.${ruleIndex}.carTypes`,
            message: `${carType} + ${planName} conflicts with ${carType} + ${conflictPlanName} in rule ${conflictRuleIndex + 1}`,
          });
        }

        existingPlans.set(planName, ruleIndex);
        plansByCarType.set(carType, existingPlans);
      }
    }
  }

  return true;
};

export const categoryDriverEligibleSchema = Yup.object({
  zone: Yup.string().trim().required("Zone is required"),
  catalogServiceType: Yup.string().required("Catalog service type is required"),
  targetServiceType: Yup.string().required("Target service type is required"),
  category: Yup.string().required("Category is required"),
  label: Yup.string().trim().required("Category label is required"),
  packageType: Yup.string().when("targetServiceType", {
    is: (targetServiceType) => shouldUsePackageFields(targetServiceType),
    then: (schema) => schema.required("Package type is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  bookingType: Yup.string().when(["targetServiceType", "packageType"], {
    is: (targetServiceType, packageType) => shouldUsePackageFields(targetServiceType) && shouldUseBookingType(packageType),
    then: (schema) => schema.required("Booking type is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  displayOrder: Yup.number()
    .typeError("Display order must be a number")
    .integer("Display order must be a whole number")
    .min(1, "Display order must be at least 1")
    .required("Display order is required"),
  isVisible: Yup.boolean().required(),
  status: Yup.string().required("Status is required"),
  driverRules: Yup.array().when(["catalogServiceType", "targetServiceType"], {
    is: (catalogServiceType, targetServiceType) => shouldUseDriverRules(catalogServiceType, targetServiceType),
    then: (schema) =>
      schema
        .of(driverRuleSchema)
        .min(1, "At least one driver request is required")
        .test("unique-car-plan-combinations", validateUniqueCarPlanCombinations),
    otherwise: (schema) => schema.notRequired(),
  }),
});

export const yupErrorsToObject = (validationError) => {
  const nextErrors = {};
  const inner = Array.isArray(validationError?.inner) ? validationError.inner : [];

  if (inner.length === 0 && validationError?.path) {
    nextErrors[validationError.path] = validationError.message;
    return nextErrors;
  }

  inner.forEach((item) => {
    if (item?.path && !nextErrors[item.path]) {
      nextErrors[item.path] = item.message;
    }
  });

  return nextErrors;
};