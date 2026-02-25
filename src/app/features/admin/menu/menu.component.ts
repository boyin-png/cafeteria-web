import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MenuService } from './menu.service';
import { Categoria } from '../../../core/models/categoria.model';
import { Producto } from '../../../core/models/producto.model';
import { ModificadorProducto, OpcionModificador } from '../../../core/models/modificador.model';

type Tab = 'categorias' | 'productos' | 'modificadores';
type ModalType = 'categoria' | 'producto' | 'modificador' | null;

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
    private menuService = inject(MenuService);

    tabActivo: Tab = 'categorias';

    categorias: Categoria[] = [];
    productos: Producto[] = [];
    modificadores: ModificadorProducto[] = [];

    productoSeleccionado: Producto | null = null;
    filtroCategoria = '';

    /* ── Modal state ── */
    modalAbierto: ModalType = null;
    modoEdicion = false;
    errorModal = '';
    errorGeneral = '';

    /* ── Formularios ── */
    formCategoria = { id: '', nombre: '', orden_visual: 0, icono_url: '', activa: true };
    formProducto = { id: '', nombre: '', descripcion: '', precio: 0, categoria_id: '', disponible: true, imagen_url: '' };
    formModificador: {
        id: string; producto_id: string; nombre: string;
        obligatorio: boolean; seleccion_multiple: boolean;
        opciones: OpcionModificador[]; activo: boolean;
    } = { id: '', producto_id: '', nombre: '', obligatorio: false, seleccion_multiple: false, opciones: [], activo: true };

    async ngOnInit(): Promise<void> {
        await this.cargarCategorias();
        await this.cargarProductos();
    }

    /* ══════════════════════════════════
       TABS
       ══════════════════════════════════ */

    cambiarTab(tab: Tab): void {
        this.tabActivo = tab;
        this.errorGeneral = '';
    }

    /* ══════════════════════════════════
       CATEGORÍAS
       ══════════════════════════════════ */

    async cargarCategorias(): Promise<void> {
        this.categorias = await this.menuService.getCategorias();
    }

    abrirCrearCategoria(): void {
        this.modoEdicion = false;
        this.formCategoria = { id: '', nombre: '', orden_visual: this.categorias.length + 1, icono_url: '', activa: true };
        this.errorModal = '';
        this.modalAbierto = 'categoria';
    }

    abrirEditarCategoria(cat: Categoria): void {
        this.modoEdicion = true;
        this.formCategoria = { ...cat };
        this.errorModal = '';
        this.modalAbierto = 'categoria';
    }

    async guardarCategoria(): Promise<void> {
        try {
            const { id, ...data } = this.formCategoria;
            if (this.modoEdicion) {
                await this.menuService.actualizarCategoria(id, data);
            } else {
                await this.menuService.crearCategoria(data as Omit<Categoria, 'id'>);
            }
            this.cerrarModal();
            await this.cargarCategorias();
        } catch (e: any) {
            this.errorModal = e.message;
        }
    }

    async eliminarCategoria(id: string): Promise<void> {
        try {
            this.errorGeneral = '';
            await this.menuService.eliminarCategoria(id);
            await this.cargarCategorias();
        } catch (e: any) {
            this.errorGeneral = e.message;
        }
    }

    async onToggleActiva(cat: Categoria): Promise<void> {
        await this.menuService.toggleActiva(cat.id, !cat.activa);
        cat.activa = !cat.activa;
    }

    /* ══════════════════════════════════
       PRODUCTOS
       ══════════════════════════════════ */

    async cargarProductos(): Promise<void> {
        this.productos = await this.menuService.getProductos(this.filtroCategoria || undefined);
    }

    async filtrarPorCategoria(): Promise<void> {
        await this.cargarProductos();
    }

    abrirCrearProducto(): void {
        this.modoEdicion = false;
        this.formProducto = { id: '', nombre: '', descripcion: '', precio: 0, categoria_id: '', disponible: true, imagen_url: '' };
        this.errorModal = '';
        this.modalAbierto = 'producto';
    }

    abrirEditarProducto(prod: Producto): void {
        this.modoEdicion = true;
        this.formProducto = { ...prod };
        this.errorModal = '';
        this.modalAbierto = 'producto';
    }

    async guardarProducto(): Promise<void> {
        try {
            const { id, ...data } = this.formProducto;
            if (this.modoEdicion) {
                await this.menuService.actualizarProducto(id, data);
            } else {
                await this.menuService.crearProducto(data as Omit<Producto, 'id'>);
            }
            this.cerrarModal();
            await this.cargarProductos();
        } catch (e: any) {
            this.errorModal = e.message;
        }
    }

    async onToggleDisponible(prod: Producto): Promise<void> {
        await this.menuService.toggleDisponible(prod.id, !prod.disponible);
        prod.disponible = !prod.disponible;
    }

    async seleccionarProducto(prod: Producto): Promise<void> {
        this.productoSeleccionado = prod;
        this.tabActivo = 'modificadores';
        await this.cargarModificadores();
    }

    /* ══════════════════════════════════
       MODIFICADORES
       ══════════════════════════════════ */

    async cargarModificadores(): Promise<void> {
        if (!this.productoSeleccionado) {
            this.modificadores = [];
            return;
        }
        this.modificadores = await this.menuService.getModificadoresByProducto(this.productoSeleccionado.id);
    }

    abrirCrearModificador(): void {
        if (!this.productoSeleccionado) return;
        this.modoEdicion = false;
        this.formModificador = {
            id: '', producto_id: this.productoSeleccionado.id,
            nombre: '', obligatorio: false, seleccion_multiple: false,
            opciones: [], activo: true
        };
        this.errorModal = '';
        this.modalAbierto = 'modificador';
    }

    abrirEditarModificador(mod: ModificadorProducto): void {
        this.modoEdicion = true;
        this.formModificador = { ...mod, opciones: mod.opciones.map(o => ({ ...o })) };
        this.errorModal = '';
        this.modalAbierto = 'modificador';
    }

    agregarOpcion(): void {
        this.formModificador.opciones.push({
            id: 'opt_' + Date.now(),
            nombre: '',
            precio_adicional: 0
        });
    }

    eliminarOpcion(index: number): void {
        this.formModificador.opciones.splice(index, 1);
    }

    async guardarModificador(): Promise<void> {
        try {
            const { id, ...data } = this.formModificador;
            if (this.modoEdicion) {
                await this.menuService.actualizarModificador(id, data);
            } else {
                await this.menuService.crearModificador(data as Omit<ModificadorProducto, 'id'>);
            }
            this.cerrarModal();
            await this.cargarModificadores();
        } catch (e: any) {
            this.errorModal = e.message;
        }
    }

    async onToggleModActivo(mod: ModificadorProducto): Promise<void> {
        await this.menuService.toggleActivo(mod.id, !mod.activo);
        mod.activo = !mod.activo;
    }

    async onEliminarModificador(id: string): Promise<void> {
        await this.menuService.eliminarModificador(id);
        await this.cargarModificadores();
    }

    /* ══════════════════════════════════
       MODAL HELPERS
       ══════════════════════════════════ */

    cerrarModal(): void {
        this.modalAbierto = null;
        this.errorModal = '';
    }

    nombreCategoria(id: string): string {
        return this.categorias.find(c => c.id === id)?.nombre ?? id;
    }
}
