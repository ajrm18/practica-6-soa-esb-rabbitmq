import { Controller, Get, Logger, Render } from '@nestjs/common';
import { createClientAsync } from 'soap';

export interface Producto {
  id?: string | number;
  nombre: string;
  precio: string | number;
}

export interface ProductoVista extends Producto {
  // Precio listo para mostrar, siempre con 2 decimales (45.9 -> "45.90").
  precioTexto: string;
}

export interface VistaProductos {
  productos: ProductoVista[];
  error?: string;
}

// Tiempo máximo de espera al SOA (holgado por el arranque en frío de Render Free).
const SOAP_TIMEOUT_MS = 60000;

export function formatearPrecio(precio: unknown): string {
  const valor = Number(precio);
  if (Number.isFinite(valor)) return valor.toFixed(2);
  return typeof precio === 'string' ? precio : '';
}

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  private readonly wsdlUrl =
    process.env.SOAP_WSDL_URL || 'http://localhost:3000/wsdl?wsdl';

  @Get()
  @Render('index')
  async index(): Promise<VistaProductos> {
    try {
      const client = await createClientAsync(this.wsdlUrl, {
        wsdl_options: { timeout: SOAP_TIMEOUT_MS },
      });
      const [result] = await client.ObtenerProductosAsync(
        {},
        { timeout: SOAP_TIMEOUT_MS },
      );
      return { productos: this.normalizar(result?.productos) };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.error(`No se pudo consultar el servicio SOA: ${mensaje}`);
      return {
        productos: [],
        error:
          'No se pudo conectar con el servicio SOA de productos. Inténtalo de nuevo en unos segundos.',
      };
    }
  }

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  // node-soap devuelve un objeto (no un arreglo) cuando hay un solo elemento.
  private normalizar(productos: unknown): ProductoVista[] {
    if (productos === undefined || productos === null) return [];
    const lista = (
      Array.isArray(productos) ? productos : [productos]
    ) as Producto[];
    return lista.map((p) => ({ ...p, precioTexto: formatearPrecio(p.precio) }));
  }
}
