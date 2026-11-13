import { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { join } from 'node:path';

// Configuración común de la app (la usan main.ts y las pruebas e2e).
export function configurarApp(app: NestExpressApplication, raiz: string) {
  app.disable('x-powered-by');
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    );
    next();
  });
  app.useStaticAssets(join(raiz, 'public'));
  app.setBaseViewsDir(join(raiz, 'views'));
  app.setViewEngine('hbs');
}
