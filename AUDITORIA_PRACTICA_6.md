# Auditoría final - Práctica 6: SOA + mini-ESB + RabbitMQ + consumidor + frontend MVC (Node.js / NestJS) y despliegue en Render

## 1. Datos del proyecto

| Campo | Valor |
|---|---|
| Materia | Integración de Sistemas (PUCE) · Semana 5 · Reto 1 |
| Autor | Anthony Rosero (trabajo individual) |
| Repositorio | https://github.com/ajrm18/practica-6-soa-esb-rabbitmq (rama `main`, público, sin protección, sin licencia) |
| Carpeta del proyecto | `C:\Users\HP\Downloads\1\practica-6-soa-esb-rabbitmq` |
| Estado auditado | `HEAD = 8e328b8` (`8e328b843d592e59d0b10afe0c8d7106609f0b7e`, "fix: prevenir fallos recurrentes de auditorías anteriores") = `origin/main`; 8 commits; CI `43554910772` en verde |
| Servicios publicados | Frontend: https://frontend-mvc-yku6.onrender.com · SOA (WSDL): https://soa-productos-service-iq64.onrender.com/wsdl?wsdl · Consumidor: https://consumidor-eventos-mbuv.onrender.com/eventos (Render Free, Blueprint `render.yaml`) |
| Broker | Local: Docker `rabbitmq-integracion` (RabbitMQ 3.13.7). Nube: CloudAMQP (URL solo como variable `AMQP_URL` en Render) |
| Fecha de la auditoría | 13 de noviembre de 2026 (23:30, UTC-5) |
| Entorno | Windows 10, Node.js 26.1.0, npm 11.13.0, Docker 29.9.2; CI: `ubuntu-24.04` con Node 22. Express 5.3.0, `soap` 1.14.0, `amqplib` 2.2.0, NestJS 12.1.3, `hbs` 4.4.0 (handlebars 4.7.10), Vitest 5.1.0, TypeScript 6.0.3, oxlint 1.88.0 |

## 2. Metodología

### 2.1 Objeto de la auditoría

Se auditó el **último commit publicado** (`8e328b8`) sobre un **clon nuevo** del repositorio en `C:\Users\HP\Downloads\1\tmp-auditoria-p6\repo`, no la carpeta de trabajo. Ese commit ya incluye las correcciones preventivas derivadas de las auditorías de las Prácticas 1 a 5 (sección 6).

### 2.2 Garantía de no modificación

- Todos los comandos (`npm ci`, `node -c`, lint, build, pruebas, E2E y robustez) se ejecutaron en el clon. No se editó ningún archivo del clon; los scripts de apoyo (`robustez.sh`, `sonda.mjs`, `nube.mjs`, `returnfault.js`) se escribieron fuera del repositorio, en `tmp-auditoria-p6`.
- Durante la auditoría, en la carpeta original solo se editó `README.md` (links públicos y tabla de pruebas, solo documentación). Ese cambio y la copia de este informe se suben en un commit posterior que **no toca código**.
- En Render solo se hicieron GET y dos POST SOAP inválidos al SOA, que no tienen efectos. La E2E en la nube genera, como está previsto, un evento `ProductoConsultado`.
- RabbitMQ local se detuvo y se volvió a arrancar a propósito (prueba 1-2). No se tocó CloudAMQP.

### 2.3 Actividades

