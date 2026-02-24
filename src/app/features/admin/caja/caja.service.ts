import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable } from 'rxjs';
import { FirestoreService, where } from '../../../core/services/firestore.service';
import { RealtimeService } from '../../../core/services/realtime.service';
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
    private functions = inject(Functions);
    private firestoreService = inject(FirestoreService);
    private realtimeService = inject(RealtimeService);

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
        } catch {
            throw new Error('Error al consultar el turno activo. Verifica tu conexión.');
        }
    }

    /**
     * Abre un nuevo turno de caja via Cloud Function.
     * @returns El ID del turno creado.
     */
    async abrirTurno(fondoInicial: number): Promise<string> {
        try {
            const fn = httpsCallable<{ fondoInicial: number }, { turnoId: string }>(this.functions, 'abrirTurnoCaja');
            const result = await fn({ fondoInicial });
            return result.data.turnoId;
        } catch (error: any) {
            throw new Error(this.mapearError(error, 'No se pudo abrir el turno de caja.'));
        }
    }

    /**
     * Cobra un pedido via Cloud Function.
     * El servidor valida totales, IVA y permisos.
     */
    async cobrarPedido(payload: CobrarPayload): Promise<CobrarResponse> {
        try {
            const fn = httpsCallable<CobrarPayload, CobrarResponse>(this.functions, 'cobrarPedido');
            const result = await fn(payload);
            return result.data;
        } catch (error: any) {
            throw new Error(this.mapearError(error, 'Error al procesar el cobro.'));
        }
    }

    /**
     * Cierra el turno de caja actual via Cloud Function.
     * El servidor calcula el resumen de ventas.
     */
    async cerrarTurno(turnoId: string): Promise<void> {
        try {
            const fn = httpsCallable<{ turnoId: string }, void>(this.functions, 'cerrarTurnoCaja');
            await fn({ turnoId });
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
        if (error?.code === 'functions/not-found') {
            return 'La función solicitada no existe. Contacta al administrador.';
        }
        if (error?.code === 'functions/permission-denied') {
            return 'No tienes permisos para realizar esta operación.';
        }
        if (error?.code === 'functions/invalid-argument') {
            return error.message || 'Los datos enviados no son válidos.';
        }
        if (error?.code === 'functions/failed-precondition') {
            return error.message || 'No se cumplen las condiciones para esta operación.';
        }
        if (error?.code === 'functions/unavailable') {
            return 'Servicio no disponible. Intenta de nuevo en unos momentos.';
        }
        if (error?.message) {
            return error.message;
        }
        return fallback;
    }
}
