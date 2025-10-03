"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authRoute_1 = __importDefault(require("./routes/authRoute"));
const httpLogger_1 = require("./middlewares/httpLogger");
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const searchRoutes_1 = __importDefault(require("./routes/searchRoutes"));
const companyAnalysis_1 = __importDefault(require("./routes/companyAnalysis"));
const app = (0, express_1.default)();
app.use(httpLogger_1.httpLogger);
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use("/auth", authRoute_1.default);
app.use('/dashboard', dashboardRoutes_1.default);
app.use('/searchQuery', searchRoutes_1.default);
app.use('/company', companyAnalysis_1.default);
// add()
app.listen(5000, () => {
    console.log("Server is running at 5000");
});
//# sourceMappingURL=index.js.map