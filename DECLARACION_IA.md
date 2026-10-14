# Declaración de uso de Inteligencia Artificial

**Práctica 6 - SOA + mini-ESB + RabbitMQ + Frontend MVC** · Integración de Sistemas (PUCE)
**Autor:** Anthony Rosero

| Campo | Detalle |
|---|---|
| **Herramienta** | Claude Code (Anthropic), modelo Claude Opus 5.5, en la terminal de Windows. |
| **Nivel de uso** | Alto: la herramienta generó el código, las pruebas, la configuración de despliegue, la documentación y la auditoría a partir de la guía de la práctica y de mis instrucciones. |
| **Qué se le pidió** | Implementar la práctica completa siguiendo la guía: servicio SOA con WSDL (`ObtenerProductos`), mini-ESB que publica `ProductoConsultado` en RabbitMQ, consumidor con reconexión y endpoint `/eventos`, frontend MVC en NestJS con Handlebars; corregir los puntos de la guía que fallan (`crypto` en el módulo del publicador, `soap:address` fijo en localhost, tests por defecto de NestJS); crear `verificar-flujo.js`, `render.yaml`, este README, la auditoría `AUDITORIA_PRACTICA_6.md`, y subir el repositorio a GitHub. |
| **Qué hizo la herramienta y cómo lo verificó** | Ejecutó los comandos de la guía (`npm init`, `npm install`, `nest new`, `docker compose up`), escribió los archivos, comprobó `node -c`, `npm run build`, `npm run lint`, `npm test` y `npm run test:e2e`; levantó los 4 componentes en local y comprobó el WSDL, el contador de la cola en la API de management de RabbitMQ, los eventos en el consumidor y la página del frontend; ejecutó `verificar-flujo.js` (salida en `evidencias/`). Las credenciales de CloudAMQP y la creación de los servicios en Render las hice yo; la URL AMQPS no se escribió en ningún archivo versionado. |
| **Qué se modificó/verificó manualmente** | _Por completar por Anthony Rosero:_ confirmar que (1) leí y entiendo cada archivo, en especial `index.js` (orden publicar → `callback`), `evento-publisher.js` y `app.controller.ts`; (2) abrí http://localhost:3001 y el panel http://localhost:15672 y vi los productos y los mensajes; (3) abrí los 3 links públicos de Render y vi los productos y los eventos en `/eventos`; (4) revisé que no hay secretos en el repositorio; (5) hice a mano el dibujo de la bitácora. Anotar aquí cualquier cambio propio que haga al código o a la documentación. |
