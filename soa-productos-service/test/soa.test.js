// Pruebas del servicio SOA con node:test (sin dependencias extra).
// RabbitMQ apunta a un puerto cerrado a propósito: el servicio debe responder igual.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const net = require("node:net");
const soap = require("soap");

const PUBLIC_URL = "https://soa.ejemplo.test";
let servidor;
let base;

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

before(async () => {
  const puerto = await puertoLibre();
  process.env.PORT = String(puerto);
  process.env.PUBLIC_URL = PUBLIC_URL;
  process.env.AMQP_URL = "amqp://127.0.0.1:1";
  process.env.AMQP_TIMEOUT_MS = "2000";
  const { iniciar } = require("../index");
  servidor = iniciar(puerto);
  await new Promise((r) => servidor.once("listening", r));
  base = `http://127.0.0.1:${puerto}`;
});

after(() => {
  servidor.closeAllConnections();
  servidor.close();
});

test("GET /health responde ok sin cabecera X-Powered-By", async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "ok" });
  assert.equal(res.headers.get("x-powered-by"), null);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
});

test("el WSDL expone ObtenerProductos y usa PUBLIC_URL en soap:address", async () => {
  const res = await fetch(`${base}/wsdl?wsdl`);
  assert.equal(res.status, 200);
  const xml = await res.text();
  assert.match(xml, /ObtenerProductos/);
  assert.match(xml, new RegExp(`location="${PUBLIC_URL}/wsdl"`));
  assert.doesNotMatch(xml, /localhost:3000/);
});

test("ObtenerProductos devuelve los 3 productos aunque RabbitMQ no responda", async () => {
  const cliente = await soap.createClientAsync(`${base}/wsdl?wsdl`);
  cliente.setEndpoint(`${base}/wsdl`);
  const [resultado] = await cliente.ObtenerProductosAsync({});
  const nombres = resultado.productos.map((p) => p.nombre);
  assert.deepEqual(nombres, ["Teclado mecánico", "Mouse inalámbrico", 'Monitor 24"']);
});

test("una petición SOAP mal formada devuelve un Fault y el servicio sigue vivo", async () => {
  const res = await fetch(`${base}/wsdl`, {
    method: "POST",
    headers: { "Content-Type": "text/xml; charset=utf-8" },
    body: "<esto no es xml",
  });
  // SOAP 1.1 exige HTTP 500 para los Fault.
  assert.equal(res.status, 500);
  assert.match(await res.text(), /Fault/);
  const salud = await fetch(`${base}/health`);
  assert.equal(salud.status, 200);
});

test("el evento ProductoConsultado tiene los 5 campos de la guía", () => {
  const { crearEventoProductoConsultado } = require("../evento-publisher");
  const evento = crearEventoProductoConsultado(3);
  assert.deepEqual(Object.keys(evento).sort(), [
    "eventoId",
    "fecha",
    "origen",
    "tipo",
    "totalProductosDevueltos",
  ]);
  assert.equal(evento.tipo, "ProductoConsultado");
  assert.equal(evento.totalProductosDevueltos, 3);
  assert.match(evento.eventoId, /^[0-9a-f-]{36}$/);
});
