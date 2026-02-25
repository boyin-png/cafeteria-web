import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreService, where } from '../../../core/services/firestore.service';
import { RealtimeService } from '../../../core/services/realtime.service';
import { AuthService } from '../../../core/services/auth.service';
import { Pedido, ItemPedido } from '../../../core/models/pedido.model';
import { TurnoCaja } from '../../../core/models/turno-caja.model';
import { VentaHistorial } from '../../../core/models/venta-historial.model';
import { MetodoPago, DetallesCliente } from '../../../core/models/venta-historial.model';

interface CobrarPayload {
    pedidoId: string;
    metodoPago: MetodoPago;
    datosCliente: DetallesCliente;
}

interface CobrarResponse {
    ventaId: string;
    totalPagado: number;
}

@Injectable({ providedIn: 'root' })
export class CajaService {
    private firestoreService = inject(FirestoreService);
    private realtimeService = inject(RealtimeService);
    private authService = inject(AuthService);

    /**
     * Escucha en tiempo real los pedidos con estado 'entregado' listos para cobrar.
     */
    getPedidosParaCobrar(): Observable<Pedido[]> {
        return this.realtimeService.listenCollection<Pedido>(
            'pedidos',
            where('estado', 'in', ['pendiente', 'en_preparacion', 'listo', 'entregado'])
        );
    }

    /**
     * Busca el turno de caja abierto para un cajero específico.
     * @returns El turno activo o null si no tiene uno abierto.
     */
    async getTurnoActivo(cajeroId: string): Promise<TurnoCaja | null> {
        try {
            // Solo un where() para evitar requerir indice compuesto
            const turnos = await this.firestoreService.getAll<TurnoCaja>(
                'turnos_caja',
                where('cajero_id', '==', cajeroId)
            );
            // Filtrar en memoria el que este abierto
            const abierto = turnos.find(t => t.estado === 'abierto');
            return abierto ?? null;
        } catch (error: any) {
            console.error('[CajaService] getTurnoActivo error:', error);
            // Mostrar el error real para diagnostico
            throw new Error(`Error al consultar turno: ${error?.message ?? error}`);
        }
    }

    /**
     * Abre un nuevo turno de caja via Cloud Function (Mocked).
     * @returns El ID del turno creado.
     */
    async abrirTurno(fondoInicial: number): Promise<string> {
        try {
            const user = this.authService.currentUser();
            if (!user) throw new Error("No hay usuario autenticado.");
            return await this.firestoreService.add('turnos_caja', {
                cajero_id: user.id,
                fondo_inicial: fondoInicial,
                estado: 'abierto',
                fecha_apertura: new Date().toISOString()
            } as any);
        } catch (error: any) {
            console.error('[CajaService] Error en abrirTurno:', error);
            throw new Error(this.mapearError(error, 'No se pudo abrir el turno de caja.'));
        }
    }

    /**
     * Cobra un pedido via Cloud Function (Mocked).
     * El servidor valida totales, IVA y permisos.
     */
    async cobrarPedido(payload: CobrarPayload): Promise<CobrarResponse> {
        try {
            const user = this.authService.currentUser();
            if (!user) throw new Error('No hay usuario autenticado.');

            // 1. Leer el pedido para obtener el total real y mesa
            const pedido = await this.firestoreService.getById<Pedido>(
                'pedidos', payload.pedidoId
            );
            if (!pedido) throw new Error('Pedido no encontrado.');

            // 2. Obtener el turno activo del cajero
            const turno = await this.getTurnoActivo(user.id);
            if (!turno) throw new Error('No hay turno de caja abierto.');

            const totalPagado = pedido.total ?? 0;
            const ahora = new Date().toISOString();

            // 3. Registrar en ventas_historial con todos los campos correctos
            const ventaId = await this.firestoreService.add('ventas_historial', {
                pedido_id: payload.pedidoId,
                turno_id: turno.id,
                cajero_id: user.id,
                mesa_id: pedido.mesa_id,
                metodo_pago: payload.metodoPago,
                total_pagado: totalPagado,
                subtotal: pedido.subtotal ?? totalPagado,
                impuestos: pedido.impuestos ?? 0,
                descuento: pedido.descuento ?? 0,
                detalles_cliente: payload.datosCliente,
                requiere_factura: !!payload.datosCliente?.datos_fiscales,
                items_vendidos: pedido.items ?? [],
                fecha_pago: ahora,
            } as any);

            // 4. Marcar pedido como pagado
            await this.firestoreService.update('pedidos', payload.pedidoId, {
                estado: 'pagado',
                fecha_pago: ahora,
            });

            // 5. Actualizar resumen_ventas del turno
            const resumenActual = turno.resumen_ventas ?? {
                num_transacciones: 0,
                total_efectivo: 0,
                total_tarjeta: 0,
                total_transferencia: 0,
                total_ventas: 0,
            };

            await this.firestoreService.update('turnos_caja', turno.id, {
                resumen_ventas: {
                    num_transacciones: resumenActual.num_transacciones + 1,
                    total_efectivo:
                        resumenActual.total_efectivo +
                        (payload.metodoPago === 'efectivo' ? totalPagado : 0),
                    total_tarjeta:
                        resumenActual.total_tarjeta +
                        (payload.metodoPago === 'tarjeta' ? totalPagado : 0),
                    total_transferencia:
                        resumenActual.total_transferencia +
                        (payload.metodoPago === 'transferencia' ? totalPagado : 0),
                    total_ventas: resumenActual.total_ventas + totalPagado,
                }
            });

            return { ventaId, totalPagado };

        } catch (error: any) {
            console.error('[CajaService] cobrarPedido error:', error);
            throw new Error(this.mapearError(error, 'Error al procesar el cobro.'));
        }
    }

