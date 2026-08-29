import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "Milestones module ready", data: [] });
});

export const MilestonesRoutes = router;
export default router;
