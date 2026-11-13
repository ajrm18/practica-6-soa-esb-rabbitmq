# Declaración de uso de Inteligencia Artificial

**Práctica 6 - SOA + mini-ESB + RabbitMQ + Frontend MVC** · Integración de Sistemas (PUCE)
**Autor:** Anthony Rosero

| Campo | Detalle |
|---|---|
| **Herramienta** | Claude Code (Anthropic), modelo Claude Opus 5.5, en la terminal de Windows. |
| **Nivel de uso** | Alto: la herramienta generó el código, las pruebas, la configuración de despliegue, la documentación y la auditoría a partir de la guía de la práctica y de mis instrucciones. |
| **Qué se le pidió** | Implementar la práctica completa siguiendo la guía: servicio SOA con WSDL (`ObtenerProductos`), mini-ESB que publica `ProductoConsultado` en RabbitMQ, consumidor con reconexión y endpoint `/eventos`, frontend MVC en NestJS con Handlebars; corregir los puntos de la guía que fallan (`crypto` en el módulo del publicador, `soap:address` fijo en localhost, tests por defecto de NestJS); crear `verificar-flujo.js`, `render.yaml`, el README y la auditoría `AUDITORIA_PRACTICA_6.md`; verificar todo con `node -c`, build, lint, tests y la prueba end-to-end en local y en la nube, y subir el repositorio a GitHub. Las credenciales de CloudAMQP y la creación de los servicios en Render las hice yo; la URL AMQPS no se escribió en ningún archivo versionado. |
| **Qué se modificó/verificó manualmente** |   |
