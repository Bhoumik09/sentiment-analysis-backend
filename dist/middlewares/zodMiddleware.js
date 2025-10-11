"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQueries = exports.validateRequest = void 0;
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../lib/logger"));
// Middleware to validate request with Zod schema
const validateRequest = (schema) => (req, res, next) => {
    try {
        // Parse and validate the request body
        schema.parse(req.body);
        next(); // If valid, proceed to the next middleware/controller
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            logger_1.default.error("Error occurred while validating the body of the request", { error: error.message });
            res.status(400).json({ errors: error.message }); // Send validation errors
        }
        else {
            logger_1.default.error("Error occurred while validating the body of the request", { error: "Internal Server Error" });
            res.status(500).json({ error: "Internal server error" });
        }
    }
};
exports.validateRequest = validateRequest;
const validateQueries = (schema) => (req, res, next) => {
    try {
        // Parse and validate the request body
        schema.parse(req.query);
        next(); // If valid, proceed to the next middleware/controller
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            logger_1.default.error("Error occurred while validating the body of the request", { error: error.message });
            res.status(400).json({ errors: error.message }); // Send validation errors
        }
        else {
            logger_1.default.error("Error occurred while validating the body of the request", { error: "Internal Server Error" });
            res.status(500).json({ error: "Internal server error" });
        }
    }
};
exports.validateQueries = validateQueries;
//# sourceMappingURL=zodMiddleware.js.map