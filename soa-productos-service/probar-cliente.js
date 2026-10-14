const soap = require("soap");

const WSDL_URL = process.env.WSDL_URL || "http://localhost:3000/wsdl?wsdl";

soap.createClient(WSDL_URL, (err, client) => {
  if (err) {
    console.error("Error al crear el cliente SOAP:", err.message);
    process.exitCode = 1;
    return;
  }

  client.ObtenerProductos({}, (err, result) => {
    if (err) {
      console.error("Error al invocar ObtenerProductos:", err.message);
      process.exitCode = 1;
      return;
    }
    console.log("Respuesta del servicio SOA:");
    console.log(JSON.stringify(result, null, 2));
  });
});
