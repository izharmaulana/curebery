import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import nursesRouter from "./nurses";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/nurses", nursesRouter);

export default router;
