// Prueba end-to-end: Frontend MVC -> SOAP -> Servicio SOA -> mini-ESB -> RabbitMQ -> Consumidor.
// Uso:
//   node verificar-flujo.js                      (local)
//   FRONTEND_URL=https://... CONSUMIDOR_URL=https://... SOA_URL=https://... node verificar-flujo.js
// Requiere Node >= 18 (fetch nativo). Tolera el arranque en frío de Render Free
// (timeouts largos y reintentos).

const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:3001").replace(/\/$/, "");
const CONSUMIDOR_URL = (process.env.CONSUMIDOR_URL || "http://localhost:3002").replace(/\/$/, "");
const SOA_URL = (process.env.SOA_URL || "http://localhost:3000").replace(/\/$/, "");
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 90000);
const REINTENTOS = Number(process.env.REINTENTOS || 3);
const ESPERA_EVENTO_MS = 2000;
const PRODUCTOS = ["Teclado mecánico", "Mouse inalámbrico", "Monitor 24&quot;"];

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = [];

function reportar(nombre, ok, detalle) {
  resultados.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"} - ${nombre}${detalle ? ` (${detalle})` : ""}`);
}

async function pedir(url) {
  let ultimoError;
  for (let intento = 1; intento <= REINTENTOS; intento++) {
    const inicio = Date.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      const cuerpo = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { cuerpo, ms: Date.now() - inicio };
    } catch (error) {
      ultimoError = error;
      console.log(`  intento ${intento}/${REINTENTOS} a ${url} falló: ${error.message}`);
      if (intento < REINTENTOS) await dormir(5000);
    }
  }
  throw ultimoError;
}

async function totalEventos() {
  const { cuerpo } = await pedir(`${CONSUMIDOR_URL}/eventos`);
  return JSON.parse(cuerpo).totalRecibidos;
}

async function main() {
  console.log(`Fecha: ${new Date().toISOString()}`);
  console.log(`Frontend:   ${FRONTEND_URL}`);
  console.log(`SOA:        ${SOA_URL}`);
  console.log(`Consumidor: ${CONSUMIDOR_URL}\n`);

  // 0. Despertar los servicios (en Render Free pueden estar dormidos).
  for (const [nombre, url] of [
    ["SOA", `${SOA_URL}/health`],
    ["Consumidor", `${CONSUMIDOR_URL}/health`],
  ]) {
    try {
      const { cuerpo, ms } = await pedir(url);
      console.log(`  ${nombre} /health -> ${cuerpo.trim()} en ${ms} ms`);
    } catch (error) {
      console.log(`  ${nombre} /health no respondió: ${error.message}`);
    }
  }
  console.log("");

  // 1. Contador inicial del consumidor.
  let antes;
  try {
    antes = await totalEventos();
    reportar("1. Leer eventos procesados por el consumidor", true, `totalRecibidos=${antes}`);
  } catch (error) {
    reportar("1. Leer eventos procesados por el consumidor", false, error.message);
  }

  // 2. El frontend muestra los 3 productos.
  try {
    const { cuerpo, ms } = await pedir(`${FRONTEND_URL}/`);
    const faltantes = PRODUCTOS.filter((p) => !cuerpo.includes(p));
    reportar(
      "2. El frontend muestra los 3 productos",
      faltantes.length === 0,
      faltantes.length ? `faltan: ${faltantes.join(", ")}` : `${ms} ms`,
    );
  } catch (error) {
    reportar("2. El frontend muestra los 3 productos", false, error.message);
  }

  // 3. Tras 2 s, el consumidor recibió al menos un evento nuevo.
  await dormir(ESPERA_EVENTO_MS);
  try {
    let despues = await totalEventos();
    // Margen extra (hasta 10 s) por la latencia de un broker en la nube.
    for (let i = 0; i < 5 && antes !== undefined && despues <= antes; i++) {
      await dormir(2000);
      despues = await totalEventos();
    }
    reportar(
      "3. El consumidor recibió un evento nuevo",
      antes !== undefined && despues > antes,
      `antes=${antes} después=${despues}`,
    );
  } catch (error) {
    reportar("3. El consumidor recibió un evento nuevo", false, error.message);
  }

  const ok = resultados.every(Boolean);
  console.log(`\nResultado: ${ok ? "PASS" : "FAIL"} (${resultados.filter(Boolean).length}/${resultados.length})`);
  process.exitCode = ok ? 0 : 1;
}

main();
