const amqp = require("amqplib");
const http = require("http");

const AMQP_URL = process.env.AMQP_URL || "amqp://localhost";
const COLA = "productos.consultados";
const PORT = process.env.PORT || 3002;
const REINTENTO_MS = 5000;
const MAX_EVENTOS = 20;

// Últimos eventos recibidos (en memoria) y contador total.
const eventos = [];
let totalRecibidos = 0;
let conectado = false;

function programarReconexion() {
  conectado = false;
  console.log(`[Consumidor] Reintentando conexión en ${REINTENTO_MS / 1000} s...`);
  setTimeout(iniciarConsumidor, REINTENTO_MS);
}

async function iniciarConsumidor() {
  let conexion;
  try {
    conexion = await amqp.connect(AMQP_URL);
  } catch (error) {
    console.error("[Consumidor] No se pudo conectar a RabbitMQ:", error.message);
    programarReconexion();
    return;
  }

  let reconectando = false;
  const alCaer = (motivo) => {
    if (reconectando) return;
    reconectando = true;
    console.error("[Consumidor] Conexión perdida:", motivo);
    programarReconexion();
  };
  conexion.on("error", (error) => alCaer(error.message));
  conexion.on("close", () => alCaer("conexión cerrada"));

  try {
    const canal = await conexion.createChannel();
    await canal.assertQueue(COLA, { durable: false });
    conectado = true;
    console.log(`[Consumidor] Esperando eventos en la cola "${COLA}"...`);

    canal.consume(COLA, (mensaje) => {
      if (!mensaje) return;
      let evento;
      try {
        evento = JSON.parse(mensaje.content.toString());
      } catch {
        console.error("[Consumidor] Mensaje descartado (JSON inválido)");
        canal.nack(mensaje, false, false);
        return;
      }
      console.log("[Consumidor] Evento recibido:", evento);
      totalRecibidos++;
      eventos.unshift(evento);
      if (eventos.length > MAX_EVENTOS) eventos.pop();
      canal.ack(mensaje);
    });
  } catch (error) {
    console.error("[Consumidor] Error al preparar el canal:", error.message);
    conexion.close().catch(() => {});
    alCaer(error.message);
  }
}

const servidor = http.createServer((req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  const ruta = req.url.split("?")[0];
  if (req.method === "GET" && ruta === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", rabbitmq: conectado ? "conectado" : "desconectado" }));
    return;
  }
  if (req.method === "GET" && ruta === "/eventos") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ totalRecibidos, eventos }, null, 2));
    return;
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "No encontrado" }));
});

servidor.on("error", (error) => {
  console.error(`[Consumidor] No se pudo iniciar HTTP en el puerto ${PORT}: ${error.message}`);
  process.exit(1);
});

servidor.listen(PORT, () => {
  console.log(`[Consumidor] HTTP en http://localhost:${PORT} (/health, /eventos)`);
});

// Render envía SIGTERM al redesplegar: se cierra el servidor y se sale limpio.
process.on("SIGTERM", () => {
  console.log("[Consumidor] SIGTERM recibido, cerrando...");
  servidor.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
});

iniciarConsumidor();
