import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "Progress module ready", data: [] });
});

export const ProgressRoutes = router;
export default router;
