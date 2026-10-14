import { Test, TestingModule } from '@nestjs/testing';
import { createClientAsync } from 'soap';
import { AppController } from './app.controller.js';

vi.mock('soap', () => ({ createClientAsync: vi.fn() }));

const crearClienteMock = vi.mocked(createClientAsync);

function clienteQueDevuelve(result: unknown) {
  const cliente = {
    ObtenerProductosAsync: vi.fn().mockResolvedValue([result]),
  };
  crearClienteMock.mockResolvedValue(cliente as never);
  return cliente;
}

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    crearClienteMock.mockReset();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('devuelve los productos del servicio SOA', async () => {
    const productos = [
      { id: '1', nombre: 'Teclado mecánico', precio: '45.9' },
      { id: '2', nombre: 'Mouse inalámbrico', precio: '19.5' },
      { id: '3', nombre: 'Monitor 24"', precio: '129.99' },
    ];
    const cliente = clienteQueDevuelve({ productos });

    await expect(appController.index()).resolves.toEqual({ productos });
    expect(crearClienteMock).toHaveBeenCalledWith(
      'http://localhost:3000/wsdl?wsdl',
      expect.any(Object),
    );
    expect(cliente.ObtenerProductosAsync).toHaveBeenCalledTimes(1);
  });

  it('envuelve en un arreglo un único producto', async () => {
    const producto = { id: '1', nombre: 'Teclado mecánico', precio: '45.9' };
    clienteQueDevuelve({ productos: producto });

    await expect(appController.index()).resolves.toEqual({
      productos: [producto],
    });
  });

  it('devuelve una lista vacía si la respuesta no trae productos', async () => {
    clienteQueDevuelve(null);

    await expect(appController.index()).resolves.toEqual({ productos: [] });
  });

  it('devuelve un mensaje de error (sin lanzar) si el SOA no responde', async () => {
    crearClienteMock.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const vista = await appController.index();
    expect(vista.productos).toEqual([]);
    expect(vista.error).toMatch(/servicio SOA/);
  });
});
