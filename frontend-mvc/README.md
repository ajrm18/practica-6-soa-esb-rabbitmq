# frontend-mvc

Frontend MVC (NestJS + Handlebars) de la Práctica 6. Consume por SOAP la operación `ObtenerProductos` del servicio `soa-productos-service` y renderiza la vista `views/index.hbs` en el servidor.

```bash
npm install
npm run start        # http://localhost:3001 (compila y ejecuta dist/main.js)
npm test             # pruebas unitarias (cliente SOAP simulado)
npm run test:e2e     # pruebas e2e de la vista (cliente SOAP simulado)
```

Variables: `PORT` (3001), `SOAP_WSDL_URL` (`http://localhost:3000/wsdl?wsdl`).

Ver el `README.md` de la raíz del repositorio para la arquitectura completa.
