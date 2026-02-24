import { Injectable, inject } from '@angular/core';
import { FirestoreService, where, orderBy } from '../../../core/services/firestore.service';
import { VentaHistorial } from '../../../core/models/venta-historial.model';

export interface MetricasReporte {
    totalVentas: number;
    totalEfectivo: number;
    totalTarjeta: number;
    numTransacciones: number;
    ticketPromedio: number;
    totalDescuentos: number;
    productosTop: { nombre: string; cantidad: number; total: number }[];
}

export interface VentaDia {
    fecha: string;
    total: number;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
    private fs = inject(FirestoreService);

    /**
     * Obtiene las ventas en un rango de fechas (ISO strings).
     */
    async getVentasPorRango(fechaInicio: Date, fechaFin: Date): Promise<VentaHistorial[]> {
        try {
            return await this.fs.getAll<VentaHistorial>(
                'ventas_historial',
                where('fecha_pago', '>=', fechaInicio.toISOString()),
                where('fecha_pago', '<=', fechaFin.toISOString()),
                orderBy('fecha_pago')
            );
        } catch {
            throw new Error('Error al consultar las ventas del período.');
        }
    }

    /**
     * Calcula métricas agregadas a partir de una lista de ventas.
     */
    calcularMetricas(ventas: VentaHistorial[]): MetricasReporte {
        const totalVentas = ventas.reduce((s, v) => s + v.total_pagado, 0);
        const totalEfectivo = ventas.filter(v => v.metodo_pago === 'efectivo').reduce((s, v) => s + v.total_pagado, 0);
        const totalTarjeta = ventas.filter(v => v.metodo_pago === 'tarjeta').reduce((s, v) => s + v.total_pagado, 0);
        const numTransacciones = ventas.length;
        const ticketPromedio = numTransacciones > 0 ? totalVentas / numTransacciones : 0;
        const totalDescuentos = ventas.reduce((s, v) => s + (v.descuento_aplicado?.monto_descontado || 0), 0);

        // Top productos
        const productoMap = new Map<string, { cantidad: number; total: number }>();
        for (const venta of ventas) {
            for (const item of venta.items_vendidos || []) {
                const key = item.nombre;
                const prev = productoMap.get(key) || { cantidad: 0, total: 0 };
                productoMap.set(key, {
                    cantidad: prev.cantidad + item.cantidad,
                    total: prev.total + item.precio_snapshot * item.cantidad
                });
            }
        }

        const productosTop = Array.from(productoMap.entries())
            .map(([nombre, data]) => ({ nombre, ...data }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 10);

        return { totalVentas, totalEfectivo, totalTarjeta, numTransacciones, ticketPromedio, totalDescuentos, productosTop };
    }

    /**
     * Agrupa ventas por día para la gráfica de línea.
     */
    agruparPorDia(ventas: VentaHistorial[]): VentaDia[] {
        const mapa = new Map<string, number>();
        for (const v of ventas) {
            const dia = v.fecha_pago.substring(0, 10); // YYYY-MM-DD
            mapa.set(dia, (mapa.get(dia) || 0) + v.total_pagado);
        }
        return Array.from(mapa.entries())
            .map(([fecha, total]) => ({ fecha, total }))
            .sort((a, b) => a.fecha.localeCompare(b.fecha));
    }
}
