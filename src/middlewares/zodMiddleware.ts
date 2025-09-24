import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import logger from "../lib/logger";

// Middleware to validate request with Zod schema
export const validateRequest =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and validate the request body
      schema.parse(req.body);
      next(); // If valid, proceed to the next middleware/controller
    } catch (error) {
      if (error instanceof ZodError) {
        logger.error(
          "Error occurred while validating the body of the request",
          { error: error.message },
        );
        res.status(400).json({ errors: error.message }); // Send validation errors
      } else {
        logger.error(
          "Error occurred while validating the body of the request",
          { error: "Internal Server Error" },
        );
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };

export const validateQueries =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and validate the request body
      schema.parse(req.query);
      next(); // If valid, proceed to the next middleware/controller
    } catch (error) {
      if (error instanceof ZodError) {
        logger.error(
          "Error occurred while validating the body of the request",
          { error: error.message },
        );
        res.status(400).json({ errors: error.message }); // Send validation errors
      } else {
        logger.error(
          "Error occurred while validating the body of the request",
          { error: "Internal Server Error" },
        );
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };
