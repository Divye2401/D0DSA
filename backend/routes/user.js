import express from "express";
import { syncLeetCodeDataHandler } from "../handlers/userHandlers.js";
import { getDashboardStatsHandler } from "../handlers/dashboardHandlers.js";

const userRouter = express.Router();

// POST /api/user/sync-leetcode-data
userRouter.route("/sync-leetcode-data").post(syncLeetCodeDataHandler);

// GET /api/user/dashboard-stats/:userId
userRouter.route("/dashboard-stats/:userId").get(getDashboardStatsHandler);

export default userRouter;
