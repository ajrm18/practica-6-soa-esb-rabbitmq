import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createClientAsync } from 'soap';
import { AppModule } from './../src/app.module.js';
import { configurarApp } from './../src/configurar-app.js';

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
    configurarApp(app, process.cwd());
    await app.init();
  });

  it('GET / renderiza los productos del SOA con 2 decimales', async () => {
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
    expect(res.text).toContain('$45.90');
    expect(res.text).toContain('$19.50');
    expect(res.text).toContain('$129.99');
  });

  it('GET / responde 200 con mensaje de error si el SOA está caído', async () => {
    crearClienteMock.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.text).toContain('No se pudo conectar con el servicio SOA');
    expect(res.text).not.toContain('ECONNREFUSED');
  });

  it('GET /health responde ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('envía cabeceras de seguridad y oculta X-Powered-By', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('GET /styles.css sirve los estáticos de public/', () => {
    return request(app.getHttpServer()).get('/styles.css').expect(200);
  });

  afterEach(async () => {
    await app.close();
  });
});
