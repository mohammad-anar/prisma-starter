import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "Lessons module ready", data: [] });
});

export const LessonsRoutes = router;
export default router;
