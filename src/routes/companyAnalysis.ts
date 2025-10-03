import express from 'express'
import { verifyTokenLogin } from '../middlewares/authMiddleware';
import { companyAnalysisTrend,  companyInformation,  companySentimentInfo, recentNewsOfCompany, sentimentTrendOverPeriod } from '../controllers/companyAnalysisController';
const companyRouter = express.Router();
companyRouter.get('/:companyId',companyInformation);
companyRouter.get('/overview/:companyId',companySentimentInfo);
companyRouter.get('/recent-news/:companyId',recentNewsOfCompany);
companyRouter.get('/sentiment-trend/:companyId',sentimentTrendOverPeriod);
companyRouter.get('/company-analysis-trend/:companyId',companyAnalysisTrend)
export default companyRouter;
