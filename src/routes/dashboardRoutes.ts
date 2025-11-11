import express from 'express'
import { authorizedRoles, verifyTokenLogin } from '../middlewares/authMiddleware';
import { dashBoardAnalytics, TrendingStartups } from '../controllers/dashboardStatsController';
const dashboardRouter = express.Router();
dashboardRouter.get('/dashboard-analytics',verifyTokenLogin,authorizedRoles(1,2),dashBoardAnalytics)
dashboardRouter.get('/trending-startups',verifyTokenLogin,authorizedRoles(1,2), TrendingStartups)
export default dashboardRouter;