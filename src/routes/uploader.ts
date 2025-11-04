import express from 'express'
import {  authorizedRoles, verifyTokenLogin } from '../middlewares/authMiddleware';
import { getAllStartups, uploadStartupsImage } from '../controllers/uploader';
const fetcherRouter = express.Router();
fetcherRouter.get('/fetch-all-startups',verifyTokenLogin,authorizedRoles(2), getAllStartups)
fetcherRouter.patch('/upload-image/:startupId', verifyTokenLogin,authorizedRoles(2),uploadStartupsImage )
export default fetcherRouter;