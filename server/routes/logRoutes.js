import { Router } from "express";
import { getLogs } from "../controllers/logController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, getLogs);

export default router;
