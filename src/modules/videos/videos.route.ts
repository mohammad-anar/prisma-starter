import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "Videos module ready", data: [] });
});

export const VideosRoutes = router;
export default router;
