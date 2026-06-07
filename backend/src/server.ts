import { app } from "./app";
import { env } from "./config/env";
import { testDatabaseConnection } from "./config/db";


app.listen(env.port, async () => {
  console.log(`Servidor corriendo en http://localhost:${env.port}`);
  try {
    await testDatabaseConnection();
    console.log("MySQL conectado correctamente");
  } catch (error: any) {
    console.warn("Servidor iniciado, pero MySQL no conectó:", error.message);
    console.warn("Revisa .env, XAMPP/MySQL y que exista la base de datos communifield");
  }
});
