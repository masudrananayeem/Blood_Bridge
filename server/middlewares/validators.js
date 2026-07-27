import { body, validationResult } from "express-validator";

export const validateRegister = [
  body("idToken").notEmpty().withMessage("idToken is required"),
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("phone")
    .matches(/^01[3-9]\d{8}$/)
    .withMessage("Enter a valid Bangladeshi phone number"),
  body("bloodGroup")
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Invalid blood group"),
  body("gender").isIn(["male", "female", "other"]).withMessage("Invalid gender"),
  body("dob").isISO8601().withMessage("Invalid date of birth"),
  body("district").trim().notEmpty().withMessage("District is required"),
  body("upazila").trim().notEmpty().withMessage("Upazila is required"),
  body("address").trim().notEmpty().withMessage("Address is required"),
];

// Run after the rule chains above; short-circuits with a 400 on failure
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};
