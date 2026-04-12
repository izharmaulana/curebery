import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import nursesRouter from "./nurses";
import connectionsRouter from "./connections";
import messagesRouter from "./messages";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/nurses", nursesRouter);
router.use("/connections", connectionsRouter);
router.use("/messages", messagesRouter);
router.use("/ai", aiRouter);

export default router;
