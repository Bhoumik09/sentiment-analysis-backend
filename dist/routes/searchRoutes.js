"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const searchController_1 = require("../controllers/searchController");
const searchRouter = express_1.default.Router();
searchRouter.get('/fetch-data', searchController_1.search);
exports.default = searchRouter;
//# sourceMappingURL=searchRoutes.js.map