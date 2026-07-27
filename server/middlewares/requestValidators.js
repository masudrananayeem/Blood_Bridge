import { body } from "express-validator";

export const validateRequest = [
  body("bloodGroup")
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Invalid blood group"),
  body("units").isInt({ min: 1 }).withMessage("Units must be at least 1"),
  body("hospital").trim().notEmpty().withMessage("Hospital is required"),
  body("district").trim().notEmpty().withMessage("District is required"),
  body("upazila").trim().notEmpty().withMessage("Upazila is required"),
  body("urgency").isIn(["Low", "Medium", "High"]).withMessage("Invalid urgency"),
  body("neededByDate").isISO8601().withMessage("Invalid date"),
  body("message").optional({ checkFalsy: true }).isString().isLength({ max: 500 }).withMessage("Message is too long"),
  body("targetDonorUid").optional({ checkFalsy: true }).isString(),
  body("isEmergency").optional().isBoolean().withMessage("isEmergency must be true/false"),
];