| # | Actividad | Tipo |
|---|---|---|
| 1 | Clon limpio + `npm ci` en los 3 proyectos, `node -c` en los 8 `.js` versionados | Ejecutado |
| 2 | `npm run lint` (3 proyectos, `--deny-warnings`), `npm run build`, `npm test` (3 proyectos) y `npm run test:e2e` (frontend) | Ejecutado |
| 3 | `npm audit` y `npm audit --omit=dev` en los 3 proyectos | Ejecutado |
| 4 | `verificar-flujo.js` contra el clon en local y contra las 3 URLs de Render | Ejecutado |
| 5 | Robustez: SOA con RabbitMQ detenido, reinicio de RabbitMQ con el consumidor corriendo, frontend con el SOA caído, 4 peticiones SOAP mal formadas, puerto ocupado en los 3 servicios | Ejecutado (local); peticiones mal formadas también en Render |
| 6 | Render: `soap:address` publicado, `/health`, cabeceras, precios con 2 decimales, 404 | Ejecutado |
| 7 | Secretos en el árbol y en `git log -p --all`; archivos versionados indebidos; dependencias que resuelven fuera del proyecto | Ejecutado |
| 8 | GitHub: CI, anotaciones, protección de `main`, licencia, Pages | Ejecutado (API) |
| 9 | Accesibilidad de `views/index.hbs` y `styles.css` (lang, roles, contraste calculado) | Ejecutado (revisión manual y cálculo) |

Evidencias en `C:\Users\HP\Downloads\1\tmp-auditoria-p6\logs\` (`ci-local.txt`, `robustez.txt`, `e2e-local-auditoria.txt`, logs de los servicios) y en el repositorio: `evidencias/verificar-flujo-local.txt` y `evidencias/verificar-flujo-nube.txt`.

### 2.4 No aplica o no confirmado

- **GitHub Pages**: no aplica (`has_pages: false`); son 3 servidores Node.
- **Validación de entradas de negocio**: `ObtenerProductos` no tiene parámetros y el frontend no tiene formularios ni parámetros de ruta. Lo único que se puede alterar es el XML de la petición SOAP (prueba 3).
- **No confirmado**: arranque en frío de Render (los servicios estaban despiertos; el README advierte de 30 s a 1 min); que Render haya esperado de verdad al CI con `autoDeployTrigger: checksPass` (el despliegue llegó después del CI en verde, pero el panel de Render no se vio); axe-core, Lighthouse y lector de pantalla (no se ejecutaron; ver la revisión manual en 7).
- El `curl` de Git Bash de este equipo no completa el handshake TLS con ningún host HTTPS (`schannel: failed to receive handshake`, también con github.com; probablemente por la inspección de Kaspersky). Todas las pruebas HTTPS se hicieron con `fetch` de Node, como `verificar-flujo.js`. No es un defecto del proyecto.

## 3. Comandos ejecutados

| Comando (clon `8e328b8`) | soa-productos-service | consumidor-eventos | frontend-mvc |
|---|---|---|---|
| `npm ci` | OK (98 paquetes) | OK (3) | OK (296) |
| `node -c` (8 archivos `.js`) | OK | OK | n/a (TS) |
| `npm run lint` (`--deny-warnings`) | OK | OK | OK (`--type-aware`) |
| `npm run build` | n/a | n/a | OK |
| `npm test` | OK 5/5 | OK 3/3 (con `TEST_AMQP_URL`) | OK 7/7 |
| `npm run test:e2e` | n/a | n/a | OK 5/5 |
| `npm audit --omit=dev` | 0 | 0 | 1 moderada (`hbs`, sin parche) → P6-03 |
| `npm audit` (incl. dev) | 0 | 0 | 1 moderada (la misma) |
| CI GitHub Actions `43554910772` (Node 22) | OK | OK | OK; job E2E con RabbitMQ OK; 0 anotaciones |

| Prueba | Resultado |
|---|---|
| `node verificar-flujo.js` (local, clon) | **PASS 3/3** (frontend 772 ms; eventos 0 → 1) |
| `node verificar-flujo.js` (Render) | **PASS 3/3** (frontend 1058 ms; eventos 3 → 4) |
| Robustez 1: SOA con RabbitMQ detenido | OK: frontend 200 en 456 ms con los 3 productos; `probar-cliente` 3 productos; log `[ESB] No se pudo publicar` (mensaje vacío → P6-02) |
| Robustez 2: reinicio de RabbitMQ | OK: el consumidor reintentó cada 5 s y se reconectó solo (61 s desde `docker start`, incluye el arranque del broker); eventos 1 → 2 |
| Robustez 3: SOAP mal formado (texto, JSON, cuerpo vacío) | OK: HTTP 500 con `soap:Fault` "Invalid XML"; `/health` sigue en 200 |
| Robustez 3: operación SOAP inexistente | **FALLA**: HTTP 500 con la pila de node-soap en texto plano, local y Render → P6-01 |
| Robustez 4: puerto ocupado (3 servicios) | OK: un mensaje de una línea y código de salida 1 en los tres |
| Robustez 5: frontend con el SOA caído | OK: 200 en 851 ms, mensaje con `role="alert"`, sin `ECONNREFUSED` en la página; `/health` 200; se recupera al volver el SOA |
| Secretos (árbol + historial completo) | OK: 0 coincidencias |

## 4. Resumen ejecutivo y conteo por severidad

La práctica cumple **todos** los puntos de la guía y el flujo completo funciona en local y en la nube. Las correcciones preventivas resolvieron la mayoría de los fallos que se repetían en las Prácticas 1-5: lint roto, falta de pruebas, falta de CI, falta de health checks, falta de timeouts, cabeceras por defecto, versiones de Node desalineadas y vulnerabilidades en devDependencies. Queda un hallazgo **Medio**: una operación SOAP inexistente expone la pila del error en producción. Los demás son menores.

| Severidad | Cantidad | Hallazgos |
|---|---|---|
| Crítica | 0 | - |
| Alta | 0 | - |
| Media | 1 | P6-01 |
| Baja | 3 | P6-02, P6-03, P6-04 (CI/CD) |
| Informativa | 4 | P6-05 a P6-08 |

## 5. Hallazgos

### Severidad Media

#### P6-01 - Una operación SOAP inexistente devuelve la pila del error con rutas internas (local y Render)

- **Archivo y línea**: `soa-productos-service/index.js:56` (`soap.listen(app, "/wsdl", servicio, wsdl)` sin `returnFault`)
- **Tipo de verificación**: Ejecutado (local y Render).
- **Evidencia**:

```text
POST /wsdl  <soap:Envelope ...><soap:Body><OperacionInexistente/></soap:Body></soap:Envelope>
Local : HTTP 500  Content-Type: text/xml
        TypeError: Cannot read properties of undefined (reading 'description')
            at p.onopentag (C:\Users\HP\Downloads\1\tmp-auditoria-p6\repo\soa-productos-service\node_modules\soap\lib\wsdl\index.js:319:37)
            at emit (...\node_modules\sax\lib\sax.js:745:35) ...
