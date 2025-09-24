import { Request, Response, NextFunction } from "express";
import logger from "../lib/logger";
import jwt from 'jsonwebtoken';
import { secretKey } from "../lib/constants";
export const verifyTokenLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  //ensure uthorization token is provided
  if (!authHeader) {
    logger.error("No token, authorization denied");
    res.status(401).json({ msg: "No token, authorization denied" });
    return;
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    logger.error("No token provided");
    res.status(401).json({ msg: "No token provided" });
    return;
  }
  try {
    // Verify the token
    const decoded = jwt.verify(token, secretKey!); // Pass the token as the first argument and secret key as second

    if (typeof decoded === "string") return;

    req.user=decoded.userInfo
    next(); // Continue to the next middleware or route handler
  } catch (err: any) {
    logger.error("Error occurred while validating the token", {
      id: req.user?.id,
      error: err.message,
    });
    res.status(401).json({ msg: "Token is not valid" });
  }
};
