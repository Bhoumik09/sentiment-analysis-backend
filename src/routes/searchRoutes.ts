import express from 'express'
import { verifyTokenLogin } from '../middlewares/authMiddleware';
import { getPaginatedCompanies, getPaginatedNews, } from '../controllers/searchController';
const searchRouter = express.Router();
searchRouter.get('/fetch-company-data',verifyTokenLogin, getPaginatedCompanies)
searchRouter.get('/fetch-news-data', verifyTokenLogin ,getPaginatedNews)
export default searchRouter;