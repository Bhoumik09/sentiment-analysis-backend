"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const companyAnalysisController_1 = require("../controllers/companyAnalysisController");
const companyRouter = express_1.default.Router();
companyRouter.get('/:companyId', authMiddleware_1.verifyTokenLogin, companyAnalysisController_1.companyInformation);
companyRouter.get('/overview/:companyId', authMiddleware_1.verifyTokenLogin, companyAnalysisController_1.companySentimentInfo);
companyRouter.get('/recent-news/:companyId', authMiddleware_1.verifyTokenLogin, companyAnalysisController_1.recentNewsOfCompany);
companyRouter.get('/sentiment-trend/:companyId', authMiddleware_1.verifyTokenLogin, companyAnalysisController_1.sentimentTrendOverPeriod);
companyRouter.get('/company-analysis-trend/:companyId', authMiddleware_1.verifyTokenLogin, companyAnalysisController_1.companyAnalysisTrend);
exports.default = companyRouter;
//# sourceMappingURL=companyAnalysis.js.map