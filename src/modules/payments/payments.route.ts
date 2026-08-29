import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "Payments module ready", data: [] });
});

export const PaymentsRoutes = router;
export default router;
