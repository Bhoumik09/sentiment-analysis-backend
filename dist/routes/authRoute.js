"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const zodMiddleware_1 = require("../middlewares/zodMiddleware");
const types_1 = require("../types/zod/types");
const authRouter = express_1.default.Router();
authRouter.get('/fetch-user', authMiddleware_1.verifyTokenLogin, authController_1.fetchUser);
authRouter.post('/login', (0, zodMiddleware_1.validateRequest)(types_1.loginBodySchema), authController_1.login);
authRouter.post('/signup', (0, zodMiddleware_1.validateRequest)(types_1.signupBodySchema), authController_1.signup);
exports.default = authRouter;
//# sourceMappingURL=authRoute.js.map