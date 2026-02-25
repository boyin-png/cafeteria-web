import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Observable, of } from 'rxjs';
import { CajaService } from './caja.service';
import { AuthService } from '../../../core/services/auth.service';
import { Pedido, ItemPedido, ModificadorAplicado } from '../../../core/models/pedido.model';
import { TurnoCaja } from '../../../core/models/turno-caja.model';
import { VentaHistorial } from '../../../core/models/venta-historial.model';
import { MetodoPago, DetallesCliente } from '../../../core/models/venta-historial.model';
import { MenuService } from '../menu/menu.service';
import { Categoria } from '../../../core/models/categoria.model';
import { Producto } from '../../../core/models/producto.model';
import { ModificadorProducto } from '../../../core/models/modificador.model';

@Component({
    selector: 'app-caja',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './caja.component.html',
    styleUrls: ['./caja.component.css']
})
export class CajaComponent implements OnInit {
    private cajaService = inject(CajaService);
    private authService = inject(AuthService);
    private menuService = inject(MenuService);
    private ngZone = inject(NgZone);
    private cdr = inject(ChangeDetectorRef);

    Math = Math;

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
    montoRecibido: number = 0;
    requiereFactura: boolean = false;
    nombreClienteOpcional: string = '';
    datosCliente: DetallesCliente = {
        nombre: '',
        email: null,
        datos_fiscales: null
    };
    procesandoCobro = false;
    errorCobro = '';

    /* ── Modal Venta Rápida / TPV ── */
    modalVentaRapida = false;
    montoVentaRapida = 0;
    stepVentaRapida: 'PuntoDeVenta' | 'Cobro' = 'PuntoDeVenta';

    // Colecciones del Menú (Para TPv Venta Rapida)
    categorias: Categoria[] = [];
    productos: Producto[] = [];
    todosLosModificadores: ModificadorProducto[] = [];
    categoriaActiva: string | null = null;
    productosVisibles: Producto[] = [];

    // Carrito
    carritoVentaActiva: ItemPedido[] = [];

    /* ── Toast ── */
    toastVisible = false;
    toastMensaje = '';

