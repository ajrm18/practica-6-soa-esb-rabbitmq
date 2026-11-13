const express = require("express");
const soap = require("soap");
const fs = require("fs");
const path = require("path");
const productos = require("./productos");
const {
  publicarEvento,
  crearEventoProductoConsultado,
} = require("./evento-publisher");

const PORT = process.env.PORT || 3000;
// RENDER_EXTERNAL_URL la define Render automáticamente si no se configura PUBLIC_URL.
const PUBLIC_URL = (
  process.env.PUBLIC_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${PORT}`
).replace(/\/$/, "");

// soap:address debe apuntar a la URL pública cuando el servicio corre en la nube.
const wsdl = fs
  .readFileSync(path.join(__dirname, "productos.wsdl"), "utf8")
  .replace("http://localhost:3000/wsdl", `${PUBLIC_URL}/wsdl`);

const servicio = {
  ProductosService: {
    ProductosPort: {
      ObtenerProductos: async function (args, callback) {
        const evento = crearEventoProductoConsultado(productos.length);
        try {
          // Se publica ANTES de responder al cliente.
          await publicarEvento(evento);
        } catch (error) {
          console.error("[ESB] No se pudo publicar el evento:", error.message);
        }
        callback(null, { productos });
      },
    },
  },
};

const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

function iniciar(puerto = PORT) {
  const servidor = app.listen(puerto, () => {
    soap.listen(app, "/wsdl", servicio, wsdl);
    console.log(`Servicio SOA escuchando en ${PUBLIC_URL}/wsdl?wsdl`);
  });
  servidor.on("error", (error) => {
    console.error(`[SOA] No se pudo iniciar en el puerto ${puerto}: ${error.message}`);
    process.exit(1);
  });
  return servidor;
}

if (require.main === module) {
  iniciar();
}

module.exports = { app, iniciar };
