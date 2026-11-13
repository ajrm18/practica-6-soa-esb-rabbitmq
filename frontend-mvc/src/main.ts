import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppModule } from './app.module.js';
import { configurarApp } from './configurar-app.js';

// Proyecto ESM: __dirname no existe, se obtiene desde import.meta.url.
// Tanto en src/ (nest start) como en dist/ (node dist/main.js), '..' es la raíz del proyecto.
const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configurarApp(app, join(__dirname, '..'));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Frontend MVC en http://localhost:${port}`);
}

try {
  await bootstrap();
} catch (error) {
  const mensaje = error instanceof Error ? error.message : String(error);
  console.error(`No se pudo iniciar el frontend: ${mensaje}`);
  process.exit(1);
}
