import { createServer } from "http";
import { app } from "./app";
import { env } from "./config/env";
import { testDatabaseConnection } from "./config/db";
import { attachReservaWebSocketServer } from "./services/reservaRealtime";

const server = createServer(app);

attachReservaWebSocketServer(server);

server.listen(env.port, async () => {
  console.log(`Servidor corriendo en http://localhost:${env.port}`);
  try {
    await testDatabaseConnection();
    console.log("MySQL conectado correctamente");
  } catch (error: any) {
    console.warn("Servidor iniciado, pero MySQL no conectó:", error.message);
    console.warn("Revisa .env, XAMPP/MySQL y que exista la base de datos communifield");
  }
});
