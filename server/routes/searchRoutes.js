import { Router } from "express";
import { safeSearch } from "../controllers/searchController.js";
import { rateLimitPerMinute } from "../middleware/rateLimitMiddleware.js";

const router = Router();

router.get("/", rateLimitPerMinute(Number(process.env.SEARCH_RATE_LIMIT_PER_MINUTE) || 30), safeSearch);

export default router;