    /**
     * Cobra una "Venta Directa" libre iniciada desde la caja, sin mesa, utilizando un Carrito TPV.
     */
    async cobrarVentaRapida(monto: number, metodoPago: MetodoPago, datosCliente: DetallesCliente, itemsCarrito: ItemPedido[]): Promise<CobrarResponse> {
        try {
            const user = this.authService.currentUser();
            if (!user) throw new Error('No hay usuario autenticado.');

            const turno = await this.getTurnoActivo(user.id);
            if (!turno) throw new Error('No hay turno de caja abierto.');

            const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
            const ahoraFormatter = new Date().toLocaleDateString('es-MX', options);
            const ahoraEspanol = ahoraFormatter.replace(',', ' a ').toLowerCase();
            const totalPagado = monto;

            const ventaId = await this.firestoreService.add('ventas_historial', {
                pedido_id: 'VENTA_DIRECTA',
                turno_id: turno.id,
                cajero_id: user.id,
                mesa_id: 'Caja',
                metodo_pago: metodoPago,
                total_pagado: totalPagado,
                subtotal: totalPagado,
                impuestos: 0,
                descuento: 0,
                descuento_aplicado: null,
                detalles_cliente: datosCliente,
                requiere_factura: !!datosCliente?.datos_fiscales,
                items_vendidos: itemsCarrito,
                fecha_pago: ahoraEspanol,
                fecha_iso: new Date().toISOString() // guardamos también el ISO para que las gráficas no se rompan por el formato de texto
            } as any);

            // Actualizar resumen de caja
            const resumenActual = turno.resumen_ventas ?? {
                num_transacciones: 0, total_efectivo: 0, total_tarjeta: 0, total_transferencia: 0, total_ventas: 0,
            };

            await this.firestoreService.update('turnos_caja', turno.id, {
                resumen_ventas: {
                    num_transacciones: resumenActual.num_transacciones + 1,
                    total_efectivo: resumenActual.total_efectivo + (metodoPago === 'efectivo' ? totalPagado : 0),
                    total_tarjeta: resumenActual.total_tarjeta + (metodoPago === 'tarjeta' ? totalPagado : 0),
                    total_transferencia: resumenActual.total_transferencia + (metodoPago === 'transferencia' ? totalPagado : 0),
                    total_ventas: resumenActual.total_ventas + totalPagado,
                }
            });

            return { ventaId, totalPagado };
        } catch (error: any) {
            console.error('[CajaService] cobrarVentaRapida error:', error);
            throw new Error(this.mapearError(error, 'Error al procesar el cobro rápido.'));
        }
    }

    /**
     * Cierra el turno de caja actual via Cloud Function (Mocked).
     * El servidor calcula el resumen de ventas.
     */
    async cerrarTurno(turnoId: string): Promise<void> {
        try {
            const user = this.authService.currentUser();
            await this.firestoreService.update('turnos_caja', turnoId, {
                estado: 'cerrado',
                fecha_cierre: new Date().toISOString(),
                cerrado_por: user?.id ?? '',
            });
        } catch (error: any) {
            console.error('[CajaService] cerrarTurno error:', error);
            throw new Error(this.mapearError(error, 'Error al cerrar el turno de caja.'));
        }
    }

    /**
     * Obtiene el historial de ventas asociadas a un turno.
     */
    async getHistorialTurno(turnoId: string): Promise<VentaHistorial[]> {
        try {
            return await this.firestoreService.getAll<VentaHistorial>(
                'ventas_historial',
                where('turno_id', '==', turnoId)
            );
        } catch {
            throw new Error('Error al consultar el historial de ventas del turno.');
        }
    }

    /**
     * Traduce errores de HttpsError a mensajes en español.
     */
    private mapearError(error: any, fallback: string): string {
        if (error?.message) {
            return error.message;
        }
        return fallback;
    }
}
