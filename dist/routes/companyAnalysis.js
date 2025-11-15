"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const companyAnalysisController_1 = require("../controllers/companyAnalysisController");
const companyRouter = express_1.default.Router();
companyRouter.get('/:companyId', authMiddleware_1.verifyTokenLogin, (0, authMiddleware_1.authorizedRoles)(1, 2), companyAnalysisController_1.companyInformation);
companyRouter.get('/overview/:companyId', authMiddleware_1.verifyTokenLogin, (0, authMiddleware_1.authorizedRoles)(1, 2), companyAnalysisController_1.companySentimentInfo);
companyRouter.get('/sentiment-trend/:sectorId', authMiddleware_1.verifyTokenLogin, (0, authMiddleware_1.authorizedRoles)(1, 2), companyAnalysisController_1.getSectorSentimentTrends);
exports.default = companyRouter;
//# sourceMappingURL=companyAnalysis.js.map