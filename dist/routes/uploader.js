"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploader_1 = require("../controllers/uploader");
const fetcherRouter = express_1.default.Router();
fetcherRouter.get('/fetch-all-startups', authMiddleware_1.verifyTokenLogin, uploader_1.getAllStartups);
fetcherRouter.patch('/upload-image/:startupId', authMiddleware_1.verifyTokenLogin, uploader_1.uploadStartupsImage);
exports.default = fetcherRouter;
//# sourceMappingURL=uploader.js.map