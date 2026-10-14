import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import request from 'supertest';
import { createClientAsync } from 'soap';
import { AppModule } from './../src/app.module.js';

vi.mock('soap', () => ({ createClientAsync: vi.fn() }));

const crearClienteMock = vi.mocked(createClientAsync);

describe('Frontend MVC (e2e)', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    crearClienteMock.mockReset();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.useStaticAssets(join(process.cwd(), 'public'));
    app.setBaseViewsDir(join(process.cwd(), 'views'));
    app.setViewEngine('hbs');
    await app.init();
  });

  it('GET / renderiza los productos del SOA', async () => {
    crearClienteMock.mockResolvedValue({
      ObtenerProductosAsync: vi.fn().mockResolvedValue([
        {
          productos: [
            { nombre: 'Teclado mecánico', precio: '45.9' },
            { nombre: 'Mouse inalámbrico', precio: '19.5' },
            { nombre: 'Monitor 24"', precio: '129.99' },
          ],
        },
      ]),
    } as never);

    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.text).toContain('Teclado mecánico');
    expect(res.text).toContain('Mouse inalámbrico');
    expect(res.text).toContain('Monitor 24&quot;');
    expect(res.text).toContain('$129.99');
  });

  it('GET / responde 200 con mensaje de error si el SOA está caído', async () => {
    crearClienteMock.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.text).toContain('No se pudo conectar con el servicio SOA');
  });

  it('GET /styles.css sirve los estáticos de public/', () => {
    return request(app.getHttpServer()).get('/styles.css').expect(200);
  });

  afterEach(async () => {
    await app.close();
  });
});
