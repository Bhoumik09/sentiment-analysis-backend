import express from 'express'
import { authorizedRoles, verifyTokenLogin } from '../middlewares/authMiddleware';
import { companyAnalysisTrend,  companyInformation,  companySentimentInfo,  getSectorSentimentTrends,  sentimentTrendOverPeriod } from '../controllers/companyAnalysisController';
const companyRouter = express.Router();
companyRouter.get('/:companyId',verifyTokenLogin,authorizedRoles(1,2), companyInformation);
companyRouter.get('/overview/:companyId',verifyTokenLogin,authorizedRoles(1,2),companySentimentInfo);
companyRouter.get('/sentiment-trend/:sectorId',verifyTokenLogin, authorizedRoles(1,2),getSectorSentimentTrends);
companyRouter.get('/company-analysis-trend/:companyId',verifyTokenLogin,authorizedRoles(1,2),companyAnalysisTrend)
export default companyRouter;
