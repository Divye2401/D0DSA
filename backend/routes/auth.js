import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import {
  syncLeetCodeHandler,
  updateProfileHandler,
} from "../handlers/authHandlers.js";

// Load environment variables
dotenv.config({ path: "config.env" });

const authRouter = express.Router();

// Initialize Supabase client with service role (for admin operations)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/auth/sync-leetcode
authRouter.route("/sync-leetcode-token").post(syncLeetCodeHandler);

// POST /api/auth/update-profile
authRouter.route("/update-profile").post(updateProfileHandler);

export default authRouter;
