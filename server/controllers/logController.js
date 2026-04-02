import { Log } from "../models/Log.js";

export async function getLogs(req, res) {
  try {
    const logs = await Log.find()
      .sort({ createdAt: -1 })
      .select("text result maskedText confidence createdAt");

    return res.status(200).json(logs);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch logs.", error: error.message });
  }
}
