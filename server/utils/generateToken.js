import jwt from "jsonwebtoken";

const generateToken = (firebaseUid, role) => {
  return jwt.sign({ uid: firebaseUid, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export default generateToken;
