import express from 'express'
import { authorizedRoles, verifyTokenLogin } from '../middlewares/authMiddleware';
import { getPaginatedCompanies, getPaginatedNews, } from '../controllers/searchController';
const searchRouter = express.Router();
searchRouter.get('/fetch-company-data',verifyTokenLogin,authorizedRoles(1,2), getPaginatedCompanies)
searchRouter.get('/fetch-news-data', verifyTokenLogin , authorizedRoles(1,2),getPaginatedNews)
export default searchRouter;