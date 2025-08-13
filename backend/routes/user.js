import express from "express";
import { syncLeetCodeDataHandler } from "../handlers/userHandlers.js";
import { getDashboardStatsHandler } from "../handlers/dashboardHandlers.js";
import { getRecommendationsHandler } from "../handlers/recommendationsHandlers.js";
import {
  updateFlashcardProgress,
  uploadMiddleware,
  uploadAndProcessPDF,
  getUserFlashcards,
} from "../handlers/flashcardHandlers.js";

const userRouter = express.Router();

// POST /api/user/sync-leetcode-data
userRouter.route("/sync-leetcode-data").post(syncLeetCodeDataHandler);

// GET /api/user/dashboard-stats/:userId
userRouter.route("/dashboard-stats/:userId").get(getDashboardStatsHandler);
userRouter.route("/recommendations/:userId").get(getRecommendationsHandler);
userRouter
  .route("/flashcards/:userId")
  .post(uploadMiddleware, uploadAndProcessPDF)
  .get(getUserFlashcards)
  .patch(updateFlashcardProgress);

export default userRouter;