Render: HTTP 500  TypeError: Cannot read properties of undefined (reading 'description')
            at p.onopentag (/opt/render/project/src/soa-productos-service/node_modules/soap/lib/w...
XML no válido / JSON / cuerpo vacío -> HTTP 500 con soap:Fault "Invalid XML" (correcto)
```

- **Causa**: con la configuración por defecto, cuando `node-soap` falla al interpretar un cuerpo que es XML válido pero no corresponde al WSDL, escribe `error.stack` como respuesta en lugar de un `soap:Fault`.
- **Impacto**: cualquier cliente anónimo obtiene la versión de la librería, la estructura de carpetas del servidor (`/opt/render/project/src/...`) y la pila interna. No expone datos ni credenciales, y el proceso no se cae (`/health` sigue en 200). Pero es una fuga de información en producción (CWE-209), y además la respuesta no es un SOAP válido, así que un cliente SOAP no puede tratarla como Fault. Es la misma familia de fallo que P5-01 (errores con detalles internos).
- **Pasos para reproducir**: `POST https://soa-productos-service-iq64.onrender.com/wsdl` con `Content-Type: text/xml` y el sobre anterior.
- **Recomendación** (verificada aparte con las mismas versiones, sin tocar el repositorio: devuelve `soap:Fault` con `Could not find message OperacionInexistente` y sin pila):

```js
soap.listen(app, { path: "/wsdl", services: servicio, xml: wsdl, returnFault: true });
```

Añadir el caso a `test/soa.test.js` (por ejemplo, `assert.doesNotMatch(cuerpo, /node_modules/)`).

### Severidad Baja

#### P6-02 - Con RabbitMQ local caído, el log del mini-ESB sale sin motivo

- **Archivo y línea**: `soa-productos-service/index.js:33`
- **Tipo de verificación**: Ejecutado.
- **Evidencia**:

```text
[ESB] No se pudo publicar el evento:
amqp.connect('amqp://localhost:1') -> name=AggregateError msg="" code=ECONNREFUSED errors=[ECONNREFUSED, ECONNREFUSED]
```

- **Causa**: `localhost` resuelve a `::1` y a `127.0.0.1`. Node prueba ambas direcciones y rechaza con un `AggregateError` cuyo `message` está vacío; el código solo registra `error.message`.
- **Impacto**: el aviso de que se perdió un evento aparece en el log sin decir por qué. En Render (`amqps://` con un único host) el mensaje sí trae texto, por lo que afecta sobre todo al diagnóstico local.
- **Recomendación**: `console.error("[ESB] No se pudo publicar el evento:", error.message || error.code || error.errors?.map((e) => e.code).join(", "))`.

#### P6-03 - `hbs` tiene un aviso de seguridad sin versión corregida

- **Archivo y línea**: `frontend-mvc/package.json:28` (`"hbs": "^4.3.1"`, instalado 4.4.0)
- **Tipo de verificación**: Ejecutado (`npm audit --omit=dev`) y Deducido (explotabilidad).
- **Evidencia**: `hbs * Severity: moderate ... GHSA-7f5c-rpf4-86p8 ... No fix available`. Los avisos críticos de `handlebars` que aparecían antes quedaron resueltos al actualizar a 4.7.10.
- **Impacto**: el aviso afecta a aplicaciones que pasan a `res.render` objetos controlados por el usuario (opciones como `layout`). Aquí el controlador solo devuelve `{ productos, error }`, construido en el servidor (`frontend-mvc/src/app.controller.ts:35-56`), así que no es explotable en esta práctica. Aun así, `npm audit` no queda en cero, y `hbs` lo exige la guía.
- **Recomendación**: mantener `hbs` (lo pide la guía), no pasar nunca `req.query` ni `req.body` a la vista, y revisar el aviso cuando salga una versión corregida. Documentarlo en el README.

#### P6-04 - `main` sin protección: el CI no impide un push directo con fallos (CI/CD)

- **Archivo y línea**: configuración del repositorio (`GET /repos/.../branches/main` → `"protected": false`)
- **Tipo de verificación**: Ejecutado (API de GitHub).
- **Impacto**: con `autoDeployTrigger: checksPass` (`render.yaml:13`, `:32`, `:47`), Render no debería desplegar un commit con el CI en rojo. Aun así, ese commit queda en `main` y el repositorio entregado tendría un estado roto. Es el resto de P3-07.
- **Recomendación**: en GitHub, **Settings → Branches → Add rule** para `main` con "Require status checks to pass" (los 4 jobs de `CI`). Es opcional en un trabajo individual.

### Severidad Informativa

#### P6-05 - Los Fault de node-soap usan `faultcode` 500 e incluyen una cabecera WS-Security

- **Tipo de verificación**: Ejecutado.
- **Evidencia**: `<soap:Fault><faultcode>500</faultcode><faultstring>Invalid XML</faultstring>...` precedido de `<o:Security soap:mustUnderstand="1">` con un `Timestamp`.
- **Observación**: SOAP 1.1 espera `soap:Client` para errores del cliente. El HTTP 500 sí es el código que exige SOAP 1.1 para los Fault (no es un fallo). Es comportamiento de la librería y no afecta a la práctica.

#### P6-06 - Limitaciones de diseño aceptadas por la guía

- **Tipo de verificación**: Ejecutado y Deducido.
- **Observación**: la cola es `durable: false` y los mensajes no son persistentes (lo pide la guía); hay una conexión AMQP por cada petición SOAP; los eventos del consumidor solo viven en memoria (últimos 20, se pierden al dormirse el servicio en Render Free); no hay autenticación. Todo está documentado en "Limitaciones conocidas" del README.

#### P6-07 - Secretos: no se encontraron

- **Tipo de verificación**: Ejecutado.
- **Evidencia**: `git log -p --all` sin coincidencias de `amqps://usuario:clave@`, dominios de CloudAMQP, `password`/`secret`/`api_key`, `ghp_`/`github_pat_`, `AKIA`, claves privadas ni `rnd_`. Las únicas URL AMQP del código son `amqp://localhost` como valor por defecto (`evento-publisher.js:6`, `consumidor-eventos/index.js:4`) y en el CI (`ci.yml:36`). Nunca se versionaron `.env`, `node_modules`, `dist`, `*.tsbuildinfo` ni logs (`git ls-files`), y no hay archivos borrados en el historial.

#### P6-08 - Repositorio sin licencia

- **Tipo de verificación**: Ejecutado (`license: null`).
- **Observación**: los `package.json` declaran `ISC` y `UNLICENSED`, pero el repositorio no tiene archivo `LICENSE`. Es irrelevante para la entrega; sin licencia, el código es "todos los derechos reservados".

## 6. Fallos recurrentes de auditorías anteriores

Se leyeron `Auditoria_Practica1.md` a `Auditoria_Practica5.md` (carpeta `au`) y se revisó la Práctica 6 contra cada fallo que apareció en más de una práctica o que era aplicable. Las prevenciones entraron en el commit `8e328b8`, antes de esta auditoría.

| Fallo recurrente | Apareció en | Estado en la Práctica 6 | Evidencia |
|---|---|---|---|
| `npm run lint` falla por la promesa sin manejar de `bootstrap()` | P1-04, P2 (tabla), P3-03, P4-09 | Prevenido | `frontend-mvc/src/main.ts:21-27` (`try { await bootstrap() } catch`); lint con `--deny-warnings` en los 3 proyectos (`*/package.json`) → OK |
| Sin pruebas, pruebas de plantilla o `--passWithNoTests` | P1-08, P2-06, P3-03, P4-02, P5-05 | Prevenido | `soa-productos-service/test/soa.test.js` (5), `consumidor-eventos/test/consumidor.test.js` (3), `frontend-mvc/src/app.controller.spec.ts` (7), `test/app.e2e-spec.ts` (5); sin `--passWithNoTests` |
| CI inexistente o que no ejecuta lint ni pruebas; publica sin verificar | P3-03, P4-03, P5-05 | Prevenido | `.github/workflows/ci.yml:44-55` (npm ci, node -c, lint, build, test, test:e2e) y `:57-87` (E2E con RabbitMQ); ejecución `43554910772` en verde |
| Render despliega aunque el CI falle; `main` sin protección | P3-07, P5-05 | Prevenido en parte | `render.yaml:13,32,47` `autoDeployTrigger: checksPass`; `main` sigue sin protección → P6-04 |
| Dependencias no declaradas ocultas por el `node_modules` de `Downloads\1`; `npm ci` limpio roto | P2-09 (y commit `2c37313` de P2) | Prevenido | `npm ci` en clon limpio OK; las 11 dependencias resuelven dentro de su proyecto (`require.resolve` → "propio"); CI en `ubuntu-24.04` sin carpeta padre |
| Entradas inválidas que provocan 500 | P1-01, P2-01..03, P3-01/02, P4-04/05, P5-07 | No aplica (sin parámetros) / XML mal formado → Fault | Robustez 3: XML, JSON y vacío → `soap:Fault`; la operación inexistente expone la pila → P6-01 |
| Errores que filtran detalles internos (pila, rutas) | P5-01, P3-17 | **No prevenido en un caso** | Frontend: sin `ECONNREFUSED` en la página (robustez 5, `app.controller.ts:47-55`); SOA: operación inexistente → P6-01 |
| Sin timeout hacia la dependencia: peticiones colgadas | P5-02 | Prevenido | `evento-publisher.js:9-12` (`timeout: 5000` en `amqp.connect`); `app.controller.ts:21` (60 s al SOA) |
| Un fallo del backend tumba el servicio o la página da 500 | P4-01, P3-06 | Prevenido | Robustez 1 (SOA responde sin RabbitMQ), 2 (el consumidor se reconecta) y 5 (frontend 200 con el SOA caído) |
| Sin endpoint de salud ni `healthCheckPath` | P3-06, P4-11, P5-08 | Prevenido | `GET /health` en `soa-productos-service/index.js:50`, `consumidor-eventos/index.js:73`, `frontend-mvc/src/app.controller.ts:58`; `render.yaml:12,31,46` |
| `X-Powered-By: Express` y sin cabeceras de seguridad | P3-15, P4-14, P5-10 | Prevenido | `index.js:42-48`, `consumidor-eventos/index.js:71`, `configurar-app.ts:7-17` (CSP); Render: `x-powered-by=null`, `nosniff`, CSP presente |
| Endpoint de plantilla "Hello World!" | P1-06, P5-10 | Prevenido | `app.controller.ts` solo tiene `GET /` y `GET /health`; no hay `AppService` |
| Puerto ocupado: rechazo sin manejar o pila completa | P4-09, P5-15 | Prevenido | `index.js:59-62`, `consumidor-eventos/index.js:87-90`, `main.ts:23-27`; robustez 4: una línea y código 1 en los tres |
| Versiones de Node desalineadas, sin `engines`, `npm install` en el build | P3-08, P5-09 | Prevenido | `engines >=22` en los 3 `package.json`; `NODE_VERSION=22` en `render.yaml`; CI `node-version: "22"`; `buildCommand` con `npm ci` |
| Acciones de GitHub deprecadas y `ubuntu-latest` | P3-16, P4-13 | Prevenido | `ci.yml:20,38-39` (`ubuntu-24.04`, `checkout@v5`, `setup-node@v5`); 0 anotaciones en la ejecución |
| Vulnerabilidades por devDependencies sin uso (`@nestjs/mau`) | P5-14, P4-18 | Prevenido | `@nestjs/mau`, el script `deploy` y `vite-tsconfig-paths` retirados; Vitest 5.1.0; `npm audit` → solo `hbs` (P6-03) |
| Secretos o credenciales en el código; URLs fijas | P5-06 (y P1-10, P3-18 como control) | Prevenido | `AMQP_URL`, `PUBLIC_URL`, `SOAP_WSDL_URL` por variable (`render.yaml`, `sync: false`); P6-07 |
| Configuración insegura en producción (`synchronize`, playground) | P3-04, P5-04 | No aplica | Sin base de datos ni explorador; el WSDL público es el contrato que pide la guía |
| Accesibilidad (contraste, estados no anunciados, `lang`) | P1-03, P4-08 | Prevenido (revisión manual) | `index.hbs:2` `lang="es"`, `:16` `role="alert"`; contraste #000/#fff 21:1 y #444/#fff 9,7:1; `<main>`; sin imágenes |
| Favicon inexistente (404 en cada visita) | P4-14 | Prevenido | `index.hbs:7` `<link rel="icon" href="data:,">` |
| Documentación desactualizada o con marcadores | P1-07, P3-09, P4-06, P5-11 | Prevenido | README con los 3 links, Node 22, tabla de pruebas y CI; queda solo el campo manual de `DECLARACION_IA.md` (lo completa el autor) |
| Logs de error ruidosos o poco útiles | P3-17, P5-08 | Prevenido en parte | Errores en una línea en los 3 servicios; mensaje vacío con `AggregateError` → P6-02 |

## 7. Checklist de salida de la guía

| # | Requisito | Estado | Evidencia |
|---|---|---|---|
| 1 | RabbitMQ local con `docker-compose.yml`, contenedor `rabbitmq-integracion` | Cumple | `docker-compose.yml:4`; contenedor 3.13.7 en marcha |
| 2 | SOA: Express + `soap` en `/wsdl`, `ObtenerProductos(args, callback)` | Cumple | `index.js:24-39`, `:56`; WSDL local y en Render |
| 3 | Publica el evento ANTES del `callback` y responde aunque falle | Cumple | `index.js:28-35`; robustez 1 y prueba "RabbitMQ no responde" |
| 4 | `process.env.PORT \|\| 3000` | Cumple | `index.js:11` |
| 5 | `soap:address` reemplazado por `${PUBLIC_URL}/wsdl` | Cumple | `index.js:20-22`; Render: `https://soa-productos-service-iq64.onrender.com/wsdl` |
| 6 | `GET /health` en el SOA | Cumple | `index.js:50` |
| 7 | mini-ESB: `require("crypto")` en el módulo y `AMQP_URL` por entorno | Cumple | `evento-publisher.js:4`, `:6` |
| 8 | Cola `productos.consultados` (`durable: false`) | Cumple | `evento-publisher.js:7`, `:15` |
| 9 | Evento con `eventoId`, `tipo`, `fecha`, `origen`, `totalProductosDevueltos` | Cumple | `evento-publisher.js:24-32`; prueba "5 campos" |
| 10 | Consumidor: `[Consumidor] Evento recibido:`, `ack`, reconexión cada 5 s | Cumple | `consumidor-eventos/index.js:7`, `:57-61`; robustez 2 |
| 11 | Consumidor: `PORT \|\| 3002`, `/health` y `/eventos` (20) | Cumple | `index.js:6`, `:8`, `:73-81` |
| 12 | Frontend: `main.ts` con hbs y `PORT \|\| 3001` | Cumple | `main.ts:14-17`, `configurar-app.ts:20` |
| 13 | Controlador con `SOAP_WSDL_URL`, normaliza `productos` a arreglo | Cumple | `app.controller.ts:32-33`, `:63-70` |
| 14 | Mensaje de error (no 500) si el SOA está caído | Cumple | Robustez 5; e2e "SOA está caído" |
| 15 | Tests por defecto de NestJS corregidos; `npm run build` y `npm test` pasan | Cumple | Sección 3 |
| 16 | `verificar-flujo.js`: 3 productos + evento nuevo, URLs por entorno, tolera Render | Cumple | `verificar-flujo.js:8-13`, `:53-65`; PASS local y nube |
| 17 | Conventional Commits; commit `feat: Reto 1 - servicio SOA + ESB + RabbitMQ + frontend MVC (Node/NestJS)` | Cumple | `35e7d22` |
| 18 | Repositorio público sin `node_modules` ni secretos | Cumple | P6-07 |
| 19 | `render.yaml`: 3 Web Services, `rootDir`, `healthCheckPath` en SOA y consumidor | Cumple (y en el frontend) | `render.yaml:4-52` |
| 20 | Variables: `AMQP_URL` (`sync: false`) en SOA y consumidor, `PUBLIC_URL`, `SOAP_WSDL_URL` | Cumple | `render.yaml:17-22`, `:36-37`, `:51-52` |
| 21 | Servicios en Render y RabbitMQ en CloudAMQP con links funcionando | Cumple | E2E en la nube PASS; consumidor `rabbitmq: "conectado"` |
| 22 | README: Mermaid, puertos, variables, cómo correr, links, dos "Pregúntate" | Cumple | `README.md` |
| 23 | `DECLARACION_IA.md` con Herramienta, Nivel de uso, Qué se le pidió, Qué se modificó/verificó manualmente | Cumple; **último campo pendiente del autor** | `DECLARACION_IA.md` (fila final en blanco a propósito) |
| 24 | `AUDITORIA_PRACTICA_6.md` | Cumple | Este informe (copia idéntica en el repositorio) |

## 8. Qué funciona (comprobado sin problemas)

- **Flujo completo** Frontend → SOAP → SOA → mini-ESB → RabbitMQ → consumidor, en local y en Render (PASS 3/3 en ambos); cada carga del frontend genera exactamente un evento.
- **Precios con 2 decimales**: `$45.90`, `$19.50`, `$129.99` en local y en Render; `formatearPrecio` probado con enteros, decimales y textos no numéricos.
- **Contrato**: el WSDL publicado declara `ObtenerProductos` y un `soap:address` público; una petición SOAP válida devuelve los 3 productos.
- **Resiliencia**: el SOA responde sin broker (456 ms vía frontend); el consumidor se reconecta solo y sigue procesando; el frontend muestra un mensaje accesible si el SOA no responde y se recupera solo; XML no válido → Fault sin caer.
- **Arranque**: el puerto ocupado se informa en una línea y con código 1 en los tres servicios; el consumidor cierra limpio con SIGTERM.
- **Calidad**: lint estricto, build, 20 pruebas automatizadas y E2E con RabbitMQ real en el CI de Node 22; `npm audit` en 0 en el SOA y el consumidor.
- **Seguridad básica**: sin `X-Powered-By`; `nosniff`, `X-Frame-Options` y CSP en el frontend; plantillas Handlebars con escape (`Monitor 24&quot;`); sin secretos en el historial.
- **Despliegue**: el código de Render coincide con `8e328b8` (rutas `/health` nuevas, cabeceras y precios presentes); `npm ci` en el build.

## 9. Pruebas a repetir

| Cuándo | Prueba |
|---|---|
| Antes de la revisión docente | Abrir los 3 links unos minutos antes para despertar Render Free y luego `node verificar-flujo.js` con las 3 URLs de la nube |
| Tras corregir P6-01 | `POST /wsdl` con `<OperacionInexistente/>` en local y en Render: debe devolver `soap:Fault` sin `node_modules` ni rutas |
| Tras corregir P6-02 | Detener `rabbitmq-integracion`, cargar el frontend y comprobar que el log del SOA dice `ECONNREFUSED` |
| En cada push | Que el workflow `CI` siga en verde y que Render despliegue solo después |
| Si se actualiza `hbs` | `npm audit --omit=dev` en `frontend-mvc` |
| Opcional | axe-core / Lighthouse sobre https://frontend-mvc-yku6.onrender.com y navegación con lector de pantalla |

## 10. Conclusiones

La Práctica 6 está **completa y funcionando**, en local y en la nube, y cumple los 24 puntos de la guía. Es la primera de la serie que llega a la auditoría con lint, build, pruebas reales, CI con prueba end-to-end y health checks en todos los servicios, y en la que ninguna entrada provoca la caída de un servicio. Solo queda un hallazgo de severidad Media: la fuga de la pila de node-soap ante una operación SOAP inexistente (P6-01). Tiene una corrección de una línea, ya verificada. No hay hallazgos Críticos ni Altos.

## 11. Correcciones aplicadas tras la auditoría

No se aplicó ninguna corrección de código tras la auditoría, porque no hubo hallazgos Críticos ni Altos. El commit posterior a `8e328b8` solo añade documentación: los links públicos en `README.md` y la copia de este informe como `AUDITORIA_PRACTICA_6.md`. P6-01 y P6-02 quedan como recomendaciones para el autor.
