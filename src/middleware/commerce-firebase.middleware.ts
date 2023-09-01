
import admin from "../services/firebase-admin-commerce";
import { Request, Response, NextFunction } from "express";

const verifyTokenCommerce = async (req: Request, res: Response, next: NextFunction) => {
  // Get JWT from authorization header
  const authorization = req.get("authorization");

  if (!authorization) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  try {
    const token = authorization.split(" ")[1];
    await admin.auth().verifyIdToken(token);
    next();
    return null;
  } catch (e) {
    // Send unauthorized
    return res.status(401).json({ message: "Malformed or Invalid token" });
  }
};

export default verifyTokenCommerce;
