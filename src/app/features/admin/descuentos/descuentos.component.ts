import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DescuentosService } from './descuentos.service';
import { Descuento } from '../../../core/models/descuento.model';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Categoria } from '../../../core/models/categoria.model';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

@Component({
    selector: 'app-descuentos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './descuentos.component.html',
    styleUrls: ['./descuentos.component.css']
})
export class DescuentosComponent implements OnInit {
    private descuentosService = inject(DescuentosService);
    private fs = inject(FirestoreService);

    descuentos: Descuento[] = [];
    categorias: Categoria[] = [];
    cargando = true;
    isLoading = false;
    errorGeneral = '';
    dias = DIAS;

    /* ── Modal ── */
    modalAbierto = false;
    editando = false;
    descuentoId = '';
    errores: string[] = [];

    form = this.formVacio();

    async ngOnInit(): Promise<void> {
        await Promise.all([this.cargarDescuentos(), this.cargarCategorias()]);
    }

    async cargarDescuentos(): Promise<void> {
        this.cargando = true;
        try {
            this.descuentos = await this.descuentosService.getDescuentos();
        } catch (e: any) {
            this.errorGeneral = e.message;
        } finally {
            this.cargando = false;
        }
    }

    async cargarCategorias(): Promise<void> {
        try {
            this.categorias = await this.fs.getAll<Categoria>('categorias');
        } catch { /* silencioso */ }
    }

    /* ══════════════════════════════════
       CREAR / EDITAR
       ══════════════════════════════════ */

    abrirCrear(): void {
        this.form = this.formVacio();
        this.editando = false;
        this.descuentoId = '';
        this.errores = [];
        this.modalAbierto = true;
    }

    abrirEditar(d: Descuento): void {
        this.editando = true;
        this.descuentoId = d.id;
        this.errores = [];
        this.form = {
            nombre: d.nombre,
            tipo: d.tipo,
            valor: d.valor,
            codigo_cupon: d.codigo_cupon || '',
            fecha_inicio: d.fecha_inicio,
            fecha_fin: d.fecha_fin,
            usos_maximos: d.usos_maximos ?? null,
            activo: d.activo,
            condiciones: {
                dias_semana: [...(d.condiciones?.dias_semana || [])],
                hora_inicio: d.condiciones?.hora_inicio || '',
                hora_fin: d.condiciones?.hora_fin || '',
                categoria_id: d.condiciones?.categoria_id || '',
                monto_minimo_pedido: d.condiciones?.monto_minimo_pedido || 0
            }
        };
        this.modalAbierto = true;
    }

    private formVacio() {
        return {
            nombre: '',
            tipo: 'porcentaje' as 'porcentaje' | 'monto_fijo',
            valor: 0,
            codigo_cupon: '',
            fecha_inicio: '',
            fecha_fin: '',
            usos_maximos: null as number | null,
            activo: true,
            condiciones: {
                dias_semana: [] as number[],
                hora_inicio: '',
                hora_fin: '',
                categoria_id: '',
                monto_minimo_pedido: 0
            }
        };
    }

    toggleDia(index: number): void {
        const i = this.form.condiciones.dias_semana.indexOf(index);
        if (i >= 0) this.form.condiciones.dias_semana.splice(i, 1);
        else this.form.condiciones.dias_semana.push(index);
    }

    diaSeleccionado(index: number): boolean {
        return this.form.condiciones.dias_semana.includes(index);
    }

    private validar(): string[] {
        const e: string[] = [];
        if (!this.form.nombre.trim()) e.push('El nombre es requerido.');
        if (this.form.valor <= 0) e.push('El valor debe ser mayor a 0.');
        if (this.form.tipo === 'porcentaje' && (this.form.valor < 1 || this.form.valor > 100)) {
            e.push('El porcentaje debe estar entre 1 y 100.');
        }
        if (!this.form.fecha_inicio) e.push('La fecha de inicio es requerida.');
        if (!this.form.fecha_fin) e.push('La fecha de fin es requerida.');
        if (this.form.fecha_inicio && this.form.fecha_fin && this.form.fecha_fin <= this.form.fecha_inicio) {
            e.push('La fecha de fin debe ser posterior a la de inicio.');
        }
        if (this.form.condiciones.hora_inicio && this.form.condiciones.hora_fin &&
            this.form.condiciones.hora_fin <= this.form.condiciones.hora_inicio) {
            e.push('La hora de fin debe ser posterior a la de inicio.');
        }
        return e;
    }

    async confirmar(): Promise<void> {
        this.errores = this.validar();
        if (this.errores.length) return;

        this.isLoading = true;
        const payload: any = {
            nombre: this.form.nombre.trim(),
            tipo: this.form.tipo,
            valor: this.form.valor,
            codigo_cupon: this.form.codigo_cupon.trim() || null,
            fecha_inicio: this.form.fecha_inicio,
            fecha_fin: this.form.fecha_fin,
            usos_maximos: this.form.usos_maximos,
            activo: this.form.activo,
            condiciones: {
                dias_semana: this.form.condiciones.dias_semana,
                hora_inicio: this.form.condiciones.hora_inicio || null,
                hora_fin: this.form.condiciones.hora_fin || null,
                categoria_id: this.form.condiciones.categoria_id || null,
                producto_id: null,
                monto_minimo_pedido: this.form.condiciones.monto_minimo_pedido || 0,
                roles_aplicables: []
            }
        };

        try {
            if (this.editando) {
                await this.descuentosService.actualizarDescuento(this.descuentoId, payload);
            } else {
                await this.descuentosService.crearDescuento(payload);
            }
            this.modalAbierto = false;
            await this.cargarDescuentos();
        } catch (e: any) {
            this.errores = [e.message];
        } finally {
            this.isLoading = false;
        }
    }

    cerrarModal(): void { this.modalAbierto = false; }

    /* ══════════════════════════════════
       TOGGLE / DELETE
       ══════════════════════════════════ */

    async toggleActivo(d: Descuento): Promise<void> {
        try {
            await this.descuentosService.toggleActivo(d.id, !d.activo);
            d.activo = !d.activo;
        } catch (e: any) {
            this.errorGeneral = e.message;
        }
    }

    async eliminar(d: Descuento): Promise<void> {
        if (d.usos_actuales > 0) {
            this.errorGeneral = 'No se puede eliminar: este descuento ya ha sido utilizado.';
            setTimeout(() => this.errorGeneral = '', 4000);
            return;
        }
        this.isLoading = true;
        try {
            await this.descuentosService.eliminarDescuento(d.id, d.usos_actuales);
            await this.cargarDescuentos();
        } catch (e: any) {
            this.errorGeneral = e.message;
        } finally {
            this.isLoading = false;
        }
    }

    /* ══════════════════════════════════
       HELPERS
       ══════════════════════════════════ */

    formatValor(d: Descuento): string {
        return d.tipo === 'porcentaje' ? `${d.valor}%` : `$${d.valor.toFixed(2)}`;
    }

    formatFecha(fecha: string): string {
        if (!fecha) return '—';
        return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    categoriaNombre(id: string | null): string {
        if (!id) return 'Todas';
        return this.categorias.find(c => c.id === id)?.nombre || id;
    }
}
