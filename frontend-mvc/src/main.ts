import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppModule } from './app.module.js';

// Proyecto ESM: __dirname no existe, se obtiene desde import.meta.url.
// Tanto en src/ (nest start) como en dist/ (node dist/main.js), '..' es la raíz del proyecto.
const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Frontend MVC en http://localhost:${port}`);
}
await bootstrap();
