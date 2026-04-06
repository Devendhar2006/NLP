import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDatabase } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:8080"],
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/search", searchRoutes);
app.use("/", authRoutes);
app.use("/", contentRoutes);
app.use("/logs", logRoutes);
app.use("/search", searchRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error." });
});

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect database:", error.message);
    process.exit(1);
  });
