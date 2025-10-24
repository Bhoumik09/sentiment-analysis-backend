import express from 'express'
import { verifyTokenLogin } from '../middlewares/authMiddleware';
import { dashBoardAnalytics, TrendingStartups } from '../controllers/dashboardStatsController';
const dashboardRouter = express.Router();
dashboardRouter.get('/dashboard-analytics',dashBoardAnalytics)
dashboardRouter.get('/trending-startups',TrendingStartups)
export default dashboardRouter;