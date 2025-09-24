import express from 'express'
import { fetchUser, login, signup } from '../controllers/authController';
import { verifyTokenLogin } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/zodMiddleware';
import { loginBodySchema, signupBodySchema } from '../types/zod/types';
const authRouter = express.Router();
authRouter.get('/fetch-user',verifyTokenLogin,fetchUser)
authRouter.post('/login',validateRequest(loginBodySchema), login)
authRouter.post('/signup',validateRequest(signupBodySchema), signup)
export default authRouter;