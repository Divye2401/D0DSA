import express from "express";
import { syncLeetCodeDataHandler } from "../handlers/userHandlers.js";

const userRouter = express.Router();

// POST /api/user/sync-leetcode-data
userRouter.route("/sync-leetcode-data").post(syncLeetCodeDataHandler);

export default userRouter;
