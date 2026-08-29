import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "Notifications module ready", data: [] });
});

export const NotificationsRoutes = router;
export default router;
