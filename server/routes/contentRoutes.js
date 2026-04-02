import { Router } from "express";
import { checkText } from "../controllers/contentController.js";

const router = Router();

router.post("/check-text", checkText);

export default router;
