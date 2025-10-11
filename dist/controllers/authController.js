"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUser = exports.signup = exports.login = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = __importDefault(require("../lib/logger"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const constants_1 = require("../lib/constants");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, password } = req.body;
    //check if email exists in the db
    try {
        const isEmailPresent = yield prisma_1.prisma.user.findUnique({
            where: { email },
            select: { id: true, password: true, roleId: true },
        });
        if (!isEmailPresent) {
            logger_1.default.error("Email Provided is not registered", {
                email,
            });
            res.status(404).json({ error: "Email Provided is not registered" });
            return;
        }
        //check if password correct
        const isPasswordMatching = yield bcryptjs_1.default.compare(password, isEmailPresent.password);
        if (!isPasswordMatching) {
            logger_1.default.error("Password provided is incorrect", {
                email,
            });
            res.status(404).json({ error: "Password provided is incorrect" });
            return;
        }
        //generate the jwt token
        const payload = {
            userInfo: {
                id: isEmailPresent.id,
                roleId: isEmailPresent.roleId,
            },
        };
        const token = jsonwebtoken_1.default.sign(payload, constants_1.secretKey, { expiresIn: "1h" });
        //send token to frontend
        logger_1.default.info("Loggin Success", {
            userId: isEmailPresent.id,
        });
        res.status(200).json({ msg: "Login SuccessFull", token: token });
    }
    catch (e) {
        logger_1.default.error("There was an error in login", {
            email,
            id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            error: e.message,
        });
        res
            .status(500)
            .json({ error: "An unknown server error occured while logging in" });
    }
});
exports.login = login;
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name } = req.body;
    //check if email exists in the db
    try {
        const isEmailPresent = yield prisma_1.prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });
        if (isEmailPresent) {
            logger_1.default.error("Email Provided is already registered", {
                email,
            });
            res.status(404).json({ error: "Email Provided is already registered" });
            return;
        }
        //encrypt the password
        const encryptedPassword = yield bcryptjs_1.default.hash(password, 8);
        //register new user
        yield prisma_1.prisma.user.create({
            data: {
                password: encryptedPassword,
                name,
                email,
            },
        });
        //send token to frontend
        res.status(200).json({ msg: "User Signed Up SuccessFully" });
    }
    catch (e) {
        logger_1.default.error("There was an error in login", {
            email,
            id: req.user.id,
            error: e.message,
        });
        res
            .status(500)
            .json({ error: "An unknown server error occured while logging in" });
    }
});
exports.signup = signup;
const fetchUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //fetch User Data
        const userData = yield prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            omit: { password: true },
        });
        if (!userData) {
            logger_1.default.error("UserId Provided is invalid", {
                id: req.user.id,
                roleId: req.user.roleId,
            });
            res.status(404).json({ error: "Invalid User Id" });
            return;
        }
        //send userData to frontend
        res
            .status(200)
            .json({ msg: "User Data fetched Successfully", userInfo: userData });
    }
    catch (e) {
        logger_1.default.error("There was an error in login", {
            id: req.user.id,
            error: e.message,
        });
        res
            .status(500)
            .json({ error: "An unknown server error occured while logging in" });
    }
});
exports.fetchUser = fetchUser;
//# sourceMappingURL=authController.js.map