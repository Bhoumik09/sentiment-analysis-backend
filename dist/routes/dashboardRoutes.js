"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const dashboardStatsController_1 = require("../controllers/dashboardStatsController");
const dashboardRouter = express_1.default.Router();
dashboardRouter.get('/dashboard-analytics', authMiddleware_1.verifyTokenLogin, dashboardStatsController_1.dashBoardAnalytics);
dashboardRouter.get('/trending-startups', authMiddleware_1.verifyTokenLogin, dashboardStatsController_1.TrendingStartups);
exports.default = dashboardRouter;
//# sourceMappingURL=dashboardRoutes.js.map