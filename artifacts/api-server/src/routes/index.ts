import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import medicalHistoryRouter from "./medical-history";
import appointmentsRouter from "./appointments";
import expensesRouter from "./expenses";
import financeRouter from "./finance";
import reviewsRouter from "./reviews";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/clients", clientsRouter);
router.use("/clients/:clientId/medical-history", medicalHistoryRouter);
router.use("/appointments", appointmentsRouter);
router.use("/expenses", expensesRouter);
router.use("/finance", financeRouter);
router.use("/reviews", reviewsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
