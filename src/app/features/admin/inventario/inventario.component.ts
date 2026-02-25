import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { InventarioService, InventarioConProducto } from './inventario.service';
import { Insumo } from '../../../core/models/inventario.model';

@Component({
    selector: 'app-inventario',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './inventario.component.html',
    styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {
    private inventarioService = inject(InventarioService);

    inventario: InventarioConProducto[] = [];
    cargando = true;
    isLoading = false;
    errorGeneral = '';

    /* ── Modal ── */
    modalAbierto = false;
    invEditando: InventarioConProducto | null = null;
    insumoIndex = -1;
    formInsumo: Insumo = { nombre: '', unidad: '', stock_actual: 0, stock_minimo: 0 };

    async ngOnInit(): Promise<void> {
        await this.cargarInventario();
    }

    async cargarInventario(): Promise<void> {
        this.cargando = true;
        try {
            this.inventario = await this.inventarioService.getInventario();
        } catch (e: any) {
            this.errorGeneral = e.message || 'Error al cargar inventario.';
        } finally {
            this.cargando = false;
        }
    }

    get alertasActivas(): InventarioConProducto[] {
        return this.inventario.filter(inv => inv.alerta_activa);
    }

    get inventarioSinAlerta(): InventarioConProducto[] {
        return this.inventario.filter(inv => !inv.alerta_activa);
    }

    todosInsumosOk(inv: InventarioConProducto): boolean {
        return inv.insumos.every(ins => ins.stock_actual >= ins.stock_minimo);
    }

    insumosBajos(inv: InventarioConProducto): Insumo[] {
        return inv.insumos.filter(ins => ins.stock_actual < ins.stock_minimo);
    }

    /* ══════════════════════════════════
       EDITAR INSUMO
       ══════════════════════════════════ */

    editarInsumo(inv: InventarioConProducto, index: number): void {
        this.invEditando = inv;
        this.insumoIndex = index;
        this.formInsumo = { ...inv.insumos[index] };
        this.errorGeneral = '';
        this.modalAbierto = true;
    }

    get stockSuficiente(): boolean {
        return this.formInsumo.stock_actual >= this.formInsumo.stock_minimo;
    }

    async guardarStock(): Promise<void> {
        if (!this.invEditando) return;
        this.isLoading = true;

        const insumosActualizados = [...this.invEditando.insumos];
        insumosActualizados[this.insumoIndex] = { ...this.formInsumo };

        try {
            await this.inventarioService.actualizarStock(this.invEditando.id, insumosActualizados);
            this.cerrarModal();
            await this.cargarInventario();
        } catch (e: any) {
            this.errorGeneral = e.message || 'Error al actualizar stock.';
        } finally {
            this.isLoading = false;
        }
    }

    cerrarModal(): void {
        this.modalAbierto = false;
        this.invEditando = null;
        this.insumoIndex = -1;
    }

    /* ══════════════════════════════════
       REACTIVAR PRODUCTO
       ══════════════════════════════════ */

    async reactivarProducto(inv: InventarioConProducto): Promise<void> {
        if (!this.todosInsumosOk(inv)) {
            this.errorGeneral = 'No se puede reactivar: algunos insumos siguen bajo el mínimo.';
            return;
        }
        this.isLoading = true;
        this.errorGeneral = '';
        try {
            await this.inventarioService.reactivarProducto(inv.producto_id, inv.id);
            await this.cargarInventario();
        } catch (e: any) {
            this.errorGeneral = e.message || 'Error al reactivar producto.';
        } finally {
            this.isLoading = false;
        }
    }

    /* ══════════════════════════════════
       HELPERS
       ══════════════════════════════════ */

    formatFecha(fecha: string): string {
        if (!fecha) return '—';
        return new Date(fecha).toLocaleString('es-MX', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    }
}
