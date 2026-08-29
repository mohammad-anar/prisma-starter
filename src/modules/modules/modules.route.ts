import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "Course Modules ready", data: [] });
});

export const ModuleRoutes = router;
export default router;
