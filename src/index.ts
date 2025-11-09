import express from "express";
import authRouter from "./routes/authRoute";
import { httpLogger } from "./middlewares/httpLogger";
import dashboardRouter from "./routes/dashboardRoutes";
import searchRouter from "./routes/searchRoutes";
import companyRouter from "./routes/companyAnalysis";
import dotenv from "dotenv";
import fetcherRouter from "./routes/uploader";
const app = express();

dotenv.config();
app.use(httpLogger);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);
app.use("/searchQuery", searchRouter);
app.use("/company", companyRouter);
app.use("/fetcher", fetcherRouter);
app.get("/", (req, res) => {
  res.send("API is running....");
});

if (process.env.NODE_ENV !== "PRODUCTION") {
  app.listen(5000, () => {
    console.log("Server is running at 5000");
  });
}
export default app;
