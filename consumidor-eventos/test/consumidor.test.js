// Pruebas del consumidor con node:test. Se ejecuta index.js como proceso hijo.
// La prueba con broker real solo corre si TEST_AMQP_URL está definida (CI y local con Docker).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");
const amqp = require("amqplib");

const INDEX = path.join(__dirname, "..", "index.js");
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

function puertoLibre() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

async function arrancar(amqpUrl) {
  const puerto = await puertoLibre();
  const hijo = spawn(process.execPath, [INDEX], {
    env: { ...process.env, PORT: String(puerto), AMQP_URL: amqpUrl },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let salida = "";
  hijo.stdout.on("data", (d) => (salida += d));
  hijo.stderr.on("data", (d) => (salida += d));
  const base = `http://127.0.0.1:${puerto}`;
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`${base}/health`);
      break;
    } catch {
      await dormir(100);
    }
  }
  return { hijo, base, salida: () => salida };
}

async function detener(hijo) {
  if (hijo.exitCode !== null) return;
  const fin = new Promise((r) => hijo.once("exit", r));
  hijo.kill();
  await fin;
}

test("sin RabbitMQ: /health responde desconectado, /eventos vacío y reintenta", async () => {
  const { hijo, base, salida } = await arrancar("amqp://127.0.0.1:1");
  try {
    const salud = await fetch(`${base}/health`);
    assert.equal(salud.status, 200);
    assert.equal(salud.headers.get("x-content-type-options"), "nosniff");
    assert.deepEqual(await salud.json(), { status: "ok", rabbitmq: "desconectado" });

    const eventos = await fetch(`${base}/eventos`);
    assert.deepEqual(await eventos.json(), { totalRecibidos: 0, eventos: [] });

    const otra = await fetch(`${base}/no-existe`);
    assert.equal(otra.status, 404);

    assert.match(salida(), /Reintentando conexión en 5 s/);
  } finally {
    await detener(hijo);
  }
});

test("puerto ocupado: termina con código 1 y un mensaje claro", async () => {
  const ocupado = net.createServer();
  await new Promise((r) => ocupado.listen(0, r));
  const puerto = ocupado.address().port;
  const hijo = spawn(process.execPath, [INDEX], {
    env: { ...process.env, PORT: String(puerto), AMQP_URL: "amqp://127.0.0.1:1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let err = "";
  hijo.stderr.on("data", (d) => (err += d));
  const codigo = await new Promise((r) => hijo.once("exit", r));
  ocupado.close();
  assert.equal(codigo, 1);
  assert.match(err, /No se pudo iniciar HTTP en el puerto/);
});

test(
  "con RabbitMQ: procesa un evento, hace ack y descarta JSON inválido",
  { skip: !process.env.TEST_AMQP_URL && "define TEST_AMQP_URL para ejecutarla" },
  async () => {
    const { hijo, base } = await arrancar(process.env.TEST_AMQP_URL);
    const conexion = await amqp.connect(process.env.TEST_AMQP_URL);
    try {
      for (let i = 0; i < 50; i++) {
        const { rabbitmq } = await (await fetch(`${base}/health`)).json();
        if (rabbitmq === "conectado") break;
        await dormir(100);
      }
      const canal = await conexion.createChannel();
      await canal.assertQueue("productos.consultados", { durable: false });
      const evento = { eventoId: `prueba-${Date.now()}`, tipo: "ProductoConsultado" };
      canal.sendToQueue("productos.consultados", Buffer.from("{no es json"));
      canal.sendToQueue("productos.consultados", Buffer.from(JSON.stringify(evento)));

      let datos;
      for (let i = 0; i < 50; i++) {
        datos = await (await fetch(`${base}/eventos`)).json();
        if (datos.totalRecibidos > 0) break;
        await dormir(100);
      }
      assert.equal(datos.totalRecibidos, 1);
      assert.equal(datos.eventos[0].eventoId, evento.eventoId);
      await canal.close();
    } finally {
      await conexion.close();
      await detener(hijo);
    }
  },
);
