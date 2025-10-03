import express from 'express'
import authRouter from './routes/authRoute';
import { httpLogger } from './middlewares/httpLogger';
import dashboardRouter from './routes/dashboardRoutes';
import searchRouter from './routes/searchRoutes';
import companyRouter from './routes/companyAnalysis';
const app= express();
app.use(httpLogger)
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use("/auth",authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/searchQuery',searchRouter);
app.use('/company', companyRouter);
// add()
app.listen(5000,()=>{
    console.log("Server is running")
})