import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { testDatabaseConnection } from "./config/db";
import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";
import { assistantRouter } from "./routes/assistant.routes";
import { errorHandler, notFound } from "./middlewares/error.middleware";
import canchaRouter from "./routes/cancharoutes";
import friendRoutes from "./routes/friendroutes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
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
app.use("/api/friends", friendRoutes);


app.use(notFound);
app.use(errorHandler);