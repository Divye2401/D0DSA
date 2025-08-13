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
import {
  generateStudyPlan,
  getActivePlan,
  updateActivePlan,
  getTodaysTasks,
  toggleTaskCompletion,
} from "../handlers/planHandlers.js";

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

userRouter
  .route("/plan/:userId")
  .post(generateStudyPlan)
  .get(getActivePlan)
  .patch(updateActivePlan);

userRouter.route("/tasks/today/:userId").get(getTodaysTasks);
userRouter.route("/tasks/toggle/:userId").put(toggleTaskCompletion);

export default userRouter;
