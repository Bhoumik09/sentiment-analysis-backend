import express from 'express'
import { verifyTokenLogin } from '../middlewares/authMiddleware';
import { companyAnalysisTrend,  companyInformation,  companySentimentInfo, recentNewsOfCompany, sentimentTrendOverPeriod } from '../controllers/companyAnalysisController';
const companyRouter = express.Router();
companyRouter.get('/:companyId',verifyTokenLogin,companyInformation);
companyRouter.get('/overview/:companyId',verifyTokenLogin,companySentimentInfo);
companyRouter.get('/recent-news/:companyId',verifyTokenLogin,recentNewsOfCompany);
companyRouter.get('/sentiment-trend/:companyId',verifyTokenLogin,sentimentTrendOverPeriod);
companyRouter.get('/company-analysis-trend/:companyId',verifyTokenLogin,companyAnalysisTrend)
export default companyRouter;
