import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { CajaService } from './caja.service';
import { AuthService } from '../../../core/services/auth.service';
import { Pedido } from '../../../core/models/pedido.model';
import { TurnoCaja } from '../../../core/models/turno-caja.model';
import { VentaHistorial } from '../../../core/models/venta-historial.model';
import { MetodoPago, DetallesCliente } from '../../../core/models/venta-historial.model';

@Component({
    selector: 'app-caja',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './caja.component.html',
    styleUrls: ['./caja.component.css']
})
export class CajaComponent implements OnInit {
    private cajaService = inject(CajaService);
    private authService = inject(AuthService);

    /* ── Estado principal ── */
    turnoActivo: TurnoCaja | null = null;
    cargandoTurno = true;
    pedidosParaCobrar$: Observable<Pedido[]> = of([]);

    /* ── Abrir turno ── */
    fondoInicial = 0;
    abriendoTurno = false;
    errorTurno = '';

    /* ── Modal cobro ── */
    modalCobro = false;
    pedidoSeleccionado: Pedido | null = null;
    metodoPago: MetodoPago = 'efectivo';
    montoRecibido = 0;
    requiereFactura = false;
    datosCliente: DetallesCliente = { nombre: '', email: null, datos_fiscales: null };
    procesandoCobro = false;
    errorCobro = '';

    /* ── Toast ── */
    toastVisible = false;
    toastMensaje = '';

    /* ── Modal cierre ── */
    modalCierre = false;
    historialTurno: VentaHistorial[] = [];
    resumenCierre = { totalEfectivo: 0, totalTarjeta: 0, totalVentas: 0, numTransacciones: 0 };
    efectivoEnCaja = 0;
    cargandoCierre = false;
    cerrandoTurno = false;
    errorCierre = '';

    async ngOnInit(): Promise<void> {
        await this.verificarTurno();
    }

    /* ══════════════════════════════════
       TURNO
       ══════════════════════════════════ */

    private async verificarTurno(): Promise<void> {
        this.cargandoTurno = true;
        const usuario = this.authService.currentUser();
        if (!usuario) { this.cargandoTurno = false; return; }

        try {
            this.turnoActivo = await this.cajaService.getTurnoActivo(usuario.id);
            if (this.turnoActivo) {
                this.pedidosParaCobrar$ = this.cajaService.getPedidosParaCobrar();
            }
        } catch (e: any) {
            this.errorTurno = e.message;
        } finally {
            this.cargandoTurno = false;
        }
    }

    async abrirTurno(): Promise<void> {
        if (this.fondoInicial < 0) { this.errorTurno = 'El fondo inicial no puede ser negativo.'; return; }
        this.abriendoTurno = true;
        this.errorTurno = '';
        try {
            await this.cajaService.abrirTurno(this.fondoInicial);
            await this.verificarTurno();
        } catch (e: any) {
            this.errorTurno = e.message;
        } finally {
            this.abriendoTurno = false;
        }
    }

    /* ══════════════════════════════════
       COBRO
       ══════════════════════════════════ */

    abrirModalCobro(pedido: Pedido): void {
        this.pedidoSeleccionado = pedido;
        this.metodoPago = 'efectivo';
        this.montoRecibido = pedido.total;
        this.requiereFactura = false;
        this.datosCliente = { nombre: '', email: null, datos_fiscales: null };
        this.errorCobro = '';
        this.modalCobro = true;
    }

    get cambio(): number {
        if (!this.pedidoSeleccionado || this.metodoPago !== 'efectivo') return 0;
        return Math.max(0, this.montoRecibido - this.pedidoSeleccionado.total);
    }

    get montoInsuficiente(): boolean {
        if (!this.pedidoSeleccionado || this.metodoPago !== 'efectivo') return false;
        return this.montoRecibido < this.pedidoSeleccionado.total;
    }

    async confirmarCobro(): Promise<void> {
        if (!this.pedidoSeleccionado) return;
        if (this.metodoPago === 'efectivo' && this.montoInsuficiente) {
            this.errorCobro = 'El monto recibido es menor al total.';
            return;
        }

        this.procesandoCobro = true;
        this.errorCobro = '';

        const datosCliente: DetallesCliente = this.requiereFactura
            ? this.datosCliente
            : { nombre: '', email: null, datos_fiscales: null };

        try {
            const resultado = await this.cajaService.cobrarPedido({
                pedidoId: this.pedidoSeleccionado.id,
                metodoPago: this.metodoPago,
                datosCliente
            });
            this.cerrarModalCobro();
            this.mostrarToast(`Venta registrada: $${resultado.totalPagado.toFixed(2)}`);
        } catch (e: any) {
            this.errorCobro = e.message;
        } finally {
            this.procesandoCobro = false;
        }
    }

    cerrarModalCobro(): void {
        this.modalCobro = false;
        this.pedidoSeleccionado = null;
        this.errorCobro = '';
    }

    /* ══════════════════════════════════
       CIERRE DE TURNO
       ══════════════════════════════════ */

    async abrirModalCierre(): Promise<void> {
        if (!this.turnoActivo) return;
        this.cargandoCierre = true;
        this.errorCierre = '';
        this.modalCierre = true;

        try {
            this.historialTurno = await this.cajaService.getHistorialTurno(this.turnoActivo.id);
            this.resumenCierre = {
                totalEfectivo: this.historialTurno.filter(v => v.metodo_pago === 'efectivo').reduce((s, v) => s + v.total_pagado, 0),
                totalTarjeta: this.historialTurno.filter(v => v.metodo_pago === 'tarjeta').reduce((s, v) => s + v.total_pagado, 0),
                totalVentas: this.historialTurno.reduce((s, v) => s + v.total_pagado, 0),
                numTransacciones: this.historialTurno.length
            };
            this.efectivoEnCaja = (this.turnoActivo.fondo_inicial || 0) + this.resumenCierre.totalEfectivo;
        } catch (e: any) {
            this.errorCierre = e.message;
        } finally {
            this.cargandoCierre = false;
        }
    }

    get diferenciaCaja(): number {
        const esperado = (this.turnoActivo?.fondo_inicial || 0) + this.resumenCierre.totalEfectivo;
        return this.efectivoEnCaja - esperado;
    }

    async confirmarCierre(): Promise<void> {
        if (!this.turnoActivo) return;
        this.cerrandoTurno = true;
        this.errorCierre = '';
        try {
            await this.cajaService.cerrarTurno(this.turnoActivo.id);
            this.modalCierre = false;
            this.turnoActivo = null;
            this.mostrarToast('Turno cerrado exitosamente.');
        } catch (e: any) {
            this.errorCierre = e.message;
        } finally {
            this.cerrandoTurno = false;
        }
    }

    cerrarModalCierre(): void {
        this.modalCierre = false;
        this.errorCierre = '';
    }

    /* ══════════════════════════════════
       TOAST
       ══════════════════════════════════ */

    private mostrarToast(mensaje: string): void {
        this.toastMensaje = mensaje;
        this.toastVisible = true;
        setTimeout(() => { this.toastVisible = false; }, 3500);
    }

    /* ══════════════════════════════════
       HELPERS
       ══════════════════════════════════ */

    formatHora(fecha: string): string {
        return new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }

    formatFecha(fecha: string): string {
        return new Date(fecha).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
}
