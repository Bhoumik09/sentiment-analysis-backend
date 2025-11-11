import express from 'express'
import { authorizedRoles, verifyTokenLogin } from '../middlewares/authMiddleware';
import {   companyInformation,  companySentimentInfo,  getSectorSentimentTrends} from '../controllers/companyAnalysisController';
const companyRouter = express.Router();
companyRouter.get('/:companyId',verifyTokenLogin,authorizedRoles(1,2), companyInformation);
companyRouter.get('/overview/:companyId',verifyTokenLogin,authorizedRoles(1,2),companySentimentInfo);
companyRouter.get('/sentiment-trend/:sectorId',verifyTokenLogin, authorizedRoles(1,2),getSectorSentimentTrends);
export default companyRouter;
