import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { testDatabaseConnection } from "./config/db";
import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";
import { assistantRouter } from "./routes/assistant.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { errorHandler, notFound } from "./middlewares/error.middleware";
import canchaRouter from "./routes/cancharoutes";
import friendRoutes from "./routes/friendroutes";
import reservaRouter from "./routes/reserva.routes";

export const app = express();

app.use(helmet());
const allowedOrigins = [
    "http://localhost:5173",
    "https://communifield.vercel.app"
];
console.log("FRONTEND_URL =", env.frontendUrl);
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("No permitido por CORS"));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: "25mb" }));

app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMinutes * 60 * 1000,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Demasiadas solicitudes. Intenta nuevamente más tarde.",
    },
  })
);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/db-test", async (_req, res) => {
  try {
    await testDatabaseConnection();

    res.json({
      status: "ok",
      message: "Conexión a MySQL correcta",
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: "No se pudo conectar a MySQL",
      detail: error.message,
    });
  }
});

app.use("/auth", authRouter);
app.use("/users", userRouter);


app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/canchas", canchaRouter);
app.use("/api/reservas", reservaRouter);
app.use("/api/friends", friendRoutes);
app.use("/api/dashboard", dashboardRouter);


app.use(notFound);
app.use(errorHandler);
