import express from 'express'
import { verifyTokenLogin } from '../middlewares/authMiddleware';
import { getAllStartups, uploadStartupsImage } from '../controllers/uploader';
const fetcherRouter = express.Router();
fetcherRouter.get('/fetch-all-startups',verifyTokenLogin, getAllStartups)
fetcherRouter.patch('/upload-image/:startupId', verifyTokenLogin,uploadStartupsImage )
export default fetcherRouter;