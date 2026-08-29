import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "Enrollments module ready", data: [] });
});

export const EnrollmentsRoutes = router;
export default router;
