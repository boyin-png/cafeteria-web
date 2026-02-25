import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreService, where } from '../../../core/services/firestore.service';
import { RealtimeService } from '../../../core/services/realtime.service';
import { AuthService } from '../../../core/services/auth.service';
import { Pedido } from '../../../core/models/pedido.model';
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
            where('estado', '==', 'entregado')
        );
    }

    /**
     * Busca el turno de caja abierto para un cajero específico.
     * @returns El turno activo o null si no tiene uno abierto.
     */
    async getTurnoActivo(cajeroId: string): Promise<TurnoCaja | null> {
        try {
            const turnos = await this.firestoreService.getAll<TurnoCaja>(
                'turnos_caja',
                where('cajero_id', '==', cajeroId),
                where('estado', '==', 'abierto')
            );
            return turnos.length > 0 ? turnos[0] : null;
        } catch (error) {
            console.error('[CajaService] Error en getTurnoActivo:', error);
            throw new Error('Error al consultar el turno activo. Verifica tu conexión e indexación.');
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
            await this.firestoreService.update('pedidos', payload.pedidoId, {
                estado: 'pagado'
            });
            const ventaId = await this.firestoreService.add('ventas_historial', {
                pedidoId: payload.pedidoId,
                metodoPago: payload.metodoPago,
                datosCliente: payload.datosCliente,
                total: 0 // Mock total
            });
            return { ventaId, totalPagado: 0 };
        } catch (error: any) {
            throw new Error(this.mapearError(error, 'Error al procesar el cobro.'));
        }
    }

    /**
     * Cierra el turno de caja actual via Cloud Function (Mocked).
     * El servidor calcula el resumen de ventas.
     */
    async cerrarTurno(turnoId: string): Promise<void> {
        try {
            await this.firestoreService.update('turnos_caja', turnoId, {
                estado: 'cerrado',
                fecha_cierre: new Date().toISOString()
            });
        } catch (error: any) {
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