    /* ── Modal cierre ── */
    modalCierre = false;
    historialTurno: VentaHistorial[] = [];
    resumenCierre = { totalEfectivo: 0, totalTarjeta: 0, totalTransferencia: 0, totalVentas: 0, numTransacciones: 0 };
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
            const turno = await this.cajaService.getTurnoActivo(usuario.id);
            this.ngZone.run(() => {
                this.turnoActivo = turno;
                if (this.turnoActivo) {
                    this.pedidosParaCobrar$ = this.cajaService.getPedidosParaCobrar();
                }
            });
        } catch (e: any) {
            this.ngZone.run(() => { this.errorTurno = e.message; });
        } finally {
            this.ngZone.run(() => { this.cargandoTurno = false; });
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
            this.ngZone.run(() => { this.errorTurno = e.message; });
        } finally {
            this.ngZone.run(() => { this.abriendoTurno = false; });
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
            this.ngZone.run(() => {
                this.cerrarModalCobro();
                this.mostrarToast(`Venta registrada: $${resultado.totalPagado.toFixed(2)}`);
            });
        } catch (e: any) {
            this.ngZone.run(() => { this.errorCobro = e.message; });
        } finally {
            this.ngZone.run(() => { this.procesandoCobro = false; });
        }
    }

    cerrarModalCobro(): void {
        this.modalCobro = false;
        this.pedidoSeleccionado = null;
        this.errorCobro = '';
    }

    /* ══════════════════════════════════
       VENTA RÁPIDA / TPV
       ══════════════════════════════════ */

    async abrirModalVentaRapida(): Promise<void> {
        this.stepVentaRapida = 'PuntoDeVenta';
        this.carritoVentaActiva = [];
        this.montoVentaRapida = 0;
        this.metodoPago = 'efectivo';
        this.montoRecibido = 0;
        this.requiereFactura = false;
        this.nombreClienteOpcional = '';
        this.datosCliente = { nombre: '', email: null, datos_fiscales: null };
        this.errorCobro = '';
        this.modalVentaRapida = true;

        // Cargar Catalogo TPV
        try {
            this.categorias = await this.menuService.getCategorias();
            this.productos = await this.menuService.getProductos();
            if (this.categorias.length > 0) {
                this.filtrarPorCategoria(this.categorias[0].id);
            } else {
                this.productosVisibles = this.productos;
            }
        } catch (e: any) {
            this.errorCobro = 'Error cargando menú: ' + e.message;
        }
    }

    filtrarPorCategoria(catId: string): void {
        this.categoriaActiva = catId;
        this.productosVisibles = this.productos.filter(p => p.categoria_id === catId && p.disponible);
    }

    agregarAlCarrito(prod: Producto): void {
        const existente = this.carritoVentaActiva.find(item => item.producto_id === prod.id && item.modificadores_aplicados.length === 0);
        if (existente) {
            existente.cantidad++;
        } else {
            this.carritoVentaActiva.push({
                producto_id: prod.id,
                nombre: prod.nombre,
                precio_snapshot: prod.precio,
                cantidad: 1,
                especificaciones: '',
                modificadores_aplicados: []
            });
        }
    }

    quitarDelCarrito(index: number): void {
        this.carritoVentaActiva.splice(index, 1);
    }

    sumarCantidad(index: number): void {
        this.carritoVentaActiva[index].cantidad++;
    }

    restarCantidad(index: number): void {
        if (this.carritoVentaActiva[index].cantidad > 1) {
            this.carritoVentaActiva[index].cantidad--;
        } else {
            this.quitarDelCarrito(index);
        }
    }

    get totalCarritoRapida(): number {
        return this.carritoVentaActiva.reduce((sum, item) => sum + (item.precio_snapshot * item.cantidad), 0);
    }

    avanzarACobroRapido(): void {
        if (this.carritoVentaActiva.length === 0) {
            this.errorCobro = 'Agrega al menos un producto al carrito.';
            return;
        }
        this.errorCobro = '';
        this.montoVentaRapida = this.totalCarritoRapida;
        this.stepVentaRapida = 'Cobro';
    }

    regresarAPuntoDeVenta(): void {
        this.stepVentaRapida = 'PuntoDeVenta';
        this.errorCobro = '';
    }

    cerrarModalVentaRapida(): void {
        this.modalVentaRapida = false;
        this.errorCobro = '';
    }

    async confirmarVentaRapida(): Promise<void> {
        if (this.carritoVentaActiva.length === 0) {
            this.errorCobro = 'El carrito está vacío.';
            return;
        }
        if (this.metodoPago === 'efectivo' && this.montoRecibido < this.montoVentaRapida) {
            this.errorCobro = 'El monto recibido es menor al total.';
            return;
        }

        this.procesandoCobro = true;
        this.errorCobro = '';

        const datosCliente: DetallesCliente = this.requiereFactura
            ? this.datosCliente
            : { nombre: this.nombreClienteOpcional.trim() || '', email: null, datos_fiscales: null };

        try {
            const totalCálculo = this.totalCarritoRapida;
            const user = this.authService.currentUser();
            if (!user) throw new Error('No usuario');
            const turno = this.turnoActivo;
            if (!turno) throw new Error('No turno');

            const resultado = await this.cajaService.cobrarVentaRapida(
                totalCálculo,
                this.metodoPago,
                datosCliente,
                this.carritoVentaActiva
            );
            this.ngZone.run(() => {
                this.cerrarModalVentaRapida();
                this.mostrarToast(`Venta registrada: $${resultado.totalPagado.toFixed(2)}`);
                // Forzar detección de cambios para cerrar el modal
                setTimeout(() => {
                    this.modalVentaRapida = false;
                    this.stepVentaRapida = 'PuntoDeVenta';
                    this.cdr.detectChanges(); // <-- FORZAMOS A ANGULAR A DESTRUIR EL HTML DEL MODAL INMEDIATAMENTE
                }, 100);
            });
        } catch (e: any) {
            this.ngZone.run(() => { this.errorCobro = e.message; });
        } finally {
            this.ngZone.run(() => { this.procesandoCobro = false; });
        }
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
            const historial = await this.cajaService.getHistorialTurno(this.turnoActivo.id);
            this.ngZone.run(() => {
                this.historialTurno = historial;
                this.resumenCierre = {
                    totalEfectivo: this.historialTurno.filter(v => v.metodo_pago === 'efectivo').reduce((s, v) => s + v.total_pagado, 0),
                    totalTarjeta: this.historialTurno.filter(v => v.metodo_pago === 'tarjeta').reduce((s, v) => s + v.total_pagado, 0),
                    totalTransferencia: this.historialTurno.filter(v => v.metodo_pago === 'transferencia').reduce((s, v) => s + v.total_pagado, 0),
                    totalVentas: this.historialTurno.reduce((s, v) => s + v.total_pagado, 0),
                    numTransacciones: this.historialTurno.length
                };
                this.efectivoEnCaja = (this.turnoActivo?.fondo_inicial || 0) + this.resumenCierre.totalEfectivo;
            });
        } catch (e: any) {
            this.ngZone.run(() => { this.errorCierre = e.message; });
        } finally {
            this.ngZone.run(() => {
                this.cargandoCierre = false;
                this.cdr.detectChanges(); // Forzar renderizado
            });
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
            this.ngZone.run(() => {
                this.mostrarToast('Turno cerrado exitosamente.');
                setTimeout(() => {
                    this.modalCierre = false;
                    this.turnoActivo = null;
                    this.cdr.detectChanges();
                }, 100);
            });
        } catch (e: any) {
            this.ngZone.run(() => { this.errorCierre = e.message; });
        } finally {
            this.ngZone.run(() => {
                this.cerrandoTurno = false;
                this.cdr.detectChanges();
            });
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
