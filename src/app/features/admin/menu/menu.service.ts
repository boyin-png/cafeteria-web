import { Injectable, inject } from '@angular/core';
import { FirestoreService, where, orderBy } from '../../../core/services/firestore.service';
import { Categoria } from '../../../core/models/categoria.model';
import { Producto } from '../../../core/models/producto.model';
import { ModificadorProducto } from '../../../core/models/modificador.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
    private fs = inject(FirestoreService);

    /* ══════════════════════════════════
       CATEGORÍAS
       ══════════════════════════════════ */

    getCategorias(): Promise<Categoria[]> {
        return this.fs.getAll<Categoria>('categorias', orderBy('orden_visual'));
    }

    crearCategoria(data: Omit<Categoria, 'id'>): Promise<string> {
        return this.fs.add<any>('categorias', data);
    }

    actualizarCategoria(id: string, data: Partial<Categoria>): Promise<void> {
        return this.fs.update('categorias', id, data);
    }

    async eliminarCategoria(id: string): Promise<void> {
        const productos = await this.fs.getAll<Producto>('productos', where('categoria_id', '==', id));
        if (productos.length > 0) {
            throw new Error(`No se puede eliminar: la categoría tiene ${productos.length} producto(s) asociado(s). Reasígnalos o elimínalos primero.`);
        }
        return this.fs.delete('categorias', id);
    }

    toggleActiva(id: string, activa: boolean): Promise<void> {
        return this.fs.update('categorias', id, { activa });
    }

    /* ══════════════════════════════════
       PRODUCTOS
       ══════════════════════════════════ */

    getProductos(categoriaId?: string): Promise<Producto[]> {
        if (categoriaId) {
            return this.fs.getAll<Producto>('productos', where('categoria_id', '==', categoriaId));
        }
        return this.fs.getAll<Producto>('productos');
    }

    crearProducto(data: Omit<Producto, 'id'>): Promise<string> {
        return this.fs.add<any>('productos', data);
    }

    actualizarProducto(id: string, data: Partial<Producto>): Promise<void> {
        return this.fs.update('productos', id, data);
    }

    toggleDisponible(id: string, disponible: boolean): Promise<void> {
        return this.fs.update('productos', id, { disponible });
    }

    /* ══════════════════════════════════
       MODIFICADORES
       ══════════════════════════════════ */

    getModificadoresByProducto(productoId: string): Promise<ModificadorProducto[]> {
        return this.fs.getAll<ModificadorProducto>('modificadores', where('producto_id', '==', productoId));
    }

    crearModificador(data: Omit<ModificadorProducto, 'id'>): Promise<string> {
        return this.fs.add<any>('modificadores', data);
    }

    actualizarModificador(id: string, data: Partial<ModificadorProducto>): Promise<void> {
        return this.fs.update('modificadores', id, data);
    }

    toggleActivo(id: string, activo: boolean): Promise<void> {
        return this.fs.update('modificadores', id, { activo });
    }

    eliminarModificador(id: string): Promise<void> {
        return this.fs.delete('modificadores', id);
    }
}
