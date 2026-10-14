// Mini-ESB: publica el evento ProductoConsultado en RabbitMQ.
const amqp = require("amqplib");
// Se requiere aquí: un require en index.js no lo hace visible en este módulo.
const crypto = require("crypto");

const AMQP_URL = process.env.AMQP_URL || "amqp://localhost";
const COLA = "productos.consultados";

async function publicarEvento(evento) {
  const conexion = await amqp.connect(AMQP_URL);
  try {
    const canal = await conexion.createChannel();
    await canal.assertQueue(COLA, { durable: false });
    canal.sendToQueue(COLA, Buffer.from(JSON.stringify(evento)));
    console.log("[ESB] Evento publicado:", evento.tipo, evento.eventoId);
    await canal.close();
  } finally {
    await conexion.close();
  }
}

function crearEventoProductoConsultado(totalProductosDevueltos) {
  return {
    eventoId: crypto.randomUUID(),
    tipo: "ProductoConsultado",
    fecha: new Date().toISOString(),
    origen: "soa-productos-service",
    totalProductosDevueltos,
  };
}

module.exports = { publicarEvento, crearEventoProductoConsultado, COLA };
