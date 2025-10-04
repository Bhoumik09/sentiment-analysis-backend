import express from 'express'
import { verifyTokenLogin } from '../middlewares/authMiddleware';
import { search } from '../controllers/searchController';
const searchRouter = express.Router();
searchRouter.get('/fetch-data',verifyTokenLogin, search)
export default searchRouter;