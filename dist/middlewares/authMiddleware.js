"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizedRoles = exports.verifyTokenLogin = void 0;
const logger_1 = __importDefault(require("../lib/logger"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const constants_1 = require("../lib/constants");
const verifyTokenLogin = (req, res, next) => {
    var _a;
    const authHeader = req.headers.authorization;
    //ensure uthorization token is provided
    if (!authHeader) {
        logger_1.default.error("No token, authorization denied");
        res.status(401).json({ msg: "No token, authorization denied" });
        return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        logger_1.default.error("No token provided");
        res.status(401).json({ msg: "No token provided" });
        return;
    }
    try {
        // Verify the token
        const decoded = jsonwebtoken_1.default.verify(token, constants_1.secretKey); // Pass the token as the first argument and secret key as second
        if (typeof decoded === "string")
            return;
        req.user = decoded.userInfo;
        next(); // Continue to the next middleware or route handler
    }
    catch (err) {
        logger_1.default.error("Error occurred while validating the token", {
            id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            error: err.message,
        });
        res.status(401).json({ msg: "Token is not valid" });
    }
};
exports.verifyTokenLogin = verifyTokenLogin;
const authorizedRoles = (...roles) => {
    return (req, res, next) => {
        var _a;
        const userRole = req.user.roleId;
        if (roles.includes(userRole)) {
            next();
            return;
        }
        logger_1.default.error("Error occurred while validating the Autherization of the role", {
            id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            error: "User is not authorized to access this route"
        });
        res.status(409).json({ msg: "Unauthorized to access the Data" });
        return;
    };
};
exports.authorizedRoles = authorizedRoles;
//# sourceMappingURL=authMiddleware.js.map